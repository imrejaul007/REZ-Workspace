import { Schema, model, Document, Types } from 'mongoose';

export interface IMerchantFeatureFlag extends Document {
  merchantId: Types.ObjectId;
  flagKey: string;
  enabled: boolean;
  overrideReason: string;
  expiresAt?: Date;
  setBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantFeatureFlagSchema = new Schema<IMerchantFeatureFlag>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    flagKey: { type: String, required: true, trim: true },
    enabled: { type: Boolean, required: true },
    overrideReason: { type: String, required: true, trim: true },
    expiresAt: { type: Date, default: null },
    setBy: { type: String, required: true },
  },
  { timestamps: true },
);

MerchantFeatureFlagSchema.index({ merchantId: 1, flagKey: 1 }, { unique: true });
MerchantFeatureFlagSchema.index({ flagKey: 1 });
MerchantFeatureFlagSchema.index({ expiresAt: 1 }, { sparse: true });

export const MerchantFeatureFlag = model<IMerchantFeatureFlag>('MerchantFeatureFlag', MerchantFeatureFlagSchema);
export default MerchantFeatureFlag;
