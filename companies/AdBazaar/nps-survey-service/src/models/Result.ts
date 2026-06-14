import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  resultId: string;
  surveyId: string;
  companyId: string;
  totalResponses: number;
  completedResponses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
  averageRating: number;
  completionRate: number;
  responseRate: number;
  trend: { date: Date; score: number }[];
  segmentScores: { segment: string; score: number; count: number }[];
  computedAt: Date;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    resultId: { type: String, required: true, unique: true, index: true },
    surveyId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    totalResponses: { type: Number, default: 0 },
    completedResponses: { type: Number, default: 0 },
    npsScore: { type: Number, default: 0 },
    promoters: { type: Number, default: 0 },
    passives: { type: Number, default: 0 },
    detractors: { type: Number, default: 0 },
    promoterPercent: { type: Number, default: 0 },
    passivePercent: { type: Number, default: 0 },
    detractorPercent: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    trend: [{
      date: { type: Date },
      score: { type: Number }
    }],
    segmentScores: [{
      segment: { type: String },
      score: { type: Number },
      count: { type: Number }
    }],
    computedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ResultSchema.index({ surveyId: 1, computedAt: -1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);