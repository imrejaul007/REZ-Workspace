import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITargeting {
  locations?: string[];
  demographics?: {
    ageRanges?: string[];
    gender?: ('male' | 'female' | 'other')[];
    incomeBrackets?: string[];
  };
  interests?: string[];
  behaviors?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet' | 'all')[];
  placements?: string[];
}

export interface ICreatives {
  adFormats: string[];
  messaging: string;
  ctaButtons: string[];
}

export interface IFrequency {
  capping?: number;
  pacing: 'fast' | 'uniform' | 'accelerated';
}

export interface ITemplateStructure {
  objectives: string[];
  keyMetrics: string[];
  budgetAllocation: Record<string, number>;
  biddingStrategy: 'cpc' | 'cpm' | 'cpv' | 'cpa' | 'auto';
  targeting?: ITargeting;
  creatives?: ICreatives;
  frequency?: IFrequency;
}

export interface ICampaignTemplate extends Document {
  agencyId: Types.ObjectId;
  name: string;
  description?: string;
  type: 'awareness' | 'consideration' | 'conversion' | 'retargeting' | 'brand';
  structure: ITemplateStructure;
  category?: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignTemplateSchema = new Schema<ICampaignTemplate>(
  {
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['awareness', 'consideration', 'conversion', 'retargeting', 'brand'],
      required: true
    },
    structure: {
      objectives: [{ type: String }],
      keyMetrics: [{ type: String }],
      budgetAllocation: { type: Map, of: Number },
      biddingStrategy: {
        type: String,
        enum: ['cpc', 'cpm', 'cpv', 'cpa', 'auto'],
        default: 'auto'
      },
      targeting: {
        locations: [{ type: String }],
        demographics: {
          ageRanges: [{ type: String }],
          gender: [{ type: String, enum: ['male', 'female', 'other'] }],
          incomeBrackets: [{ type: String }]
        },
        interests: [{ type: String }],
        behaviors: [{ type: String }],
        devices: [{ type: String, enum: ['desktop', 'mobile', 'tablet', 'all'] }],
        placements: [{ type: String }]
      },
      creatives: {
        adFormats: [{ type: String }],
        messaging: { type: String },
        ctaButtons: [{ type: String }]
      },
      frequency: {
        capping: { type: Number },
        pacing: {
          type: String,
          enum: ['fast', 'uniform', 'accelerated'],
          default: 'uniform'
        }
      }
    },
    category: { type: String },
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
    createdBy: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes
CampaignTemplateSchema.index({ agencyId: 1 });
CampaignTemplateSchema.index({ type: 1 });
CampaignTemplateSchema.index({ category: 1 });
CampaignTemplateSchema.index({ isPublic: 1 });
CampaignTemplateSchema.index({ usageCount: -1 });
CampaignTemplateSchema.index({ tags: 1 });

export const CampaignTemplate = mongoose.model<ICampaignTemplate>('CampaignTemplate', CampaignTemplateSchema);