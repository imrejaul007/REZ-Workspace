import mongoose, { Types } from 'mongoose';
import { ReferralConversion, IReferralConversion } from '../models/ReferralConversion';
import { redis } from '../config/redis';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('referralService');

// Anti-farming cap: max referral rewards per referrer per calendar month
const MAX_REFERRALS_PER_MONTH = 50;

/**
 * Register a new referral (pending state)
 * Called when a new user signs up with a referrer code
 *
 * @param referrerId - The user ID of the person who referred
 * @param refereeId - The user ID of the newly referred user
 * @param rewardAmount - Amount of coins to reward on qualification
 * @param rewardCoinType - Type of coins to reward (default: 'rez')
 * @returns ReferralConversion record in pending state
 * @throws Error if validation fails
 */
export async function registerReferral(
  referrerId: string,
  refereeId: string,
  rewardAmount: number = 100,
  rewardCoinType: string = 'rez',
): Promise<IReferralConversion> {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(referrerId)) {
    throw new Error('Invalid referrerId');
  }
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid refereeId');
  }

  // No self-referral
  if (referrerId === refereeId) {
    throw new Error('Cannot self-refer');
  }

  const referrerIdObj = new Types.ObjectId(referrerId);
  const refereeIdObj = new Types.ObjectId(refereeId);

  // Check for existing referral pair (compound unique index will enforce this on insert)
  const existing = await ReferralConversion.findOne({
    referrerId: referrerIdObj,
    refereeId: refereeIdObj,
  });
  if (existing) {
    throw new Error(`Referral pair already exists for referrer:${referrerId}, referee:${refereeId}`);
  }

  // Create new pending referral
  const referral = await ReferralConversion.create({
    referrerId: referrerIdObj,
    refereeId: refereeIdObj,
    status: 'pending',
    qualifyingAction: 'first_order', // default qualifying action
    rewardAmount,
    rewardCoinType,
  });

  logger.info('Referral registered', {
    referrerId,
    refereeId,
    rewardAmount,
    rewardCoinType,
  });

  return referral;
}

/**
 * Mark a referral as qualified (user completed the qualifying action)
 * Called when the referee completes their first order/payment
 *
 * @param refereeId - The user ID of the referred user
 * @param action - Type of qualifying action
 * @param actionId - Optional ID of the order/payment that qualified the referral
 * @param idempotencyKey - Optional idempotency key for deduplication
 * @returns ReferralConversion record in qualified state, or null if not found
 *
 * BAK-MED-005: Uses atomic findOneAndUpdate so concurrent calls with the same
 * refereeId are handled safely (first writer wins, others return null).
 * The caller should check for null and treat it as idempotent success.
 */
export async function qualifyReferral(
  refereeId: string,
  action: 'first_order' | 'first_payment' | 'account_verified' = 'first_order',
  actionId?: string,
  idempotencyKey?: string,
): Promise<IReferralConversion | null> {
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid refereeId');
  }

  const refereeIdObj = new Types.ObjectId(refereeId);
  const actionIdObj = actionId && mongoose.Types.ObjectId.isValid(actionId)
    ? new Types.ObjectId(actionId)
    : undefined;

  const update: Record<string, unknown> = {
    status: 'qualified',
    qualifyingAction: action,
    qualifyingActionId: actionIdObj,
    qualifiedAt: new Date(),
  };

  // BAK-MED-005: Store idempotency key on the record if provided.
  // The unique sparse index on idempotencyKey enforces that each key is used once.
  if (idempotencyKey) {
    update.idempotencyKey = idempotencyKey;
  }

  const referral = await ReferralConversion.findOneAndUpdate(
    {
      refereeId: refereeIdObj,
      status: 'pending', // only qualify if still pending
    },
    { $set: update },
    { new: true },
  );

  if (!referral) {
    logger.warn('No pending referral found to qualify', { refereeId });
    return null;
  }

  logger.info('Referral qualified', {
    referrerId: referral.referrerId,
    refereeId,
    action,
    actionId,
    idempotencyKey,
  });

  return referral;
}

/**
 * Process a referral reward (mark as rewarded after crediting coins)
 * Called after coins have been successfully credited to the referrer
 *
 * @param referralId - The ReferralConversion ID
 * @returns {credited: boolean}
 */
export async function processReferralReward(
  referralId: string,
): Promise<{ credited: boolean }> {
  if (!mongoose.Types.ObjectId.isValid(referralId)) {
    throw new Error('Invalid referralId');
  }

  const referralIdObj = new Types.ObjectId(referralId);

  const updated = await ReferralConversion.findByIdAndUpdate(
    referralIdObj,
    {
      status: 'rewarded',
      rewardedAt: new Date(),
    },
    { new: true },
  );

  if (!updated) {
    throw new Error(`Referral not found: ${referralId}`);
  }

  logger.info('Referral reward processed', {
    referrerId: updated.referrerId,
    refereeId: updated.refereeId,
    rewardAmount: updated.rewardAmount,
  });

  return { credited: true };
}

/**
 * Validate referral credit before allowing it
 * Checks: referrer exists, referee came from referrer, qualifying action done, no self-referral, anti-farming cap
 *
 * @param referrerId - The referrer's user ID
 * @param refereeId - The referred user's ID
 * @param userId - The user ID being credited (should equal referrerId)
 * @returns {valid: boolean, reason?: string}
 */
export async function validateReferralCredit(
  referrerId: string,
  refereeId: string,
  userId: string,
): Promise<{ valid: boolean; reason?: string }> {
  // Ensure the person being credited is the referrer
  if (referrerId !== userId) {
    return {
      valid: false,
      reason: 'referrerId does not match userId being credited',
    };
  }

  if (!mongoose.Types.ObjectId.isValid(referrerId)) {
    return { valid: false, reason: 'Invalid referrerId' };
  }
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    return { valid: false, reason: 'Invalid refereeId' };
  }

  // No self-referral
  if (referrerId === refereeId) {
    return { valid: false, reason: 'Self-referral not allowed' };
  }

  const referrerIdObj = new Types.ObjectId(referrerId);
  const refereeIdObj = new Types.ObjectId(refereeId);

  // Find the referral record
  const referral = await ReferralConversion.findOne({
    referrerId: referrerIdObj,
    refereeId: refereeIdObj,
  });

  if (!referral) {
    return {
      valid: false,
      reason: 'No referral record found for this referrer-referee pair',
    };
  }

  // Referral must be in qualified state to be rewarded
  if (referral.status !== 'qualified') {
    return {
      valid: false,
      reason: `Referral status is '${referral.status}', not 'qualified'. Referee must complete qualifying action first.`,
    };
  }

  // Anti-farming: check if referrer has already received 50+ rewards this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const rewardedThisMonth = await ReferralConversion.countDocuments({
    referrerId: referrerIdObj,
    status: 'rewarded',
    rewardedAt: { $gte: monthStart, $lte: monthEnd },
  });

  if (rewardedThisMonth >= MAX_REFERRALS_PER_MONTH) {
    return {
      valid: false,
      reason: `Referrer has reached the monthly cap of ${MAX_REFERRALS_PER_MONTH} referral rewards`,
    };
  }

  return { valid: true };
}

/**
 * Get referral status for a referee
 * @param refereeId - The referred user's ID
 * @returns ReferralConversion record or null
 */
export async function getReferralStatus(
  refereeId: string,
): Promise<IReferralConversion | null> {
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid refereeId');
  }

  return ReferralConversion.findOne({
    refereeId: new Types.ObjectId(refereeId),
  }).lean().exec() as Promise<IReferralConversion | null>;
}

/**
 * Get all referrals by a referrer in a given status
 * @param referrerId - The referrer's user ID
 * @param status - Optional status filter
 * @returns Array of ReferralConversion records
 */
export async function getReferralsByReferrer(
  referrerId: string,
  status?: 'pending' | 'qualified' | 'rewarded' | 'rejected',
): Promise<IReferralConversion[]> {
  if (!mongoose.Types.ObjectId.isValid(referrerId)) {
    throw new Error('Invalid referrerId');
  }

  const query: unknown = { referrerId: new Types.ObjectId(referrerId) };
  if (status) {
    query.status = status;
  }

  return ReferralConversion.find(query).lean().exec() as unknown as Promise<IReferralConversion[]>;
}

/**
 * Count referrals by a referrer in a given time period
 * @param referrerId - The referrer's user ID
 * @param status - Optional status filter
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Count of matching referrals
 */
export async function countReferralsByReferrer(
  referrerId: string,
  status?: 'pending' | 'qualified' | 'rewarded' | 'rejected',
  startDate?: Date,
  endDate?: Date,
): Promise<number> {
  if (!mongoose.Types.ObjectId.isValid(referrerId)) {
    throw new Error('Invalid referrerId');
  }

  const query: unknown = { referrerId: new Types.ObjectId(referrerId) };
  if (status) {
    query.status = status;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return ReferralConversion.countDocuments(query);
}
