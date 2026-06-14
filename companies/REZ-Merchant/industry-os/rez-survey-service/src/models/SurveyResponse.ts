import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyAnswer {
  questionId: string;
  question: string;
  score?: number;
  comment?: string;
}

export interface ISurveyResponse extends Document {
  responseId: string;
  surveyId: string;
  hotelId: string;
  guestId: string;
  bookingId: string;
  templateType: 'nps' | 'csat' | 'ces';
  npsScore?: number;
  npsCategory?: string;
  csatScore?: number;
  cesScore?: number;
  overallScore?: number;
  answers: ISurveyAnswer[];
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  duration?: number;
  createdAt: Date;
}

const SurveyAnswerSchema = new Schema<ISurveyAnswer>(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    score: Number,
    comment: String,
  },
  { _id: false }
);

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    responseId: { type: String, required: true, unique: true, index: true },
    surveyId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    guestId: { type: String, required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    templateType: { type: String, enum: ['nps', 'csat', 'ces'], required: true },
    npsScore: Number,
    npsCategory: String,
    csatScore: Number,
    cesScore: Number,
    overallScore: Number,
    answers: [SurveyAnswerSchema],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    sentimentScore: { type: Number, default: 0 },
    duration: Number,
  },
  { timestamps: true }
);

SurveyResponseSchema.index({ hotelId: 1, createdAt: -1 });
SurveyResponseSchema.index({ surveyId: 1, createdAt: -1 });
SurveyResponseSchema.index({ guestId: 1 });

export const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
