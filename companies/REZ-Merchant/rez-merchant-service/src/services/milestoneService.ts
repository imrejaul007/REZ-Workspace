import logger from './utils/logger';

import mongoose, { Schema, model, Types } from 'mongoose';

export interface IMilestone extends Document {
  userId: Types.ObjectId;
  milestoneId: string;
  type: 'orders' | 'spending' | 'visits';
  count: number;
  reward: {
    type: 'points' | 'discount' | 'free_item';
    value: number | string;
  };
  awardedAt: Date;
  message: string;
}

export interface MilestoneConfig {
  id: string;
  type: 'orders' | 'spending' | 'visits';
  count: number;
  reward: {
    type: 'points' | 'discount' | 'free_item';
    value: number | string;
  };
  message: string;
}

export const DEFAULT_MILESTONES: MilestoneConfig[] = [
  { id: 'order_10', type: 'orders', count: 10, reward: { type: 'points', value: 100 }, message: '10 orders complete! +100 bonus points' },
  { id: 'order_50', type: 'orders', count: 50, reward: { type: 'points', value: 500 }, message: '50 orders complete! +500 bonus points' },
  { id: 'order_100', type: 'orders', count: 100, reward: { type: 'discount', value: 10 }, message: '100 orders! 10% off your next order' },
  { id: 'order_500', type: 'orders', count: 500, reward: { type: 'free_item', value: 'free_dessert' }, message: '500 orders! Free dessert on us!' },
  { id: 'spending_5000', type: 'spending', count: 5000, reward: { type: 'points', value: 250 }, message: '₹5000 spent! +250 bonus points' },
  { id: 'spending_10000', type: 'spending', count: 10000, reward: { type: 'discount', value: 15 }, message: '₹10000 spent! 15% off' },
  { id: 'spending_50000', type: 'spending', count: 50000, reward: { type: 'free_item', value: 'free_meal' }, message: '₹50000 spent! Free meal on us!' },
];

const MilestoneSchema = new Schema<IMilestone>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  milestoneId: { type: String, required: true },
  type: { type: String, enum: ['orders', 'spending', 'visits'], required: true },
  count: { type: Number, required: true },
  reward: {
    type: { type: String, enum: ['points', 'discount', 'free_item'], required: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  awardedAt: { type: Date, default: Date.now },
  message: String
});

MilestoneSchema.index({ userId: 1 });
MilestoneSchema.index({ milestoneId: 1 });

export const Milestone = mongoose.models.Milestone || model<IMilestone>('Milestone', MilestoneSchema, 'milestones');

export class MilestoneService {
  async checkAndAwardMilestones(userId: string, orderData: { orderId: string; total: number }): Promise<IMilestone[]> {
    const awarded: IMilestone[] = [];

    const user = await mongoose.model('User').findById(userId);
    if (!user) return awarded;

    for (const milestone of DEFAULT_MILESTONES) {
      const alreadyAwarded = await Milestone.findOne({ userId, milestoneId: milestone.id });
      if (alreadyAwarded) continue;

      const reached = await this.checkMilestone(userId, milestone);
      if (reached) {
        const earned = await this.awardMilestone(userId, milestone);
        awarded.push(earned);
      }
    }

    return awarded;
  }

  private async checkMilestone(userId: string, milestone: MilestoneConfig): Promise<boolean> {
    switch (milestone.type) {
      case 'orders': {
        const count = await mongoose.model('Order').countDocuments({ userId });
        return count >= milestone.count;
      }
      case 'spending': {
        const result = await mongoose.model('Order').aggregate([
          { $match: { userId: new Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalSpent = result[0]?.total || 0;
        return totalSpent >= milestone.count;
      }
      default:
        return false;
    }
  }

  private async awardMilestone(userId: string, milestone: MilestoneConfig): Promise<IMilestone> {
    const record = await Milestone.create({
      userId,
      milestoneId: milestone.id,
      type: milestone.type,
      count: milestone.count,
      reward: milestone.reward,
      awardedAt: new Date(),
      message: milestone.message
    });

    // Award reward
    if (milestone.reward.type === 'points') {
      await mongoose.model('LoyaltyAccount').findOneAndUpdate(
        { userId },
        { $inc: { points: milestone.reward.value as number } },
        { upsert: true }
      );
    }

    // Send notification
    logger.info(`🎉 Milestone awarded: ${milestone.message} to user ${userId}`);

    return record;
  }

  async getUpcomingMilestones(userId: string): Promise<MilestoneConfig[]> {
    const earned = await Milestone.find({ userId }).select('milestoneId');
    const earnedIds = earned.map(e => e.milestoneId);

    const orderCount = await mongoose.model('Order').countDocuments({ userId });
    const result = await mongoose.model('Order').aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalSpent = result[0]?.total || 0;

    return DEFAULT_MILESTONES
      .filter(m => !earnedIds.includes(m.id))
      .filter(m => {
        if (m.type === 'orders') return orderCount < m.count;
        if (m.type === 'spending') return totalSpent < m.count;
        return false;
      })
      .map(m => ({
        ...m,
        progress: m.type === 'orders'
          ? Math.min(100, (orderCount / m.count) * 100)
          : Math.min(100, (totalSpent / m.count) * 100),
        remaining: m.type === 'orders'
          ? m.count - orderCount
          : m.count - totalSpent
      }));
  }
}

export const milestoneService = new MilestoneService();
