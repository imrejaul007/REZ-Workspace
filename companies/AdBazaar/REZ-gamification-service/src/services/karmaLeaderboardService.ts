/**
 * Karma Leaderboard Service — gamification service
 *
 * Reads karma leaderboard data from the shared Redis instance.
 * Both gamification and karma services connect to the same Redis cluster.
 */
import { bullmqRedis } from '../config/redis';
import { logger } from '../config/logger';

export interface KarmaLeaderboardEntry {
  rank: number;
  userId: string;
  activeKarma: number;
}

export interface KarmaLeaderboard {
  entries: KarmaLeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function getKarmaLeaderboard(
  limit = 20,
  offset = 0,
): Promise<KarmaLeaderboard> {
  try {
    const results = await bullmqRedis.zrevrange(
      'karma:rankings:activeKarma',
      offset,
      offset + limit - 1,
      'WITHSCORES',
    );

    const entries: KarmaLeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        rank: offset + Math.floor(i / 2) + 1,
        userId: results[i],
        activeKarma: parseInt(results[i + 1], 10),
      });
    }

    const total = await bullmqRedis.zcard('karma:rankings:activeKarma');

    return {
      entries,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  } catch (err) {
    logger.error('[KarmaLeaderboardService] getKarmaLeaderboard error', { error: err });
    return { entries: [], total: 0, limit, offset, hasMore: false };
  }
}

export async function getKarmaUserRank(userId: string): Promise<{
  rank: number | null;
  total: number;
  score: number;
  percentile: number;
}> {
  try {
    const [rank, total, score] = await Promise.all([
      bullmqRedis.zrevrank('karma:rankings:activeKarma', userId),
      bullmqRedis.zcard('karma:rankings:activeKarma'),
      bullmqRedis.zscore('karma:rankings:activeKarma', userId),
    ]);

    if (rank === null) {
      return { rank: null, total: 0, score: 0, percentile: 0 };
    }

    const percentile = total > 0 ? ((total - rank - 1) / total) * 100 : 0;

    return {
      rank: rank + 1,
      total,
      score: parseInt(score ?? '0', 10),
      percentile: Math.round(percentile * 100) / 100,
    };
  } catch (err) {
    logger.error('[KarmaLeaderboardService] getKarmaUserRank error', { userId, error: err });
    return { rank: null, total: 0, score: 0, percentile: 0 };
  }
}
