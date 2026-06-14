import mongoose, { Schema, Document, Model } from 'mongoose';

// Define stage type locally to avoid collision
interface StageConfig {
  id: string;
  name: string;
  probability: number;
  order: number;
}

export interface PipelineDocument extends Document {
  tenantId: string;
  name: string;
  description?: string;
  stages: StageConfig[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stageSchema = new Schema<StageConfig>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    probability: { type: Number, required: true, min: 0, max: 100 },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const pipelineSchema = new Schema<PipelineDocument>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String },
    stages: {
      type: [stageSchema],
      required: true,
      validate: {
        validator: function (stages: StageConfig[]) {
          return stages.length >= 2;
        },
        message: 'Pipeline must have at least 2 stages',
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
pipelineSchema.index({ tenantId: 1, isDefault: 1 });
pipelineSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Ensure only one default pipeline per tenant
pipelineSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Pipeline').updateMany(
      { tenantId: this.tenantId, isDefault: true, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const Pipeline: Model<PipelineDocument> = mongoose.model<PipelineDocument>('Pipeline', pipelineSchema);

// Default pipeline stages
export const DEFAULT_PIPELINE_STAGES: StageConfig[] = [
  { id: 'lead', name: 'Lead', probability: 10, order: 1 },
  { id: 'qualified', name: 'Qualified', probability: 25, order: 2 },
  { id: 'proposal', name: 'Proposal', probability: 50, order: 3 },
  { id: 'negotiation', name: 'Negotiation', probability: 75, order: 4 },
  { id: 'won', name: 'Won', probability: 100, order: 5 },
  { id: 'lost', name: 'Lost', probability: 0, order: 6 },
];
