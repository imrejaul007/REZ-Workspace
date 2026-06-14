/**
 * REZ Atlas v2 - Pipeline Service MongoDB Models
 * Visual Pipeline Management
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// PipelineStage Schema
// ================================================
export interface IPipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

// ================================================
// Pipeline Schema
// ================================================
export interface IPipeline extends Document {
  name: string;
  stages: IPipelineStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineStageSchema = new Schema<IPipelineStage>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  probability: { type: Number, required: true, min: 0, max: 100 },
  color: { type: String, required: true }
}, { _id: false });

const PipelineSchema = new Schema<IPipeline>({
  name: { type: String, required: true },
  stages: { type: [PipelineStageSchema], default: [] },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

PipelineSchema.index({ isDefault: -1 });

export const Pipeline = mongoose.model<IPipeline>('Pipeline', PipelineSchema);

// ================================================
// PipelineDeal Schema
// ================================================
export interface IPipelineDeal extends Document {
  opportunityId: string;
  pipelineId: string;
  stageId: string;
  value: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineDealSchema = new Schema<IPipelineDeal>({
  opportunityId: { type: String, required: true, index: true },
  pipelineId: { type: String, required: true, index: true },
  stageId: { type: String, required: true, index: true },
  value: { type: Number, default: 0 },
  position: { type: Number, default: 0 }
}, { timestamps: true });

PipelineDealSchema.index({ pipelineId: 1, stageId: 1 });
PipelineDealSchema.index({ opportunityId: 1, pipelineId: 1 });

export const PipelineDeal = mongoose.model<IPipelineDeal>('PipelineDeal', PipelineDealSchema);