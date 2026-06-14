import { Router, Request, Response } from 'express';
import trustService, { TrustScoreUpdate, CreditScoreUpdate, TransactionLimitsUpdate } from '../services/trust.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /trust/:entityId
 * Get trust score for an entity
 */
router.get('/trust/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const trustScore = await trustService.getTrustScore(entityId);

    if (!trustScore) {
      return res.status(404).json({
        success: false,
        error: 'Trust score not found for this entity',
        entityId,
      });
    }

    res.json({
      success: true,
      data: trustScore,
    });
  } catch (error) {
    logger.error('Error in GET /trust/:entityId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /trust/:entityId/update
 * Update trust score for an entity
 */
router.post('/trust/:entityId/update', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const updates: TrustScoreUpdate = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided',
      });
    }

    const updatedScore = await trustService.updateTrustScore(entityId, updates);

    res.json({
      success: true,
      data: updatedScore,
      message: 'Trust score updated successfully',
    });
  } catch (error) {
    logger.error('Error in POST /trust/:entityId/update:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /trust/:entityId/history
 * Get trust score history for an entity
 */
router.get('/trust/:entityId/history', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    const history = await trustService.getTrustHistory(entityId, limit);

    res.json({
      success: true,
      data: {
        entityId,
        history,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Error in GET /trust/:entityId/history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /credit/:entityId
 * Get credit score for an entity
 */
router.get('/credit/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const creditScore = await trustService.getCreditScore(entityId);

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        error: 'Credit score not found for this entity',
        entityId,
      });
    }

    res.json({
      success: true,
      data: creditScore,
    });
  } catch (error) {
    logger.error('Error in GET /credit/:entityId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /credit/:entityId/update
 * Update credit score for an entity
 */
router.post('/credit/:entityId/update', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const updates: CreditScoreUpdate = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided',
      });
    }

    const updatedScore = await trustService.updateCreditScore(entityId, updates);

    res.json({
      success: true,
      data: updatedScore,
      message: 'Credit score updated successfully',
    });
  } catch (error) {
    logger.error('Error in POST /credit/:entityId/update:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /can-transact
 * Check if an entity can transact
 */
router.post('/can-transact', async (req: Request, res: Response) => {
  try {
    const { entityId, amount } = req.body;

    if (!entityId || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'entityId and amount are required',
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    const result = await trustService.canTransact(entityId, amount);

    res.json({
      success: true,
      data: {
        entityId,
        amount,
        ...result,
      },
    });
  } catch (error) {
    logger.error('Error in POST /can-transact:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /can-extend-credit
 * Check if credit can be extended to an entity
 */
router.post('/can-extend-credit', async (req: Request, res: Response) => {
  try {
    const { entityId, amount } = req.body;

    if (!entityId || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'entityId and amount are required',
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    const result = await trustService.canExtendCredit(entityId, amount);

    res.json({
      success: true,
      data: {
        entityId,
        amount,
        ...result,
      },
    });
  } catch (error) {
    logger.error('Error in POST /can-extend-credit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /limits/:entityId
 * Get transaction limits for an entity
 */
router.get('/limits/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const limits = await trustService.getTransactionLimits(entityId);

    if (!limits) {
      return res.status(404).json({
        success: false,
        error: 'Transaction limits not found for this entity',
        entityId,
      });
    }

    res.json({
      success: true,
      data: limits,
    });
  } catch (error) {
    logger.error('Error in GET /limits/:entityId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /limits/:entityId
 * Update transaction limits for an entity
 */
router.put('/limits/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const updates: TransactionLimitsUpdate = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided',
      });
    }

    const updatedLimits = await trustService.updateTransactionLimits(entityId, updates);

    res.json({
      success: true,
      data: updatedLimits,
      message: 'Transaction limits updated successfully',
    });
  } catch (error) {
    logger.error('Error in PUT /limits/:entityId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /report/:entityId
 * Get combined entity report (trust, credit, limits)
 */
router.get('/report/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const report = await trustService.getEntityReport(entityId);

    res.json({
      success: true,
      data: {
        entityId,
        trustScore: report.trustScore,
        creditScore: report.creditScore,
        transactionLimits: report.transactionLimits,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error in GET /report/:entityId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
