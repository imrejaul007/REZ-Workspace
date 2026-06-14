/**
 * Cross-Merchant Routes
 *
 * Cross-merchant loyalty tracking and bonus endpoints.
 * Routes to Cross-Merchant Service (port 4028).
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import {
  circuitBreaker,
  getCircuitBreaker,
  CircuitOpenError,
} from '../utils/circuitBreaker';

const router = Router();

// Service URL
const CROSS_MERCHANT_SERVICE_URL = process.env.CROSS_MERCHANT_SERVICE_URL || 'http://localhost:4028';

// ============================================
// TYPES
// ============================================

interface Merchant {
  merchantId: string;
  merchantName: string;
  category: string;
  totalSpend: number;
  pointsEarned: number;
  lastVisit: string;
  visitCount: number;
}

interface CrossMerchantProfile {
  userId: string;
  merchantCount: number;
  merchants: Merchant[];
  crossMerchantBonus: number;
  mostVisitedMerchant: string;
  tierLevel: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  bonusMultiplier: number;
  nextTierBonus: number;
}

interface CrossMerchantTransaction {
  transactionId: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  pointsEarned: number;
  crossMerchantBonus: number;
  timestamp: string;
}

interface CrossMerchantBonus {
  bonusId: string;
  type: 'multiplier' | 'flat' | 'category_bonus';
  value: number;
  description: string;
  conditions: string[];
  expiresAt?: string;
  claimed: boolean;
}

interface MerchantRanking {
  merchantId: string;
  merchantName: string;
  category: string;
  totalUsers: number;
  avgSpend: number;
  bonusPool: number;
}

interface CrossMerchantSummary {
  userId: string;
  totalMerchantsVisited: number;
  totalSpendAcrossMerchants: number;
  totalPointsEarned: number;
  crossMerchantBonusEarned: number;
  currentTier: string;
  bonusMultiplier: number;
  pendingBonuses: number;
}

// ============================================
// IN-MEMORY STORE (Demo)
const profilesStore = new Map<string, CrossMerchantProfile>();
const transactionsStore = new Map<string, CrossMerchantTransaction[]>();
const bonusesStore = new Map<string, CrossMerchantBonus[]>();
const merchantRankingsStore = new Map<string, MerchantRanking>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const transactionSchema = z.object({
  merchantId: z.string().min(1),
  merchantName: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
});

// ============================================
// CROSS-MERCHANT SERVICE CALL
// ============================================

async function callCrossMerchantService<T>(
  endpoint: string,
  userId: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'cross-merchant-service',
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

      const response = await fetch(`${CROSS_MERCHANT_SERVICE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Cross-Merchant service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// CROSS-MERCHANT ENDPOINTS
// ============================================

/**
 * Get cross-merchant profile
 * GET /api/v1/cross-merchant/:userId
 */
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId
    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Try circuit breaker call first, fall back to demo data
    let profile: CrossMerchantProfile;
    try {
      profile = await callCrossMerchantService<CrossMerchantProfile>(
        `/api/profile/${userId}`,
        userId
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        return res.status(503).json({
          success: false,
          error: 'Cross-Merchant service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
      }

      // Fallback to demo data
      profile = profilesStore.get(userId) || generateDemoProfile(userId);
      profilesStore.set(userId, profile);
    }

    logger.info('[CrossMerchant] Get profile', { userId });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get cross-merchant profile';
    logger.error('[CrossMerchant] Get profile failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get cross-merchant summary
 * GET /api/v1/cross-merchant/:userId/summary
 */
router.get('/:userId/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const profile = profilesStore.get(userId) || generateDemoProfile(userId);
    const transactions = transactionsStore.get(userId) || [];

    const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPoints = transactions.reduce((sum, t) => sum + t.pointsEarned, 0);
    const totalBonus = transactions.reduce((sum, t) => sum + t.crossMerchantBonus, 0);

    const summary: CrossMerchantSummary = {
      userId,
      totalMerchantsVisited: profile.merchantCount,
      totalSpendAcrossMerchants: totalSpend || 16500,
      totalPointsEarned: totalPoints || 825,
      crossMerchantBonusEarned: totalBonus || 500,
      currentTier: profile.tierLevel,
      bonusMultiplier: profile.bonusMultiplier,
      pendingBonuses: (bonusesStore.get(userId) || []).filter(b => !b.claimed).length,
    };

    logger.info('[CrossMerchant] Get summary', { userId });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    logger.error('[CrossMerchant] Get summary failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get merchant visits
 * GET /api/v1/cross-merchant/:userId/merchants
 */
router.get('/:userId/merchants', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, sort = 'lastVisit' } = req.query;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const profile = profilesStore.get(userId) || generateDemoProfile(userId);
    let merchants = [...profile.merchants];

    // Filter by category
    if (category) {
      merchants = merchants.filter(m => m.category === category);
    }

    // Sort
    switch (sort) {
      case 'spend':
        merchants.sort((a, b) => b.totalSpend - a.totalSpend);
        break;
      case 'points':
        merchants.sort((a, b) => b.pointsEarned - a.pointsEarned);
        break;
      case 'visits':
        merchants.sort((a, b) => b.visitCount - a.visitCount);
        break;
      default:
        merchants.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    }

    logger.info('[CrossMerchant] Get merchants', { userId, count: merchants.length });

    res.json({
      success: true,
      data: merchants,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get merchants';
    logger.error('[CrossMerchant] Get merchants failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get transactions
 * GET /api/v1/cross-merchant/:userId/transactions
 */
router.get('/:userId/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId, limit = '50', page = '1' } = req.query;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    let transactions = transactionsStore.get(userId) || generateDemoTransactions(userId);
    transactionsStore.set(userId, transactions);

    // Filter by merchant
    if (merchantId) {
      transactions = transactions.filter(t => t.merchantId === merchantId);
    }

    // Paginate
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const paginated = transactions.slice(start, start + limitNum);

    logger.info('[CrossMerchant] Get transactions', { userId, count: paginated.length });

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: transactions.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(transactions.length / limitNum),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get transactions';
    logger.error('[CrossMerchant] Get transactions failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get available bonuses
 * GET /api/v1/cross-merchant/:userId/bonuses
 */
router.get('/:userId/bonuses', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { claimed } = req.query;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    let bonuses = bonusesStore.get(userId) || generateDemoBonuses(userId);
    bonusesStore.set(userId, bonuses);

    // Filter by claimed status
    if (claimed !== undefined) {
      const isClaimed = claimed === 'true';
      bonuses = bonuses.filter(b => b.claimed === isClaimed);
    }

    logger.info('[CrossMerchant] Get bonuses', { userId, count: bonuses.length });

    res.json({
      success: true,
      data: bonuses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get bonuses';
    logger.error('[CrossMerchant] Get bonuses failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Record cross-merchant transaction
 * POST /api/v1/cross-merchant/:userId/transaction
 */
router.post('/:userId/transaction', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const bodyValidation = transactionSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: bodyValidation.error.errors[0].message,
      });
    }

    const { merchantId, merchantName, amount, category } = bodyValidation.data;

    // Calculate points and bonus
    const pointsEarned = Math.floor(amount * 0.05); // 5% base points
    const crossMerchantBonus = Math.floor(amount * 0.02); // 2% cross-merchant bonus

    const transaction: CrossMerchantTransaction = {
      transactionId: `TXN${Date.now()}`,
      userId,
      merchantId,
      merchantName,
      amount,
      pointsEarned,
      crossMerchantBonus,
      timestamp: new Date().toISOString(),
    };

    // Store transaction
    const transactions = transactionsStore.get(userId) || [];
    transactions.unshift(transaction);
    transactionsStore.set(userId, transactions.slice(0, 500)); // Keep last 500

    // Update profile
    const profile = profilesStore.get(userId) || generateDemoProfile(userId);
    profile.crossMerchantBonus += crossMerchantBonus;

    // Update or add merchant
    const merchantIndex = profile.merchants.findIndex(m => m.merchantId === merchantId);
    if (merchantIndex >= 0) {
      profile.merchants[merchantIndex].totalSpend += amount;
      profile.merchants[merchantIndex].pointsEarned += pointsEarned;
      profile.merchants[merchantIndex].lastVisit = transaction.timestamp;
      profile.merchants[merchantIndex].visitCount += 1;
    } else {
      profile.merchants.push({
        merchantId,
        merchantName,
        category: category || 'general',
        totalSpend: amount,
        pointsEarned,
        lastVisit: transaction.timestamp,
        visitCount: 1,
      });
      profile.merchantCount = profile.merchants.length;
    }

    profilesStore.set(userId, profile);

    logger.info('[CrossMerchant] Transaction recorded', {
      userId,
      merchantId,
      amount,
      pointsEarned,
      crossMerchantBonus,
    });

    res.status(201).json({
      success: true,
      data: {
        transaction,
        updatedProfile: profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record transaction';
    logger.error('[CrossMerchant] Record transaction failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get merchant rankings
 * GET /api/v1/cross-merchant/merchants/rankings
 */
router.get('/merchants/rankings', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, limit = '20' } = req.query;

    let rankings = Array.from(merchantRankingsStore.values());

    if (category) {
      rankings = rankings.filter(r => r.category === category);
    }

    if (rankings.length === 0) {
      rankings = generateDemoRankings(parseInt(limit as string));
      rankings.forEach(r => merchantRankingsStore.set(r.merchantId, r));
    }

    const limitedRankings = rankings.slice(0, parseInt(limit as string));

    logger.info('[CrossMerchant] Get merchant rankings', { count: limitedRankings.length });

    res.json({
      success: true,
      data: limitedRankings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rankings';
    logger.error('[CrossMerchant] Get rankings failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoProfile(userId: string): CrossMerchantProfile {
  return {
    userId,
    merchantCount: 5,
    merchants: [
      {
        merchantId: 'MERCH001',
        merchantName: 'Starbucks',
        category: 'food',
        totalSpend: 5000,
        pointsEarned: 250,
        lastVisit: new Date().toISOString(),
        visitCount: 25,
      },
      {
        merchantId: 'MERCH002',
        merchantName: 'Uber',
        category: 'travel',
        totalSpend: 8000,
        pointsEarned: 400,
        lastVisit: new Date().toISOString(),
        visitCount: 40,
      },
      {
        merchantId: 'MERCH003',
        merchantName: 'Swiggy',
        category: 'food',
        totalSpend: 3500,
        pointsEarned: 175,
        lastVisit: new Date(Date.now() - 86400000).toISOString(),
        visitCount: 15,
      },
      {
        merchantId: 'MERCH004',
        merchantName: 'Amazon',
        category: 'shopping',
        totalSpend: 15000,
        pointsEarned: 750,
        lastVisit: new Date(Date.now() - 172800000).toISOString(),
        visitCount: 30,
      },
      {
        merchantId: 'MERCH005',
        merchantName: 'Myntra',
        category: 'shopping',
        totalSpend: 8000,
        pointsEarned: 400,
        lastVisit: new Date(Date.now() - 259200000).toISOString(),
        visitCount: 10,
      },
    ],
    crossMerchantBonus: 500,
    mostVisitedMerchant: 'Uber',
    tierLevel: 'silver',
    bonusMultiplier: 1.5,
    nextTierBonus: 250,
  };
}

function generateDemoTransactions(userId: string): CrossMerchantTransaction[] {
  const merchants = [
    { id: 'MERCH001', name: 'Starbucks' },
    { id: 'MERCH002', name: 'Uber' },
    { id: 'MERCH003', name: 'Swiggy' },
  ];

  const transactions: CrossMerchantTransaction[] = [];
  for (let i = 0; i < 20; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = Math.floor(Math.random() * 500) + 100;
    transactions.push({
      transactionId: `TXN${Date.now() - i * 1000}`,
      userId,
      merchantId: merchant.id,
      merchantName: merchant.name,
      amount,
      pointsEarned: Math.floor(amount * 0.05),
      crossMerchantBonus: Math.floor(amount * 0.02),
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }

  return transactions;
}

function generateDemoBonuses(userId: string): CrossMerchantBonus[] {
  return [
    {
      bonusId: 'BONUS001',
      type: 'multiplier',
      value: 2,
      description: '2x points on your next 3 transactions',
      conditions: ['Valid for 7 days', 'Only on food category'],
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      claimed: false,
    },
    {
      bonusId: 'BONUS002',
      type: 'flat',
      value: 100,
      description: '100 bonus points for visiting 3 new merchants',
      conditions: ['Must be new merchant visits'],
      claimed: false,
    },
    {
      bonusId: 'BONUS003',
      type: 'category_bonus',
      value: 10,
      description: '10% extra bonus on travel category',
      conditions: ['Valid for 30 days'],
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      claimed: true,
    },
  ];
}

function generateDemoRankings(limit: number): MerchantRanking[] {
  const merchants = [
    { id: 'MERCH001', name: 'Starbucks', category: 'food' },
    { id: 'MERCH002', name: 'Uber', category: 'travel' },
    { id: 'MERCH003', name: 'Swiggy', category: 'food' },
    { id: 'MERCH004', name: 'Amazon', category: 'shopping' },
    { id: 'MERCH005', name: 'Myntra', category: 'shopping' },
    { id: 'MERCH006', name: 'Flipkart', category: 'shopping' },
    { id: 'MERCH007', name: 'Zomato', category: 'food' },
    { id: 'MERCH008', name: 'Ola', category: 'travel' },
  ];

  return merchants.slice(0, limit).map((m, i) => ({
    merchantId: m.id,
    merchantName: m.name,
    category: m.category,
    totalUsers: Math.floor(Math.random() * 50000) + 10000,
    avgSpend: Math.floor(Math.random() * 5000) + 1000,
    bonusPool: Math.floor(Math.random() * 10000) + 5000,
  }));
}

export default router;
