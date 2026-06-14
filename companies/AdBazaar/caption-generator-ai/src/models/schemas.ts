/**
 * Data Models for Caption Generator AI Service
 */

import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// ==================== ZOD SCHEMAS ====================

// Generation Request Schema
export const GenerationRequestSchema = z.object({
  content: z.string().min(1).max(5000),
  brandVoice: z.string().optional(),
  style: z.enum(['casual', 'professional', 'witty', 'inspirational', 'educational']).optional(),
  tone: z.enum(['friendly', 'bold', 'luxury', 'playful', 'professional']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  includeHashtags: z.boolean().optional().default(true),
  includeCTA: z.boolean().optional().default(true),
  platforms: z.array(z.string()).optional().default(['instagram']),
  variations: z.number().int().min(1).max(5).optional().default(1),
});

export type IGenerationRequest = z.infer<typeof GenerationRequestSchema>;

// Generated Caption Schema
export interface IGeneratedCaption {
  caption: string;
  hashtags: string[];
  suggestedCTA: string;
  tone: string;
  characterCount: number;
  platformOptimized: { [platform: string]: string };
}

// ==================== MONGOOSE MODELS ====================

// Generation Request Model
export interface IGenerationRequestDoc extends Document {
  requestId: string;
  content: string;
  brandVoice?: string;
  style?: string;
  tone?: string;
  length?: string;
  includeHashtags: boolean;
  includeCTA: boolean;
  platforms: string[];
  variations: number;
  generatedCaptions: IGeneratedCaption[];
  userId?: string;
  createdAt: Date;
}

const generationRequestSchema = new Schema<IGenerationRequestDoc>({
  requestId: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  brandVoice: { type: String },
  style: { type: String },
  tone: { type: String },
  length: { type: String },
  includeHashtags: { type: Boolean, default: true },
  includeCTA: { type: Boolean, default: true },
  platforms: { type: [String], default: ['instagram'] },
  variations: { type: Number, default: 1 },
  generatedCaptions: [{
    caption: String,
    hashtags: [String],
    suggestedCTA: String,
    tone: String,
    characterCount: Number,
    platformOptimized: Map,
  }],
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const GenerationRequest = mongoose.model<IGenerationRequestDoc>('GenerationRequest', generationRequestSchema);

// Caption Template Model
export interface ICaptionTemplateDoc extends Document {
  id: string;
  name: string;
  style: string;
  template: string;
  variables: string[];
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const captionTemplateSchema = new Schema<ICaptionTemplateDoc>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  style: { type: String, required: true },
  template: { type: String, required: true },
  variables: { type: [String], default: [] },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

captionTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const CaptionTemplate = mongoose.model<ICaptionTemplateDoc>('CaptionTemplate', captionTemplateSchema);

// Brand Voice Model
export interface IBrandVoiceDoc extends Document {
  brandId: string;
  name: string;
  style?: string;
  tone?: string;
  commonPhrases: string[];
  avoidPhrases: string[];
  personality: string[];
  sampleCaptions: string[];
  captionHistory: {
    caption: string;
    style: string;
    engagement?: number;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const brandVoiceSchema = new Schema<IBrandVoiceDoc>({
  brandId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  style: { type: String },
  tone: { type: String },
  commonPhrases: { type: [String], default: [] },
  avoidPhrases: { type: [String], default: [] },
  personality: { type: [String], default: [] },
  sampleCaptions: { type: [String], default: [] },
  captionHistory: [{
    caption: String,
    style: String,
    engagement: Number,
    createdAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

brandVoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BrandVoice = mongoose.model<IBrandVoiceDoc>('BrandVoice', brandVoiceSchema);

// Caption History Model (for analytics)
export interface ICaptionHistoryDoc extends Document {
  historyId: string;
  caption: string;
  hashtags: string[];
  style: string;
  tone: string;
  characterCount: number;
  platform: string;
  userId?: string;
  brandId?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  usedAt: Date;
  createdAt: Date;
}

const captionHistorySchema = new Schema<ICaptionHistoryDoc>({
  historyId: { type: String, required: true, unique: true },
  caption: { type: String, required: true },
  hashtags: { type: [String], default: [] },
  style: { type: String },
  tone: { type: String },
  characterCount: { type: Number },
  platform: { type: String, default: 'instagram' },
  userId: { type: String },
  brandId: { type: String },
  engagement: {
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
  },
  usedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export const CaptionHistory = mongoose.model<ICaptionHistoryDoc>('CaptionHistory', captionHistorySchema);

// Translation Cache Model
export interface ITranslationCacheDoc extends Document {
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  preservedEmojis: boolean;
  createdAt: Date;
}

const translationCacheSchema = new Schema<ITranslationCacheDoc>({
  sourceText: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  translatedText: { type: String, required: true },
  preservedEmojis: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for cache lookup
translationCacheSchema.index({ sourceText: 1, targetLanguage: 1, preservedEmojis: 1 }, { unique: true });

export const TranslationCache = mongoose.model<ITranslationCacheDoc>('TranslationCache', translationCacheSchema);

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
];

// Platform Character Limits
export const PLATFORM_LIMITS: { [platform: string]: { maxChars: number; hashtagLimit: number } } = {
  instagram: { maxChars: 2200, hashtagLimit: 30 },
  twitter: { maxChars: 280, hashtagLimit: 5 },
  facebook: { maxChars: 63206, hashtagLimit: 10 },
  linkedin: { maxChars: 3000, hashtagLimit: 5 },
  tiktok: { maxChars: 2200, hashtagLimit: 10 },
  pinterest: { maxChars: 500, hashtagLimit: 20 },
  youtube: { maxChars: 5000, hashtagLimit: 15 },
  snapchat: { maxChars: 250, hashtagLimit: 5 },
};
