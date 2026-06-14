import mongoose, { Schema, Document } from 'mongoose';
import { Publisher } from '../types/index.js';

export interface IPublisher extends Omit<Publisher, 'createdAt' | 'updatedAt'>, Document {}

const ContactSchema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true },
  phone: { type: String },
}, { _id: false });

const PublisherSettingsSchema = new Schema({
  adFormats: [{
    type: String,
    enum: ['banner', 'rectangle', 'native', 'video', 'interstitial'],
  }],
  minCPM: { type: Number, default: 1.0, min: 0 },
  headerBidding: { type: Boolean, default: false },
}, { _id: false });

const PublisherStatsSchema = new Schema({
  totalImpressions: { type: Number, default: 0, min: 0 },
  totalClicks: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  pendingPayout: { type: Number, default: 0, min: 0 },
}, { _id: false });

const PublisherSchema = new Schema<IPublisher>({
  publisherId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  website: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'news', 'blog', 'entertainment', 'ecommerce', 'social',
      'gaming', 'education', 'tech', 'lifestyle', 'finance',
      'sports', 'travel', 'food', 'health', 'other'
    ],
  },
  contact: { type: ContactSchema, required: true },
  settings: { type: PublisherSettingsSchema, default: () => ({}) },
  stats: { type: PublisherStatsSchema, default: () => ({}) },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

PublisherSchema.index({ status: 1 });
PublisherSchema.index({ 'stats.totalEarnings': -1 });
PublisherSchema.index({ website: 1 });

export const PublisherModel = mongoose.model<IPublisher>('Publisher', PublisherSchema);