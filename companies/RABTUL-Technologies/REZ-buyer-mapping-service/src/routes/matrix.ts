import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BuyerMatrix, StakeholderMap } from '../models/BuyerMapping';
import { BuyerMatrixService } from '../services/buyerMatrixService';

const router = Router();

// Generate matrix for a deal
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dealId, accountId, stakeholderMapId } = z.object({
      dealId: z.string().min(1),
      accountId: z.string().min(1),
      stakeholderMapId: z.string().optional()
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate stakeholder map if provided
    if (stakeholderMapId) {
      const map = await StakeholderMap.findOne({
        _id: stakeholderMapId,
        tenantId
      });

      if (!map) {
        return res.status(404).json({
          success: false,
          error: 'Stakeholder map not found'
        });
      }
    }

    const matrix = await BuyerMatrixService.generateMatrix(
      tenantId,
      dealId,
      accountId,
      stakeholderMapId
    );

    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    next(error);
  }
});

// Get matrix for a deal
router.get('/deal/:dealId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const matrix = await BuyerMatrix.findOne({
      tenantId,
      dealId: req.params.dealId
    });

    if (!matrix) {
      return res.status(404).json({
        success: false,
        error: 'Buyer matrix not found for this deal'
      });
    }

    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    next(error);
  }
});

// Get matrices by account
router.get('/account/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const matrices = await BuyerMatrix.find({
      tenantId,
      accountId: req.params.accountId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: matrices
    });
  } catch (error) {
    next(error);
  }
});

// Update coverage for a contact in matrix
router.patch('/deal/:dealId/contacts/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { engagementLevel, sentiment, blockers, nextActions } = z.object({
      engagementLevel: z.enum(['none', 'low', 'medium', 'high', 'champion']).optional(),
      sentiment: z.enum(['positive', 'neutral', 'negative', 'unknown']).optional(),
      blockers: z.array(z.string()).optional(),
      nextActions: z.array(z.string()).optional()
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    const matrix = await BuyerMatrix.findOne({
      tenantId,
      dealId: req.params.dealId
    });

    if (!matrix) {
      return res.status(404).json({
        success: false,
        error: 'Buyer matrix not found for this deal'
      });
    }

    // Find and update contact
    const contactIndex = matrix.contacts.findIndex(
      c => c.contactId.toString() === req.params.contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found in matrix'
      });
    }

    const contact = matrix.contacts[contactIndex];

    if (engagementLevel) contact.engagementLevel = engagementLevel;
    if (sentiment) contact.sentiment = sentiment;
    if (blockers) contact.blockers = blockers;
    if (nextActions) contact.nextActions = nextActions;

    // Recalculate relationship strength
    contact.relationshipStrength = Math.min(
      contact.relationshipStrength + (engagementLevel ? 5 : 0),
      100
    );

    // Recalculate coverage
    const map = await StakeholderMap.findById(matrix.stakeholderMapId);
    if (map) {
      matrix.coverage = BuyerMatrixService.calculateCoverage(map);
    }

    matrix.lastAnalyzedAt = new Date();
    await matrix.save();

    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    next(error);
  }
});

// Get gaps for a deal
router.get('/deal/:dealId/gaps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const gaps = await BuyerMatrixService.generateGapAnalysis(
      tenantId,
      req.params.dealId,
      req.query.accountId as string || ''
    );

    res.json({
      success: true,
      data: gaps
    });
  } catch (error) {
    next(error);
  }
});

// Get recommendations for a deal
router.get('/deal/:dealId/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const matrix = await BuyerMatrix.findOne({
      tenantId,
      dealId: req.params.dealId
    });

    if (!matrix) {
      return res.status(404).json({
        success: false,
        error: 'Buyer matrix not found for this deal'
      });
    }

    res.json({
      success: true,
      data: matrix.recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Get coverage summary
router.get('/coverage/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (dealId) query.dealId = dealId;

    const matrices = await BuyerMatrix.find(query);

    if (matrices.length === 0) {
      return res.json({
        success: true,
        data: {
          overall: 0,
          economic: 0,
          technical: 0,
          champion: 0,
          executive: 0,
          dealsAnalyzed: 0
        }
      });
    }

    // Calculate averages
    const avgCoverage = {
      overall: Math.round(
        matrices.reduce((sum, m) => sum + m.coverage.overall, 0) / matrices.length
      ),
      economic: Math.round(
        matrices.reduce((sum, m) => sum + m.coverage.economic, 0) / matrices.length
      ),
      technical: Math.round(
        matrices.reduce((sum, m) => sum + m.coverage.technical, 0) / matrices.length
      ),
      champion: Math.round(
        matrices.reduce((sum, m) => sum + m.coverage.champion, 0) / matrices.length
      ),
      executive: Math.round(
        matrices.reduce((sum, m) => sum + m.coverage.executive, 0) / matrices.length
      ),
      dealsAnalyzed: matrices.length
    };

    res.json({
      success: true,
      data: avgCoverage
    });
  } catch (error) {
    next(error);
  }
});

// Delete matrix
router.delete('/deal/:dealId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await BuyerMatrix.deleteOne({
      tenantId,
      dealId: req.params.dealId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Buyer matrix not found'
      });
    }

    res.json({
      success: true,
      message: 'Matrix deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
