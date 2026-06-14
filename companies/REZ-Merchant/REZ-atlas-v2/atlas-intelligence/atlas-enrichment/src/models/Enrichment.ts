/**
 * REZ Atlas v2 - Enrichment Service MongoDB Models
 * Data Enrichment from Multiple Sources
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// DataSource Schema
// ================================================
export interface IDataSource extends Document {
  name: string;
  type: 'professional' | 'email' | 'contact' | 'company' | 'technology' | 'funding' | 'general';
  coverage: number;
  active: boolean;
}

const DataSourceSchema = new Schema<IDataSource>({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['professional', 'email', 'contact', 'company', 'technology', 'funding', 'general'], required: true },
  coverage: { type: Number, default: 0.5 },
  active: { type: Boolean, default: true }
});

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);

// ================================================
// EnrichmentJob Schema
// ================================================
export interface IEnrichmentJob extends Document {
  targetType: 'company' | 'contact' | 'merchant';
  targetId: string;
  targetData: Record<string, any>;
  status: 'pending' | 'enriching' | 'completed' | 'failed';
  sources: string[];
  enrichedFields: Record<string, any>;
  confidence: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const EnrichmentJobSchema = new Schema<IEnrichmentJob>({
  targetType: { type: String, enum: ['company', 'contact', 'merchant'], required: true, index: true },
  targetId: { type: String, required: true, index: true },
  targetData: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'enriching', 'completed', 'failed'], default: 'pending', index: true },
  sources: [{ type: String }],
  enrichedFields: { type: Schema.Types.Mixed, default: {} },
  confidence: { type: Number, default: 0 },
  error: { type: String, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

EnrichmentJobSchema.index({ targetType: 1, status: 1 });
EnrichmentJobSchema.index({ createdAt: -1, status: 1 });

export const EnrichmentJob = mongoose.model<IEnrichmentJob>('EnrichmentJob', EnrichmentJobSchema);

// ================================================
// EnrichmentCache Schema
// ================================================
export interface IEnrichmentCache extends Document {
  key: string;
  data: Record<string, any>;
  source: string;
  confidence: number;
  expiresAt: Date;
  createdAt: Date;
}

const EnrichmentCacheSchema = new Schema<IEnrichmentCache>({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  source: { type: String, required: true },
  confidence: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

export const EnrichmentCache = mongoose.model<IEnrichmentCache>('EnrichmentCache', EnrichmentCacheSchema);