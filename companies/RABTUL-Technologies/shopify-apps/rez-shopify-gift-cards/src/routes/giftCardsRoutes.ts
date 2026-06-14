import { Router } from 'express';
import { z } from 'zod';
import { giftCardsService } from '../services/giftCardsService.js';
import { GiftCardCreateSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/gift-cards', (req, res) => {
  try {
    const data = GiftCardCreateSchema.parse(req.body);
    const giftCard = giftCardsService.createGiftCard(data);
    res.status(201).json({ success: true, data: giftCard });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create gift card', { error });
      res.status(500).json({ success: false, error: 'Failed to create gift card' });
    }
  }
});

router.get('/gift-cards/:id', (req, res) => {
  const giftCard = giftCardsService.getGiftCard(req.params.id);
  giftCard ? res.json({ success: true, data: giftCard }) : res.status(404).json({ success: false, error: 'Gift card not found' });
});

router.get('/gift-cards/code/:code', (req, res) => {
  const giftCard = giftCardsService.getGiftCard(req.params.code, true);
  giftCard ? res.json({ success: true, data: giftCard }) : res.status(404).json({ success: false, error: 'Gift card not found' });
});

router.post('/gift-cards/:code/redeem', (req, res) => {
  const { amount, orderId } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  const result = giftCardsService.redeemGiftCard(req.params.code, amount, orderId);
  if (result.success) res.json({ success: true, data: { balance: result.balance } });
  else res.status(400).json({ success: false, error: result.error, balance: result.balance });
});

router.post('/gift-cards/:code/topup', (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  const giftCard = giftCardsService.topupGiftCard(req.params.code, amount);
  giftCard ? res.json({ success: true, data: giftCard }) : res.status(404).json({ success: false, error: 'Gift card not found' });
});

router.post('/gift-cards/:code/refund', (req, res) => {
  const { amount, orderId } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  const result = giftCardsService.refundGiftCard(req.params.code, amount, orderId);
  if (result.success) res.json({ success: true, data: { balance: result.balance } });
  else res.status(400).json({ success: false, error: result.error });
});

router.post('/gift-cards/:code/cancel', (req, res) => {
  const giftCard = giftCardsService.cancelGiftCard(req.params.code);
  giftCard ? res.json({ success: true, data: giftCard }) : res.status(404).json({ success: false, error: 'Gift card not found' });
});

router.get('/gift-cards/:id/transactions', (req, res) => {
  const transactions = giftCardsService.getTransactions(req.params.id);
  res.json({ success: true, data: transactions });
});

router.get('/stats', (req, res) => {
  const stats = giftCardsService.getStats();
  res.json({ success: true, data: stats });
});

export default router;
