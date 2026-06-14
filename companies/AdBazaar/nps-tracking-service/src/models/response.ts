import mongoose, { Schema, Document } from 'mongoose';

export interface IResponse extends Document {
  surveyId: string;
  customerId: string;
  answers: {
    questionOrder: number;
    questionText: string;
    answerType: 'nps' | 'rating' | 'text' | 'multiple_choice';
    npsScore?: number;
    ratingValue?: number;
    textAnswer?: string;
    selectedOption?: string;
  }[];
  overallScore?: number;
  scoreCategory: 'detractor' | 'passive' | 'promoter';
  feedback?: string;
  improvementAreas: string[];
  submittedAt: Date;
  timeToComplete?: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    surveyId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    answers: [{
      questionOrder: { type: Number, required: true },
      questionText: { type: String, required: true },
      answerType: { type: String, enum: ['nps', 'rating', 'text', 'multiple_choice'], required: true },
      npsScore: { type: Number, min: 0, max: 10 },
      ratingValue: { type: Number },
      textAnswer: { type: String },
      selectedOption: { type: String },
    }],
    overallScore: { type: Number, min: 0, max: 10 },
    scoreCategory: {
      type: String,
      enum: ['detractor', 'passive', 'promoter'],
      required: true,
    },
    feedback: { type: String },
    improvementAreas: [{ type: String }],
    submittedAt: { type: Date, required: true, default: Date.now },
    timeToComplete: { type: Number },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'nps_responses',
  }
);

ResponseSchema.index({ surveyId: 1 });
ResponseSchema.index({ customerId: 1, submittedAt: -1 });
ResponseSchema.index({ scoreCategory: 1, submittedAt: -1 });
ResponseSchema.index({ overallScore: 1 });

export const ResponseModel = mongoose.model<IResponse>('NPSResponse', ResponseSchema);