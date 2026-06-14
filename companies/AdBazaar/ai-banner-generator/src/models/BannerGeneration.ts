/**
 * BannerGeneration Model - MongoDB schema for banner generations
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  BannerGeneration,
  BannerGenerationRequest,
  BannerOutput,
  BannerMetadata,
} from '../types';

export interface BannerGenerationDocument extends Omit<BannerGeneration, 'request' | 'output' | 'metadata'>, Document {
  request: BannerGenerationRequest;
  output?: BannerOutput;
  metadata?: BannerMetadata;
}

const BannerDimensionsSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const BrandGuidelinesSchema = new Schema({
  primaryColor: { type: String, required: true },
  secondaryColor: { type: String, required: true },
  font: { type: String, required: true },
  logo: { type: String },
}, { _id: false });

const BannerVariantSchema = new Schema({
  size: { type: String, required: true },
  imageUrl: { type: String, required: true },
}, { _id: false });

const BannerOutputSchema = new Schema({
  imageUrl: { type: String },
  thumbnailUrl: { type: String },
  format: {
    type: String,
    enum: ['png', 'jpg', 'gif', 'webp'],
    default: 'png',
  },
  size: { type: Number },
  dimensions: BannerDimensionsSchema,
  variants: [BannerVariantSchema],
}, { _id: false });

const BannerMetadataSchema = new Schema({
  generationTime: { type: Number },
  model: { type: String },
  confidence: { type: Number },
}, { _id: false });

const BannerGenerationSchema = new Schema<BannerGenerationDocument>({
  generationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  advertiserId: {
    type: String,
    required: true,
    index: true,
  },
  request: {
    description: { type: String, required: true },
    dimensions: { type: BannerDimensionsSchema, required: true },
    format: {
      type: String,
      enum: ['static', 'animated', 'video'],
      default: 'static',
    },
    style: {
      type: String,
      enum: ['modern', 'classic', 'bold', 'minimal'],
    },
    colors: [{ type: String }],
    brandGuidelines: { type: BrandGuidelinesSchema },
  },
  output: { type: BannerOutputSchema },
  metadata: { type: BannerMetadataSchema },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true,
  },
  error: { type: String },
}, {
  timestamps: true,
  collection: 'banner_generations',
});

// Indexes for efficient queries
BannerGenerationSchema.index({ advertiserId: 1, createdAt: -1 });
BannerGenerationSchema.index({ status: 1, createdAt: -1 });
BannerGenerationSchema.index({ 'request.format': 1, 'request.style': 1 });

export const BannerGenerationModel = mongoose.model<BannerGenerationDocument>(
  'BannerGeneration',
  BannerGenerationSchema
);

export default BannerGenerationModel;