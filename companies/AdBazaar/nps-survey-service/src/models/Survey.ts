import mongoose, { Document, Schema } from 'mongoose';

export interface ISurvey extends Document {
  surveyId: string;
  name: string;
  description: string;
  companyId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  type: 'nps' | 'ces' | 'csat' | 'custom';
  targetAudience: { segments?: string[]; userIds?: string[]; excludeUserIds?: string[] };
  questions: string[];
  startDate?: Date;
  endDate?: Date;
  responseCount: number;
  completionRate: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>(
  {
    surveyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    companyId: { type: String, required: true, index: true },
    status: { type: String, enum: ['draft', 'active', 'paused', 'completed', 'archived'], default: 'draft' },
    type: { type: String, enum: ['nps', 'ces', 'csat', 'custom'], required: true },
    targetAudience: {
      segments: [{ type: String }],
      userIds: [{ type: String }],
      excludeUserIds: [{ type: String }]
    },
    questions: [{ type: String }],
    startDate: { type: Date },
    endDate: { type: Date },
    responseCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

SurveySchema.index({ companyId: 1, status: 1 });
SurveySchema.index({ type: 1, status: 1 });

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);