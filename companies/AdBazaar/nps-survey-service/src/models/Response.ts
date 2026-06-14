import mongoose, { Document, Schema } from 'mongoose';

export interface IResponse extends Document {
  responseId: string;
  surveyId: string;
  userId: string;
  companyId: string;
  npsScore?: number;
  answers: { questionId: string; value: string | number }[];
  comments?: string;
  completedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    responseId: { type: String, required: true, unique: true, index: true },
    surveyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    npsScore: { type: Number, min: 0, max: 10 },
    answers: [{
      questionId: { type: String },
      value: { type: Schema.Types.Mixed }
    }],
    comments: { type: String },
    completedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

ResponseSchema.index({ surveyId: 1, completedAt: -1 });
ResponseSchema.index({ userId: 1, completedAt: -1 });
ResponseSchema.index({ npsScore: 1 });

export const Response = mongoose.model<IResponse>('Response', ResponseSchema);