import mongoose, { Document, Schema } from 'mongoose';

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StepType = 'email' | 'notification' | 'sms' | 'delay' | 'condition' | 'webhook' | 'task';

export interface IStep {
  order: number;
  type: StepType;
  name: string;
  config: {
    templateId?: string;
    content?: string;
    subject?: string;
    channel?: string;
    delay?: number; // Delay in milliseconds
    condition?: {
      field: string;
      operator: string;
      value: unknown;
    };
    webhookUrl?: string;
    webhookMethod?: string;
    webhookHeaders?: Record<string, string>;
  };
  isActive: boolean;
}

export interface ISequence extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  status: SequenceStatus;
  steps: IStep[];
  entryCriteria?: {
    field: string;
    operator: string;
    value: unknown;
  }[];
  exitCriteria?: {
    field: string;
    operator: string;
    value: unknown;
  }[];
  settings: {
    enrollmentCap?: number;
    allowReEnrollment: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
    goalTracking: boolean;
  };
  stats: {
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    droppedEnrollments: number;
    conversionRate?: number;
  };
  isTemplate: boolean;
  templateId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SequenceSchema = new Schema<ISequence>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: String,
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
      index: true
    },
    steps: [
      {
        order: { type: Number, required: true },
        type: {
          type: String,
          enum: ['email', 'notification', 'sms', 'delay', 'condition', 'webhook', 'task'],
          required: true
        },
        name: { type: String, required: true },
        config: { type: Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true }
      }
    ],
    entryCriteria: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true }
      }
    ],
    exitCriteria: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true }
      }
    ],
    settings: {
      enrollmentCap: Number,
      allowReEnrollment: { type: Boolean, default: true },
      trackOpens: { type: Boolean, default: true },
      trackClicks: { type: Boolean, default: true },
      goalTracking: { type: Boolean, default: false }
    },
    stats: {
      totalEnrollments: { type: Number, default: 0 },
      activeEnrollments: { type: Number, default: 0 },
      completedEnrollments: { type: Number, default: 0 },
      droppedEnrollments: { type: Number, default: 0 },
      conversionRate: Number
    },
    isTemplate: { type: Boolean, default: false },
    templateId: { type: Schema.Types.ObjectId, ref: 'Sequence' }
  },
  { timestamps: true }
);

SequenceSchema.index({ userId: 1, status: 1 });

export const Sequence = mongoose.model<ISequence>('Sequence', SequenceSchema);