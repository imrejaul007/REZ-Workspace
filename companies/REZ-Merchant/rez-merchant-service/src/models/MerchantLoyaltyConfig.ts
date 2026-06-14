/**
 * MIRROR of the canonical schema at:
 *   rezbackend/rez-backend-master/src/models/MerchantLoyaltyConfig.ts
 *
 * Shared type: @rez/shared — MerchantLoyaltyConfig (packages/rez-shared/src/types/merchant.types.ts)
 *
 * Any field additions or changes MUST be applied to the canonical source first,
 * then reflected here and in the @rez/shared type definition.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMerchantLoyaltyConfig extends Document {
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  pointsPerRupee: number;
  expiryDays: number;
  bonusCategories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantLoyaltyConfigSchema = new Schema<IMerchantLoyaltyConfig>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    pointsPerRupee: { type: Number, required: true, min: 0, default: 0.1 },
    expiryDays: { type: Number, required: true, min: 1, default: 365 },
    bonusCategories: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

MerchantLoyaltyConfigSchema.index({ storeId: 1 }, { unique: true });

export const MerchantLoyaltyConfig =
  mongoose.models.MerchantLoyaltyConfig ||
  mongoose.model<IMerchantLoyaltyConfig>('MerchantLoyaltyConfig', MerchantLoyaltyConfigSchema);
