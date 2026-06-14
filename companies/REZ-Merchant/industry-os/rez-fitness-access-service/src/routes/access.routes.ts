/**
 * Access Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  generateAccessCard,
  validateAndCheckIn,
  suspendCard,
  reactivateCard,
  reportLostCard,
  getCardStatus,
} from '../services/accessService';

const router = Router();

// Generate new access card
router.post('/cards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, gymId, memberName, planName, validUntil } = req.body;

    if (!memberId || !gymId || !validUntil) {
      return res.status(400).json({
        success: false,
        error: 'memberId, gymId, and validUntil are required',
      });
    }

    const card = await generateAccessCard({
      memberId,
      gymId,
      memberName: memberName || 'Member',
      planName: planName || 'Standard',
      validUntil: new Date(validUntil),
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

// Get member's card
router.get('/cards/member/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await getCardStatus(req.params.memberId);
    if (!card) {
      return res.status(404).json({ success: false, error: 'No active card found' });
    }
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

// QR scan check-in
router.post('/scan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrCode, gymId } = req.body;

    if (!qrCode || !gymId) {
      return res.status(400).json({
        success: false,
        error: 'qrCode and gymId are required',
      });
    }

    const result = await validateAndCheckIn(qrCode, gymId);

    if (!result.success) {
      return res.status(400).json({ success: false, ...result });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Suspend card
router.post('/cards/:cardId/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const card = await suspendCard(req.params.cardId, reason || 'Administrative');
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

// Reactivate card
router.post('/cards/:cardId/reactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await reactivateCard(req.params.cardId);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
});

// Report lost card
router.post('/cards/:cardId/lost', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await reportLostCard(req.params.cardId);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, data: card, message: 'Card reported as lost. Request a replacement.' });
  } catch (error) {
    next(error);
  }
});

export { router as accessRoutes };
