/**
 * Webhook Routes
 */
import { Router, Request, Response } from 'express';
import { BookingModel, TrialModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Verify booking QR (for merchant/staff)
router.post('/booking/verify', async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;

    const booking = await BookingModel.findOne({ qrCode }).populate('trialId');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Invalid booking' });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        status: booking.status,
        trial: booking.trialId,
        bookedAt: booking.bookedAt,
      },
    });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook error' });
  }
});

export default router;
