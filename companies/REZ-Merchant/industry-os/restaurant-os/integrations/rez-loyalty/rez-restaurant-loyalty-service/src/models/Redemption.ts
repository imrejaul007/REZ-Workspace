import mongoose, { Document, Schema } from 'mongoose';
import { STATUS } from '../config/constants';

export interface IReward {
  rewardType: 'FREE_DISH' | 'DISCOUNT' | 'CASHBACK' | 'VIP_ACCESS';
  dishId?: string;
  dishName?: string;
  discountPercentage?: number;
  discountAmount?: number;
  cashbackAmount?: number;
  minOrderValue?: number;
  maxDiscount?: number;
}

export interface IRedemption extends Document {
  redemptionId: string;
  customerId: string;
  programId: string;
  reward: IReward;
  pointsUsed: number;
  monetaryValue: number; // ₹ value of redemption
  orderId?: string;
  restaurantId: string;
  status: STATUS;
  redeemedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    rewardType: {
      type: String,
      enum: ['FREE_DISH', 'DISCOUNT', 'CASHBACK', 'VIP_ACCESS'],
      required: true,
    },
    dishId: String,
    dishName: String,
    discountPercentage: Number,
    discountAmount: Number,
    cashbackAmount: Number,
    minOrderValue: Number,
    maxDiscount: Number,
  },
  { _id: false }
);

const RedemptionSchema = new Schema<IRedemption>(
  {
    redemptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    programId: {
      type: String,
      required: true,
      index: true,
    },
    reward: {
      type: RewardSchema,
      required: true,
    },
    pointsUsed: {
      type: Number,
      required: true,
    },
    monetaryValue: {
      type: Number,
      required: true,
    },
    orderId: String,
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values({
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        EXPIRED: 'EXPIRED',
        CANCELLED: 'CANCELLED',
      }),
      default: 'ACTIVE',
    },
    redeemedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

RedemptionSchema.index({ customerId: 1, status: 1 });
RedemptionSchema.index({ restaurantId: 1, status: 1 });
RedemptionSchema.index({ expiresAt: 1, status: 1 });

export const Redemption = mongoose.model<IRedemption>('Redemption', RedemptionSchema);
