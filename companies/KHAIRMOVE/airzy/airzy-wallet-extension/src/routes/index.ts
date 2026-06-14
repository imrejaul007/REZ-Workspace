import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { walletService } from '../services/walletService';
import { asyncHandler, ApiError } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

// ========== ALL WALLET ROUTES REQUIRE AUTHENTICATION ==========
// (authenticate middleware is applied at the app level in index.ts)

// Get balance
router.get('/balance', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  const balance = await walletService.getBalance(userId);
  res.json({ success: true, data: balance, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Top up wallet
router.post('/topup',
  [body('amount').isFloat({ min: 1 }), body('paymentMethod').isIn(['card', 'upi', 'netbanking'])],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    const { amount, paymentMethod } = req.body;
    const transaction = await walletService.topup(userId, amount, 'topup');
    res.status(201).json({ success: true, data: transaction, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Pay from wallet
router.post('/pay',
  [body('amount').isFloat({ min: 0.01 }), body('reference').notEmpty(), body('description').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    const { amount, reference, description } = req.body;
    try {
      const transaction = await walletService.pay(userId, amount, reference, description);
      res.json({ success: true, data: transaction, meta: { requestId: req.requestId, timestamp: Date.now() } });
    } catch (error) {
      res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: (error as Error).message } });
    }
  })
);

// Get transactions
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  const result = await walletService.getTransactions(userId, { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20, type: req.query.type as string });
  res.json({ success: true, data: result.transactions, meta: { requestId: req.requestId, timestamp: Date.now(), total: result.total } });
}));

// Get loyalty points
router.get('/loyalty', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  const loyalty = await walletService.getLoyalty(userId);
  res.json({ success: true, data: loyalty, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;
