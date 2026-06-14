/**
 * REZ Atlas Twin - Merchant Twin Routes
 */

import { Router, Request, Response } from 'express';
import {
  MerchantTwinModel,
  IdentityTwinModel,
  PresenceTwinModel,
  ReputationTwinModel,
  OperationsTwinModel,
  GrowthSignalsTwinModel
} from '../models/merchant.js';

const router = Router();

// ============================================================================
// MERCHANT TWIN - Complete twin
// ============================================================================

/**
 * GET /api/merchants/:merchantId
 * Get complete merchant twin
 */
router.get('/merchants/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    // Get merchant twin
    const twin = await MerchantTwinModel.findOne({ merchantId })
      .populate('identity')
      .populate('presence')
      .populate('reputation')
      .populate('operations')
      .populate('growth');

    if (!twin) {
      return res.status(404).json({ error: 'Merchant twin not found' });
    }

    res.json({ twin });
  } catch (error) {
    console.error('Get twin error:', error);
    res.status(500).json({ error: 'Failed to get merchant twin' });
  }
});

/**
 * POST /api/merchants/:merchantId/twin
 * Create or update merchant twin
 */
router.post('/api/merchants/:merchantId/twin', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const twinData = req.body;

    // Create or update identity
    let identity = await IdentityTwinModel.findOne({ merchantId });
    if (twinData.identity) {
      identity = await IdentityTwinModel.findOneAndUpdate(
        { merchantId },
        twinData.identity,
        { upsert: true, new: true }
      );
    }

    // Create or update presence
    let presence = await PresenceTwinModel.findOne({ merchantId });
    if (twinData.presence) {
      presence = await PresenceTwinModel.findOneAndUpdate(
        { merchantId },
        twinData.presence,
        { upsert: true, new: true }
      );
    }

    // Create or update reputation
    let reputation = await ReputationTwinModel.findOne({ merchantId });
    if (twinData.reputation) {
      reputation = await ReputationTwinModel.findOneAndUpdate(
        { merchantId },
        twinData.reputation,
        { upsert: true, new: true }
      );
    }

    // Create or update operations
    let operations = await OperationsTwinModel.findOne({ merchantId });
    if (twinData.operations) {
      operations = await OperationsTwinModel.findOneAndUpdate(
        { merchantId },
        twinData.operations,
        { upsert: true, new: true }
      );
    }

    // Create or update growth signals
    let growth = await GrowthSignalsTwinModel.findOne({ merchantId });
    if (twinData.growth) {
      growth = await GrowthSignalsTwinModel.findOneAndUpdate(
        { merchantId },
        twinData.growth,
        { upsert: true, new: true }
      );
    }

    // Calculate twin scores
    const twinScore = {
      identity: identity ? 100 : 0,
      presence: presence?.presenceScore || 0,
      reputation: reputation?.rating?.overall ? (reputation.rating.overall / 5) * 100 : 0,
      operations: operations ? 50 : 0, // Simplified
      growth: growth?.growthScore || 0,
      overall: 0
    };
    twinScore.overall = (
      twinScore.identity +
      twinScore.presence +
      twinScore.reputation +
      twinScore.operations +
      twinScore.growth
    ) / 5;

    // Create or update merchant twin
    const twin = await MerchantTwinModel.findOneAndUpdate(
      { merchantId },
      {
        $set: {
          merchantId,
          identity: identity?._id,
          presence: presence?._id,
          reputation: reputation?._id,
          operations: operations?._id,
          growth: growth?._id,
          twinScore,
          lastSynced: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({ twin });
  } catch (error) {
    console.error('Create twin error:', error);
    res.status(500).json({ error: 'Failed to create merchant twin' });
  }
});

/**
 * GET /api/merchants/:merchantId/performance
 * Get merchant performance score
 */
router.get('/api/merchants/:merchantId/performance', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const twin = await MerchantTwinModel.findOne({ merchantId });

    if (!twin) {
      return res.status(404).json({ error: 'Merchant twin not found' });
    }

    // Calculate performance grade
    const score = twin.twinScore.overall;
    let grade: string;
    let trend: string;

    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B+';
    else if (score >= 60) grade = 'B';
    else if (score >= 50) grade = 'C';
    else if (score >= 30) grade = 'D';
    else grade = 'F';

    trend = score >= 70 ? 'improving' : score >= 50 ? 'stable' : 'declining';

    res.json({
      merchantId,
      performance: {
        score,
        grade,
        trend,
        components: twin.twinScore
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get performance' });
  }
});

// ============================================================================
// IDENTITY TWIN
// ============================================================================

/**
 * GET /api/merchants/:merchantId/identity
 */
router.get('/api/merchants/:merchantId/identity', async (req: Request, res: Response) => {
  try {
    const identity = await IdentityTwinModel.findOne({ merchantId: req.params.merchantId });
    res.json({ identity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get identity' });
  }
});

/**
 * PUT /api/merchants/:merchantId/identity
 */
router.put('/api/merchants/:merchantId/identity', async (req: Request, res: Response) => {
  try {
    const identity = await IdentityTwinModel.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    res.json({ identity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update identity' });
  }
});

// ============================================================================
// PRESENCE TWIN
// ============================================================================

/**
 * GET /api/merchants/:merchantId/presence
 */
router.get('/api/merchants/:merchantId/presence', async (req: Request, res: Response) => {
  try {
    const presence = await PresenceTwinModel.findOne({ merchantId: req.params.merchantId });
    res.json({ presence });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get presence' });
  }
});

/**
 * PUT /api/merchants/:merchantId/presence
 */
router.put('/api/merchants/:merchantId/presence', async (req: Request, res: Response) => {
  try {
    const presence = await PresenceTwinModel.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    res.json({ presence });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

// ============================================================================
// REPUTATION TWIN
// ============================================================================

/**
 * GET /api/merchants/:merchantId/reputation
 */
router.get('/api/merchants/:merchantId/reputation', async (req: Request, res: Response) => {
  try {
    const reputation = await ReputationTwinModel.findOne({ merchantId: req.params.merchantId });
    res.json({ reputation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get reputation' });
  }
});

/**
 * PUT /api/merchants/:merchantId/reputation
 */
router.put('/api/merchants/:merchantId/reputation', async (req: Request, res: Response) => {
  try {
    const reputation = await ReputationTwinModel.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    res.json({ reputation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reputation' });
  }
});

// ============================================================================
// OPERATIONS TWIN
// ============================================================================

/**
 * GET /api/merchants/:merchantId/operations
 */
router.get('/api/merchants/:merchantId/operations', async (req: Request, res: Response) => {
  try {
    const operations = await OperationsTwinModel.findOne({ merchantId: req.params.merchantId });
    res.json({ operations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get operations' });
  }
});

/**
 * PUT /api/merchants/:merchantId/operations
 */
router.put('/api/merchants/:merchantId/operations', async (req: Request, res: Response) => {
  try {
    const operations = await OperationsTwinModel.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    res.json({ operations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operations' });
  }
});

// ============================================================================
// GROWTH SIGNALS TWIN
// ============================================================================

/**
 * GET /api/merchants/:merchantId/growth
 */
router.get('/api/merchants/:merchantId/growth', async (req: Request, res: Response) => {
  try {
    const growth = await GrowthSignalsTwinModel.findOne({ merchantId: req.params.merchantId });
    res.json({ growth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get growth signals' });
  }
});

/**
 * PUT /api/merchants/:merchantId/growth
 */
router.put('/api/merchants/:merchantId/growth', async (req: Request, res: Response) => {
  try {
    const growth = await GrowthSignalsTwinModel.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { $set: req.body },
      { upsert: true, new: true }
    );
    res.json({ growth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update growth signals' });
  }
});

// ============================================================================
// SEARCH
// ============================================================================

/**
 * GET /api/merchants/search
 */
router.get('/api/merchants/search', async (req: Request, res: Response) => {
  try {
    const { q, category, minScore, limit = 20, offset = 0 } = req.query;

    const query: any = {};
    if (q) query['identity.name'] = { $regex: q, $options: 'i' };
    if (category) query['identity.category'] = category;
    if (minScore) query['twinScore.overall'] = { $gte: Number(minScore) };

    const twins = await MerchantTwinModel.find(query)
      .populate('identity')
      .populate('presence')
      .populate('reputation')
      .skip(Number(offset))
      .limit(Number(limit))
      .sort({ 'twinScore.overall': -1 });

    res.json({
      count: twins.length,
      twins
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================================
// STATS
// ============================================================================

/**
 * GET /api/merchants/stats
 */
router.get('/api/merchants/stats', async (req: Request, res: Response) => {
  try {
    const total = await MerchantTwinModel.countDocuments();

    const byCategory = await MerchantTwinModel.aggregate([
      {
        $lookup: {
          from: 'identities',
          localField: 'identity',
          foreignField: '_id',
          as: 'identityData'
        }
      },
      { $unwind: '$identityData' },
      {
        $group: {
          _id: '$identityData.category',
          count: { $sum: 1 },
          avgScore: { $avg: '$twinScore.overall' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const avgScore = await MerchantTwinModel.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$twinScore.overall' },
          avgIdentity: { $avg: '$twinScore.identity' },
          avgPresence: { $avg: '$twinScore.presence' },
          avgReputation: { $avg: '$twinScore.reputation' },
          avgOperations: { $avg: '$twinScore.operations' },
          avgGrowth: { $avg: '$twinScore.growth' }
        }
      }
    ]);

    res.json({
      total,
      byCategory: byCategory.map(c => ({ category: c._id, count: c.count, avgScore: c.avgScore })),
      averages: avgScore[0] || {}
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export { router as twinRoutes };