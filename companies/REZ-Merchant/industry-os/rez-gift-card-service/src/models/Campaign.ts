import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftCardCampaign extends Document {
  campaignId: string;
  name: string;
  merchantId: string;
  cardType: 'physical' | 'digital';
  denominations: number[];
  validityDays: number;
  status: 'active' | 'paused' | 'ended';
  maxCards?: number;
  cardsIssued: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const GiftCardCampaignSchema = new Schema<IGiftCardCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    merchantId: { type: String, required: true, index: true },
    cardType: { type: String, enum: ['physical', 'digital'], required: true },
    denominations: [Number],
    validityDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
    },
    maxCards: Number,
    cardsIssued: { type: Number, default: 0 },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const GiftCardCampaign = mongoose.model<IGiftCardCampaign>('GiftCardCampaign', GiftCardCampaignSchema);