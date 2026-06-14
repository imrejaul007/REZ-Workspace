import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { Wallet, IWallet } from '../models/Wallet';
import { CoinTransaction } from '../models/CoinTransaction';
import { redis, pub } from '../config/redis';
import { createServiceLogger } from '../config/logger';
import { walletProjectionService } from './WalletProjectionService';
import { recordTransaction } from './amlComplianceService';
import { AuditLogger, AUDIT_ACTIONS } from '../utils/AuditLogger';

const logger = createServiceLogger('wallet');

// Initialize audit logger
let auditLogger: AuditLogger | null = null;

function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    const auditCollection = mongoose.connection.collection('audit_logs');
    auditLogger = new AuditLogger(auditCollection);
  }
  return auditLogger;
}

// Well-known platform account IDs — must match rezbackend/src/services/ledgerService.ts
const PLATFORM_FLOAT_ID = new Types.ObjectId('000000000000000000000002');

/**
 * =====================================================================
 * CASHBACK FUNDING MODEL — Documentation
 * =====================================================================
 *
 * Who funds cashback:
 *   All cashback credits are funded by the **platform treasury account**
 *   identified by PLATFORM_FLOAT_ID ('000000000000000000000002'). When a
 *   consumer earns cashback (via order completion, promotions, or loyalty
 *   programs), the creditCoins() function debits the platform float and
 *   credits the user's wallet. This is recorded as a double-entry ledger
 *   pair via writeLedgerPair() within the same MongoDB transaction.
 *
 * How the double-entry ledger tracks it:
 *   - DEBIT:  platform_float (000000000000000000000002) — money leaves treasury
 *   - CREDIT: user_wallet (consumer's wallet _id) — money enters user balance
 *   - Both entries share a pairId for reconciliation
 *   - operationType is 'cashback' (mapped from source via mapSourceToOperationType)
 *   - The ledger is append-only; reversals create new pairs, never mutate existing ones
 *
 * Current limitations:
 *   - Cashback is 100% platform-funded — there is no merchant co-funding mechanism
 *   - The cashback percentage is determined by the caller (order service, loyalty service)
 *     and is not configurable within the wallet service itself
 *   - No per-merchant or per-campaign funding pool — all cashback draws from a single
 *     platform float account
 *
 * Future enhancements needed:
 *   - Configurable funding rules: platform % vs merchant co-fund %
 *     (e.g., 70% platform + 30% merchant for promotional campaigns)
 *   - Merchant co-funding: debit merchant wallet for their share, platform for remainder
 *   - Per-campaign cashback pools with dedicated budget tracking
 *   - Cashback funding source metadata on LedgerEntry (which pool funded it)
 *   - Admin dashboard for treasury balance monitoring and alerts
 *
 * See also: ledgerService.ts in rezbackend for the canonical ledger schema
 * =====================================================================
 */

// Map source strings to LedgerEntry operationTypes (mirrors the rezbackend enum subset)
function mapSourceToOperationType(source: string, direction: 'credit' | 'debit'): string {
  const map: Record<string, string> = {
    order: direction === 'credit' ? 'loyalty_credit' : 'order_coin_deduction',
    cashback: 'cashback',
    referral: 'referral_bonus',
    admin: 'admin_adjustment',
    payment: direction === 'credit' ? 'loyalty_credit' : 'payment',
    reward: 'loyalty_credit',
    bonus: 'loyalty_credit',
    game: 'game_prize',
    achievement: 'achievement_reward',
  };
  const key = source.toLowerCase().split('_')[0];
  return map[key] || (direction === 'credit' ? 'loyalty_credit' : 'payment');
}

/**
 * Map wallet source to savings type for the savings module.
 * Returns the appropriate savings type or null if not a savings event.
 */
function getSavingsType(source: string, coinType: string): 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus' | null {
  const sourceLower = source.toLowerCase();

  if (sourceLower.includes('cashback')) return 'cashback';
  if (sourceLower.includes('referral')) return 'referral';
  if (sourceLower.includes('reward') || sourceLower.includes('loyalty')) return 'loyalty';
  if (sourceLower.includes('promo') || sourceLower.includes('bonus')) return 'promo';
  if (sourceLower.includes('achievement') || sourceLower.includes('game')) return 'reward';

  // Default mapping based on coin type
  if (coinType === 'cashback') return 'cashback';
  if (coinType === 'referral') return 'referral';
  if (coinType === 'branded') return 'promo';

  return null;
}

/**
 * Write a double-entry ledger pair to the shared `ledgerentries` collection.
 * Uses the raw MongoDB collection to avoid maintaining a duplicate schema with enums.
 * Errors are propagated only if inside a session (transaction rollback); otherwise fire-and-forget.
 */
async function writeLedgerPair(opts: {
  direction: 'credit' | 'debit';
  walletId: Types.ObjectId;
  userId: string;
  amount: number;
  coinType: string;
  operationType: string;
  referenceId: string;
  referenceModel: string;
  description: string;
  source: string;
  idempotencyKey?: string;
  session?: mongoose.ClientSession;
}): Promise<void> {
  const pairId = crypto.randomUUID();
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ledgerCoinType = opts.coinType; // LedgerEntry now supports all coin types including 'prive'

  // For credit: debit platform_float → credit user_wallet
  // For debit:  debit user_wallet → credit platform_float
  const [debitAccount, creditAccount] =
    opts.direction === 'credit'
      ? [
          { type: 'platform_float', id: PLATFORM_FLOAT_ID },
          { type: 'user_wallet', id: opts.walletId },
        ]
      : [
          { type: 'user_wallet', id: opts.walletId },
          { type: 'platform_float', id: PLATFORM_FLOAT_ID },
        ];

  const baseDoc = {
    pairId,
    amount: opts.amount,
    coinType: ledgerCoinType,
    operationType: opts.operationType,
    referenceId: opts.referenceId,
    referenceModel: opts.referenceModel,
    metadata: {
      description: opts.description,
      source: opts.source,
      idempotencyKey: opts.idempotencyKey,
      microservice: 'rez-wallet-service',
    },
    yearMonth,
    createdAt: now,
  };

  const docs = [
    { ...baseDoc, accountType: debitAccount.type, accountId: debitAccount.id, direction: 'debit' },
    { ...baseDoc, accountType: creditAccount.type, accountId: creditAccount.id, direction: 'credit' },
  ];

  try {
    // MEDIUM FIX: Ledger Half-Pair Risk — use ordered:true to ensure both entries
    // (debit and credit) succeed together or both fail. This prevents orphaned ledger entries.
    // See MEDIUM issue: Ledger Half-Pair Risk.
    await mongoose.connection.collection('ledgerentries').insertMany(docs, {
      ordered: true,
      ...(opts.session ? { session: opts.session } : {}),
    });
  } catch (err) {
    // E11000 = duplicate key — idempotent retry, treat as success
    if (err.code === 11000 || err.message?.includes('E11000') || err?.writeErrors?.every((e) => e.code === 11000)) {
      return;
    }
    throw err;
  }
}

const BALANCE_CACHE_PREFIX = 'wallet:balance:';
const BALANCE_CACHE_TTL = 60; // M19 FIX: Reduced from 300s (5 min) to 60s to limit stale balance exposure in case of concurrent transaction race conditions

// ── Coin-to-Rupee conversion rate ─────────────────────────────────────────────
// 1 rez coin = COIN_TO_RUPEE_RATE rupees.
// Configurable via COIN_TO_RUPEE_RATE env var (default: 1.0 — 1 coin = ₹1).
// REZ_COIN_TO_RUPEE_RATE is accepted as a secondary fallback for monolith env-var compat.
// All consumer-facing balances use coins; this rate is provided for display only.
// Validate at module load time with warning fallback — if env var is invalid, use default
// instead of crashing the service (which would block all wallet operations).
const _rawRate = parseFloat(
  process.env.COIN_TO_RUPEE_RATE ||
  process.env.REZ_COIN_TO_RUPEE_RATE ||
  '1'
);
let _finalRate = _rawRate;
if (!Number.isFinite(_rawRate) || _rawRate <= 0 || _rawRate > 10) {
  logger.warn('Invalid COIN_TO_RUPEE_RATE detected, using default 1.0', {
    provided: process.env.COIN_TO_RUPEE_RATE || process.env.REZ_COIN_TO_RUPEE_RATE || '1',
    parsed: _rawRate,
  });
  _finalRate = 1.0;
}

// ── Coin Minting Caps ─────────────────────────────────────────────────────────
// C-05 FIX: Add coin minting caps to prevent inflation.
// These caps are read from environment variables with sensible defaults.
const _parseCap = (envKey: string, defaultVal: number): number => {
  const raw = process.env[envKey];
  if (!raw) return defaultVal;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultVal : parsed;
};

export const DAILY_COIN_CAP = _parseCap('DAILY_COIN_CAP', 1000);    // Max coins per user per day
export const WEEKLY_COIN_CAP = _parseCap('WEEKLY_COIN_CAP', 5000);  // Max coins per user per week
export const LIFETIME_COIN_CAP = _parseCap('LIFETIME_COIN_CAP', 100000); // Max total coins per user

// Cache keys for coin cap totals
const COIN_CAP_DAILY_PREFIX = 'wallet:cap:daily:';
const COIN_CAP_WEEKLY_PREFIX = 'wallet:cap:weekly:';

/**
 * Get the start of the current day in UTC.
 */
function getDayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get the start of the current week (Monday) in UTC.
 */
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - diffToMonday);
  return new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate()));
}

/**
 * Get daily earned total for a user using Redis cache.
 * Falls back to MongoDB aggregation if Redis is unavailable.
 */
async function getDailyTotal(userId: string): Promise<number> {
  const dayStart = getDayStart();
  const cacheKey = `${COIN_CAP_DAILY_PREFIX}${userId}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { total, date } = JSON.parse(cached);
      // Only use cache if it's for today
      if (date === dayStart.toISOString().split('T')[0]) {
        return total;
      }
    }
  } catch {
    // Redis unavailable, fall through to MongoDB
  }

  // Query MongoDB
  const oid = new mongoose.Types.ObjectId(userId);
  const result = await CoinTransaction.aggregate([
    { $match: { user: oid, type: 'earned', createdAt: { $gte: dayStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const total = result[0]?.total ?? 0;

  // Update Redis cache
  try {
    await redis.setex(cacheKey, 86400, JSON.stringify({ total, date: dayStart.toISOString().split('T')[0] }));
  } catch {
    // Best effort cache update
  }

  return total;
}

/**
 * Get weekly earned total for a user using Redis cache.
 * Falls back to MongoDB aggregation if Redis is unavailable.
 */
async function getWeeklyTotal(userId: string): Promise<number> {
  const weekStart = getWeekStart();
  const cacheKey = `${COIN_CAP_WEEKLY_PREFIX}${userId}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { total, weekKey } = JSON.parse(cached);
      // Only use cache if it's for current week
      const currentWeekKey = `${weekStart.getUTCFullYear()}-W${Math.ceil((weekStart.getUTCDate() + weekStart.getUTCMonth() * 30) / 7)}`;
      if (weekKey === currentWeekKey) {
        return total;
      }
    }
  } catch {
    // Redis unavailable, fall through to MongoDB
  }

  // Query MongoDB
  const oid = new mongoose.Types.ObjectId(userId);
  const result = await CoinTransaction.aggregate([
    { $match: { user: oid, type: 'earned', createdAt: { $gte: weekStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const total = result[0]?.total ?? 0;

  // Update Redis cache (TTL = seconds until next Monday)
  const now = new Date();
  const daysUntilMonday = (7 - now.getUTCDay()) % 7 || 7;
  const ttlSeconds = daysUntilMonday * 86400 + (86400 - (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()));
  try {
    const weekKey = `${weekStart.getUTCFullYear()}-W${Math.ceil((weekStart.getUTCDate() + weekStart.getUTCMonth() * 30) / 7)}`;
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify({ total, weekKey }));
  } catch {
    // Best effort cache update
  }

  return total;
}

/**
 * Get lifetime earned total for a user.
 */
async function getLifetimeTotal(userId: string): Promise<number> {
  const oid = new mongoose.Types.ObjectId(userId);
  const result = await CoinTransaction.aggregate([
    { $match: { user: oid, type: 'earned' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * C-05 FIX: Check if crediting the given amount would exceed unknown coin minting cap.
 * Returns true if the credit is allowed, false if unknown cap would be exceeded.
 *
 * @param userId - The user ID to check
 * @param amount - The amount of coins to credit
 * @returns true if credit is allowed, false if it would exceed unknown cap
 */
async function checkCoinCap(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
  // Skip cap check if caps are disabled (set to 0 or negative)
  if (DAILY_COIN_CAP <= 0 && WEEKLY_COIN_CAP <= 0 && LIFETIME_COIN_CAP <= 0) {
    return { allowed: true };
  }

  const [dailyTotal, weeklyTotal, lifetimeTotal] = await Promise.all([
    DAILY_COIN_CAP > 0 ? getDailyTotal(userId) : Promise.resolve(0),
    WEEKLY_COIN_CAP > 0 ? getWeeklyTotal(userId) : Promise.resolve(0),
    LIFETIME_COIN_CAP > 0 ? getLifetimeTotal(userId) : Promise.resolve(0),
  ]);

  if (DAILY_COIN_CAP > 0 && dailyTotal + amount > DAILY_COIN_CAP) {
    return {
      allowed: false,
      reason: `Daily coin cap exceeded: ${dailyTotal}/${DAILY_COIN_CAP} earned today, cannot add ${amount} more`,
    };
  }

  if (WEEKLY_COIN_CAP > 0 && weeklyTotal + amount > WEEKLY_COIN_CAP) {
    return {
      allowed: false,
      reason: `Weekly coin cap exceeded: ${weeklyTotal}/${WEEKLY_COIN_CAP} earned this week, cannot add ${amount} more`,
    };
  }

  if (LIFETIME_COIN_CAP > 0 && lifetimeTotal + amount > LIFETIME_COIN_CAP) {
    return {
      allowed: false,
      reason: `Lifetime coin cap exceeded: ${lifetimeTotal}/${LIFETIME_COIN_CAP} earned total, cannot add ${amount} more`,
    };
  }

  return { allowed: true };
}

/**
 * C-05 FIX: Update cap cache after a successful credit.
 * Called within the same transaction as the credit.
 */
async function updateCapCacheAfterCredit(userId: string, amount: number): Promise<void> {
  const dayStart = getDayStart();
  const cacheKey = `${COIN_CAP_DAILY_PREFIX}${userId}`;

  // Update daily cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { total, date } = JSON.parse(cached);
      if (date === dayStart.toISOString().split('T')[0]) {
        await redis.setex(cacheKey, 86400, JSON.stringify({ total: total + amount, date }));
      }
    }
  } catch {
    // Best effort cache update
  }

  // Update weekly cache
  const weekStart = getWeekStart();
  const weekCacheKey = `${COIN_CAP_WEEKLY_PREFIX}${userId}`;
  try {
    const cached = await redis.get(weekCacheKey);
    if (cached) {
      const { total, weekKey } = JSON.parse(cached);
      const currentWeekKey = `${weekStart.getUTCFullYear()}-W${Math.ceil((weekStart.getUTCDate() + weekStart.getUTCMonth() * 30) / 7)}`;
      if (weekKey === currentWeekKey) {
        const now = new Date();
        const daysUntilMonday = (7 - now.getUTCDay()) % 7 || 7;
        const ttlSeconds = daysUntilMonday * 86400 + (86400 - (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()));
        await redis.setex(weekCacheKey, ttlSeconds, JSON.stringify({ total: total + amount, weekKey }));
      }
    }
  } catch {
    // Best effort cache update
  }
}

/**
 * Startup-time constant read from the environment variable.
 * Kept for backward compatibility with unknown caller that imports this directly.
 * For display/calculation use getDynamicConversionRate() instead, which reflects
 * admin changes made via the WalletConfig admin panel without requiring a restart.
 * Falls back to 1.0 if the env var is invalid.
 */
export const COIN_TO_RUPEE_RATE: number = _finalRate;

// ── Dynamic rate cache ────────────────────────────────────────────────────────
// Avoids a MongoDB round-trip on every transaction while still picking up admin
// changes within 60 seconds.
let _cachedRate: number = _finalRate;
let _cacheExpiresAt: number = 0; // epoch ms; 0 = expired immediately
const RATE_CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Returns the current coin-to-rupee conversion rate.
 *
 * Resolution order:
 *   1. In-memory cache (valid for 60 s) — zero latency
 *   2. WalletConfig singleton document in MongoDB — picks up admin changes
 *   3. COIN_TO_RUPEE_RATE env-var constant — last-resort fallback if DB is unavailable
 *
 * The function is intentionally non-throwing: a DB hiccup degrades gracefully to
 * the last known good value rather than crashing a transaction.
 */
/**
 * Returns the dynamic coin-to-rupee conversion rate from Redis, falling back to the configured default.
 * Rates are periodically updated by an admin cron job or market sync.
 * @returns The conversion rate (coins per rupee), defaulting to 1.0 if not set
 */
export async function getDynamicConversionRate(): Promise<number> {
  const now = Date.now();
  if (now < _cacheExpiresAt) {
    return _cachedRate;
  }

  try {
    const { WalletConfig } = await import('../models/WalletConfig');
    const config = await WalletConfig.findOne({ singleton: true })
      .select('coinConversion.rezToInr')
      .lean();

    const dbRate = (config as unknown)?.coinConversion?.rezToInr;
    if (typeof dbRate === 'number' && Number.isFinite(dbRate) && dbRate > 0 && dbRate <= 10) {
      _cachedRate = dbRate;
      _cacheExpiresAt = now + RATE_CACHE_TTL_MS;
      logger.debug('getDynamicConversionRate: refreshed from DB', { rate: dbRate });
    } else {
      // DB returned no usable value — extend cache TTL briefly to reduce retry pressure
      _cacheExpiresAt = now + 10_000; // retry in 10 s
      logger.warn('getDynamicConversionRate: DB value unusable, using cached/env fallback', { dbRate });
    }
  } catch (err) {
    // Network error, model registration race, etc. — keep last known value.
    _cacheExpiresAt = now + 10_000; // retry in 10 s
    logger.warn('getDynamicConversionRate: DB lookup failed, using cached/env fallback', { error: err?.message });
  }

  return _cachedRate;
}

/**
 * Synchronous helper — uses the in-memory cached rate (or env-var default).
 * Safe to call in sync contexts; may be up to 60 s stale after an admin change.
 */
/**
 * Synchronously converts a coin amount to rupees using the default static conversion rate.
 * For dynamic rates, use coinsToRupeesAsync instead.
 * @param coins - The number of coins to convert
 * @returns The rupee value rounded to 2 decimal places
 */
export function coinsToRupees(coins: number): number {
  const paise = Math.round(coins * _cachedRate * 100);
  const rupees = paise / 100;
  return Number(rupees.toFixed(2));
}

/**
 * Async helper — always resolves to the freshest rate (DB → cache → env fallback).
 * Use this wherever an accurate rupee value matters (e.g. payment display, refunds).
 */
export async function coinsToRupeesAsync(coins: number): Promise<number> {
  const rate = await getDynamicConversionRate();
  return parseFloat((coins * rate).toFixed(2));
}

/**
 * Gets an existing wallet or creates a new one with zero balances for all coin types.
 * @param userId - The user ID to get or create a wallet for
 * @param session - Optional MongoDB transaction session
 * @returns The wallet document
 */
export async function getOrCreateWallet(userId: string, session?: mongoose.ClientSession): Promise<IWallet> {
  const oid = new mongoose.Types.ObjectId(userId);
  const opts: Record<string, unknown> = { upsert: true, new: true };
  if (session) opts.session = session;
  const wallet = await Wallet.findOneAndUpdate(
    { user: oid },
    {
      $setOnInsert: {
        user: oid,
        balance: { total: 0, available: 0, pending: 0, cashback: 0 },
        coins: [{ type: 'rez', amount: 0, isActive: true }],
        brandedCoins: [],
        currency: 'REZ_COIN',
        statistics: { totalEarned: 0, totalSpent: 0, totalCashback: 0, transactionCount: 0 },
        limits: { maxBalance: 100000, minWithdrawal: 100, dailySpendLimit: 10000, dailySpent: 0, lastResetDate: new Date() },
        savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0, lastCalculated: new Date() },
        isActive: true,
      },
    },
    opts as { session?: mongoose.ClientSession },
  ) as unknown as IWallet | null;
  return wallet!;
}

/**
 * Retrieves the current coin balances for a user across all coin types.
 * Returns the full wallet document with balance breakdown.
 * @param userId - The user ID to get balances for
 * @returns The wallet document with balances, or null if wallet does not exist
 */
export async function getBalance(userId: string) {
  // Check cache first
  const cached = await redis.get(`${BALANCE_CACHE_PREFIX}${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // R2-C5: Corrupted cache — fall through to recompute from database
    }
  }

  const [wallet, rate] = await Promise.all([
    getOrCreateWallet(userId),
    getDynamicConversionRate(),
  ]);

  // Expose balance fields explicitly so consumers can reliably access
  // `pending` cashback without having to know the nested structure.
  const result = {
    balance: {
      total: wallet.balance.total,
      available: wallet.balance.available,
      pending: wallet.balance.pending,
      cashback: wallet.balance.cashback,
    },
    rupeesEquivalent: parseFloat((wallet.balance.available * rate).toFixed(2)),
    pendingCashback: wallet.balance.cashback,   // top-level alias for consumer app
    coins: wallet.coins,
    brandedCoins: wallet.brandedCoins,
    savingsInsights: wallet.savingsInsights,
    statistics: wallet.statistics,
    createdAt: wallet.createdAt,
  };

  await redis.set(`${BALANCE_CACHE_PREFIX}${userId}`, JSON.stringify(result), 'EX', BALANCE_CACHE_TTL);
  return result;
}

/**
 * FIX REZ-WALLET-006 note: getBalance uses cache-aside pattern.
 * The balance read and cache write are not atomic — another request could
 * modify balance between read and write. However, this is acceptable because:
 * 1. DB is always the source of truth for financial operations
 * 2. All write operations use atomic MongoDB transactions
 * 3. The 5-minute cache TTL limits staleness exposure
 * 4. For critical operations, code should read directly from DB
 */

/**
 * Credits coins to a user's wallet with double-entry ledger recording.
 * Supports multiple coin types: rez, prive, branded, promo, cashback, referral.
 * @param userId - The user ID to credit
 * @param amount - Number of coins to credit (must be positive)
 * @param coinType - The coin type being credited
 * @param source - The source of the credit (e.g., 'order_payment', 'refund', 'referral')
 * @param description - Human-readable description of the transaction
 * @param metadata - Optional metadata to attach to the transaction
 * @param session - Optional MongoDB transaction session
 * @returns The transaction record with the new balance
 */
export async function creditCoins(
  userId: string,
  amount: number,
  coinType: 'rez' | 'prive' | 'branded' | 'promo' | 'cashback' | 'referral',
  source: string,
  description: string,
  opts?: { sourceId?: string; merchantId?: string; idempotencyKey?: string; operationType?: string; referenceModel?: string },
): Promise<{ balance: number; transactionId: string }> {
  if (amount <= 0) throw new Error('Amount must be positive');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Idempotency check inside the transaction — prevents TOCTOU race where two
    // concurrent calls both read null and both proceed to credit.
    if (opts?.idempotencyKey) {
      const existing = await CoinTransaction.findOne(
        { idempotencyKey: opts.idempotencyKey },
        null,
        { session },
      );
      if (existing) {
        await session.abortTransaction();
        return { balance: existing.balanceAfter, transactionId: existing._id.toString() };
      }
    }

    // Pass the session so that wallet creation (on first credit) is part of the same
    // transaction — a crash mid-transaction will roll back the wallet document too.
    const wallet = await getOrCreateWallet(userId, session);

    // Frozen wallet guard — prevent any credits to frozen accounts
    if (wallet.isFrozen) {
      await session.abortTransaction();
      throw new Error('Wallet is frozen');
    }

    // C-05 FIX: Check coin minting caps before crediting
    // This prevents inflation by enforcing daily, weekly, and lifetime coin earning limits.
    // Only applies to 'earned' type credits (e.g., order payments, achievements, referrals).
    // Excludes refund/bonus types which represent corrections rather than new minting.
    const creditIsEarnedType = source && !['refund', 'partial_refund', 'admin_refund'].includes(source.toLowerCase());
    if (creditIsEarnedType) {
      const capCheck = await checkCoinCap(userId, amount);
      if (!capCheck.allowed) {
        await session.abortTransaction();
        throw Object.assign(
          new Error(capCheck.reason || 'Coin cap exceeded'),
          { code: 'COIN_CAP_EXCEEDED', statusCode: 429 },
        );
      }
    }

    const balanceBefore = wallet.balance.available;

    // Two-step atomic update:
    // Step 1 — ensure the per-type entry exists in the correct sub-array.
    //   $addToSet adds the entry only if it doesn't already exist (by reference equality
    //   the new object literal is always a new reference so it always adds, then the
    //   $inc on the same field in step 2 brings amount up to the correct value).
    //   Branded coins use the brandedCoins sub-array; all others use coins[].
    // Step 2 — $inc the amount on the matching sub-array entry.
    const coinEntry = coinType === 'branded'
      ? { type: 'branded' as const, amount: 0, isActive: true, expiresAt: null }
      : { type: coinType as string, amount: 0, isActive: true };
    if (coinType === 'branded') {
      await Wallet.updateOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $addToSet: { brandedCoins: coinEntry } },
        { session },
      );
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        {
          $inc: {
            'balance.total': amount,
            'balance.available': amount,
            'statistics.totalEarned': amount,
            'statistics.transactionCount': 1,
            'brandedCoins.$[elem].amount': amount,
          },
        },
        { session, arrayFilters: [{ 'elem.type': 'branded' }] },
      );
    } else {
      // MEDIUM FIX: Coin Type ArrayFilter Silent Miss
      // Ensure the coin entry exists before attempting arrayFilter update.
      // If the entry doesn't exist, MongoDB's arrayFilter silently skips the $inc,
      // causing balance divergence between the aggregate balance and per-type sub-balance.
      await Wallet.updateOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $addToSet: { coins: coinEntry } },
        { session },
      );
      // Pre-check: verify the entry exists before attempting the $inc on it
      const walletWithEntry = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(userId), 'coins.type': coinType },
        null,
        { session },
      );
      if (!walletWithEntry) {
        await session.abortTransaction();
        throw new Error(`Coin type '${coinType}' not found in wallet after addToSet`);
      }
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        {
          $inc: {
            'balance.total': amount,
            'balance.available': amount,
            'statistics.totalEarned': amount,
            'statistics.transactionCount': 1,
            'coins.$[elem].amount': amount,
          },
        },
        { session, arrayFilters: [{ 'elem.type': coinType }] },
      );
    }

    const tx = await CoinTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(userId),
          type: 'earned',
          coinType,
          amount,
          balanceBefore,
          balanceAfter: balanceBefore + amount,
          source,
          sourceId: opts?.sourceId,
          description,
          merchantId: opts?.merchantId ? new mongoose.Types.ObjectId(opts.merchantId) : undefined,
          idempotencyKey: opts?.idempotencyKey,
        },
      ],
      { session },
    );

    // Write LedgerEntry double-entry pair inside the same session
    const operationType = opts?.operationType || mapSourceToOperationType(source, 'credit');
    const referenceId = opts?.idempotencyKey || opts?.sourceId || tx[0]._id.toString();
    const referenceModel = opts?.referenceModel || source || 'WalletService';
    await writeLedgerPair({
      direction: 'credit',
      walletId: wallet._id as Types.ObjectId,
      userId,
      amount,
      coinType,
      operationType,
      referenceId,
      referenceModel,
      description,
      source,
      idempotencyKey: opts?.idempotencyKey,
      session,
    });

    await session.commitTransaction();

    // WAL-013 FIX: Publish coin credit event to Redis pub/sub with retry backoff so the
    // karma service can subscribe and update karma conversion records. Exponential backoff
    // (1s, 2s, 4s) gives Redis time to recover without hammering it.
    const transactionId = tx[0]._id.toString();
    const payload = JSON.stringify({
      eventId: `coin-credit:${transactionId}`,
      eventType: 'wallet.credited',
      userId,
      amount,
      coinType,
      source,
      transactionId,
      referenceId: opts?.sourceId || opts?.idempotencyKey || transactionId,
      referenceModel: opts?.referenceModel || source || 'WalletService',
      description,
      newBalance: balanceBefore + amount,
      createdAt: new Date().toISOString(),
    });

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await pub.publish('coin-credit', payload);
        break;
      } catch (err) {
        if (attempt === maxAttempts) {
          logger.error('[WalletService] Failed to publish coin-credit event after all retries', {
            userId, amount, coinType, source, transactionId, error: err?.message,
          });
        } else {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          logger.warn('[WalletService] Retrying coin-credit publish', {
            userId, amount, attempt, maxAttempts, error: err?.message,
          });
        }
      }
    }

    // Invalidate cache
    await redis.del(`${BALANCE_CACHE_PREFIX}${userId}`);

    // C-05 FIX: Update cap cache after successful credit
    if (creditIsEarnedType) {
      updateCapCacheAfterCredit(userId, amount).catch((err) => {
        logger.warn('[WalletService] Failed to update cap cache after credit', { userId, error: err.message });
      });
    }

    logger.info('Coins credited', { userId, amount, coinType, source });

    // Audit logging: coins credited
    getAuditLogger().log({
      timestamp: new Date(),
      userId,
      action: AUDIT_ACTIONS.COINS_CREDITED,
      entityType: 'wallet',
      entityId: transactionId,
      status: 'success',
      metadata: {
        amount,
        coinType,
        source,
        balanceBefore,
        balanceAfter: balanceBefore + amount,
        description,
        sourceId: opts?.sourceId,
      },
    }).catch((err) => logger.warn('Audit log failed', { error: err?.message }));

    // C-01 FIX: Record transaction for AML compliance monitoring (fire-and-forget)
    recordTransaction({
      amount,
      type: 'credit',
      fromUserId: undefined,
      toUserId: userId,
      createdAt: new Date(),
    }).catch((err) => {
      logger.warn('[WalletService] AML recordTransaction failed', { userId, error: err.message });
    });

    // CQRS: Update read model (fire-and-forget, don't block the response)
    walletProjectionService.projectWallet(userId).catch((err) => {
      logger.error('[CQRS] Projection failed after credit', { userId, error: err.message });
    });

    // SAVINGS MODULE: Record savings for cashback, referral, and loyalty credits
    // These are the primary sources of user savings
    if (creditIsEarnedType) {
      const savingsType = getSavingsType(source, coinType);
      if (savingsType) {
        // Lazy import to avoid circular dependency
        import('./savingsService').then(({ recordSavings }) => {
          recordSavings({
            userId,
            type: savingsType,
            amount,
            source: opts?.sourceId || transactionId,
            description,
            originalAmount: opts?.sourceId ? undefined : undefined,
            merchantId: opts?.merchantId,
          }).catch((err) => {
            logger.warn('[WalletService] Failed to record savings', { userId, error: err.message });
          });
        });
      }
    }

    return { balance: balanceBefore + amount, transactionId };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Coin types that never expire (expiryDays: 0 per spec — REZ coins last forever)
const NON_EXPIRING_COIN_TYPES = new Set<string>(['rez']);

/**
 * Debits coins from a user's wallet with idempotency and retry support.
 * Uses MongoDB transactions to ensure atomic balance updates.
 * @param userId - The user ID to debit
 * @param amount - Number of coins to debit (must be positive)
 * @param coinType - The coin type being debited
 * @param source - The source of the debit (e.g., 'order_payment', 'redemption')
 * @param description - Human-readable description of the transaction
 * @param opts - Optional parameters including sourceId, idempotencyKey, operationType, referenceModel
 * @returns The transaction record with the new balance
 */
export async function debitCoins(
  userId: string,
  amount: number,
  coinType: 'rez' | 'prive' | 'branded' | 'promo' | 'cashback' | 'referral',
  source: string,
  description: string,
  opts?: { sourceId?: string; idempotencyKey?: string; operationType?: string; referenceModel?: string },
): Promise<{ balance: number; transactionId: string }> {
  if (amount <= 0) throw new Error('Amount must be positive');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Idempotency check inside the transaction — prevents TOCTOU race where two
    // concurrent debit calls both read null and both proceed to debit.
    if (opts?.idempotencyKey) {
      const existing = await CoinTransaction.findOne(
        { idempotencyKey: opts.idempotencyKey },
        null,
        { session },
      );
      if (existing) {
        await session.abortTransaction();
        return { balance: existing.balanceAfter, transactionId: existing._id.toString() };
      }
    }

    // WAL-001 FIX: Consolidate pre-read TOCTOU window into a single atomic findOneAndUpdate.
    // The daily spend limit, balance check, frozen check, and per-coin-type expiry check are
    // ALL embedded in the query condition so they are evaluated atomically with the debit.
    // No concurrent request can race between "check" and "debit" — the query either matches
    // (all conditions pass) or returns null (something failed).
    //
    // For expiring coin types (non-REZ): we cannot embed a per-array-element expiry check
    // into the top-level query. Instead we perform the expiry pre-read INSIDE the transaction
    // session (serializable isolation would catch races, but we use the session to guarantee
    // consistency with the subsequent atomic update). The expiry check is fast (no $regex or
    // aggregation) and the window between it and the atomic update is minimal.
    if (!NON_EXPIRING_COIN_TYPES.has(coinType)) {
      const nowCheck = new Date();
      const walletForExpiry = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(userId), isFrozen: { $ne: true } },
        'coins brandedCoins isFrozen',
        { session },
      );
      if (!walletForExpiry) {
        await session.abortTransaction();
        throw new Error('Insufficient balance');
      }
      let nonExpired = 0;
      if (coinType === 'branded') {
        nonExpired = (walletForExpiry.brandedCoins || [])
          .filter((c) => c.isActive && (!c.expiresAt || c.expiresAt > nowCheck))
          .reduce((s: number, c) => s + (c.amount || 0), 0);
      } else {
        nonExpired = (walletForExpiry.coins || [])
          .filter((c) => c.type === coinType && (!c.expiryDate || c.expiryDate > nowCheck))
          .reduce((s: number, c) => s + (c.amount || 0), 0);
      }
      if (nonExpired < amount) {
        await session.abortTransaction();
        throw new Error(nonExpired === 0 ? 'Coins of this type have expired' : 'Insufficient non-expired coins');
      }
    }

    // WAL-001 FIX: Embed ALL guards into the atomic findOneAndUpdate query predicate.
    // This eliminates the TOCTOU window entirely — no concurrent request can race between
    // "check limit" and "debit" because the $expr evaluates $limits.dailySpent atomically
    // with the balance debit at MongoDB storage engine level.
    //
    // Remaining pre-read (walletForLimit) is ONLY used for:
    //   1. Fast-path error differentiation (distinguish LIMIT_EXCEEDED from other causes)
    //   2. isFrozen guard (early rejection before hitting the atomic query)
    // The pre-read value is NEVER used as the authoritative limit check — the $expr does that.
    const nowAtomic = new Date();
    const userOid = new mongoose.Types.ObjectId(userId);
    const walletForLimit = await Wallet.findOne(
      { user: userOid },
      'limits.isFrozen limits.dailySpendLimit limits.dailySpent limits.lastResetDate',
      { session },
    ).lean();

    if (!walletForLimit) {
      await session.abortTransaction();
      throw new Error('Wallet not found');
    }
    if (walletForLimit.isFrozen) {
      await session.abortTransaction();
      throw new Error('Wallet is frozen');
    }

    const limit = walletForLimit.limits?.dailySpendLimit ?? 0;
    const isNewDayAtomic =
      nowAtomic.getDate() !== (walletForLimit.limits?.lastResetDate?.getDate() ?? 0) ||
      nowAtomic.getMonth() !== (walletForLimit.limits?.lastResetDate?.getMonth() ?? 0) ||
      nowAtomic.getFullYear() !== (walletForLimit.limits?.lastResetDate?.getFullYear() ?? 0);

    // Build the atomic query. The $expr ALWAYS reads $limits.dailySpent live from the
    // document at query evaluation time — never a pre-read stale value. On a new day
    // $limits.dailySpent is still 0 from yesterday's value, so the check is correct:
    // it allows the debit because 0 + amount <= limit (first spend of new day).
    const atomicQuery: Record<string, unknown> = {
      user: userOid,
      'balance.available': { $gte: amount },
      isFrozen: { $ne: true },
      ...(limit > 0
        ? {
            // WAL-001: Single atomic condition — live $limits.dailySpent at query time.
            // No TOCTOU possible: MongoDB evaluates $limits.dailySpent and applies the
            // $inc in a single atomic write operation on the document.
            $expr: { $lte: [{ $add: ['$limits.dailySpent', amount] }, limit] },
          }
        : {}),
    };

    const updated = await Wallet.findOneAndUpdate(
      atomicQuery,
      {
        $inc: {
          'balance.total': -amount,
          'balance.available': -amount,
          'statistics.totalSpent': amount,
          'statistics.transactionCount': 1,
          ...(coinType === 'branded'
            ? { 'brandedCoins.$[elem].amount': -amount }
            : { 'coins.$[elem].amount': -amount }),
        },
        // WAL-001 + WAL-002: Atomically increment dailySpent inside the same op.
        // On a new day reset dailySpent to `amount`; otherwise increment.
        ...(limit > 0
          ? isNewDayAtomic
            ? { $set: { 'limits.dailySpent': amount, 'limits.lastResetDate': nowAtomic } }
            : { $inc: { 'limits.dailySpent': amount } }
          : {}),
      },
      { session, new: true, arrayFilters: [{ 'elem.type': coinType }] },
    );

    if (!updated) {
      await session.abortTransaction();
      // WAL-001: Fast-path error differentiation using the pre-read values.
      // The pre-read $limits.dailySpent is stale by at most the session duration (ms), but
      // the atomic $expr is authoritative. We use pre-read here only for user-facing error
      // message quality — the atomic update is the true enforcement.
      const preReadDailySpent = walletForLimit.limits?.dailySpent ?? 0;
      if (limit > 0 && preReadDailySpent + amount > limit) {
        throw Object.assign(
          new Error(`Daily spend limit of ${limit} would be exceeded`),
          { code: 'DAILY_LIMIT_EXCEEDED', statusCode: 429 },
        );
      }
      if (walletForLimit.isFrozen) throw new Error('Wallet is frozen');
      throw new Error('Insufficient balance');
    }

    const tx = await CoinTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(userId),
          type: 'spent',
          coinType,
          amount,
          balanceBefore: updated.balance.available + amount,
          balanceAfter: updated.balance.available,
          source,
          sourceId: opts?.sourceId,
          description,
          idempotencyKey: opts?.idempotencyKey,
        },
      ],
      { session },
    );

    // Write LedgerEntry double-entry pair inside the same session
    const operationType = opts?.operationType || mapSourceToOperationType(source, 'debit');
    const referenceId = opts?.idempotencyKey || opts?.sourceId || tx[0]._id.toString();
    const referenceModel = opts?.referenceModel || source || 'WalletService';
    await writeLedgerPair({
      direction: 'debit',
      walletId: updated._id as Types.ObjectId,
      userId,
      amount,
      coinType,
      operationType,
      referenceId,
      referenceModel,
      description,
      source,
      idempotencyKey: opts?.idempotencyKey,
      session,
    });

    await session.commitTransaction();
    await redis.del(`${BALANCE_CACHE_PREFIX}${userId}`);

    logger.info('Coins debited', { userId, amount, coinType, source });

    // Audit logging: coins debited
    const debitTxId = tx[0]._id.toString();
    getAuditLogger().log({
      timestamp: new Date(),
      userId,
      action: AUDIT_ACTIONS.COINS_DEBITED,
      entityType: 'wallet',
      entityId: debitTxId,
      status: 'success',
      metadata: {
        amount,
        coinType,
        source,
        balanceBefore: updated.balance.available + amount,
        balanceAfter: updated.balance.available,
        description,
        sourceId: opts?.sourceId,
      },
    }).catch((err) => logger.warn('Audit log failed', { error: err?.message }));

    // C-01 FIX: Record transaction for AML compliance monitoring (fire-and-forget)
    recordTransaction({
      amount,
      type: 'debit',
      fromUserId: userId,
      toUserId: undefined,
      createdAt: new Date(),
    }).catch((err) => {
      logger.warn('[WalletService] AML recordTransaction failed', { userId, error: err.message });
    });

    // CQRS: Update read model (fire-and-forget, don't block the response)
    walletProjectionService.projectWallet(userId).catch((err) => {
      logger.error('[CQRS] Projection failed after debit', { userId, error: err.message });
    });

    return { balance: updated.balance.available, transactionId: debitTxId };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Debit using canonical priority order: Promo → Branded → Prive → REZ.
 * Use this when the caller wants automatic coin-type sequencing.
 * Pass autoOrder=true to the /internal/debit endpoint to trigger this path.
 */
export async function debitInPriorityOrder(
  userId: string,
  totalAmount: number,
  source: string,
  description: string,
  opts?: { sourceId?: string; idempotencyKey?: string; operationType?: string; referenceModel?: string },
): Promise<{ balance: number; transactionIds: string[] }> {
  if (totalAmount <= 0) throw new Error('Amount must be positive');

  const PRIORITY: Array<'promo' | 'branded' | 'prive' | 'rez' | 'cashback' | 'referral'> = ['promo', 'branded', 'prive', 'cashback', 'referral', 'rez'];
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (opts?.idempotencyKey) {
      const existing = await CoinTransaction.findOne({ idempotencyKey: opts.idempotencyKey }, null, { session });
      if (existing) {
        await session.abortTransaction();
        return { balance: existing.balanceAfter, transactionIds: [existing._id.toString()] };
      }
    }

    const wallet = await Wallet.findOne(
      { user: new mongoose.Types.ObjectId(userId), isFrozen: { $ne: true } },
      null,
      { session },
    );
    if (!wallet) {
      await session.abortTransaction();
      const raw = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) }).lean();
      if ((raw as unknown)?.isFrozen) throw new Error('Wallet is frozen');
      throw new Error('Wallet not found');
    }

    // CRITICAL: Embed daily spend limit check in atomic query to prevent TOCTOU race.
    // The pre-read is only used for error differentiation; the $expr enforces atomically.
    const dailySpendLimit = wallet.limits?.dailySpendLimit ?? 0;
    const nowForLimit = new Date();
    const lastResetForLimit = new Date(wallet.limits?.lastResetDate ?? nowForLimit);
    const isNewDayForLimit =
      nowForLimit.getDate() !== lastResetForLimit.getDate() ||
      nowForLimit.getMonth() !== lastResetForLimit.getMonth() ||
      nowForLimit.getFullYear() !== lastResetForLimit.getFullYear();
    const preReadDailySpent = isNewDayForLimit ? 0 : (wallet.limits?.dailySpent ?? 0);

    const now = new Date();
    const tierBalances: Record<string, number> = {
      promo: (wallet.coins || []).filter((c) => c.type === 'promo' && (!c.expiryDate || c.expiryDate > now)).reduce((s: number, c) => s + (c.amount || 0), 0),
      branded: (wallet.brandedCoins || []).filter((c) => c.isActive && (!c.expiresAt || c.expiresAt > now)).reduce((s: number, c) => s + (c.amount || 0), 0),
      prive: (wallet.coins || []).filter((c) => c.type === 'prive' && (!c.expiryDate || c.expiryDate > now)).reduce((s: number, c) => s + (c.amount || 0), 0),
      rez: (wallet.coins || []).filter((c) => c.type === 'rez').reduce((s: number, c) => s + (c.amount || 0), 0),
      cashback: (wallet.balance as unknown).cashback ?? 0,
      referral: (wallet.coins || []).filter((c) => c.type === 'referral').reduce((s: number, c) => s + (c.amount || 0), 0),
    };

    const totalAvailable = PRIORITY.reduce((s, t) => s + tierBalances[t], 0);
    if (totalAvailable < totalAmount) {
      await session.abortTransaction();
      throw new Error('Insufficient balance across all coin types');
    }

    let remaining = totalAmount;
    const plan: Array<{ coinType: 'promo' | 'branded' | 'prive' | 'cashback' | 'referral' | 'rez'; debit: number }> = [];
    // COIN-TRUNCATION: Math.min() is used — no floor needed since all amounts are integers
    // (totalAmount comes from callers who pass pre-rounded coin integers, tierBalances are
    // already integer sums, remaining is decremented by integer take values).
    for (const tier of PRIORITY) {
      if (remaining <= 0) break;
      const take = Math.min(tierBalances[tier], remaining);
      if (take > 0) { plan.push({ coinType: tier, debit: take }); remaining -= take; }
    }

    // CRITICAL FIX: Single atomic update for balance + sub-array to prevent divergence.
    // Previous approach: balance decremented first, then sub-array updated separately.
    // If sub-array updates failed after balance decrement, we had balance/sub-balance divergence.
    // Now: ALL updates (balance + sub-array + dailySpent) happen in ONE atomic findOneAndUpdate.

    // Build arrayFilters for each coin type in plan
    const arrayFilters = plan.map((step) => {
      if (step.coinType === 'branded') return { 'elem.type': 'branded' };
      if (step.coinType === 'cashback') return {};
      return { 'elem.type': step.coinType };
    });

    // Build the atomic query with daily limit check embedded via $expr
    const atomicQuery: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(userId),
      'balance.available': { $gte: totalAmount },
      isFrozen: { $ne: true },
    };
    if (dailySpendLimit > 0) {
      atomicQuery.$expr = { $lte: [{ $add: ['$limits.dailySpent', totalAmount] }, dailySpendLimit] };
    }

    // Build the atomic update: balance + sub-array + dailySpent in ONE $inc
    const atomicUpdateInc: Record<string, number> = {
      'balance.total': -totalAmount,
      'balance.available': -totalAmount,
      'statistics.totalSpent': totalAmount,
      'statistics.transactionCount': plan.length,
    };
    if (dailySpendLimit > 0) {
      atomicUpdateInc['limits.dailySpent'] = totalAmount;
    }
    for (const step of plan) {
      if (step.coinType === 'branded') {
        atomicUpdateInc['brandedCoins.$[elem].amount'] = -step.debit;
      } else if (step.coinType === 'cashback') {
        atomicUpdateInc['balance.cashback'] = -step.debit;
      } else {
        atomicUpdateInc[`coins.$[elem].amount`] = -step.debit;
      }
    }

    // Execute single atomic update
    const updated = await Wallet.findOneAndUpdate(
      atomicQuery,
      {
        $inc: atomicUpdateInc,
        ...(dailySpendLimit > 0 && isNewDayForLimit ? { $set: { 'limits.lastResetDate': nowForLimit } } : {})
      },
      { session, new: true, arrayFilters },
    );

    if (!updated) {
      await session.abortTransaction();
      if (dailySpendLimit > 0 && preReadDailySpent + totalAmount > dailySpendLimit) {
        throw Object.assign(
          new Error(`Daily spend limit of ${dailySpendLimit} would be exceeded`),
          { code: 'DAILY_LIMIT_EXCEEDED', statusCode: 429 },
        );
      }
      throw new Error('Insufficient balance');
    }

    const transactionIds: string[] = [];
    const operationType = opts?.operationType || mapSourceToOperationType(source, 'debit');
    const referenceModel = opts?.referenceModel || source || 'WalletService';
    let runningBalance = updated.balance.available + totalAmount;

    for (const step of plan) {
      const balanceBefore = runningBalance;
      runningBalance -= step.debit;
      const tx = await CoinTransaction.create(
        [{ user: new mongoose.Types.ObjectId(userId), type: 'spent', coinType: step.coinType, amount: step.debit, balanceBefore, balanceAfter: runningBalance, source, sourceId: opts?.sourceId, description: `${description} [priority:${step.coinType}]`, idempotencyKey: transactionIds.length === 0 ? opts?.idempotencyKey : undefined }],
        { session },
      );
      transactionIds.push(tx[0]._id.toString());
      await writeLedgerPair({ direction: 'debit', walletId: updated._id as Types.ObjectId, userId, amount: step.debit, coinType: step.coinType, operationType, referenceId: transactionIds.length === 1 && opts?.idempotencyKey ? opts.idempotencyKey : (opts?.sourceId || tx[0]._id.toString()), referenceModel, description: `${description} [priority:${step.coinType}]`, source, idempotencyKey: transactionIds.length === 1 ? opts?.idempotencyKey : undefined, session });
    }

    // dailySpent is now updated atomically within the findOneAndUpdate above
    await session.commitTransaction();
    try {
      await redis.del(`${BALANCE_CACHE_PREFIX}${userId}`);
    } catch (redisErr) {
      logger.warn('[WalletService] Failed to invalidate balance cache', { error: redisErr, userId });
    }

    logger.info('Coins debited via priority order', { userId, totalAmount, source, plan });

    // CQRS: Update read model (fire-and-forget, don't block the response)
    walletProjectionService.projectWallet(userId).catch((err) => {
      logger.error('[CQRS] Projection failed after priority debit', { userId, error: err.message });
    });

    return { balance: updated.balance.available, transactionIds };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// MEDIUM NOTE: Cashback Expiry Not Tracked
// Cashback is stored as a scalar in balance.cashback with no expiry tracking.
// Per current design, cashback is treated as non-expiring currency.
// If expiry tracking is needed in the future, add expiresAt field to cashback
// and update priority-order debit logic to filter on expiry.
// TODO: Design decision — confirm if cashback should have expiry semantics.
const VALID_COIN_TYPES = new Set(['rez', 'prive', 'branded', 'promo', 'cashback', 'referral']);

// Map raw CoinTransaction.type (lowercase internal values) to consumer-compatible
// credit/debit + category. This is the single canonical transform applied at the
// wallet-service boundary so all consumers (consumer app, admin app) receive the
// same shape regardless of which endpoint they call.
//
// XS-CRIT-002 FIX: Previously getTransactions() returned raw MongoDB documents
// with type='earned'/'spent'. The consumer app's TransactionResponse interface
// expects type:'credit'|'debit' + category:'earning'|'spending'|... etc.
// Without this transform every filtered transaction query silently returned empty.
const TX_TYPE_MAP: Record<string, { type: 'credit' | 'debit'; category: 'earning' | 'spending' | 'refund' | 'withdrawal' | 'topup' | 'bonus' | 'penalty' | 'cashback' }> = {
  earned:       { type: 'credit',  category: 'earning'   },
  bonus:         { type: 'credit',  category: 'bonus'     },
  branded_award: { type: 'credit',  category: 'bonus'     },
  refunded:      { type: 'credit',  category: 'refund'    },
  spent:         { type: 'debit',   category: 'spending' },
  expired:       { type: 'debit',   category: 'penalty'  },
};

/**
 * Retrieves paginated wallet transactions for a user with credit/debit categorization.
 * Filters by coin type if specified. Returns consumer-friendly transaction records.
 * @param userId - The user ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @param coinType - Optional coin type filter
 * @returns Paginated transactions with total count and hasMore flag
 */
export async function getTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20,
  coinType?: string,
): Promise<{ transactions: unknown[]; total: number; page: number; hasMore: boolean }> {
  const filter: unknown = { user: new mongoose.Types.ObjectId(userId) };
  if (coinType) {
    if (typeof coinType !== 'string' || !VALID_COIN_TYPES.has(coinType)) {
      throw new Error('Invalid coinType');
    }
    filter.coinType = coinType;
  }

  const [rawTxns, total] = await Promise.all([
    CoinTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CoinTransaction.countDocuments(filter),
  ]);

  // XS-CRIT-002: Normalize raw MongoDB type to consumer-compatible credit/debit + category
  const transactions = rawTxns.map((tx) => {
    const mapped = TX_TYPE_MAP[tx.type] ?? { type: 'debit' as const, category: 'spending' as const };
    return {
      ...tx,
      // Consumer API contract: type is 'credit'|'debit', category is the semantic bucket
      type: mapped.type,
      category: mapped.category,
      // Normalize _id → id for consumer convenience
      id: tx._id.toString(),
      // Normalize status to consumer format (defaults to 'completed' per schema default)
      status: { current: tx.status ?? 'completed', history: [] },
      // Normalize source to the consumer's source shape
      source: {
        type: tx.source ?? '',
        reference: tx.sourceId?.toString() ?? '',
        description: tx.description ?? '',
        metadata: tx.metadata ?? undefined,
      },
      // Always return the raw coinType so consumers know which coin tier
      coinType: tx.coinType,
    };
  });

  return { transactions, total, page, hasMore: page * limit < total };
}

/**
 * Returns a summary of wallet activity for a user including total earned, total spent,
 * transaction counts, and current balances across all coin types.
 * @param userId - The user ID to get the summary for
 * @returns Transaction summary with earned, spent, counts, and current balances
 */
export async function getTransactionSummary(userId: string) {
  const oid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allTime, thisMonth] = await Promise.all([
    CoinTransaction.aggregate([
      { $match: { user: oid } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    CoinTransaction.aggregate([
      { $match: { user: oid, createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { allTime, thisMonth };
}

/**
 * Process a partial refund for a transaction.
 * Credits back the proportional amount of coins used, floored to the nearest integer.
 *
 * @param userId              - Wallet owner
 * @param originalTransactionId - ID of the original order/payment transaction
 * @param refundAmount        - Rupee amount being refunded for this partial refund
 * @param originalAmount      - Total rupee amount of the original order
 * @param coinsOriginallyUsed - Coin amount that was spent on the original order
 * @param coinType            - Coin type to refund (default: 'rez')
 * @returns coinsRefunded and the new wallet transaction ID
 */
export async function partialRefund(
  userId: string,
  originalTransactionId: string,
  refundAmount: number,
  originalAmount: number,
  coinsOriginallyUsed: number,
  coinType: 'rez' | 'prive' | 'branded' | 'promo' | 'cashback' | 'referral' = 'rez',
): Promise<{ coinsRefunded: number; transactionId: string }> {
  // Guard: invalid amounts
  if (refundAmount <= 0 || originalAmount <= 0 || coinsOriginallyUsed < 0) {
    return { coinsRefunded: 0, transactionId: '' };
  }

  // Guard: zero coin spend — nothing to refund
  if (coinsOriginallyUsed === 0) {
    return { coinsRefunded: 0, transactionId: '' };
  }

  // Guard: refund ratio capped at 1.0 (cannot refund more than originally spent)
  const refundRatio = originalAmount > 0 ? refundAmount / originalAmount : 0;
  const safeRatio = Math.min(refundRatio, 1.0);
  // COIN-TRUNCATION: floor() is applied intentionally — coins are discrete integers, rounding
  // down (conservative) ensures the user is never credited more than their pro-rated share.
  // e.g. 100 coins used, 99% refund → floor(100 * 0.99) = 99 coins (user loses 1 coin).
  const coinsToRefund = Math.min(
    Math.floor(coinsOriginallyUsed * safeRatio),
    coinsOriginallyUsed
  );

  // Guard: no fractional coins — skip if rounding yields 0
  if (coinsToRefund <= 0) {
    return { coinsRefunded: 0, transactionId: '' };
  }

  // Idempotency: same original transaction + same refund ratio cannot be credited twice.
  // FIX REZ-WALLET-005: Round amounts to integers (paise) to avoid float precision issues
  // in idempotency keys. "99.999999" and "100.0" rupees both become 9999 and 10000 paise.
  const refundAmountPaise = Math.round(refundAmount * 100);
  const originalAmountPaise = Math.round(originalAmount * 100);
  const idempotencyKey = `partial_refund:${originalTransactionId}:${userId}:${refundAmountPaise}:${originalAmountPaise}`;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check idempotency inside the transaction to prevent concurrent double-credit
    const existing = await CoinTransaction.findOne({ idempotencyKey }, null, { session });
    if (existing) {
      await session.abortTransaction();
      return { coinsRefunded: 0, transactionId: existing._id.toString() };
    }

    const wallet = await getOrCreateWallet(userId, session);

    // Frozen wallet guard
    if (wallet.isFrozen) {
      await session.abortTransaction();
      throw new Error('Wallet is frozen');
    }

    const balanceBefore = wallet.balance.available;

    // Update per-type sub-array (same pattern as creditCoins)
    const coinEntry =
      coinType === 'branded'
        ? { type: 'branded' as const, amount: 0, isActive: true, expiresAt: null }
        : { type: coinType as string, amount: 0, isActive: true };

    if (coinType === 'branded') {
      await Wallet.updateOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $addToSet: { brandedCoins: coinEntry } },
        { session },
      );
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        {
          $inc: {
            'balance.total': coinsToRefund,
            'balance.available': coinsToRefund,
            'statistics.totalEarned': coinsToRefund,
            'statistics.transactionCount': 1,
            'brandedCoins.$[elem].amount': coinsToRefund,
          },
        },
        { session, arrayFilters: [{ 'elem.type': 'branded' }] },
      );
    } else {
      await Wallet.updateOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $addToSet: { coins: coinEntry } },
        { session },
      );
      const walletWithEntry = await Wallet.findOne(
        { user: new mongoose.Types.ObjectId(userId), 'coins.type': coinType },
        null,
        { session },
      );
      if (!walletWithEntry) {
        await session.abortTransaction();
        throw new Error(`Coin type '${coinType}' not found in wallet after addToSet`);
      }
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        {
          $inc: {
            'balance.total': coinsToRefund,
            'balance.available': coinsToRefund,
            'statistics.totalEarned': coinsToRefund,
            'statistics.transactionCount': 1,
            'coins.$[elem].amount': coinsToRefund,
          },
        },
        { session, arrayFilters: [{ 'elem.type': coinType }] },
      );
    }

    const tx = await CoinTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(userId),
          type: 'refunded' as const,
          coinType,
          amount: coinsToRefund,
          balanceBefore,
          balanceAfter: balanceBefore + coinsToRefund,
          source: 'partial_refund',
          sourceId: originalTransactionId,
          description: `Partial refund (${(refundRatio * 100).toFixed(1)}% of order)`,
          idempotencyKey,
          metadata: {
            refundAmount,
            originalAmount,
            coinsOriginallyUsed,
            refundRatio,
          },
        },
      ],
      { session },
    );

    // Write double-entry ledger pair with 'order_refund' operation type
    await writeLedgerPair({
      direction: 'credit',
      walletId: wallet._id as Types.ObjectId,
      userId,
      amount: coinsToRefund,
      coinType,
      operationType: 'order_refund',
      referenceId: idempotencyKey,
      referenceModel: 'WalletService',
      description: `Partial refund — ${(refundRatio * 100).toFixed(1)}% of ₹${originalAmount} (original transaction: ${originalTransactionId})`,
      source: 'partial_refund',
      idempotencyKey,
      session,
    });

    await session.commitTransaction();

    // Invalidate balance cache
    await redis.del(`${BALANCE_CACHE_PREFIX}${userId}`);

    logger.info('Partial refund processed', {
      userId,
      originalTransactionId,
      refundAmount,
      originalAmount,
      coinsOriginallyUsed,
      coinsToRefund,
      refundRatio: parseFloat(refundRatio.toFixed(4)),
      coinType,
    });

    return { coinsRefunded: coinsToRefund, transactionId: tx[0]._id.toString() };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Check if user has already claimed welcome bonus (one-time claim validation)
 * Returns true if welcome_bonus transaction exists for this user
 */
export async function hasWelcomeCoinsTransaction(userId: string): Promise<boolean> {
  try {
    const transaction = await CoinTransaction.findOne(
      {
        user: new mongoose.Types.ObjectId(userId),
        source: 'welcome_bonus',
      },
      null,
      { lean: true },
    );
    return !!transaction;
  } catch (err) {
    // If query fails, assume user has not claimed to be safe
    return false;
  }
}
