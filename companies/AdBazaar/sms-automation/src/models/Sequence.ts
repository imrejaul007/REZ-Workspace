import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStep extends Document {
  sequenceId: Types.ObjectId;
  order: number;
  name: string;
  smsContent: string;
  delayDays: number;
  delayHours?: number;
  conditions?: {
    action?: 'delivered' | 'replied' | 'failed';
    waitDays?: number;
    skipIf?: string[];
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISequence extends Document {
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  trigger: {
    type: 'campaign_signup' | 'trial_start' | 'purchase' | 'manual' | 'segment';
    conditions?: Record<string, unknown>;
  };
  steps: Types.ObjectId[];
  ownerId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  stats?: {
    enrolled: number;
    completed: number;
    optedOut: number;
    failed: number;
    averageResponseRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StepSchema = new Schema<IStep>(
  {
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    order: { type: Number, required: true },
    name: { type: String, required: true },
    smsContent: { type: String, required: true },
    delayDays: { type: Number, default: 0 },
    delayHours: { type: Number, default: 0 },
    conditions: {
      action: { type: String, enum: ['delivered', 'replied', 'failed'] },
      waitDays: Number,
      skipIf: [String],
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

StepSchema.index({ sequenceId: 1, order: 1 });

const SequenceSchema = new Schema<ISequence>(
  {
    name: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
      index: true,
    },
    trigger: {
      type: { type: String, enum: ['campaign_signup', 'trial_start', 'purchase', 'manual', 'segment'], required: true },
      conditions: { type: Schema.Types.Mixed },
    },
    steps: [{ type: Schema.Types.ObjectId, ref: 'Step' }],
    ownerId: { type: String, required: true, index: true },
    tags: [String],
    metadata: { type: Schema.Types.Mixed },
    stats: {
      enrolled: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      optedOut: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      averageResponseRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

SequenceSchema.index({ ownerId: 1, status: 1 });
SequenceSchema.index({ tags: 1 });

export const Sequence = mongoose.model<ISequence>('Sequence', SequenceSchema);
export const Step = mongoose.model<IStep>('Step', StepSchema);