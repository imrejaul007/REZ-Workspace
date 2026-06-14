import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDeal, Activity } from '../types/index.js';

export interface DealDocument extends Omit<IDeal, '_id'>, Document {}

const activitySchema = new Schema<Activity>(
  {
    activityId: { type: String, required: true },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'task', 'stage_change'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    performedBy: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const dealSchema = new Schema<DealDocument>(
  {
    dealId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'lead',
      index: true,
    },
    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    expectedClose: {
      type: Date,
      required: true,
    },
    actualClose: { type: Date },
    products: [String],
    owner: {
      type: String,
      required: true,
      index: true,
    },
    activities: [activitySchema],
    lossReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
dealSchema.index({ tenantId: 1, stage: 1 });
dealSchema.index({ tenantId: 1, owner: 1 });
dealSchema.index({ tenantId: 1, clientId: 1 });
dealSchema.index({ tenantId: 1, expectedClose: 1 });
dealSchema.index({ tenantId: 1, value: 1 });

// Stage probability mapping
const stageProbabilities: Record<string, number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};

// Update probability when stage changes
dealSchema.pre('save', async function (next) {
  if (this.isNew && !this.dealId) {
    const count = await mongoose.model('Deal').countDocuments({ tenantId: this.tenantId });
    this.dealId = `DEAL-${String(count + 1).padStart(5, '0')}`;
  }

  // Update probability based on stage
  if (this.isModified('stage')) {
    this.probability = stageProbabilities[this.stage] || this.probability;
    if (this.stage === 'won' || this.stage === 'lost') {
      this.actualClose = new Date();
    }
  }
  next();
});

export const Deal: Model<DealDocument> = mongoose.model<DealDocument>('Deal', dealSchema);
