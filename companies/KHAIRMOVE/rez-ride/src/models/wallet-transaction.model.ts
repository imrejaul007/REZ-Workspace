import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum TransactionSource {
  RIDE_FARE = 'ride_fare',
  CASHBACK = 'cashback',
  BONUS = 'bonus',
  PROMO = 'promo',
  REFUND = 'refund',
  SUBSCRIPTION = 'subscription',
  AD_REVENUE = 'ad_revenue',
  COMMISSION = 'commission',
  WITHDRAWAL = 'withdrawal',
}

@Schema({ timestamps: true })
export class WalletTransaction {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true, enum: TransactionSource })
  source: TransactionSource;

  @Prop()
  referenceId: string; // rideId, driverId, etc.

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ required: true, unique: true, sparse: true })
  idempotencyKey: string;

  @Prop()
  description: string;

  @Prop()
  completedAt: Date;

  @Prop()
  failedAt: Date;

  @Prop()
  reversedAt: Date;

  @Prop()
  failureReason: string;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

// Indexes
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, type: 1 });
WalletTransactionSchema.index({ userId: 1, source: 1 });
WalletTransactionSchema.index({ status: 1 });
WalletTransactionSchema.index({ referenceId: 1, source: 1 });
WalletTransactionSchema.index({ completedAt: -1 });

// Compound indexes
WalletTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Idempotency is already unique+sparse
