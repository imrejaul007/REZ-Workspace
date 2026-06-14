import logger from 'utils/logger.js';

import mongoose, { Schema, model, Types } from 'mongoose';

interface WinbackConfig {
  merchantId: Types.ObjectId;
  inactiveDays: number;
  offerDiscount: number;
  maxRetries: number;
}

interface CampaignLog {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: string;
  type: string;
  segment: string;
  offerId?: Types.ObjectId;
  sentAt: Date;
}

const WinbackConfigSchema = new Schema<WinbackConfig>({
  merchantId: { type: Schema.Types.ObjectId, required: true },
  inactiveDays: { type: Number, default: 30 },
  offerDiscount: { type: Number, default: 15 },
  maxRetries: { type: Number, default: 3 }
});

const CampaignLogSchema = new Schema<CampaignLog>({
  merchantId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  segment: String,
  offerId: Schema.Types.ObjectId,
  sentAt: { type: Date, default: Date.now }
});

CampaignLogSchema.index({ merchantId: 1, userId: 1, type: 1 });
CampaignLogSchema.index({ sentAt: -1 });

export const WinbackConfigModel = mongoose.models.WinbackConfig || model('WinbackConfig', WinbackConfigSchema);
export const CampaignLogModel = mongoose.models.CampaignLog || model('CampaignLog', CampaignLogSchema);

export class WinbackService {
  async identifyWinbackCustomers(merchantId: string): Promise<unknown[]> {
    const config = await WinbackConfigModel.findOne({ merchantId });
    const days = config?.inactiveDays || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Find users who haven't ordered in X days
    const Order = mongoose.model('Order');
    const inactiveUsers = await Order.aggregate([
      { $group: {
        _id: '$userId',
        lastOrderDate: { $max: '$createdAt' }
      }},
      { $match: { lastOrderDate: { $lt: cutoffDate } } },
      { $project: { userId: '$_id', lastOrderDate: 1, _id: 0 } }
    ]);

    return inactiveUsers;
  }

  async sendWinbackCampaign(
    merchantId: string,
    userId: string,
    discount: number
  ): Promise<void> {
    // Check if already sent recently
    const recent = await CampaignLogModel.findOne({
      merchantId: new Types.ObjectId(merchantId),
      userId,
      type: 'winback',
      sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (recent) {
      logger.info(`Winback already sent to ${userId} this week`);
      return;
    }

    // Create offer
    const Offer = mongoose.models.Offer;
    const offer = await Offer?.create({
      merchantId: new Types.ObjectId(merchantId),
      userId,
      discountType: 'percentage',
      discountValue: discount,
      validFor: 7
    });

    // Log campaign
    await CampaignLogModel.create({
      merchantId: new Types.ObjectId(merchantId),
      userId,
      type: 'winback',
      segment: 'winback',
      offerId: offer?._id
    });

    logger.info(`Winback campaign sent to ${userId} with ${discount}% discount`);
  }

  async getWinbackStats(merchantId: string): Promise<unknown> {
    const stats = await CampaignLogModel.aggregate([
      { $match: { merchantId: new Types.ObjectId(merchantId), type: 'winback' } },
      { $group: {
        _id: null,
        totalSent: { $sum: 1 },
        bySegment: { $push: '$segment' }
      }}
    ]);

    return stats[0] || { totalSent: 0 };
  }
}

export const winbackService = new WinbackService();
