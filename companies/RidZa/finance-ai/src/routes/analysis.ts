import { Router } from 'express';
import { createResponse } from '../types/index.js';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middleware/index.js';
import { analyzeTransaction, predictCashflow, getSpendingInsights } from '../services/index.js';

const router = Router();

// Analyze a transaction
router.post('/transaction',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, transactionId, amount, type, category, description } = req.body;

    const analysis = await analyzeTransaction({
      tenantId,
      transactionId,
      amount,
      type,
      category,
      description
    });

    res.json(createResponse(true, { analysis }));
  })
);

// Get cashflow prediction
router.get('/:tenantId/prediction',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;
    const daysAhead = parseInt(req.query.days as string) || 30;

    const prediction = await predictCashflow(tenantId, daysAhead);

    res.json(createResponse(true, { prediction }));
  })
);

// Get spending insights
router.get('/:tenantId/insights',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;

    const insights = await getSpendingInsights(tenantId);

    res.json(createResponse(true, { insights }));
  })
);

// Dashboard summary
router.get('/:tenantId/dashboard',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;

    const [prediction, insights] = await Promise.all([
      predictCashflow(tenantId, 30),
      getSpendingInsights(tenantId)
    ]);

    res.json(createResponse(true, {
      dashboard: {
        cashflowPrediction: prediction,
        spendingInsights: insights
      }
    }));
  })
);

export default router;
