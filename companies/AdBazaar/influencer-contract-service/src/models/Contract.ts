import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const ContractTermsSchema = z.object({
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
    description: z.string(),
    quantity: z.number(),
    platform: z.string().optional(),
    dueDate: z.date().optional()
  })),
  compensation: z.object({
    amount: z.number(),
    currency: z.string().default('INR'),
    paymentTerms: z.string(),
    paymentSchedule: z.array(z.object({
      milestone: z.string(),
      percentage: z.number(),
      amount: z.number(),
      dueDate: z.date()
    })).optional()
  }),
  exclusivity: z.object({
    required: z.boolean().default(false),
    duration: z.number().optional(),
    competitors: z.array(z.string()).optional()
  }).optional(),
  usageRights: z.object({
    duration: z.number().optional(),
    platforms: z.array(z.string()).optional(),
    territories: z.array(z.string()).optional(),
    commercialUse: z.boolean().default(false)
  }).optional(),
  intellectualProperty: z.object({
    contentOwnership: z.enum(['brand', 'influencer', 'joint']),
    licenseRequired: z.boolean().default(false)
  }).optional()
});

export const ContractSchema = z.object({
  campaignId: z.string().optional(),
  influencerId: z.string(),
  brandId: z.string(),
  type: z.enum(['standard', 'nda', 'sponsorship', 'affiliate', 'ambassador']).default('sponsorship'),
  title: z.string(),
  content: z.string(),
  terms: ContractTermsSchema,
  status: z.enum(['draft', 'sent', 'viewed', 'negotiating', 'signed', 'active', 'expired', 'terminated']).default('draft'),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  signatures: z.array(z.object({
    signerId: z.string(),
    signerName: z.string(),
    signerEmail: z.string(),
    signerRole: z.enum(['brand', 'influencer', 'witness']),
    signedAt: z.date().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional()
  })).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.enum(['contract', 'nda', 'amendment', 'addendum']),
    url: z.string(),
    uploadedAt: z.date()
  })).optional(),
  negotiationHistory: z.array(z.object({
    changedBy: z.string(),
    changedAt: z.date(),
    changes: z.string()
  })).optional(),
  sentAt: z.date().optional(),
  signedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type IContract = z.infer<typeof ContractSchema>;
export type IContractTerms = z.infer<typeof ContractTermsSchema>;

const contractSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, index: true },
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: ['standard', 'nda', 'sponsorship', 'affiliate', 'ambassador'],
    default: 'sponsorship'
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  terms: {
    deliverables: [{
      type: {
        type: String,
        enum: ['post', 'story', 'reel', 'video', 'live', 'blog']
      },
      description: String,
      quantity: Number,
      platform: String,
      dueDate: Date
    }],
    compensation: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      paymentTerms: String,
      paymentSchedule: [{
        milestone: String,
        percentage: Number,
        amount: Number,
        dueDate: Date
      }]
    },
    exclusivity: {
      required: { type: Boolean, default: false },
      duration: Number,
      competitors: [String]
    },
    usageRights: {
      duration: Number,
      platforms: [String],
      territories: [String],
      commercialUse: { type: Boolean, default: false }
    },
    intellectualProperty: {
      contentOwnership: {
        type: String,
        enum: ['brand', 'influencer', 'joint']
      },
      licenseRequired: { type: Boolean, default: false }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'negotiating', 'signed', 'active', 'expired', 'terminated'],
    default: 'draft',
    index: true
  },
  validFrom: { type: Date },
  validUntil: { type: Date },
  signatures: [{
    signerId: String,
    signerName: String,
    signerEmail: String,
    signerRole: {
      type: String,
      enum: ['brand', 'influencer', 'witness']
    },
    signedAt: Date,
    ipAddress: String,
    userAgent: String
  }],
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'nda', 'amendment', 'addendum']
    },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  negotiationHistory: [{
    changedBy: String,
    changedAt: { type: Date, default: Date.now },
    changes: String
  }],
  sentAt: { type: Date },
  signedAt: { type: Date },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

contractSchema.index({ influencerId: 1, status: 1 });
contractSchema.index({ brandId: 1, status: 1 });
contractSchema.index({ validUntil: 1 });

export const Contract = mongoose.model<IContract & Document>('Contract', contractSchema);