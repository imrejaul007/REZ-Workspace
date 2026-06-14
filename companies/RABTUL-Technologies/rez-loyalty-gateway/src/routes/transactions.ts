/**
 * Transactions Routes - Unified transaction history
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiClient } from '../utils/apiClient.js';
import { CoinType, UnifiedTransaction, TransactionType } from '../types/index.js';

const router = Router();

// Query params schema
const TransactionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  coinType: z.string().optional(),
  type: z.enum(['EARN', 'REDEEM', 'EXPIRE', 'REFUND', 'BONUS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * GET /api/v1/loyalty/transactions/:userId
 * Get unified transaction history from all services
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const query = TransactionsQuerySchema.parse(req.query);

    // Fetch from multiple services in parallel
    const results = await Promise.allSettled([
      // Wallet transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          coinType: string;
          description: string;
          createdAt: string;
        }>;
      }>('wallet', '/api/wallet/transactions', {
        userId,
        page: query.page,
        limit: query.limit,
        ...(query.coinType && { coinType: query.coinType }),
        ...(query.type && { type: query.type }),
      }),

      // Unified loyalty transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          coinType: string;
          amount: number;
          source: string;
          description: string;
          createdAt: string;
        }>;
      }>('unifiedLoyalty', `/api/loyalty/transactions/${userId}`, {
        page: query.page,
        limit: query.limit,
      }),

      // Restaurant loyalty transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          merchantId: string;
          description: string;
          createdAt: string;
        }>;
      }>('restaurantLoyalty', `/api/loyalty/transactions/${userId}`, {
        page: query.page,
        limit: query.limit,
      }),

      // Prive transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          description: string;
          createdAt: string;
        }>;
      }>('prive', '/api/coins/transactions', {
        userId,
        page: query.page,
        limit: query.limit,
      }),

      // Referral transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          referredUserId: string;
          description: string;
          createdAt: string;
        }>;
      }>('referralOS', `/api/referral/transactions/${userId}`, {
        page: query.page,
        limit: query.limit,
      }),

      // Cashback transactions
      apiClient.get<{
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          orderId: string;
          description: string;
          createdAt: string;
        }>;
      }>('cashbackService', `/api/cashback/transactions/${userId}`, {
        page: query.page,
        limit: query.limit,
      }),
    ]);

    // Merge and normalize transactions
    const allTransactions: UnifiedTransaction[] = [];

    // Wallet transactions
    if (results[0].status === 'fulfilled' && results[0].value?.transactions) {
      for (const tx of results[0].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: (tx.coinType?.toUpperCase() as CoinType) || CoinType.REZ,
          amount: tx.amount,
          type: (tx.type?.toUpperCase() as TransactionType) || TransactionType.EARN,
          source: 'RABTUL_WALLET',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'wallet',
        });
      }
    }

    // Unified loyalty transactions
    if (results[1].status === 'fulfilled' && results[1].value?.transactions) {
      for (const tx of results[1].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: (tx.coinType?.toUpperCase() as CoinType) || CoinType.REZ,
          amount: tx.amount,
          type: (tx.type?.toUpperCase() as TransactionType) || TransactionType.EARN,
          source: (tx.source as any) || 'SYSTEM',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'unified-loyalty',
        });
      }
    }

    // Restaurant loyalty transactions
    if (results[2].status === 'fulfilled' && results[2].value?.transactions) {
      for (const tx of results[2].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: CoinType.BRANDED,
          amount: tx.amount,
          type: (tx.type?.toUpperCase() as TransactionType) || TransactionType.EARN,
          source: 'REZ_APP',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'restaurant-loyalty',
        });
      }
    }

    // Prive transactions
    if (results[3].status === 'fulfilled' && results[3].value?.transactions) {
      for (const tx of results[3].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: CoinType.PRIVE,
          amount: tx.amount,
          type: (tx.type?.toUpperCase() as TransactionType) || TransactionType.BONUS,
          source: 'SYSTEM',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'prive',
        });
      }
    }

    // Referral transactions
    if (results[4].status === 'fulfilled' && results[4].value?.transactions) {
      for (const tx of results[4].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: CoinType.REFERRAL,
          amount: tx.amount,
          type: tx.type?.toUpperCase() === 'REDEEM' ? TransactionType.REDEEM : TransactionType.EARN,
          source: 'REZ_APP',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'referral-os',
        });
      }
    }

    // Cashback transactions
    if (results[5].status === 'fulfilled' && results[5].value?.transactions) {
      for (const tx of results[5].value.transactions) {
        allTransactions.push({
          id: tx.id,
          userId,
          coinType: CoinType.CASHBACK,
          amount: tx.amount,
          type: tx.type?.toUpperCase() === 'REDEEM' ? TransactionType.REDEEM : TransactionType.EARN,
          source: 'RABTUL_WALLET',
          description: tx.description,
          createdAt: new Date(tx.createdAt),
          sourceService: 'cashback-service',
        });
      }
    }

    // Sort by date descending
    allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Filter by coin type if specified
    let filtered = allTransactions;
    if (query.coinType) {
      filtered = allTransactions.filter(
        tx => tx.coinType.toLowerCase() === query.coinType!.toLowerCase()
      );
    }

    // Filter by type if specified
    if (query.type) {
      filtered = filtered.filter(tx => tx.type === query.type);
    }

    // Filter by date range
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filtered = filtered.filter(tx => tx.createdAt >= startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filtered = filtered.filter(tx => tx.createdAt <= endDate);
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / query.limit);
    const startIndex = (query.page - 1) * query.limit;
    const paginatedTransactions = filtered.slice(startIndex, startIndex + query.limit);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
        breakdown: {
          wallet: results[0].status === 'fulfilled' ? (results[0].value?.transactions?.length || 0) : -1,
          unifiedLoyalty: results[1].status === 'fulfilled' ? (results[1].value?.transactions?.length || 0) : -1,
          restaurantLoyalty: results[2].status === 'fulfilled' ? (results[2].value?.transactions?.length || 0) : -1,
          prive: results[3].status === 'fulfilled' ? (results[3].value?.transactions?.length || 0) : -1,
          referralOS: results[4].status === 'fulfilled' ? (results[4].value?.transactions?.length || 0) : -1,
          cashbackService: results[5].status === 'fulfilled' ? (results[5].value?.transactions?.length || 0) : -1,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/transactions/:userId/summary
 * Get transaction summary by coin type
 */
router.get('/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days } = z.object({
      days: z.coerce.number().min(1).max(365).default(30),
    }).parse(req.query);

    // Get unified transactions for summary
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await apiClient.get<{
      transactions: Array<{
        coinType: string;
        type: string;
        amount: number;
      }>;
    }>('wallet', '/api/wallet/transactions', {
      userId,
      startDate: startDate.toISOString(),
      limit: 1000,
    });

    if (!response?.transactions) {
      res.json({
        success: true,
        data: {
          period: `${days} days`,
          summary: {},
        },
      });
      return;
    }

    // Aggregate by coin type and type
    const summary: Record<string, { earned: number; redeemed: number; net: number; count: number }> = {};

    for (const tx of response.transactions) {
      const coinType = (tx.coinType?.toUpperCase() || 'REZ') as CoinType;
      if (!summary[coinType]) {
        summary[coinType] = { earned: 0, redeemed: 0, net: 0, count: 0 };
      }

      if (tx.type?.toUpperCase() === 'SPENT' || tx.type?.toUpperCase() === 'REDEEM') {
        summary[coinType].redeemed += tx.amount;
        summary[coinType].net -= tx.amount;
      } else {
        summary[coinType].earned += tx.amount;
        summary[coinType].net += tx.amount;
      }
      summary[coinType].count++;
    }

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        summary,
        totalEarned: Object.values(summary).reduce((sum, s) => sum + s.earned, 0),
        totalRedeemed: Object.values(summary).reduce((sum, s) => sum + s.redeemed, 0),
        totalNet: Object.values(summary).reduce((sum, s) => sum + s.net, 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction summary',
      message: (error as Error).message,
    });
  }
});

export default router;