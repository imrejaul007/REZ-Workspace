import mongoose, { Schema, Document } from 'mongoose';
import type { SDKConfigDocument, OTTStreamingConfig } from '../types/index.js';

const StreamConfigSchema = new Schema({
  hls: {
    enabled: { type: Boolean, required: true },
    maxBitrate: { type: Number, required: true },
    minBitrate: { type: Number, required: true },
  },
  dash: {
    enabled: { type: Boolean, required: true },
    manifestVersion: { type: String, required: true },
  },
}, { _id: false });

const DRMConfigSchema = new Schema({
  widevine: {
    licenseUrl: { type: String, required: true },
    serverCertificate: { type: String, required: true },
  },
  fairplay: {
    licenseUrl: { type: String, required: true },
    certificateUrl: { type: String, required: true },
  },
}, { _id: false });

const AnalyticsConfigSchema = new Schema({
  endpoint: { type: String, required: true },
  heartbeatInterval: { type: Number, required: true },
}, { _id: false });

const AdConfigSchema = new Schema({
  adServerUrl: { type: String, required: true },
  adTimeout: { type: Number, required: true },
}, { _id: false });

const SDKConfigSchema = new Schema<SDKConfigDocument>({
  appId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  config: {
    sdkVersion: { type: String, required: true },
    streamConfig: { type: StreamConfigSchema, required: true },
    drm: { type: DRMConfigSchema, required: true },
    analytics: { type: AnalyticsConfigSchema, required: true },
    adConfig: { type: AdConfigSchema, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SDKConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SDKConfig = mongoose.model<SDKConfigDocument>('SDKConfig', SDKConfigSchema);
