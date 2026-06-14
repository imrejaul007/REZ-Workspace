import { Router, Request, Response } from 'express';
import { Referrer, Referral, ReferralReward } from '../models/Referral';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

const router = Router();

function generateReferralCode(): string {
  return 'REZ' + uuidv4().slice(0, 8).toUpperCase();
}

// Get referrer by user ID
router.get('/referrer/:userId', async (req: Request, res: Response) => {
  try {
    let referrer = await Referrer.findOne({ userId: req.params.userId });
    if (!referrer) {
      referrer = await Referrer.create({ userId: req.params.userId, referralCode: generateReferralCode() });
    }
    res.json({ success: true, data: referrer });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch referrer' } });
  }
});

// Get referrer by code
router.get('/referrer/code/:code', async (req: Request, res: Response) => {
  try {
    const referrer = await Referrer.findOne({ referralCode: req.params.code });
    if (!referrer) return res.status(404).json({ success: false, error: { message: 'Referral code not found' } });
    res.json({ success: true, data: referrer });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch referrer' } });
  }
});

// Create referral
router.post('/referrals', async (req: Request, res: Response) => {
  try {
    const { referrerCode, refereeId } = req.body;

    const referrer = await Referrer.findOne({ referralCode: referrerCode });
    if (!referrer) return res.status(404).json({ success: false, error: { message: 'Invalid referral code' } });

    const existingReferral = await Referral.findOne({ refereeId, referralCode: referrerCode });
    if (existingReferral) return res.status(400).json({ success: false, error: { message: 'Already referred with this code' } });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    const referral = await Referral.create({
      referrerId: referrer._id,
      refereeId,
      referralCode: referrerCode,
      status: 'pending',
      rewardAmount: 100,
      rewardType: 'credit',
      expiryDate,
    });

    await Referrer.updateOne({ _id: referrer._id }, { $inc: { totalReferrals: 1 } });

    res.status(201).json({ success: true, data: referral });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get referrals by referrer
router.get('/referrals/referrer/:referrerId', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: Record<string, any> = { referrerId: req.params.referrerId };
    if (status) query.status = status;

    const referrals = await Referral.find(query).sort({ referredAt: -1 });
    res.json({ success: true, data: referrals, count: referrals.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch referrals' } });
  }
});

// Update referral status
router.patch('/referrals/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const referral = await Referral.findById(req.params.id);
    if (!referral) return res.status(404).json({ success: false, error: { message: 'Referral not found' } });

    const updateData: Record<string, any> = { status };
    if (status === 'registered') updateData.registeredAt = new Date();
    if (status === 'activated') updateData.activatedAt = new Date();
    if (status === 'completed') {
      updateData.completedAt = new Date();
      await ReferralReward.create({
        referralId: referral._id,
        referrerId: referral.referrerId,
        type: 'signup',
        amount: referral.rewardAmount,
        status: 'credited',
        creditedAt: new Date(),
      });
      await Referrer.updateOne(
        { _id: referral.referrerId },
        { $inc: { successfulReferrals: 1, totalEarnings: referral.rewardAmount, pendingEarnings: -referral.rewardAmount } }
      );
    }

    const updated = await Referral.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get rewards
router.get('/rewards/:referrerId', async (req: Request, res: Response) => {
  try {
    const rewards = await ReferralReward.find({ referrerId: req.params.referrerId })
      .populate('referralId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rewards, count: rewards.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch rewards' } });
  }
});

// Get referral stats
router.get('/stats/:referrerId', async (req: Request, res: Response) => {
  try {
    const referrer = await Referrer.findById(req.params.referrerId);
    if (!referrer) return res.status(404).json({ success: false, error: { message: 'Referrer not found' } });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReferrals = await Referral.countDocuments({
      referrerId: req.params.referrerId,
      referredAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      data: {
        totalReferrals: referrer.totalReferrals,
        successfulReferrals: referrer.successfulReferrals,
        totalEarnings: referrer.totalEarnings,
        pendingEarnings: referrer.pendingEarnings,
        withdrawnAmount: referrer.withdrawnAmount,
        recentReferrals,
        conversionRate: referrer.totalReferrals > 0
          ? (referrer.successfulReferrals / referrer.totalReferrals * 100).toFixed(2) + '%'
          : '0%',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats' } });
  }
});

export default router;
