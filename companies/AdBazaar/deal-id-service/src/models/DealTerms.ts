import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema
export const DealTermsSchema = z.object({
  dealId: z.string().min(1),
  impressions: z.object({
    guaranteed: z.number().int().min(0).default(0),
    nonGuaranteed: z.number().int().min(0).default(0),
    total: z.number().int().min(0).default(0),
  }),
  pacing: z.object({
    daily: z.number().min(0).optional(),
    weekly: z.number().min(0).optional(),
    monthly: z.number().min(0).optional(),
    strategy: z.enum(['asap', 'even', 'frontload', 'backload']).default('even'),
    pacingRatio: z.number().min(0).max(1).optional(),
  }),
  targeting: z.object({
    geo: z.array(z.string()).optional(),
    device: z.array(z.string()).optional(),
    browser: z.array(z.string()).optional(),
    os: z.array(z.string()).optional(),
    ageRange: z.object({
      min: z.number().min(0),
      max: z.number().max(120),
    }).optional(),
    interests: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    inventory: z.array(z.string()).optional(),
    pagePosition: z.enum(['any', 'above', 'below']).optional(),
  }),
  pricing: z.object({
    basePrice: z.number().min(0),
    currency: z.string().default('USD'),
    model: z.enum(['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate']).default('cpm'),
    floorPrice: z.number().min(0).optional(),
    ceilingPrice: z.number().min(0).optional(),
    discounts: z.array(z.object({
      name: z.string(),
      type: z.enum(['percentage', 'fixed']),
      value: z.number(),
      conditions: z.string().optional(),
    })).optional(),
  }),
  creativeRequirements: z.object({
    formats: z.array(z.enum(['banner', 'video', 'native', 'richmedia'])),
    sizes: z.array(z.string()),
    mimeTypes: z.array(z.string()),
    maxFileSize: z.number().optional(),
    duration: z.number().optional(),
  }),
  deliveryRequirements: z.object({
    viewabilityThreshold: z.number().min(0).max(100).optional(),
    brandSafety: z.boolean().default(true),
    fraudProtection: z.boolean().default(true),
    verification: z.array(z.string()).optional(),
  }),
  restrictions: z.object({
    excludedCategories: z.array(z.string()).optional(),
    excludedAdvertisers: z.array(z.string()).optional(),
    sensitiveCategories: z.array(z.string()).optional(),
    brandExclusions: z.array(z.string()).optional(),
  }),
  attribution: z.object({
    window: z.number().min(1).default(30),
    model: z.enum(['last_click', 'last_touch', 'linear', 'time_decay', 'position']).default('last_click'),
  }),
  measurement: z.object({
    thirdPartyUrls: z.array(z.string()).optional(),
    viewabilityVendor: z.string().optional(),
    verificationVendors: z.array(z.string()).optional(),
    clickTracking: z.boolean().default(true),
    impressionTracking: z.boolean().default(true),
  }),
  metadata: z.record(z.any()).optional(),
});

export type IDealTerms = z.infer<typeof DealTermsSchema>;

export interface IDealTermsDocument extends IDealTerms, Document {
  createdAt: Date;
  updatedAt: Date;
}

const dealTermsMongooseSchema = new Schema<IDealTermsDocument>(
  {
    dealId: { type: String, required: true, unique: true, index: true },
    impressions: {
      guaranteed: { type: Number, default: 0, min: 0 },
      nonGuaranteed: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    pacing: {
      daily: Number,
      weekly: Number,
      monthly: Number,
      strategy: { type: String, enum: ['asap', 'even', 'frontload', 'backload'], default: 'even' },
      pacingRatio: Number,
    },
    targeting: {
      geo: [String],
      device: [String],
      browser: [String],
      os: [String],
      ageRange: {
        min: Number,
        max: Number,
      },
      interests: [String],
      keywords: [String],
      inventory: [String],
      pagePosition: { type: String, enum: ['any', 'above', 'below'] },
    },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD' },
      model: { type: String, enum: ['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate'], default: 'cpm' },
      floorPrice: Number,
      ceilingPrice: Number,
      discounts: [{
        name: String,
        type: { type: String, enum: ['percentage', 'fixed'] },
        value: Number,
        conditions: String,
      }],
    },
    creativeRequirements: {
      formats: [{
        type: String,
        enum: ['banner', 'video', 'native', 'richmedia'],
      }],
      sizes: [String],
      mimeTypes: [String],
      maxFileSize: Number,
      duration: Number,
    },
    deliveryRequirements: {
      viewabilityThreshold: Number,
      brandSafety: { type: Boolean, default: true },
      fraudProtection: { type: Boolean, default: true },
      verification: [String],
    },
    restrictions: {
      excludedCategories: [String],
      excludedAdvertisers: [String],
      sensitiveCategories: [String],
      brandExclusions: [String],
    },
    attribution: {
      window: { type: Number, default: 30, min: 1 },
      model: {
        type: String,
        enum: ['last_click', 'last_touch', 'linear', 'time_decay', 'position'],
        default: 'last_click',
      },
    },
    measurement: {
      thirdPartyUrls: [String],
      viewabilityVendor: String,
      verificationVendors: [String],
      clickTracking: { type: Boolean, default: true },
      impressionTracking: { type: Boolean, default: true },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const DealTerms = mongoose.model<IDealTermsDocument>('DealTerms', dealTermsMongooseSchema);