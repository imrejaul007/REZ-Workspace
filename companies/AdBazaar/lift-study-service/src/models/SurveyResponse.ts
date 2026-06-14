import mongoose, { Document, Schema } from 'mongoose';

export interface ISurveyResponse extends Document {
  _id: mongoose.Types.ObjectId;
  surveyId: mongoose.Types.ObjectId;
  studyId: mongoose.Types.ObjectId;
  respondentId: string;
  treatmentGroup: boolean;
  responses: {
    questionId: string;
    questionType: string;
    answer: any;
  }[];
  completionTime?: number;
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    income?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
    studyId: { type: Schema.Types.ObjectId, ref: 'LiftStudy', required: true, index: true },
    respondentId: { type: String, required: true },
    treatmentGroup: { type: Boolean, required: true, index: true },
    responses: [{
      questionId: { type: String, required: true },
      questionType: { type: String, required: true },
      answer: { type: Schema.Types.Mixed, required: true }
    }],
    completionTime: { type: Number },
    demographics: {
      age: Number,
      gender: String,
      location: String,
      income: String
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes
SurveyResponseSchema.index({ surveyId: 1, respondentId: 1 }, { unique: true });
SurveyResponseSchema.index({ studyId: 1, treatmentGroup: 1 });
SurveyResponseSchema.index({ respondentId: 1 });
SurveyResponseSchema.index({ createdAt: 1 });

export const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
export default SurveyResponse;