import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RideWalletDocument = RideWallet & Document;

@Schema({ timestamps: true })
export class RideWallet {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, default: 0, min: 0 })
  balance: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalEarned: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalSpent: number;

  @Prop({ default: 0, min: 0 })
  pendingBalance: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastTransactionAt: Date;
}

export const RideWalletSchema = SchemaFactory.createForClass(RideWallet);

// Indexes for efficient queries
RideWalletSchema.index({ balance: 1 });
RideWalletSchema.index({ isActive: 1 });
RideWalletSchema.index({ createdAt: -1 });
RideWalletSchema.index({ lastTransactionAt: -1 });

// Compound index for common query patterns
RideWalletSchema.index({ isActive: 1, balance: 1 });
