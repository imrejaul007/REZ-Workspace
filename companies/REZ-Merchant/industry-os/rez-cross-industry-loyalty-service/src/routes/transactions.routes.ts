import { Router, Request, Response } from 'express';
import { loyaltyEngine } from '../services/loyaltyEngine';
import { LoyaltyTransactionModel } from '../models';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Earn points
 * POST /api/v1/transactions/earn
 */
router.post('/earn',
  validateBody(schemas.earnPoints),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      accountId,
      userId,
      merchantId,
      vertical,
      points,
      source,
      sourceId,
      description,
      expiresInDays
    } = req.body;

    const result = await loyaltyEngine.earnPoints({
      accountId,
      userId,
      merchantId,
      vertical,
      points,
      source,
      sourceId,
      description,
      expiresInDays
    });

    logger.info(`Points earned: ${result.pointsEarned} for account ${accountId}`);

    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transaction.transactionId,
        accountId,
        pointsEarned: result.pointsEarned,
        campaignMultiplier: result.campaignMultiplier,
        tierMultiplier: result.tierMultiplier,
        finalPoints: result.pointsEarned,
        balance: result.account.totalPoints,
        vertical: result.account.verticals.find((v: any) => v.vertical === vertical)?.points || 0
      },
      message: 'Points earned successfully'
    });
  })
);

/**
 * Redeem points
 * POST /api/v1/transactions/redeem
 */
router.post('/redeem',
  validateBody(schemas.redeemPoints),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      accountId,
      merchantId,
      vertical,
      points,
      sourceId,
      description
    } = req.body;

    const result = await loyaltyEngine.redeemPoints({
      accountId,
      merchantId,
      vertical,
      points,
      sourceId,
      description
    });

    logger.info(`Points redeemed: ${result.pointsRedeemed} for account ${accountId}`);

    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transaction.transactionId,
        accountId,
        pointsRedeemed: result.pointsRedeemed,
        balance: result.account.totalPoints,
        verticalBalance: result.account.verticals.find((v: any) => v.vertical === vertical)?.points || 0
      },
      message: 'Points redeemed successfully'
    });
  })
);

/**
 * Transfer points between verticals
 * POST /api/v1/transactions/transfer
 */
router.post('/transfer',
  validateBody(schemas.transferPoints),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      accountId,
      fromVertical,
      toVertical,
      points
    } = req.body;

    const result = await loyaltyEngine.transferPoints({
      accountId,
      fromVertical,
      toVertical,
      points
    });

    logger.info(`Points transferred: ${points} from ${fromVertical} to ${toVertical} for account ${accountId}`);

    res.status(201).json({
      success: true,
      data: {
        redemptionId: result.redemption.redemptionId,
        accountId,
        pointsTransferred: points,
        fromVertical,
        toVertical,
        convertedValue: result.redemption.convertedValue,
        conversionRate: result.redemption.conversionRate,
        balance: result.account.totalPoints
      },
      message: 'Points transferred successfully'
    });
  })
);

/**
 * Manual trigger for expiring points (called by cron)
 * POST /api/v1/transactions/expire
 */
router.post('/expire',
  asyncHandler(async (req: Request, res: Response) => {
    // This should be called internally or by cron
    const expiredCount = await loyaltyEngine.checkAndExpirePoints();

    logger.info(`Expired ${expiredCount} transactions`);

    res.json({
      success: true,
      data: {
        expiredCount
      },
      message: 'Points expiration job completed'
    });
  })
);

/**
 * Get transaction history for an account
 * GET /api/v1/transactions/:accountId
 */
router.get('/:accountId',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    const type = req.query.type as string;
    const vertical = req.query.vertical as string;

    const query: any = { accountId };

    if (type) {
      query.type = type;
    }

    if (vertical) {
      query.vertical = vertical;
    }

    const transactions = await LoyaltyTransactionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoyaltyTransactionModel.countDocuments(query);

    // Get summary statistics
    const summary = await LoyaltyTransactionModel.aggregate([
      { $match: { accountId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryMap = summary.reduce((acc: any, item) => {
      acc[item._id] = {
        total: Math.abs(item.total),
        count: item.count
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
        total,
        summary: summaryMap
      }
    });
  })
);

/**
 * Get transaction by ID
 * GET /api/v1/transactions/detail/:transactionId
 */
router.get('/detail/:transactionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    const transaction = await LoyaltyTransactionModel.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  })
);

/**
 * Get pending expirations (preview)
 * GET /api/v1/transactions/pending-expirations
 */
router.get('/analytics/pending-expirations',
  asyncHandler(async (req: Request, res: Response) => {
    const daysUntilExpiration = parseInt(req.query.days as string) || 7;
    const cutoffDate = new Date(Date.now() + daysUntilExpiration * 24 * 60 * 60 * 1000);

    const pendingExpirations = await LoyaltyTransactionModel.aggregate([
      {
        $match: {
          type: 'earn',
          expiresAt: {
            $lte: cutoffDate,
            $gt: new Date()
          }
        }
      },
      {
        $group: {
          _id: '$accountId',
          totalExpiring: { $sum: '$points' },
          transactions: { $push: { transactionId: '$transactionId', points: '$points', expiresAt: '$expiresAt' } }
        }
      },
      { $sort: { totalExpiring: -1 } },
      { $limit: 100 }
    ]);

    const totalPointsExpiring = pendingExpirations.reduce(
      (sum: number, item: any) => sum + item.totalExpiring,
      0
    );

    res.json({
      success: true,
      data: {
        pendingExpirations,
        totalPointsExpiring,
        daysUntilExpiration,
        count: pendingExpirations.length
      }
    });
  })
);

export default router;