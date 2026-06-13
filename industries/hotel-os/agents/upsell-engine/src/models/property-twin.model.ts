import mongoose, { Schema, Document } from 'mongoose';
import { PropertyTwin } from '../types/twin.types';

export interface IPropertyTwin extends Omit<PropertyTwin, 'created_at' | 'updated_at'>, Document {
  created_at: Date;
  updated_at: Date;
}

const VenueSchema = new Schema(
  {
    venue_id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room'],
      required: true,
    },
    capacity: { type: Number, default: 50 },
    hours: {
      type: Map,
      of: {
        open: { type: String, required: true },
        close: { type: String, required: true },
      },
      default: {},
    },
    pos_revenue_center_id: { type: String },
  },
  { _id: false }
);

const PropertyTwinSchema = new Schema<IPropertyTwin>(
  {
    property_id: { type: String, required: true, unique: true, index: true },
    brand: { type: String, required: true },
    name: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      timezone: { type: String, default: 'UTC' },
    },
    inventory: {
      total_rooms: { type: Number, required: true },
      by_type: { type: Map, of: Number, default: {} },
      available_today: { type: Number, default: 0 },
      available_tomorrow: { type: Number, default: 0 },
    },
    venues: [VenueSchema],
    revenue: {
      today_revenue: { type: Number, default: 0 },
      mtd_revenue: { type: Number, default: 0 },
      ytd_revenue: { type: Number, default: 0 },
      revpar: { type: Number, default: 0 },
      adr: { type: Number, default: 0 },
      occupancy_rate: { type: Number, default: 0 },
    },
    settings: {
      brand_standards_version: { type: String, default: '1.0.0' },
      upsell_config: {
        max_upgrade_discount: { type: Number, default: 30 },
        min_offer_interval_hours: { type: Number, default: 24 },
        preferred_offer_times: [{ type: String }],
        excluded_rate_codes: [{ type: String }],
        upgrade_thresholds: {
          occupancy: { type: Number, default: 70 },
          min_rate: { type: Number, default: 100 },
        },
      },
      pricing_rules: {
        dynamic_pricing_enabled: { type: Boolean, default: true },
        surge_multiplier_max: { type: Number, default: 1.5 },
        weekend_premium: { type: Number, default: 1.15 },
        seasonal_adjustments: [
          {
            season: { type: String },
            multiplier: { type: Number },
          },
        ],
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PropertyTwinSchema.index({ 'location.city': 1 });
PropertyTwinSchema.index({ brand: 1 });

export const PropertyTwinModel = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);
