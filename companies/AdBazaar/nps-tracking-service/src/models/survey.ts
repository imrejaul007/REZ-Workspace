import mongoose, { Schema, Document } from 'mongoose';

export interface ISurvey extends Document {
  customerId: string;
  type: 'transactional' | 'relationship' | 'churn' | 'onboarding' | 'support';
  status: 'draft' | 'sent' | 'completed' | 'expired' | 'cancelled';
  score?: number;
  questions: {
    order: number;
    text: string;
    type: 'nps' | 'rating' | 'text' | 'multiple_choice';
    required: boolean;
    options?: string[];
  }[];
  sentAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  targetSegment?: string;
  triggeredBy?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['transactional', 'relationship', 'churn', 'onboarding', 'support'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'completed', 'expired', 'cancelled'],
      required: true,
      default: 'draft',
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
    },
    questions: [{
      order: { type: Number, required: true },
      text: { type: String, required: true },
      type: { type: String, enum: ['nps', 'rating', 'text', 'multiple_choice'], default: 'nps' },
      required: { type: Boolean, default: true },
      options: [{ type: String }],
    }],
    sentAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    targetSegment: { type: String, index: true },
    triggeredBy: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'nps_surveys',
  }
);

SurveySchema.index({ customerId: 1, status: 1 });
SurveySchema.index({ type: 1, status: 1 });
SurveySchema.index({ sentAt: -1 });
SurveySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SurveyModel = mongoose.model<ISurvey>('Survey', SurveySchema);