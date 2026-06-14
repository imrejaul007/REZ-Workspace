import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  qbrId: string;
  name: string;
  type: 'executive_summary' | 'usage_metrics' | 'health_score' | 'roi_analysis' | 'challenges' | 'action_items' | 'roadmap' | 'custom';
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  content?: {
    summary?: string;
    metrics?: {
      name: string;
      value: number | string;
      change?: number;
      trend?: 'up' | 'down' | 'stable';
    }[];
    insights?: string[];
    risks?: string[];
    opportunities?: string[];
  };
  generatedAt?: Date;
  generatedBy?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    qbrId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['executive_summary', 'usage_metrics', 'health_score', 'roi_analysis', 'challenges', 'action_items', 'roadmap', 'custom'],
      required: true,
    },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      required: true,
      default: 'pending',
    },
    content: {
      summary: { type: String },
      metrics: [{
        name: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        change: { type: Number },
        trend: { type: String, enum: ['up', 'down', 'stable'] },
      }],
      insights: [{ type: String }],
      risks: [{ type: String }],
      opportunities: [{ type: String }],
    },
    generatedAt: { type: Date },
    generatedBy: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'qbr_sections',
  }
);

SectionSchema.index({ qbrId: 1, order: 1 });
SectionSchema.index({ qbrId: 1, status: 1 });

export const SectionModel = mongoose.model<ISection>('QBRSection', SectionSchema);