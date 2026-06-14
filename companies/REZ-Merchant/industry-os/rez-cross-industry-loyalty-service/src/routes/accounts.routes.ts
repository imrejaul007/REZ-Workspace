import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UnifiedAccount } from '../models';
import { loyaltyEngine } from '../services/loyaltyEngine';
import { tierService } from '../services/tierService';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Create a new unified loyalty account
 * POST /api/v1/accounts
 */
router.post('/',
  validateBody(schemas.createAccount),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, phone, email } = req.body;

    const account = await loyaltyEngine.createAccount(userId, phone, email);

    logger.info(`Account created: ${account.accountId}`);

    res.status(201).json({
      success: true,
      data: {
        accountId: account.accountId,
        userId: account.userId,
        phone: account.phone,
        email: account.email,
        totalPoints: account.totalPoints,
        tier: account.tier,
        createdAt: account.createdAt
      },
      message: 'Account created successfully'
    });
  })
);

/**
 * Get account by account ID
 * GET /api/v1/accounts/:accountId
 */
router.get('/:accountId',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    const account = await UnifiedAccount.findOne({ accountId });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const tierInfo = await tierService.getTierProgression(account.totalPoints);

    res.json({
      success: true,
      data: {
        accountId: account.accountId,
        userId: account.userId,
        phone: account.phone,
        email: account.email,
        totalPoints: account.totalPoints,
        tier: account.tier,
        tierInfo,
        verticals: account.verticals,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }
    });
  })
);

/**
 * Get account by user ID
 * GET /api/v1/accounts/user/:userId
 */
router.get('/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const account = await UnifiedAccount.findOne({ userId });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found for this user'
      });
    }

    res.json({
      success: true,
      data: account
    });
  })
);

/**
 * Get account by phone number
 * GET /api/v1/accounts/phone/:phone
 */
router.get('/phone/:phone',
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.params;

    const account = await UnifiedAccount.findOne({ phone });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found for this phone'
      });
    }

    res.json({
      success: true,
      data: account
    });
  })
);

/**
 * Update account tier
 * PUT /api/v1/accounts/:accountId/tier
 */
router.put('/:accountId/tier',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const { tier } = req.body;

    if (!['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier name'
      });
    }

    const account = await tierService.upgradeTier(accountId, tier);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: account,
      message: `Account upgraded to ${tier} tier`
    });
  })
);

/**
 * Get balance across all verticals
 * GET /api/v1/accounts/:accountId/balance
 */
router.get('/:accountId/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    const balance = await loyaltyEngine.getBalance(accountId);

    res.json({
      success: true,
      data: balance
    });
  })
);

/**
 * Get transaction history for an account
 * GET /api/v1/accounts/:accountId/transactions
 */
router.get('/:accountId/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await loyaltyEngine.getTransactionHistory(accountId, limit);

    res.json({
      success: true,
      data: {
        accountId,
        transactions,
        count: transactions.length
      }
    });
  })
);

/**
 * Search accounts with filters
 * POST /api/v1/accounts/search
 */
router.post('/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { query, filters, page = 1, limit = 20 } = req.body;

    const searchQuery: any = {};

    if (query) {
      searchQuery.$or = [
        { accountId: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    if (filters?.tier) {
      searchQuery.tier = filters.tier;
    }

    if (filters?.vertical) {
      searchQuery['verticals.vertical'] = filters.vertical;
    }

    const skip = (page - 1) * limit;

    const accounts = await UnifiedAccount.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ totalPoints: -1 });

    const total = await UnifiedAccount.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

export default router;