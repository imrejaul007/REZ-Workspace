import mongoose, { Schema, Document } from 'mongoose';
import type {
  AppPublisher as IAppPublisher,
  App,
  PublisherSettings,
  PublisherStats,
  Platform,
  PublisherStatus,
  AppStatus,
  AdFormat,
} from '../types/index.js';

export interface AppPublisherDocument extends Omit<IAppPublisher, 'apps' | 'settings' | 'stats'>, Document {
  apps: AppDocument[];
  settings: PublisherSettingsDocument;
  stats: PublisherStatsDocument;
}

export interface AppDocument extends Omit<App, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface PublisherSettingsDocument extends Omit<PublisherSettings, 'adFormats'>, Document {
  adFormats: AdFormat[];
}

export interface PublisherStatsDocument extends Omit<PublisherStats, never>, Document {}

const AppSchema = new Schema<AppDocument>(
  {
    appId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    platform: {
      type: String,
      enum: ['ios', 'android', 'react-native', 'flutter'] as Platform[],
      required: true,
    },
    bundleId: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'] as AppStatus[],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const PublisherSettingsSchema = new Schema<PublisherSettingsDocument>({
  adFormats: {
    type: [String],
    enum: ['banner', 'interstitial', 'native', 'rewarded', 'app-open'] as AdFormat[],
    default: ['banner', 'interstitial'],
  },
  minCPM: { type: Number, default: 0.5 },
  autoRefresh: { type: Boolean, default: true },
  testMode: { type: Boolean, default: false },
});

const PublisherStatsSchema = new Schema<PublisherStatsDocument>(
  {
    totalImpressions: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    todayImpressions: { type: Number, default: 0 },
    todayClicks: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 },
    yesterdayImpressions: { type: Number, default: 0 },
    yesterdayClicks: { type: Number, default: 0 },
    yesterdayEarnings: { type: Number, default: 0 },
  },
  { _id: false }
);

const AppPublisherSchema = new Schema<AppPublisherDocument>(
  {
    publisherId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    company: { type: String },
    apps: { type: [AppSchema], default: [] },
    settings: { type: PublisherSettingsSchema, default: () => ({}) },
    stats: { type: PublisherStatsSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'] as PublisherStatus[],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AppPublisherSchema.index({ email: 1 });
AppPublisherSchema.index({ 'apps.appId': 1 });
AppPublisherSchema.index({ status: 1 });
AppPublisherSchema.index({ createdAt: -1 });

export const AppPublisherModel = mongoose.model<AppPublisherDocument>(
  'AppPublisher',
  AppPublisherSchema
);