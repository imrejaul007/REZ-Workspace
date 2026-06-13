import mongoose, { Schema, Document } from 'mongoose';
import { GuestTwin, UpgradeHistory } from '../types/twin.types';

export interface IUpgradeHistory extends UpgradeHistory {}

export interface IGuestTwin extends Omit<GuestTwin, 'created_at' | 'updated_at'>, Document {
  created_at: Date;
  updated_at: Date;
}

const UpgradeHistorySchema = new Schema<IUpgradeHistory>(
  {
    room_type: { type: String, required: true },
    upgrade_date: { type: String, required: true },
    accepted: { type: Boolean, required: true },
    discount_applied: { type: Number },
  },
  { _id: false }
);

const GuestTwinSchema = new Schema<IGuestTwin>(
  {
    guest_id: { type: String, required: true, unique: true, index: true },
    property_id: { type: String, required: true, index: true },
    profile: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      nationality: { type: String },
      language_preference: { type: String, default: 'en' },
      accessibility_needs: [{ type: String }],
    },
    loyalty: {
      tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
      points_balance: { type: Number, default: 0 },
      member_since: { type: String },
      total_stays: { type: Number, default: 0 },
      total_spend: { type: Number, default: 0 },
    },
    preferences: {
      room: {
        floor_preference: { type: String },
        view_preference: { type: String },
        bed_configuration: { type: String },
        temperature_setting: {
          default: { type: Number, default: 22 },
          range: {
            min: { type: Number, default: 18 },
            max: { type: Number, default: 26 },
          },
        },
        lighting_preference: { type: String },
        noise_tolerance: { type: Number, min: 1, max: 10, default: 5 },
      },
      dining: {
        dietary_restrictions: [{ type: String }],
        allergies: [{ type: String }],
        favorite_items: [{ type: String }],
        beverage_preferences: [{ type: String }],
        typical_spend_range: {
          min: { type: Number, default: 50 },
          max: { type: Number, default: 200 },
        },
      },
      amenities: {
        spa_interests: [{ type: String }],
        fitness_habits: { type: Boolean, default: false },
        pool_usage: { type: Boolean, default: false },
        business_amenities: [{ type: String }],
      },
      communication: {
        preferred_channel: {
          type: String,
          enum: ['email', 'sms', 'app_push', 'whatsapp'],
          default: 'email',
        },
        opt_ins: [{ type: String }],
        quiet_hours: {
          start: { type: String, default: '22:00' },
          end: { type: String, default: '08:00' },
        },
      },
    },
    stay_patterns: {
      typical_check_in_time: { type: String, default: '15:00' },
      typical_check_out_time: { type: String, default: '11:00' },
      weekend_vs_weekday: { type: String, enum: ['weekend', 'weekday', 'mixed'], default: 'mixed' },
      seasonal_patterns: [{ type: String }],
      booking_lead_time: { type: Number, default: 7 },
    },
    sentiment: {
      current_score: { type: Number, min: 0, max: 100, default: 70 },
      trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
      last_feedback_date: { type: String },
      key_topics: [{ type: String }],
    },
    lifetime_value: {
      clv: { type: Number, default: 0 },
      potential_clv: { type: Number, default: 0 },
      churn_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      recommendation_eligibility: { type: Boolean, default: true },
    },
    current_stay: {
      room_id: { type: String },
      check_in: { type: String },
      check_out: { type: String },
      adults: { type: Number, default: 1 },
      children: { type: Number, default: 0 },
      rate_code: { type: String },
      special_requests: [{ type: String }],
      occasion: { type: String },
    },
    price_sensitivity: { type: Number, min: 0, max: 100, default: 50 },
    upgrade_history: [UpgradeHistorySchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
GuestTwinSchema.index({ 'loyalty.tier': 1 });
GuestTwinSchema.index({ 'sentiment.current_score': 1 });
GuestTwinSchema.index({ 'lifetime_value.clv': -1 });
GuestTwinSchema.index({ 'current_stay.check_in': 1, 'current_stay.check_out': 1 });

export const GuestTwinModel = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);
