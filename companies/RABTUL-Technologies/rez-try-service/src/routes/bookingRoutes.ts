/**
 * Booking Routes
 */
import { Router, Request, Response } from 'express';
import { BookingModel, TrialModel, ExplorerProfileModel, CoinTransactionModel } from '../models';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../config/logger';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get user bookings
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const bookings = await BookingModel.find({ userId: req.params.userId })
      .sort({ bookedAt: -1 })
      .limit(50);

    res.json({ success: true, data: bookings });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await BookingModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// Create booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trialId, userId } = req.body;

    // Check if trial exists and has slots
    const trial = await TrialModel.findById(trialId);
    if (!trial) {
      return res.status(404).json({ success: false, error: 'Trial not found' });
    }
    if (trial.slotsRemaining <= 0) {
      return res.status(400).json({ success: false, error: 'No slots available' });
    }

    // Check user booking limit
    const userBookings = await BookingModel.countDocuments({
      userId,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (userBookings >= config.trialSettings.maxBookingsPerUser) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${config.trialSettings.maxBookingsPerUser} active bookings allowed`,
      });
    }

    // Create booking
    const booking = new BookingModel({
      userId,
      trialId,
      status: 'confirmed',
      qrCode: `REZTRY:${uuidv4()}`,
      coinEarned: config.coinSettings.trialCompletionReward,
    });

    await booking.save();

    // Decrement slots
    await TrialModel.updateOne({ _id: trialId }, { $inc: { slotsRemaining: -1 } });

    logger.info('Booking created:', { bookingId: booking._id, userId, trialId });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// Cancel booking
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Restore slot
    await TrialModel.updateOne({ _id: booking.trialId }, { $inc: { slotsRemaining: 1 } });

    logger.info('Booking cancelled:', { bookingId: booking._id });

    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// Complete booking (mark as done)
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Update explorer score
    await updateExplorerScore(booking.userId);

    // Award coins
    await awardCoins(booking.userId, booking.coinEarned, booking._id.toString());

    logger.info('Booking completed:', { bookingId: booking._id });

    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error completing booking:', error);
    res.status(500).json({ success: false, error: 'Failed to complete booking' });
  }
});

// Verify booking QR
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;

    const booking = await BookingModel.findOne({ qrCode });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Invalid QR code' });
    }

    const trial = await TrialModel.findById(booking.trialId);

    res.json({
      success: true,
      data: {
        valid: true,
        booking,
        trial,
      },
    });
  } catch (error) {
    logger.error('Error verifying QR:', error);
    res.status(500).json({ success: false, error: 'Failed to verify QR' });
  }
});

async function updateExplorerScore(userId: string) {
  let profile = await ExplorerProfileModel.findOne({ userId });

  if (!profile) {
    profile = new ExplorerProfileModel({ userId });
  }

  profile.stats.trialsCompleted += 1;
  profile.stats.lastActivityAt = new Date();

  // Recalculate score
  profile.score =
    profile.stats.trialsCompleted * config.explorerScoreWeights.trialsCompleted +
    profile.stats.reviewsWritten * config.explorerScoreWeights.reviewsWritten +
    profile.stats.campaignsJoined * config.explorerScoreWeights.campaignsJoined +
    profile.stats.referrals * config.explorerScoreWeights.referrals +
    profile.stats.currentStreak * config.explorerScoreWeights.streak;

  // Determine tier
  if (profile.score >= 1000) profile.tier = 'Conqueror';
  else if (profile.score >= 500) profile.tier = 'Adventurer';
  else if (profile.score >= 100) profile.tier = 'Explorer';
  else profile.tier = 'Curious';

  await profile.save();
}

async function awardCoins(userId: string, amount: number, bookingId: string) {
  const transaction = new CoinTransactionModel({
    userId,
    amount,
    type: 'earned',
    source: 'trial_completion',
    referenceId: bookingId,
    description: 'Trial completion reward',
  });

  await transaction.save();
}

export default router;
