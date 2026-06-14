/**
 * REZ TAM Builder - Account Universe Model
 *
 * Stores built account universes with matching companies
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface ICompany {
  id: string;
  name: string;
  domain?: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
  country?: string;
  city?: string;
  revenue?: string;
  founded?: number;
  technologies?: string[];
  score: number;
  fitBreakdown: {
    industry: number;
    size: number;
    location: number;
    technology: number;
    behavior: number;
  };
  signals?: {
    hiring?: number;
    funding?: boolean;
    growth?: string;
    news?: string[];
  };
  enrichmentStatus: 'pending' | 'enriched' | 'failed';
  enrichedAt?: Date;
}

export interface IAccountUniverse extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  icpId: mongoose.Types.ObjectId;

  name: string;
  description?: string;

  // Stats
  totalCompanies: number;
  enrichedCompanies: number;
  highFitCompanies: number; // score >= 80
  mediumFitCompanies: number; // score 50-79
  lowFitCompanies: number; // score < 50

  // Distribution
  byIndustry: Record<string, number>;
  bySize: Record<string, number>;
  byLocation: Record<string, number>;

  // Companies
  companies: ICompany[];

  // Status
  status: 'building' | 'built' | 'failed' | 'refreshing';
  buildProgress?: number; // 0-100
  errorMessage?: string;

  // Source
  source: 'icp' | 'import' | 'manual';

  // Timestamps
  builtAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const CompanySchema = new Schema<ICompany>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  domain: String,
  linkedinUrl: String,
  industry: String,
  size: String,
  location: String,
  country: String,
  city: String,
  revenue: String,
  founded: Number,
  technologies: [String],
  score: { type: Number, required: true, min: 0, max: 100 },
  fitBreakdown: {
    industry: Number,
    size: Number,
    location: Number,
    technology: Number,
    behavior: Number,
  },
  signals: {
    hiring: Number,
    funding: Boolean,
    growth: String,
    news: [String],
  },
  enrichmentStatus: {
    type: String,
    enum: ['pending', 'enriched', 'failed'],
    default: 'pending',
  },
  enrichedAt: Date,
}, { _id: false });

const AccountUniverseSchema = new Schema<IAccountUniverse>({
  tenantId: { type: String, required: true, index: true },
  icpId: { type: Schema.Types.ObjectId, ref: 'ICP', index: true },

  name: { type: String, required: true },
  description: String,

  totalCompanies: { type: Number, default: 0 },
  enrichedCompanies: { type: Number, default: 0 },
  highFitCompanies: { type: Number, default: 0 },
  mediumFitCompanies: { type: Number, default: 0 },
  lowFitCompanies: { type: Number, default: 0 },

  byIndustry: { type: Map, of: Number, default: {} },
  bySize: { type: Map, of: Number, default: {} },
  byLocation: { type: Map, of: Number, default: {} },

  companies: [CompanySchema],

  status: {
    type: String,
    enum: ['building', 'built', 'failed', 'refreshing'],
    default: 'building',
    index: true,
  },
  buildProgress: Number,
  errorMessage: String,

  source: {
    type: String,
    enum: ['icp', 'import', 'manual'],
    default: 'icp',
  },

  builtAt: Date,
  expiresAt: Date,
}, {
  timestamps: true,
});

// Compound indexes
AccountUniverseSchema.index({ tenantId: 1, icpId: 1 });
AccountUniverseSchema.index({ tenantId: 1, status: 1 });
AccountUniverseSchema.index({ tenantId: 1, builtAt: -1 });

// ============================================================================
// Model
// ============================================================================

export const AccountUniverseModel: Model<IAccountUniverse> = mongoose.model<IAccountUniverse>(
  'AccountUniverse',
  AccountUniverseSchema
);
export default AccountUniverseModel;
