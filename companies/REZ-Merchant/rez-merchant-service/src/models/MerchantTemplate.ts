import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMerchantTemplate extends Document {
  merchantId: Types.ObjectId;
  title: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MerchantTemplateSchema = new Schema<IMerchantTemplate>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    variables: { type: [String], default: [] },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

export const MerchantTemplate =
  mongoose.models.MerchantTemplate ||
  mongoose.model<IMerchantTemplate>('MerchantTemplate', MerchantTemplateSchema);
