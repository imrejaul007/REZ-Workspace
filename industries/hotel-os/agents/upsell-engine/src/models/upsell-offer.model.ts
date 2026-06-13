import mongoose, { Schema, Document } from 'mongoose';
import { UpsellOffer } from '../types/twin.types';

export interface IUpsellOffer extends Omit<UpsellOffer, 'created_at'>, Document {
  created_at: Date;
}

const UpsellOfferSchema = new Schema<IUpsellOffer>(
  {
    offer_id: { type: String, required: true, unique: true, index: true },
    guest_id: { type: String, required: true, index: true },
    room_id: { type: String, required: true, index: true },
    offer_type: {
      type: String,
      enum: ['upgrade', 'package', 'addon', 'early_checkin', 'late_checkout'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    original_price: { type: Number, required: true },
    offer_price: { type: Number, required: true },
    discount_percentage: { type: Number, required: true },
    savings: { type: Number, required: true },
    target_room_type: { type: String },
    addons: [{ type: String }],
    valid_until: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'shown', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    shown_at: { type: String },
    responded_at: { type: String },
    conversion_probability: { type: Number },
    revenue_impact: { type: Number },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UpsellOfferSchema.index({ guest_id: 1, status: 1 });
UpsellOfferSchema.index({ room_id: 1, valid_until: 1 });
UpsellOfferSchema.index({ offer_type: 1, status: 1 });
UpsellOfferSchema.index({ created_at: -1 });

export const UpsellOfferModel = mongoose.model<IUpsellOffer>('UpsellOffer', UpsellOfferSchema);
