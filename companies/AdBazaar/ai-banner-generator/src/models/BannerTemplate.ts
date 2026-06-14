/**
 * BannerTemplate Model - MongoDB schema for banner templates
 */

import mongoose, { Schema, Document } from 'mongoose';
import { BannerTemplate, TemplateLayout, TemplatePerformance } from '../types';

export interface BannerTemplateDocument extends Omit<BannerTemplate, 'layout' | 'performance'>, Document {
  layout: TemplateLayout;
  performance: TemplatePerformance;
}

const LayoutElementSchema = new Schema({
  type: {
    type: String,
    enum: ['text', 'image', 'logo', 'cta'],
    required: true,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  style: { type: Schema.Types.Mixed },
}, { _id: false });

const TemplateLayoutSchema = new Schema({
  elements: [LayoutElementSchema],
}, { _id: false });

const TemplatePerformanceSchema = new Schema({
  avgCTR: { type: Number, default: 0 },
  avgConversion: { type: Number, default: 0 },
}, { _id: false });

const BannerDimensionsSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const BannerTemplateSchema = new Schema<BannerTemplateDocument>({
  templateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 200,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  dimensions: { type: BannerDimensionsSchema, required: true },
  layout: { type: TemplateLayoutSchema, required: true },
  usageCount: {
    type: Number,
    default: 0,
  },
  performance: {
    type: TemplatePerformanceSchema,
    default: () => ({ avgCTR: 0, avgConversion: 0 }),
  },
  createdBy: {
    type: String,
    required: true,
    index: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'banner_templates',
});

// Indexes
BannerTemplateSchema.index({ category: 1, isPublic: 1 });
BannerTemplateSchema.index({ createdBy: 1, createdAt: -1 });
BannerTemplateSchema.index({ 'performance.avgCTR': -1 });

export const BannerTemplateModel = mongoose.model<BannerTemplateDocument>(
  'BannerTemplate',
  BannerTemplateSchema
);

export default BannerTemplateModel;