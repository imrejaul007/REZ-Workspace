/**
 * Leaderboard Service — Redis-backed leaderboard cache.
 *
 * GAM-CRIT-04 fix: Replaces the module-level in-memory Map cache that was
 * used in httpServer.ts.  That Map was local to each Node.js instance, so
 * in a multi-instance deployment (e.g. Render with >1 instance) every instance
 * held its own copy of the cache.  Cache invalidation via invalidateLeaderboardCache()
 * only cleared the local instance's Map, leaving stale data served by the other
 * instances.
 *
 * This service uses Redis (which is shared across all instances) as the cache
 * store, and a 60-second TTL to balance freshness with DB load.
 */

import mongoose from 'mongoose';
import { bullmqRedis } from '../config/redis';
import { createServiceLogger } from '../config/logger';
import { sendLeaderboardMilestoneNotification } from './notificationService';

const logger = createServiceLogger('leaderboard-service');

const LEADERBOARD_CACHE_TTL_SECONDS = 60;
const LEADERBOARD_CACHE_KEY = 'leaderboard:top10';
const LEADERBOARD_USER_RANK_TTL = 300; // 5 minutes

// Track previous rank in Redis for comparison
async function getUserPreviousRank(userId: string): Promise<number | undefined> {
  try {
    const key = `leaderboard:user_rank:${userId}`;
    const rank = await bullmqRedis.get(key);
    return rank ? parseInt(rank, 10) : undefined;
  } catch {
    return undefined;
  }
}

async function setUserCurrentRank(userId: string, rank: number): Promise<void> {
  try {
    const key = `leaderboard:user_rank:${userId}`;
    await bullmqRedis.setex(key, LEADERBOARD_USER_RANK_TTL, rank.toString());
  } catch {
    // Non-critical, ignore
  }
}

// ── Types ───────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  lifetimeCoins: number;
  tier: string;
}

// ── Tier computation ───────────────────────────────────────────────────────────

/**
 * BE-GAM-001 FIX: Mutually exclusive tier ranges to prevent boundary ambiguity.
 * L1 (bronze): 0–499
 * L2 (silver): 500–1999
 * L3 (gold): 2000–4999
 * L4 (platinum): 5000+
 */
export function getTier(coins: number): string {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500) return 'silver';
  return 'bronze';
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

/**
 * Invalidate the Redis leaderboard cache.
 * Called by worker.ts whenever a leaderboard-affecting event is processed.
 * Unlike the old in-memory Map, this invalidates the cache across ALL instances.
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  try {
    await bullmqRedis.del(LEADERBOARD_CACHE_KEY);
    logger.debug('[LeaderboardService] Cache invalidated');
  } catch (err) {
    logger.warn('[LeaderboardService] Failed to invalidate cache', { error: err instanceof Error ? err.message : String(err) });
  }
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Fetch the top-10 leaderboard, using Redis as a shared cache.
 *
 * Cache strategy:
 *   1. Try Redis GET — hit means another instance already computed it.
 *   2. On miss: compute from MongoDB, store in Redis with TTL.
 *
 * Because Redis is shared across all Node.js instances, this ensures
 * all instances see the same cached data and invalidation is effective fleet-wide.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Step 1: Try Redis cache first
    const cached = await bullmqRedis.get(LEADERBOARD_CACHE_KEY);
    if (cached) {
      logger.debug('[LeaderboardService] Cache hit — returning cached leaderboard');
      return JSON.parse(cached) as LeaderboardEntry[];
    }
  } catch (err) {
    // Redis GET failed (e.g. brief disconnection) — fall through to DB computation
    logger.warn('[LeaderboardService] Redis cache read failed, falling back to DB', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Step 2: Cache miss — compute from MongoDB
  logger.debug('[LeaderboardService] Cache miss — computing leaderboard from DB');

  const CoinTransactions = mongoose.connection.collection('cointransactions');
  const Users = mongoose.connection.collection('users');

  const aggregated = await CoinTransactions.aggregate([
    { $match: { type: 'earned' } },
    { $group: { _id: '$user', lifetimeCoins: { $sum: '$amount' } } },
    { $sort: { lifetimeCoins: -1 } },
    { $limit: 10 },
  ]).toArray();

  const userIds = aggregated.map((r) => r._id);
  const userDocs = await Users.find(
    {
      _id: {
        $in: userIds.map((id) => {
          try {
            return new mongoose.Types.ObjectId(String(id));
          } catch {
            return id;
          }
        }),
      },
    },
    { projection: { _id: 1, firstName: 1, name: 1 } },
  ).toArray();

  const userMap = new Map<string, string>();
  for (const u of userDocs) {
    const key = String(u._id);
    const displayName =
      (u.firstName as string) ||
      ((u.name as string) || '').split(' ')[0] ||
      'Unknown';
    userMap.set(key, displayName);
  }

  const entries: LeaderboardEntry[] = aggregated.map((r, idx: number) => ({
    rank: idx + 1,
    userId: String(r._id),
    displayName: userMap.get(String(r._id)) || 'Unknown',
    lifetimeCoins: r.lifetimeCoins as number,
    tier: getTier(r.lifetimeCoins as number),
  }));

  // Step 3: Store in Redis with TTL so other instances benefit
  try {
    await bullmqRedis.setex(
      LEADERBOARD_CACHE_KEY,
      LEADERBOARD_CACHE_TTL_SECONDS,
      JSON.stringify(entries),
    );
    logger.debug('[LeaderboardService] Leaderboard cached in Redis', {
      ttlSeconds: LEADERBOARD_CACHE_TTL_SECONDS,
      entriesCount: entries.length,
    });
  } catch (err) {
    // Redis SET failed — log but still return the computed result
    logger.warn('[LeaderboardService] Failed to write to Redis cache', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return entries;
}

/**
 * Check if user entered a notable leaderboard position and send notification.
 * Called after coin earning events to track rank changes.
 */
export async function checkAndNotifyLeaderboardRank(userId: string, newTotalCoins: number): Promise<void> {
  try {
    // Get user's current rank
    const CoinTransactions = mongoose.connection.collection('cointransactions');

    // Count users with more coins than this user
    const higherRankCount = await CoinTransactions.countDocuments({
      type: 'earned',
      user: { $ne: new mongoose.Types.ObjectId(userId) },
    });

    const currentRank = higherRankCount + 1;

    // Only notify for top positions
    if (currentRank > 100) return;

    // Get previous rank
    const previousRank = await getUserPreviousRank(userId);

    // Update stored rank
    await setUserCurrentRank(userId, currentRank);

    // Only send notification if rank improved and entered notable position
    if (previousRank !== undefined && previousRank > currentRank && currentRank <= 100) {
      await sendLeaderboardMilestoneNotification(userId, currentRank, previousRank);
      logger.info('[LeaderboardService] Leaderboard rank improved', {
        userId,
        previousRank,
        currentRank,
      });
    } else if (previousRank === undefined && currentRank <= 10) {
      // First time in top 10
      await sendLeaderboardMilestoneNotification(userId, currentRank);
      logger.info('[LeaderboardService] User entered top 10', {
        userId,
        currentRank,
      });
    }
  } catch (err) {
    logger.warn('[LeaderboardService] Failed to check leaderboard rank', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
