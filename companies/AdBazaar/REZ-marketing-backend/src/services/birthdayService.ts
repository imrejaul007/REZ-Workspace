import logger from 'utils/logger.js';

import mongoose, { Schema, model, Types } from 'mongoose';

interface BirthdayWish {
  _id: Types.ObjectId;
  userId: string;
  merchantId: Types.ObjectId;
  year: number;
  offerId?: Types.ObjectId;
  sentAt: Date;
}

const BirthdayWishSchema = new Schema<BirthdayWish>({
  userId: String,
  merchantId: { type: Schema.Types.ObjectId, required: true },
  year: { type: Number, required: true },
  offerId: Schema.Types.ObjectId,
  sentAt: { type: Date, default: Date.now }
});

BirthdayWishSchema.index({ merchantId: 1, userId: 1, year: 1 }, { unique: true });

export const BirthdayWishModel = mongoose.models.BirthdayWish ||
  model('BirthdayWish', BirthdayWishSchema, 'birthday_wishes');

export class BirthdayService {
  async processBirthdays(): Promise<void> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find users with birthday today
    const User = mongoose.model('User');
    const users = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, month] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] }
        ]
      }
    });

    for (const user of users) {
      await this.sendBirthdayWish(user);
    }

    logger.info(`Processed ${users.length} birthday wishes`);
  }

  private async sendBirthdayWish(user): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Check if already sent this year
    const alreadySent = await BirthdayWishModel.findOne({
      userId: user._id.toString(),
      year: currentYear
    });

    if (alreadySent) return;

    // Create birthday offer
    const Offer = mongoose.models.Offer;
    const offer = await Offer?.create({
      merchantId: user.merchantId || user.merchant?._id,
      userId: user._id.toString(),
      discountType: 'percentage',
      discountValue: 20,
      validFor: 7,
      reason: 'birthday'
    });

    // Log
    await BirthdayWishModel.create({
      userId: user._id.toString(),
      merchantId: user.merchantId || user.merchant?._id,
      year: currentYear,
      offerId: offer?._id
    });

    logger.info(`Birthday wish sent to ${user._id} with offer ${offer?._id}`);
  }

  async getBirthdayStats(merchantId: string): Promise<unknown> {
    const stats = await BirthdayWishModel.aggregate([
      { $match: { merchantId: new Types.ObjectId(merchantId) } },
      { $group: {
        _id: '$year',
        count: { $sum: 1 }
      }},
      { $sort: { _id: -1 } }
    ]);

    return stats;
  }
}

export const birthdayService = new BirthdayService();
