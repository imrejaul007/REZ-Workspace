import { Router, Request, Response } from 'express';
import { GiftCardsService } from '../services/gift-cards.service';

const router = Router();
const giftCardsService = new GiftCardsService();

// ===========================================
// GIFT CARDS
// ===========================================

/**
 * @route POST /api/gift-cards
 * @desc Purchase gift card
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { amount, senderName, recipient, message } = req.body;

    const giftCard = await giftCardsService.purchaseGiftCard(
      amount,
      senderName,
      recipient,
      message
    );

    res.json({ success: true, giftCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/gift-cards/balance/:code
 * @desc Check gift card balance
 */
router.get('/balance/:code', async (req: Request, res: Response) => {
  try {
    const balance = await giftCardsService.checkBalance(req.params.code);
    res.json({ success: true, ...balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/gift-cards/redeem
 * @desc Redeem gift card
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;

    const result = await giftCardsService.redeemGiftCard(code, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================================
// PASSES
// ===========================================

/**
 * @route GET /api/passes
 * @desc Get all available passes
 */
router.get('/passes', async (req: Request, res: Response) => {
  try {
    const passes = await giftCardsService.getAvailablePasses();
    res.json({ success: true, passes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/passes/:passId
 * @desc Get pass by ID
 */
router.get('/passes/:passId', async (req: Request, res: Response) => {
  try {
    const pass = await giftCardsService.getPass(req.params.passId);
    if (!pass) {
      return res.status(404).json({ error: 'Pass not found' });
    }
    res.json({ success: true, pass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/passes
 * @desc Purchase pass
 */
router.post('/passes', async (req: Request, res: Response) => {
  try {
    const { userId, passId } = req.body;

    const result = await giftCardsService.purchasePass(userId, passId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/passes/user/:userId
 * @desc Get user's active passes
 */
router.get('/passes/user/:userId', async (req: Request, res: Response) => {
  try {
    const passes = await giftCardsService.getUserPasses(req.params.userId);
    res.json({ success: true, passes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/passes/use
 * @desc Use pass ride
 */
router.post('/passes/use', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const result = await giftCardsService.usePassRide(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
