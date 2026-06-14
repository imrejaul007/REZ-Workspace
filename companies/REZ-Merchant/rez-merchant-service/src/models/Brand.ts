import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMerchantBrand extends Document {
  merchantId: Types.ObjectId;
  name: string;
  logo?: string;
  description?: string;
  stores: Types.ObjectId[];
  settings: {
    centralMenuEnabled: boolean;
    centralPricingEnabled: boolean;
    centralCampaignsEnabled: boolean;
  };
  isActive: boolean;
}

const MerchantBrandSchema = new Schema<IMerchantBrand>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    description: { type: String },
    stores: [{ type: Schema.Types.ObjectId, ref: 'Store' }],
    settings: {
      centralMenuEnabled: { type: Boolean, default: false },
      centralPricingEnabled: { type: Boolean, default: false },
      centralCampaignsEnabled: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

MerchantBrandSchema.index({ merchantId: 1, isActive: 1 });

export const MerchantBrand =
  mongoose.models.MerchantBrand ||
  mongoose.model<IMerchantBrand>('MerchantBrand', MerchantBrandSchema, 'merchantbrands');
