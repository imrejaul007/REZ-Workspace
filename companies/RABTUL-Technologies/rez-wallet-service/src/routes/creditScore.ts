/**
 * Credit Score route — GET /credit-score/:merchantId
 *
 * Assembles CreditScoreInput from multiple REZ data sources, calls the
 * CreditScoreCalculator, and caches the result for 24 hours.
 *
 * Protected by X-Internal-Token — only the RestaurantHub API (fintech module)
 * should call this directly. The raw scoring inputs are never returned to callers.
 *
 * Production note: the analytics-events, payment records, and merchant purchase
 * order fetches below use best-effort calls with sensible defaults when a
 * downstream service is unavailable.
 *
 * ── CS-H2 NOTE: See rez-finance-service/src/services/creditIntelligenceService.ts
 * for the canonical credit score implementation and the recommendation to
 * consolidate both scoring engines. This service should eventually proxy to
 * rez-finance-service rather than computing its own score, once the data
 * sources (monthlyRevenue, paymentRegularity) are available there.
 */

import { Router, Request, Response } from 'express';
import { requireInternalToken } from '../middleware/internalAuth';
import { computeCreditScore } from '../engines/CreditScoreCalculator';
import type { CreditScoreInput, CreditScore } from '../engines/CreditScoreCalculator';
import { logger } from '../config/logger';

const router = Router();

// L5 FIX: LRU cache with bounded size to prevent unbounded memory growth.
// Previously the cache grew without limit as new merchants were queried.
// Max 1000 entries with LRU eviction when limit reached.
const MAX_CACHE_SIZE = 1000;
const scoreCache = new Map<string, { score: CreditScore; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheSet(key: string, value: { score: CreditScore; expiresAt: number }): void {
  // Evict oldest entries if at capacity (LRU approximation)
  if (scoreCache.size >= MAX_CACHE_SIZE && !scoreCache.has(key)) {
    const firstKey = scoreCache.keys().next().value;
    if (firstKey !== undefined) scoreCache.delete(firstKey);
  }
  scoreCache.set(key, value);
}

// ── Service URLs (resolved at module load — must be set via env vars) ────────

const ANALYTICS_EVENTS_URL = process.env.ANALYTICS_EVENTS_URL;
const REZ_PAYMENT_SERVICE_URL = process.env.REZ_PAYMENT_SERVICE_URL;
const REZ_MERCHANT_SERVICE_URL = process.env.REZ_MERCHANT_SERVICE_URL;

// CS-L3: URL validation moved to request-time (handler level) so it uses the
// structured logger and does not emit console.error noise at module load.
// The per-fetcher checks below (analyticsUrl(), paymentServiceUrl(), merchantServiceUrl())
// each call logger.warn on first use if the URL is missing.

function analyticsUrl(): string | undefined {
  return ANALYTICS_EVENTS_URL;
}

function paymentServiceUrl(): string | undefined {
  return REZ_PAYMENT_SERVICE_URL;
}

function merchantServiceUrl(): string | undefined {
  return REZ_MERCHANT_SERVICE_URL;
}

function internalToken(): string {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    if (parsed['rez-wallet-service']) {
      return parsed['rez-wallet-service'];
    }
  } catch {
    logger.warn('[CreditScore] Failed to parse INTERNAL_SERVICE_TOKENS_JSON');
  }

  // BUG-WAL-003 FIX: fall back to legacy single-token when scoped map lookup fails
  if (process.env.INTERNAL_SERVICE_TOKEN) {
    return process.env.INTERNAL_SERVICE_TOKEN;
  }

  return '';
}

function authHeaders() {
  return {
    'x-internal-service': 'rez-wallet-service',
    'x-internal-token': internalToken(),
  };
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, defaultValue: T): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const resp = await fetch(url, { headers: authHeaders(), signal: ac.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return (await resp.json()) as T;
  } catch {
    return defaultValue;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch last 12 months of monthly revenue from analytics-events service */
async function fetchMonthlyRevenue(merchantId: string): Promise<number[]> {
  const baseUrl = analyticsUrl();
  if (!baseUrl) {
    logger.warn('[CreditScore] ANALYTICS_EVENTS_URL not set — skipping fetchMonthlyRevenue', { merchantId });
    return [];
  }
  const data = await fetchJson<{ data?: { monthlyRevenue?: number[] } }>(
    `${baseUrl}/merchants/${encodeURIComponent(merchantId)}/revenue/monthly`,
    {},
  );
  if (!data?.data?.monthlyRevenue) {
    logger.warn('[CreditScore] fetchMonthlyRevenue returned no data — using empty history', { merchantId });
  }
  return data?.data?.monthlyRevenue ?? [];
}

/** Fetch payment regularity (0-1) from payment-service */
async function fetchPaymentRegularity(merchantId: string): Promise<number> {
  const baseUrl = paymentServiceUrl();
  if (!baseUrl) {
    logger.warn('[CreditScore] REZ_PAYMENT_SERVICE_URL not set — skipping fetchPaymentRegularity', { merchantId });
    return 0.5;
  }
  const data = await fetchJson<{ data?: { onTimeRate?: number } }>(
    `${baseUrl}/internal/merchants/${encodeURIComponent(merchantId)}/payment-regularity`,
    {},
  );
  if (data?.data?.onTimeRate == null) {
    logger.warn('[CreditScore] fetchPaymentRegularity returned no data — defaulting to 0.5', { merchantId });
  }
  return data?.data?.onTimeRate ?? 0.5;
}

/** Fetch purchase order stats from merchant-service */
async function fetchOrderStats(merchantId: string): Promise<{
  ordersPerMonth: number;
  disputeRate: number;
  accountAgeMonths: number;
}> {
  const baseUrl = merchantServiceUrl();
  if (!baseUrl) {
    logger.warn('[CreditScore] REZ_MERCHANT_SERVICE_URL not set — skipping fetchOrderStats', { merchantId });
    return { ordersPerMonth: 0, disputeRate: 0, accountAgeMonths: 0 };
  }
  const data = await fetchJson<{
    data?: { ordersPerMonth?: number; disputeRate?: number; accountAgeMonths?: number };
  }>(
    `${baseUrl}/internal/merchants/${encodeURIComponent(merchantId)}/order-stats`,
    {},
  );
  if (!data?.data) {
    logger.warn('[CreditScore] fetchOrderStats returned no data — using zero defaults', { merchantId });
  }
  return {
    ordersPerMonth: data?.data?.ordersPerMonth ?? 0,
    disputeRate: data?.data?.disputeRate ?? 0,
    accountAgeMonths: data?.data?.accountAgeMonths ?? 0,
  };
}

/** Fetch wallet balance from the wallet model directly (same service).
 *  MerchantWallet stores `merchant` as an ObjectId ref to User.
 *  We query by the string merchantId which may be a Mongo ObjectId string.
 */
async function fetchWalletBalance(merchantId: string): Promise<number> {
  try {
    const { MerchantWallet } = await import('../models/MerchantWallet');
    // merchant field is an ObjectId — cast string to ObjectId for the query
    const { Types } = await import('mongoose');
    let query: Record<string, unknown>;
    if (Types.ObjectId.isValid(merchantId)) {
      query = { merchant: new Types.ObjectId(merchantId) };
    } else {
      // merchantId is not a Mongo ObjectId — service will return 0 gracefully
      return 0;
    }
    const wallet = await MerchantWallet.findOne(query).lean();
    const balance = (wallet as unknown)?.balance;
    // balance may be an object { available, pending } or a number
    if (typeof balance === 'number') return balance;
    if (balance && typeof balance === 'object') return balance.available ?? 0;
    return 0;
  } catch (err) {
    logger.warn('[CreditScore] fetchWalletBalance failed', { merchantId, error: err.message });
    return 0;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /credit-score/:merchantId
 *
 * Returns a CreditScore object or { ineligible: true, reason: string }.
 * Results are cached for 24 hours per merchantId.
 */
router.get(
  '/credit-score/:merchantId',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const merchantId = String(req.params['merchantId'] ?? '');

    const isValidObjectId = /^[a-f0-9]{24}$/i.test(merchantId);
    const isValidMerchantSlug = /^[a-zA-Z0-9_-]{1,64}$/.test(merchantId);
    if (!isValidObjectId && !isValidMerchantSlug) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }

    // Cache hit
    const cached = scoreCache.get(merchantId);
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ success: true, data: cached.score, cached: true });
      return;
    }

    try {
      // Fan out all data fetches concurrently
      const [monthlyRevenue, paymentRegularity, orderStats, walletBalance] =
        await Promise.all([
          fetchMonthlyRevenue(merchantId),
          fetchPaymentRegularity(merchantId),
          fetchOrderStats(merchantId),
          fetchWalletBalance(merchantId),
        ]);

      const input: CreditScoreInput = {
        merchantId,
        monthlyRevenueHistory: monthlyRevenue,
        paymentRegularity,
        supplierOrderFrequency: orderStats.ordersPerMonth,
        disputeRate: orderStats.disputeRate,
        accountAgeMonths: orderStats.accountAgeMonths,
        walletBalance,
      };

      const score = await computeCreditScore(input);

      // Detect ineligibility (< 3 months data)
      if (score.dataMonthsAvailable < 3 && score.score === 0) {
        res.json({
          success: true,
          ineligible: true,
          reason: score.factors[0]?.description ?? 'Insufficient REZ data history',
          dataMonthsAvailable: score.dataMonthsAvailable,
        });
        return;
      }

      // Cache and return (uses LRU-eviction cacheSet)
      cacheSet(merchantId, { score, expiresAt: Date.now() + CACHE_TTL_MS });
      res.json({ success: true, data: score, cached: false });
    } catch (err) {
      logger.error('[CreditScore] computation failed', { merchantId, error: err.message });
      res.status(500).json({ success: false, message: 'Credit score computation failed' });
    }
  },
);

export default router;
