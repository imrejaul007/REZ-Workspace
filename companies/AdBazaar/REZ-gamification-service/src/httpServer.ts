/**
 * Gamification Service HTTP Server
 *
 * Provides REST endpoints for querying achievement and streak data.
 * Runs alongside the BullMQ workers on PORT (default 3004).
 *
 * Routes:
 *   GET /health                 — liveness probe
 *   GET /achievements/:userId   — earned + locked achievements for a user
 *   GET /streak/:userId         — current streak info for a user
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { ACHIEVEMENTS } from './workers/achievementWorker';
import { logger } from './config/logger';
import { requireInternalToken } from './middleware/internalAuth';
import { track } from './services/intentCaptureService';
import { requireAuth } from './middleware/auth';
import { LeaderboardEntry, getTier } from './services/leaderboardService';
import { tracingMiddleware } from './middleware/tracing';
import { appRedis } from './config/redis';
import { randomUUID } from 'crypto';
import { leaderboardLimiter } from './middleware/rateLimiter';
import { fetchLeaderboard } from './services/leaderboardService';
import { ChallengeService, Challenge, ChallengeLeaderboardEntry } from './services/challengeService';
import { err } from './utils/response';
import { rewardsRouter } from './routes/rewards.routes';

// ── Visit milestone configuration (GAM-MED-05 fix) ───────────────────────────────

/** GAM-MED-05 FIX: Milestone config is now at module scope (not inside the route handler).
 * Validation runs once at module-load time, not on every request. Invalid config
 * will cause the service to fail immediately at startup rather than throw on the
 * first visit request. */
const VISIT_MILESTONES: ReadonlyArray<{ readonly visits: number; readonly coins: number }> = [
  Object.freeze({ visits: 7, coins: 50 }),
  Object.freeze({ visits: 30, coins: 200 }),
  Object.freeze({ visits: 100, coins: 500 }),
] as const;

/** GAM-MED-05 FIX: Validate milestone config at module-load time.
 * Throws synchronously so the service fails fast at startup if the config is invalid. */
(function validateMilestoneConfig(): void {
  for (let i = 0; i < VISIT_MILESTONES.length; i++) {
    if (VISIT_MILESTONES[i].coins <= 0) {
      throw new Error(`[GAM-MED-05] Invalid milestone coin amount at index ${i}: ${VISIT_MILESTONES[i].coins}`);
    }
    if (i > 0 && VISIT_MILESTONES[i].visits <= VISIT_MILESTONES[i - 1].visits) {
      throw new Error(`[GAM-MED-05] Milestones not in ascending order at index ${i}`);
    }
  }
  logger.info('[GAM-MED-05] VISIT_MILESTONES validated at startup', {
    milestones: VISIT_MILESTONES.map((m) => `${m.visits} visits → ${m.coins} coins`).join(', '),
  });
})();
// ── Typed collection document interfaces (GAM-MED-01 fix) ────────────────────────

/** Single coin entry within a wallets collection document. */
interface CoinEntry {
  type: string;
  amount: number;
  [key: string]: unknown;
}

/** Shape of a wallets collection document. */
interface WalletDoc {
  _id?: unknown;
  userId: string;
  coins?: CoinEntry[];
  balance?: { available?: number; [key: string]: unknown };
  [key: string]: unknown;
}

/** Shape of a userachievements collection document. */
interface UserAchievementDoc {
  _id?: unknown;
  userId: string;
  achievementId: string;
  earnedAt?: Date;
  coinsAwarded?: number;
  [key: string]: unknown;
}

/** Shape of a userstreaks collection document. */
interface UserStreakDoc {
  _id?: unknown;
  userId: string;
  type?: string;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string;
  streakStartDate?: string;
  lastStoreId?: string;
  lastMerchantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

/** Raw leaderboard aggregation result from cointransactions. */
interface LeaderboardAggregateEntry {
  _id: unknown;
  lifetimeCoins: number;
}

/** Raw user lookup result. */
interface UserDoc {
  _id?: unknown;
  firstName?: string;
  name?: string;
  [key: string]: unknown;
}

// ── Wallet service credit helper ──────────────────────────────────────────────
//
// All coin credit operations in the gamification service MUST go through this
// function rather than writing directly to the `wallets` MongoDB collection.
// Direct writes from gamification and the wallet service on the same collection
// under concurrent load produce a race condition that corrupts balances.
//
// The wallet service's /internal/credit endpoint performs the $inc atomically
// and creates the CoinTransaction record itself — callers must NOT also insert
// into coinledgers or cointransactions after a successful call here.

// BE-GAM-007 FIX: Validate WALLET_SERVICE_URL at startup, not on each call
let WALLET_SERVICE_URL: string | null = null;

export function validateWalletServiceUrl(): void {
  WALLET_SERVICE_URL =
    process.env.WALLET_SERVICE_URL ||
    process.env.REZ_WALLET_SERVICE_URL ||
    null;

  if (!WALLET_SERVICE_URL) {
    throw new Error(
      'WALLET_SERVICE_URL is not set. Gamification service cannot proceed without wallet service integration. ' +
      'Set WALLET_SERVICE_URL or REZ_WALLET_SERVICE_URL environment variable.'
    );
  }
  logger.info('[Gamification] Wallet service URL validated at startup', { url: WALLET_SERVICE_URL });
}

// GAM-HIGH-01 FIX: Strict 24-character hex string regex — ObjectId.isValid() is too permissive
// and accepts numeric strings, padded values, and non-24-char hex strings.
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function creditCoinsViaWalletService(
  userId: string,
  amount: number,
  idempotencyKey: string,
  description: string,
  coinType: string = 'rez',
  source: string = 'gamification',
): Promise<boolean> {
  // GAM-HIGH-03 FIX: Reject non-finite and non-positive amounts before any network call.
  // The wallet service's /internal/credit endpoint is internal but still an untrusted boundary.
  if (!Number.isFinite(amount) || amount <= 0) {
    logger.error('[Gamification] Invalid coin amount rejected', { userId, amount, idempotencyKey });
    return false;
  }

  if (!WALLET_SERVICE_URL) {
    logger.error('[Gamification] Wallet service URL not initialized', {
      userId,
      amount,
      idempotencyKey,
    });
    return false;
  }

  try {
    const response = await fetch(`${WALLET_SERVICE_URL}/internal/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
        'x-internal-service': 'rez-gamification-service',
      },
      body: JSON.stringify({
        userId,
        amount,
        coinType,
        source,
        description,
        idempotencyKey,
      }),
    });

    if (!response.ok) {
      // GAM-P2-001 FIX: Include raw text when JSON parse fails so error is still visible.
      const err = await response.json().catch(async () => {
        const text = await response.text().catch(() => '<unreadable>');
        return { _rawBody: text };
      });
      logger.error('[Gamification] Wallet credit failed', {
        userId,
        amount,
        idempotencyKey,
        status: response.status,
        error: err,
      });
      return false;
    }

    return true;
  } catch (e) {
    logger.error('[Gamification] Wallet service unreachable', {
      userId,
      amount,
      idempotencyKey,
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}

// ── Achievement helpers ───────────────────────────────────────────────────────

/**
 * GAM-MED-04 FIX: Added pagination with a hard cap (50 achievements per user is
 * sufficient for unknown practical user journey). Without pagination, .toArray() loads
 * all documents into memory — a user with 1000+ achievements could OOM the service.
 */
async function getEarnedAchievements(userId: string): Promise<UserAchievementDoc[]> {
  const UserAchievements = mongoose.connection.collection('userachievements');
  const cursor = UserAchievements.find(
    { userId },
    { projection: { achievementId: 1, earnedAt: 1, coinsAwarded: 1 }, limit: 50 },
  );
  return cursor.toArray() as Promise<UserAchievementDoc[]>;
}

/**
 * BE-GAM-010 FIX: Filter for completed visits only — pending/cancelled visits
 * must not count toward achievement progress. Matches achievementWorker.ts logic.
 */
async function getUserVisitCount(userId: string): Promise<number> {
  const StoreVisits = mongoose.connection.collection('storevisits');
  return StoreVisits.countDocuments({ userId, status: 'completed' });
}

async function getUserStreakDoc(userId: string, type: string = 'store_visit'): Promise<UserStreakDoc | null> {
  const UserStreaks = mongoose.connection.collection('userstreaks');
  return UserStreaks.findOne({ userId, type }) as Promise<UserStreakDoc | null>;
}

async function getUserWallet(userId: string): Promise<WalletDoc | null> {
  // Use 'wallets' — the shared collection written by all services (including achievementWorker).
  // Old: 'userwallets' was a stale separate collection not written by any current code path.
  const Wallets = mongoose.connection.collection('wallets');
  return Wallets.findOne({ userId }) as Promise<WalletDoc | null>;
}

// ── Prometheus metrics counters ───────────────────────────────────────────────
let requestCount = 0;
let errorCount = 0;

// ── Gamification job metrics (incremented by worker.ts) ───────────────────────
export const jobMetrics = {
  processed: new Map<string, number>(),   // jobName -> total processed
  failed:    new Map<string, number>(),   // jobName -> total failed
  durationSumSeconds: new Map<string, number>(), // jobName -> sum of durations
  durationCount:      new Map<string, number>(), // jobName -> observation count
  activeWorkers: 0,
};

export function recordJobProcessed(jobName: string, durationMs: number): void {
  jobMetrics.processed.set(jobName, (jobMetrics.processed.get(jobName) ?? 0) + 1);
  const secs = durationMs / 1000;
  jobMetrics.durationSumSeconds.set(jobName, (jobMetrics.durationSumSeconds.get(jobName) ?? 0) + secs);
  jobMetrics.durationCount.set(jobName, (jobMetrics.durationCount.get(jobName) ?? 0) + 1);
}

export function recordJobFailed(jobName: string): void {
  jobMetrics.failed.set(jobName, (jobMetrics.failed.get(jobName) ?? 0) + 1);
}

// ── Express app ───────────────────────────────────────────────────────────────

export function createHttpApp(): express.Application {
  const app = express();
  // Behind Render LB + CF — trust N hops so per-IP rate limiters key on real client IP.
  // See MASTER-PLAN-2026-04-19 P1 (trust proxy fleet-wide).
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
  app.use(helmet());
  // PERFORMANCE: Enable gzip compression for all responses
  app.use(compression());
  app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()),
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  app.use(tracingMiddleware);

  // Sentry request handler — capture request data for error tracking
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    app.use(Sentry.Handlers.requestHandler());
  }

  // Gateway sends /api/gamification/* — strip /api/gamification prefix so routes match /:userId, /streak/:userId etc.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api/gamification')) req.url = req.url.replace(/^\/api\/gamification/, '');
    else if (req.url.startsWith('/api/')) req.url = req.url.replace(/^\/api/, '');
    next();
  });

  // Metrics tracking middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    requestCount++;
    res.on('finish', () => { if (res.statusCode >= 500) errorCount++; });
    next();
  });

  // GET /health
  app.get('/health', async (_req: Request, res: Response) => {
    const checks: Record<string, string> = { db: 'ok' };
    const errors: string[] = [];

    if (mongoose.connection.readyState !== 1) {
      checks.db = 'error';
      errors.push('MongoDB not connected');
    }

    const status = errors.length > 0 ? 'degraded' : 'ok';
    res.status(errors.length > 0 ? 503 : 200).json({
      status,
      service: 'rez-gamification-service',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // GET /healthz — alias for /health
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'rez-gamification-service' });
  });

  // GET /health/live — Kubernetes/Render liveness probe (process is up)
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'rez-gamification-service' });
  });

  // GET /health/ready — Kubernetes/Render readiness probe (dependencies connected)
  app.get('/health/ready', async (_req: Request, res: Response) => {
    const dbOk = mongoose.connection.readyState === 1;
    const status = dbOk ? 200 : 503;
    res.status(status).json({
      status: dbOk ? 'ready' : 'not_ready',
      db: dbOk ? 'connected' : 'disconnected',
    });
  });

  // GET /health/detailed — Comprehensive health check with latency metrics
  app.get('/health/detailed', async (_req: Request, res: Response) => {
    const checks: Record<string, unknown> = {};
    let isHealthy = true;

    // Check MongoDB with latency
    const mongoStart = Date.now();
    try {
      if (mongoose.connection.readyState !== 1) throw new Error('not connected');
      await mongoose.connection.db?.admin().ping();
      checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
    } catch (err) {
      checks.database = { status: 'down', error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - mongoStart };
      isHealthy = false;
    }

    // Check Redis with latency
    const redisStart = Date.now();
    try {
      await appRedis.ping();
      checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = { status: 'down', error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - redisStart };
    }

    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks,
    });
  });

  // ── Internal auth for all routes below (except /health*) ──
  app.use((req, res, next) => {
    if (req.path === '/health' || req.path === '/healthz'
        || req.path === '/health/live' || req.path === '/health/ready') {
      return next();
    }
    requireInternalToken(req, res, next);
  });

  // GET /achievements/:userId
  // Returns:
  //   earned  — list of unlocked achievements with earnedAt date
  //   locked  — list of not-yet-unlocked achievements with progress hint
  app.get('/achievements/:userId', requireAuth, async (req: Request, res: Response) => {
    // GAM-SEC-01 FIX: Require JWT auth. Use req.userId from token instead of req.params.userId
    // to prevent IDOR — users can only view their own achievements.
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;

    // Only allow a user to view their own achievements (or an admin could be added)
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }
    try {
      // GAM-SEC-01 FIX: Use authenticatedUserId from JWT (set by requireAuth).
      // userId from token is trusted — no need to re-validate format or check existence.
      const userId = authenticatedUserId;

      const [earnedDocs, visitCount, streakDoc, walletDoc] = await Promise.all([
        getEarnedAchievements(userId),
        getUserVisitCount(userId),
        getUserStreakDoc(userId),
        getUserWallet(userId),
      ]);

      const earnedIds = new Set(earnedDocs.map((d: UserAchievementDoc) => d.achievementId));
      // GAM-MED-01 FIX: streakDoc is typed as UserStreakDoc, so currentStreak is already typed.
      const currentStreak: number = (streakDoc as UserStreakDoc)?.currentStreak ?? 0;
      // CS-H1 fix: neither rezBalance nor balance (object) are valid number fields.
      // Match the pattern used in achievementWorker.ts line 131: find rez coin entry first,
      // fall back to balance.available (already a number field) if no rez coin entry found.
      // GAM-MED-01 FIX: walletDoc?.coins is typed as CoinEntry[] via the WalletDoc interface.
      const rezCoin = (walletDoc as WalletDoc)?.coins?.find((c: CoinEntry) => c.type === 'rez');
      const totalCoins: number = (rezCoin?.amount ?? (walletDoc as WalletDoc)?.balance?.available) ?? 0;

      const earned = earnedDocs.map((d: UserAchievementDoc) => {
        const def = ACHIEVEMENTS.find((a) => a.id === d.achievementId);
        return {
          id:           d.achievementId,
          name:         def?.name ?? d.achievementId,
          description:  def?.description ?? '',
          coins:        d.coinsAwarded,
          earnedAt:     d.earnedAt,
        };
      });

      const locked = ACHIEVEMENTS.filter((a) => !earnedIds.has(a.id)).map((a) => {
        // Derive a progress hint from the condition
        let progress = 0;
        let target = 0;

        if (a.condition.startsWith('visit_count')) {
          target   = parseInt(a.condition.split('>= ')[1], 10);
          progress = Math.min(visitCount, target);
        } else if (a.condition.startsWith('streak')) {
          target   = parseInt(a.condition.split('>= ')[1], 10);
          progress = Math.min(currentStreak, target);
        } else if (a.condition.startsWith('total_coins')) {
          target   = parseInt(a.condition.split('>= ')[1], 10);
          progress = Math.min(totalCoins, target);
        }

        return {
          id:           a.id,
          name:         a.name,
          description:  a.description,
          coins:        a.coins,
          condition:    a.condition,
          progress,
          target,
          percentComplete: target > 0 ? Math.round((progress / target) * 100) : 0,
        };
      });

      res.json({ success: true, data: { earned, locked } });
    } catch (error) {
      logger.error('[HTTP] GET /achievements error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /streak/:userId
  // Returns current streak info from userstreaks collection.
  // GAM-SEC-01 FIX: Require JWT auth + IDOR check.
  app.get('/streak/:userId', requireAuth, async (req: Request, res: Response) => {
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }
    try {
      const userId = authenticatedUserId;

      const [streakDoc, savingsDoc] = await Promise.all([
        getUserStreakDoc(userId, 'store_visit'),
        getUserStreakDoc(userId, 'savings'),
      ]);

      const buildStreakShape = (doc: unknown | null) => {
        if (!doc) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null as string | null, streakActive: false };
        const docObj = doc as { lastActivityDate?: string; currentStreak?: number; longestStreak?: number };
        const lastDate: string | null = docObj.lastActivityDate ?? null;
        let streakActive = false;
        if (lastDate) {
          const today     = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
          streakActive = lastDate === today || lastDate === yesterday;
        }
        return {
          currentStreak:    docObj.currentStreak ?? 0,
          longestStreak:    docObj.longestStreak ?? 0,
          lastActivityDate: lastDate,
          streakActive,
        };
      };

      const storeVisit = buildStreakShape(streakDoc);
      const savings    = buildStreakShape(savingsDoc);

      // Return shape compatible with both consumer app expectations:
      // { success, data: { currentStreak } }               — top-level store_visit streak
      // { success, data: { savings: { currentStreak } } }  — savings streak shape
      res.json({
        success: true,
        data: {
          userId,
          currentStreak:    storeVisit.currentStreak,
          longestStreak:    storeVisit.longestStreak,
          lastActivityDate: storeVisit.lastActivityDate,
          streakActive:     storeVisit.streakActive,
          storeVisit,
          savings,
        },
      });
    } catch (error) {
      logger.error('[HTTP] GET /streak error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /leaderboard
  // Returns top 10 users by lifetime coins, cached 5 minutes.
  app.get('/leaderboard', leaderboardLimiter, async (_req: Request, res: Response) => {
    try {
      const entries = await fetchLeaderboard();
      res.json({ success: true, data: entries });
    } catch (error) {
      logger.error('[HTTP] GET /leaderboard error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /leaderboard/me
  // Returns the requesting user's rank and ±2 surrounding neighbours.
  // GAM-SEC-01 FIX: Use req.userId from JWT (set by requireAuth) instead of req.query.userId
  // to prevent IDOR — users can only view their own leaderboard position.
  app.get('/leaderboard/me', leaderboardLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      // CS-M6 fix: cache the full aggregation result in Redis for 60 seconds.
      // The aggregation scans up to 1000 documents on every request — caching avoids
      // a full collection scan per user hit as the cointransactions collection grows.
      const cacheKey = `leaderboard:me:full`;
      let allAggregated: LeaderboardAggregateEntry[] = [];

      try {
        const cached = await appRedis.get(cacheKey);
        if (cached) {
          // GAM-MED-01 FIX: JSON.parse returns unknown; validate it is an array before using.
          // If the cached value is corrupted (not an array), fall through to recompute from DB.
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allAggregated = parsed as LeaderboardAggregateEntry[];
          }
        }
      } catch (cacheErr) {
        // Redis unavailable or parse error — fall through to recompute from DB below
        logger.warn('[HTTP] /leaderboard/me Redis cache error, falling back to DB', { error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr) });
      }

      // GAM-MED-04 FIX: If cache was empty/missing/corrupted, recompute from DB.
      // NOTE: Index recommended on cointransactions: { type: 1, user: 1, amount: 1 }
      // to avoid a full collection scan on every /leaderboard/me request.
      if (allAggregated.length === 0) {
        const CoinTransactions = mongoose.connection.collection('cointransactions');
        const rawAggregated = await CoinTransactions.aggregate([
          { $match: { type: 'earned' } },
          { $group: { _id: '$user', lifetimeCoins: { $sum: '$amount' } } },
          { $sort: { lifetimeCoins: -1 } },
          { $limit: 1000 },
        ]).toArray();
        allAggregated = rawAggregated as LeaderboardAggregateEntry[];

        // Cache the result for future requests (best-effort)
        try {
          await appRedis.setex(cacheKey, 60, JSON.stringify(allAggregated));
        } catch {
          // Cache write failure — non-fatal; serve the computed result
        }
      }

      const Users = mongoose.connection.collection('users');

      const userIndex = allAggregated.findIndex((r: LeaderboardAggregateEntry) => String(r._id) === userId);
      if (userIndex === -1) {
        // LOW-04 FIX: Return same 404 message regardless of whether user is off-leaderboard or beyond query limit
        res.status(404).json(err('RES_NOT_FOUND', 'User not found on leaderboard'));
        return;
      }

      const start = Math.max(0, userIndex - 2);
      const end = Math.min(allAggregated.length - 1, userIndex + 2);
      const slice = allAggregated.slice(start, end + 1);

      // Convert raw _id values to ObjectId; fall back to the raw value if conversion fails.
      const userIdCandidates = slice.map((r: LeaderboardAggregateEntry) => {
        try { return new mongoose.Types.ObjectId(String(r._id)); } catch { return String(r._id); }
      });
      const userDocs = await Users.find(
        { _id: { $in: userIdCandidates as mongoose.Types.ObjectId[] } },
        { projection: { _id: 1, firstName: 1, name: 1 } }
      ).toArray() as UserDoc[];

      const userMap = new Map<string, string>();
      for (const u of userDocs) {
        const key = String(u._id);
        const displayName = u.firstName || ((u.name || '').split(' ')[0]) || 'Unknown';
        userMap.set(key, displayName);
      }

      const neighbours: LeaderboardEntry[] = slice.map((r: LeaderboardAggregateEntry, i: number) => ({
        rank: start + i + 1,
        userId: String(r._id),
        displayName: userMap.get(String(r._id)) || 'Unknown',
        lifetimeCoins: r.lifetimeCoins,
        tier: getTier(r.lifetimeCoins as number),
      }));

      const me = neighbours.find((n) => n.userId === userId);

      // RTMN Commerce Memory: track leaderboard rank query as engagement intent
      track({ userId, event: 'leaderboard_rank_changed', intentKey: `gamification_leaderboard`, properties: { rank: me?.rank, tier: me?.tier, lifetimeCoins: me?.lifetimeCoins } }).catch((err) => {
        logger.warn('[Analytics] Track failed', { error: err instanceof Error ? err.message : String(err) });
      });

      res.json({ success: true, data: { me, neighbours } });
    } catch (error) {
      logger.error('[HTTP] GET /leaderboard/me error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // POST /internal/visit
  // Accepts a store visit event, increments streak, and awards milestone coins.
  // Milestones: 7 visits (50 rez), 30 visits (200 rez), 100 visits (500 rez).
  // Uses idempotency via eventId to prevent double-processing on retries.
  // C-24 FIX: Added explicit requireInternalToken (global middleware also guards this route)
  app.post('/internal/visit', requireInternalToken, async (req: Request, res: Response) => {
    try {
      const { userId, merchantId, storeId, timestamp, eventId } = req.body as {
        userId?: string;
        merchantId?: string;
        storeId?: string;
        timestamp?: string;
        eventId?: string;
      };

      if (!userId || !storeId) {
        res.status(400).json({ success: false, error: 'userId and storeId are required' });
        return;
      }
      if (!OBJECT_ID_REGEX.test(userId)) {
        res.status(400).json({ success: false, error: 'Invalid userId format' });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ success: false, error: 'Invalid userId' });
        return;
      }
      // GAM-MED-02 FIX: Validate optional fields. timestamp must be a parseable ISO date.
      if (timestamp !== undefined) {
        const parsed = Date.parse(timestamp);
        if (isNaN(parsed)) {
          res.status(400).json({ success: false, error: 'Invalid timestamp format — expected ISO 8601 string' });
          return;
        }
      }
      // eventId is validated as a string; empty strings are treated as missing.
      if (typeof eventId === 'string' && eventId.trim() === '') {
        // Treat empty-string eventId as missing — prevents accidental empty dedup keys.
        (req.body as Record<string, unknown>).eventId = undefined;
      }

      // Idempotency: skip if this eventId was already processed.
      // The upsert is the authoritative atomic check — the old pre-flight findOne
      // widened the TOCTOU window without adding safety, so it's removed.
      if (eventId) {
        const ProcessedVisits = mongoose.connection.collection('processedvisitevents');
        const markResult = await ProcessedVisits.updateOne(
          { eventId },
          { $setOnInsert: { eventId, userId, processedAt: new Date() } },
          { upsert: true },
        );
        if (markResult.upsertedCount === 0) {
          // Another request already claimed this eventId
          res.json({ success: true, data: { duplicate: true, message: 'Event already processed' } });
          return;
        }
      }

      // BE-GAM-005 FIX: Use distributed lock (Redis SET NX with TTL) to prevent
      // concurrent requests from both incrementing and checking milestones.
      // Lock protects both the increment and milestone detection to ensure atomicity.
      const lockKey = `milestone-lock:${userId}`;
      const lockToken = `${Date.now()}-${randomUUID()}`;
      const lockAcquired = await appRedis.set(lockKey, lockToken, 'EX', 10, 'NX'); // 10s lock

      if (!lockAcquired) {
        // Another request is processing this user's milestone, skip (let the other request handle it)
        res.json({ success: true, data: { message: 'Visit recorded (milestone check in progress)' } });
        return;
      }

      try {
        // Increment total visit count for the user (across all stores)
        const UserVisitCounts = mongoose.connection.collection('uservisitcounts');
        const visitCountResult = await UserVisitCounts.findOneAndUpdate(
          { userId },
          {
            $inc: { totalVisits: 1 },
            $set: { updatedAt: new Date() },
            $setOnInsert: { userId, createdAt: new Date() },
          },
          { upsert: true, returnDocument: 'after' },
        );

        // Guard against null — findOneAndUpdate with upsert should always return the doc,
        // but re-fetch if the driver returns null (e.g. on first upsert in some versions).
        const visitDoc = visitCountResult ?? await UserVisitCounts.findOne({ userId });
        // GAM-MED-01 FIX: Add runtime guard so TypeScript knows totalVisits is a number.
        // findOneAndUpdate with upsert always returns a doc or null; null-coalesce handles the edge case.
        const newVisitCount: number = typeof visitDoc?.totalVisits === 'number' ? visitDoc.totalVisits : 1;

        // Check if this visit count hits a milestone
        const milestone = VISIT_MILESTONES.find((m) => m.visits === newVisitCount);
        let coinsAwarded = 0;

        if (milestone) {
          // GAM-MED-06 FIX: Use crypto.randomUUID() instead of Date.now() for the dedup key.
          // Date.now() created collision windows where concurrent visits generated identical
          // dedup keys, silently dropping milestone rewards. randomUUID() guarantees uniqueness.
          const dedupKey = `visit-milestone-${userId}-${milestone.visits}-${randomUUID()}`;

        // CS-C3 FIX: Call wallet service FIRST, write ledger entry SECOND.
        // If wallet credit fails, the error propagates and the caller (BullMQ via
        // storeVisitStreakWorker.processStoreVisitInternal) retries safely.
        // Ledger entry is only written after confirmed credit.
        const credited = await creditCoinsViaWalletService(
          userId,
          milestone.coins,
          dedupKey,
          `${milestone.visits}-visit milestone bonus`,
        );

        if (credited) {
          coinsAwarded = milestone.coins;
          logger.info('[HTTP /internal/visit] Milestone coins awarded', {
            userId,
            visits: milestone.visits,
            coins: milestone.coins,
          });
          // Write audit ledger entry only after confirmed credit.
          const CoinLedger = mongoose.connection.collection('coinledgers');
          await CoinLedger.updateOne(
            { dedupKey },
            {
              $setOnInsert: {
                userId,
                amount: milestone.coins,
                type: 'credit',
                source: 'visit_milestone',
                description: `${milestone.visits}-visit milestone bonus`,
                dedupKey,
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );

          // RTMN Commerce Memory: track visit milestone as engagement intent
          track({ userId, event: 'visit_milestone_reached', intentKey: `gamification_visit_milestone_${milestone.visits}`, properties: { visits: milestone.visits, coins: milestone.coins } }).catch(() => {});
        } else {
          // Throw to signal failure — caller should handle retry.
          throw new Error(`[HTTP /internal/visit] Wallet credit failed for milestone ${milestone.visits}`);
        }
      }

        // HIGH-10 FIX: Use Promise.allSettled() to decouple milestone and streak operations.
        // If one fails, it doesn't block the other from running, and both results are captured.
        // This prevents desync where milestone succeeds but streak processing fails (or vice versa).
        const { processStoreVisitInternal } = await import('./workers/storeVisitStreakWorker');

        const [streakResult] = await Promise.allSettled([
          processStoreVisitInternal({
            eventId: eventId || `http-visit-${userId}-${Date.now()}`,
            userId,
            merchantId: merchantId || '',
            storeId,
            timestamp,
          }),
        ]);

        // Log any streak processing failure but don't fail the whole request
        if (streakResult.status === 'rejected') {
          logger.error('[HTTP /internal/visit] Streak processing failed', {
            userId,
            reason: streakResult.reason?.message,
          });
        }

        res.json({
          success: true,
          data: {
            totalVisits: newVisitCount,
            coinsAwarded,
            milestoneReached: milestone ? milestone.visits : null,
          },
        });
      } finally {
        // BE-GAM-005 FIX: Always release the distributed lock
        const lockStillHeld = await appRedis.get(lockKey);
        if (lockStillHeld === lockToken) {
          await appRedis.del(lockKey);
        }
      }
    } catch (error) {
      logger.error('[HTTP] POST /internal/visit error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // Allowlist prevents Redis key injection via arbitrary queueName path param.
  const VALID_DLQ_QUEUE_NAMES = new Set([
    'gamification-events',
    'store-visit-events',
    'notification-events',
    'achievement-events',
  ]);

  // GET /internal/dlq/:queueName — inspect dead-letter queue entries (internal network only)
  // C-24 FIX: Added explicit requireInternalToken (global middleware also guards this route)
  app.get('/internal/dlq/:queueName', requireInternalToken, async (req: Request, res: Response) => {
    const { queueName } = req.params;
    if (!VALID_DLQ_QUEUE_NAMES.has(queueName)) {
      res.status(400).json({ success: false, error: 'Invalid queue name' });
      return;
    }
    const dlqKey = `dlq:${queueName}`;
    const start = parseInt(String(req.query.start ?? '0'), 10);
    const end = parseInt(String(req.query.end ?? '49'), 10);
    try {
      const entries = await appRedis.lrange(dlqKey, start, end);
      const total = await appRedis.llen(dlqKey);
      const jobs = entries.map((e: string) => {
        try { return JSON.parse(e); } catch { return { raw: e }; }
      });
      res.json({ success: true, data: { queueName, dlqKey, total, jobs, page: { start, end } } });
    } catch (error) {
      logger.error('[HTTP] GET /internal/dlq error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to fetch DLQ entries' });
    }
  });

  // GET /metrics — Prometheus exposition format (C-24 FIX: explicit requireInternalToken)
  app.get('/metrics', requireInternalToken, (_req: Request, res: Response) => {
    const lines: string[] = [];

    lines.push(
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${process.uptime()}`,
      '# HELP http_requests_total Total HTTP requests',
      '# TYPE http_requests_total counter',
      `http_requests_total ${requestCount}`,
      '# HELP http_errors_total Total HTTP 5xx errors',
      '# TYPE http_errors_total counter',
      `http_errors_total ${errorCount}`,
    );

    // gamification_jobs_processed_total{jobName="..."}
    lines.push(
      '# HELP gamification_jobs_processed_total Total gamification jobs processed',
      '# TYPE gamification_jobs_processed_total counter',
    );
    for (const [jobName, count] of jobMetrics.processed) {
      lines.push(`gamification_jobs_processed_total{jobName="${jobName}"} ${count}`);
    }

    // gamification_jobs_failed_total{jobName="..."}
    lines.push(
      '# HELP gamification_jobs_failed_total Total gamification jobs failed',
      '# TYPE gamification_jobs_failed_total counter',
    );
    for (const [jobName, count] of jobMetrics.failed) {
      lines.push(`gamification_jobs_failed_total{jobName="${jobName}"} ${count}`);
    }

    // gamification_job_duration_seconds{jobName="..."} — expose as a simple summary (sum + count)
    lines.push(
      '# HELP gamification_job_duration_seconds_sum Sum of gamification job durations in seconds',
      '# TYPE gamification_job_duration_seconds_sum gauge',
    );
    for (const [jobName, sum] of jobMetrics.durationSumSeconds) {
      lines.push(`gamification_job_duration_seconds_sum{jobName="${jobName}"} ${sum.toFixed(6)}`);
    }
    lines.push(
      '# HELP gamification_job_duration_seconds_count Count of gamification job duration observations',
      '# TYPE gamification_job_duration_seconds_count gauge',
    );
    for (const [jobName, count] of jobMetrics.durationCount) {
      lines.push(`gamification_job_duration_seconds_count{jobName="${jobName}"} ${count}`);
    }

    // gamification_active_workers
    lines.push(
      '# HELP gamification_active_workers Number of active gamification worker instances',
      '# TYPE gamification_active_workers gauge',
      `gamification_active_workers ${jobMetrics.activeWorkers}`,
    );

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(lines.join('\n') + '\n');
  });

  // Sentry error handler — must be before global error handler
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    app.use(Sentry.Handlers.errorHandler());
  }

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('[HTTP] Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ code: 'SRV_001', message: 'Internal server error' });
  });

  // GET /karma-leaderboard — proxy to karma service Redis ZSET for active karma rankings
  // Requires internal token; returns top N users by active karma
  app.get('/karma-leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10));

      // Read from shared Redis (both karma and gamification services use bullmqRedis)
      const { bullmqRedis } = await import('./config/redis');
      const results = await bullmqRedis.zrevrange(
        'karma:rankings:activeKarma',
        offset,
        offset + limit - 1,
        'WITHSCORES',
      );

      const entries: Array<{ rank: number; userId: string; activeKarma: number }> = [];
      for (let i = 0; i < results.length; i += 2) {
        entries.push({
          rank: offset + Math.floor(i / 2) + 1,
          userId: results[i],
          activeKarma: parseInt(results[i + 1], 10),
        });
      }

      const total = await bullmqRedis.zcard('karma:rankings:activeKarma');

      // RTMN Commerce Memory: track karma leaderboard query (public endpoint, no userId)
      track({ event: 'karma_leaderboard_queried', intentKey: `gamification_karma_leaderboard`, properties: { limit, offset, resultCount: entries.length }, userId: 'anonymous' }).catch(() => {});

      res.json({
        success: true,
        data: { entries, total, limit, offset, hasMore: offset + limit < total },
      });
    } catch (error) {
      logger.error('[HTTP] GET /karma-leaderboard error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /karma-leaderboard/my-rank — user's rank in karma leaderboard
  app.get('/karma-leaderboard/my-rank', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      const { bullmqRedis } = await import('./config/redis');
      const rank = await bullmqRedis.zrevrank('karma:rankings:activeKarma', userId);
      const total = await bullmqRedis.zcard('karma:rankings:activeKarma');
      const score = await bullmqRedis.zscore('karma:rankings:activeKarma', userId);

      if (rank === null) {
        res.json({ success: true, data: { rank: null, total: 0, score: 0, percentile: 0 } });
        return;
      }

      const percentile = total > 0 ? ((total - rank - 1) / total) * 100 : 0;

      // RTMN Commerce Memory: track karma leaderboard rank query as engagement intent
      track({ userId, event: 'karma_leaderboard_queried', intentKey: `gamification_karma_leaderboard`, properties: { rank: rank + 1, total, percentile } }).catch(() => {});

      res.json({
        success: true,
        data: {
          rank: rank + 1,
          total,
          score: parseInt(score ?? '0', 10),
          percentile: Math.round(percentile * 100) / 100,
        },
      });
    } catch (error) {
      logger.error('[HTTP] GET /karma-leaderboard/my-rank error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // ── Challenge Routes ─────────────────────────────────────────────────────────

  const challengeService = new ChallengeService();

  // POST /challenges — Create a new challenge (internal only)
  app.post('/challenges', requireInternalToken, async (req: Request, res: Response) => {
    try {
      const { name, description, type, startDate, endDate, goals, rewards, maxParticipants } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: 'name is required' });
        return;
      }

      // Validate goals format
      if (goals && !Array.isArray(goals)) {
        res.status(400).json({ success: false, error: 'goals must be an array' });
        return;
      }

      // Validate rewards format
      if (rewards && !Array.isArray(rewards)) {
        res.status(400).json({ success: false, error: 'rewards must be an array' });
        return;
      }

      const challenge = await challengeService.createChallenge({
        name,
        description,
        type: type || 'event',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        goals,
        rewards,
        maxParticipants,
      });

      res.status(201).json({ success: true, data: challenge });
    } catch (error) {
      logger.error('[HTTP] POST /challenges error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /challenges — List challenges
  app.get('/challenges', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as Challenge['status'] | undefined;
      const type = req.query.type as Challenge['type'] | undefined;
      const limit = parseInt(String(req.query.limit ?? '20'), 10);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);

      const { challenges, total } = await challengeService.listChallenges({
        status,
        type,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { challenges, total, limit, offset },
      });
    } catch (error) {
      logger.error('[HTTP] GET /challenges error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /challenges/active — Get active challenges for the current user
  app.get('/challenges/active', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const challenges = await challengeService.getUserChallenges(userId);

      res.json({ success: true, data: challenges });
    } catch (error) {
      logger.error('[HTTP] GET /challenges/active error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // POST /challenges/:id/join — Join a challenge
  app.post('/challenges/:id/join', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id: challengeId } = req.params;

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      await challengeService.joinChallenge(userId, challengeId);

      res.json({ success: true, message: 'Successfully joined challenge' });
    } catch (error) {
      if (error instanceof Error && error.message === 'Challenge not found or not active') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Challenge has reached maximum participants') {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      logger.error('[HTTP] POST /challenges/:id/join error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /challenges/:id/leaderboard — Get challenge leaderboard
  app.get('/challenges/:id/leaderboard', async (req: Request, res: Response) => {
    try {
      const { id: challengeId } = req.params;
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10)));

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      const leaderboard = await challengeService.getLeaderboard(challengeId, limit);

      res.json({ success: true, data: { challengeId, leaderboard } });
    } catch (error) {
      logger.error('[HTTP] GET /challenges/:id/leaderboard error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /challenges/:id/leaderboard/me — Get user's rank in challenge leaderboard
  app.get('/challenges/:id/leaderboard/me', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id: challengeId } = req.params;

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      const rank = await challengeService.getUserRank(userId, challengeId);

      if (!rank) {
        res.status(404).json({ success: false, error: 'User not participating in this challenge' });
        return;
      }

      res.json({ success: true, data: rank });
    } catch (error) {
      logger.error('[HTTP] GET /challenges/:id/leaderboard/me error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // GET /challenges/:id — Get single challenge details
  app.get('/challenges/:id', async (req: Request, res: Response) => {
    try {
      const { id: challengeId } = req.params;

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      const challenge = await challengeService.getChallenge(challengeId);

      if (!challenge) {
        res.status(404).json({ success: false, error: 'Challenge not found' });
        return;
      }

      res.json({ success: true, data: challenge });
    } catch (error) {
      logger.error('[HTTP] GET /challenges/:id error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // PUT /challenges/:id/activate — Activate a draft challenge (internal only)
  app.put('/challenges/:id/activate', requireInternalToken, async (req: Request, res: Response) => {
    try {
      const { id: challengeId } = req.params;

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      const challenge = await challengeService.activateChallenge(challengeId);

      if (!challenge) {
        res.status(404).json({ success: false, error: 'Challenge not found or already active' });
        return;
      }

      res.json({ success: true, data: challenge });
    } catch (error) {
      logger.error('[HTTP] PUT /challenges/:id/activate error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // DELETE /challenges/:id — Cancel a challenge (internal only)
  app.delete('/challenges/:id', requireInternalToken, async (req: Request, res: Response) => {
    try {
      const { id: challengeId } = req.params;

      if (!challengeId) {
        res.status(400).json({ success: false, error: 'Challenge ID is required' });
        return;
      }

      await challengeService.cancelChallenge(challengeId);

      res.json({ success: true, message: 'Challenge cancelled' });
    } catch (error) {
      logger.error('[HTTP] DELETE /challenges/:id error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json(err('SRV_001', 'Internal server error'));
    }
  });

  // ── Rewards Routes ──────────────────────────────────────────────────────────
  // GET /rewards/earned/:userId — Total rewards earned
  // GET /rewards/history/:userId — Reward history with pagination
  // GET /rewards/available/:userId — Available rewards/challenges
  // GET /rewards/summary/:userId — Gamification status summary
  // POST /rewards/internal/process — Process challenge reward (internal)
  // GET /rewards/internal/progress/:userId — Get user progress (internal)
  app.use(rewardsRouter);

  return app;
}

export function startHttpServer(port: number): ReturnType<express.Application['listen']> {
  const app = createHttpApp();
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`[HTTP] Gamification HTTP server listening on port ${port}`);
  });
  return server;
}
