/**
 * REZ TAM Builder - ICP Model
 *
 * Ideal Customer Profile schema
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface IFirmographics {
  industries: string[];
  companySizes: string[]; // "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  locations: {
    countries: string[];
    states?: string[];
    cities?: string[];
    tiers?: ('tier1' | 'tier2' | 'tier3')[];
  };
  revenueRange?: { min: number; max: number };
  employeeCount?: { min: number; max: number };
  foundingYear?: { min: number; max: number };
  publicPrivate?: ('public' | 'private')[];
}

export interface ITechnographics {
  technologies: string[];
  tools: string[];
  hasCRM?: boolean;
  hasMarketingAutomation?: boolean;
  hasSalesAutomation?: boolean;
}

export interface IBehavioral {
  useCases: string[];
  buyingStage: ('awareness' | 'consideration' | 'decision')[];
  purchaseFrequency?: 'one-time' | 'recurring' | 'subscription';
  averageDealSize?: { min: number; max: number };
}

export interface IICP extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  name: string;
  description?: string;

  // ICP Components
  firmographics: IFirmographics;
  technographics?: ITechnographics;
  behavioral?: IBehavioral;

  // Metadata
  tags: string[];
  createdBy: string;
  updatedBy?: string;

  // Status
  isActive: boolean;
  version: number;

  // Stats
  accountCount: number;
  lastBuiltAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const ICPFirmographicsSchema = new Schema<IFirmographics>({
  industries: { type: [String], required: true, index: true },
  companySizes: { type: [String], required: true, index: true },
  locations: {
    countries: { type: [String], required: true },
    states: [String],
    cities: [String],
    tiers: [{
      type: String,
      enum: ['tier1', 'tier2', 'tier3']
    }]
  },
  revenueRange: {
    min: Number,
    max: Number
  },
  employeeCount: {
    min: Number,
    max: Number
  },
  foundingYear: {
    min: Number,
    max: Number
  },
  publicPrivate: [{
    type: String,
    enum: ['public', 'private']
  }]
}, { _id: false });

const ICPTechnographicsSchema = new Schema<ITechnographics>({
  technologies: { type: [String], index: true },
  tools: { type: [String], index: true },
  hasCRM: Boolean,
  hasMarketingAutomation: Boolean,
  hasSalesAutomation: Boolean
}, { _id: false });

const ICPBehavioralSchema = new Schema<IBehavioral>({
  useCases: { type: [String], index: true },
  buyingStage: [{
    type: String,
    enum: ['awareness', 'consideration', 'decision']
  }],
  purchaseFrequency: {
    type: String,
    enum: ['one-time', 'recurring', 'subscription']
  },
  averageDealSize: {
    min: Number,
    max: Number
  }
}, { _id: false });

const ICPSchema = new Schema<IICP>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,

  firmographics: { type: ICPFirmographicsSchema, required: true },
  technographics: ICPTechnographicsSchema,
  behavioral: ICPBehavioralSchema,

  tags: [{ type: String, index: true }],
  createdBy: { type: String, required: true },
  updatedBy: String,

  isActive: { type: Boolean, default: true, index: true },
  version: { type: Number, default: 1 },

  accountCount: { type: Number, default: 0 },
  lastBuiltAt: Date
}, {
  timestamps: true
});

// Compound indexes
ICPSchema.index({ tenantId: 1, isActive: 1 });
ICPSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// ============================================================================
// Model
// ============================================================================

export const ICPModel: Model<IICP> = mongoose.model<IICP>('ICP', ICPSchema);
export default ICPModel;
