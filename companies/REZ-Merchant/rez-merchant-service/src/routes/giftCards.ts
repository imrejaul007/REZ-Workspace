/**
 * Gift Card Routes
 */

import { Router, Request, Response } from 'express';
import { GiftCard } from '../models/GiftCard';
import { merchantAuth } from '../middleware/auth';
import { createRateLimiter } from '@rez/shared';

const router = Router();
router.use(merchantAuth);

// Rate limiter
const giftCardLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
});

// Error handler
function handleError(res: Response, error: unknown, action: string): void {
  const message = process.env.NODE_ENV === 'production'
    ? `Failed to ${action}`
    : error instanceof Error ? error.message : 'Unknown error';
  console.error(`[GiftCard] ${action} error:`, error);
  res.status(500).json({ success: false, message });
}

router.get('/', giftCardLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const query: Record<string, unknown> = { merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      GiftCard.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      GiftCard.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    handleError(res, error, 'list gift cards');
  }
});

router.get('/:id', giftCardLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const item = await GiftCard.findOne({ _id: req.params.id, merchantId }).lean();
    if (!item) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    handleError(res, error, 'get gift card');
  }
});

router.post('/', giftCardLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { code, initialBalance, expiresAt, recipientEmail, recipientName, message } = req.body;

    if (!initialBalance || typeof initialBalance !== 'number' || initialBalance <= 0) {
      res.status(400).json({ success: false, message: 'Invalid initialBalance' });
      return;
    }

    const giftCard = await GiftCard.create({
      code,
      initialBalance,
      currentBalance: initialBalance,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      recipientEmail,
      recipientName,
      message,
      merchantId,
      status: 'active',
    });

    res.status(201).json({ success: true, data: giftCard });
  } catch (error) {
    handleError(res, error, 'create gift card');
  }
});

router.post('/:id/redeem', giftCardLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { amount } = req.body;

    const giftCard = await GiftCard.findOne({ _id: req.params.id, merchantId });
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }

    if (giftCard.currentBalance < amount) {
      res.status(400).json({ success: false, message: 'Insufficient balance' });
      return;
    }

    giftCard.currentBalance -= amount;
    if (giftCard.currentBalance === 0) {
      giftCard.status = 'redeemed';
    }
    await giftCard.save();

    res.json({ success: true, data: giftCard });
  } catch (error) {
    handleError(res, error, 'redeem gift card');
  }
});

export default router;
