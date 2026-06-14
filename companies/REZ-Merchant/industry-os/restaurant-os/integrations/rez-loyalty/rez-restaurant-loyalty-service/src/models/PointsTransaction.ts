import mongoose, { Document, Schema } from 'mongoose';
import { TransactionType, STATUS } from '../config/constants';

export interface IPointsTransaction extends Document {
  transactionId: string;
  customerId: string;
  programId: string;
  type: TransactionType;
  points: number;
  balanceAfter: number;
  orderId?: string;
  restaurantId?: string;
  description: string;
  status: STATUS;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    transactionId: {
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
    type: {
      type: String,
      enum: Object.values({
        EARN: 'EARN',
        REDEEM: 'REDEEM',
        EXPIRE: 'EXPIRE',
        ADJUST: 'ADJUST',
        BONUS: 'BONUS',
        REFERRAL: 'REFERRAL',
        BIRTHDAY: 'BIRTHDAY',
      }),
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    restaurantId: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      required: true,
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
    expiresAt: {
      type: Date,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PointsTransactionSchema.index({ customerId: 1, createdAt: -1 });
PointsTransactionSchema.index({ customerId: 1, type: 1 });
PointsTransactionSchema.index({ expiresAt: 1, status: 1 });

export const PointsTransaction = mongoose.model<IPointsTransaction>(
  'PointsTransaction',
  PointsTransactionSchema
);
