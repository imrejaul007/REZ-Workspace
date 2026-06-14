import mongoose, { Document, Schema } from 'mongoose';

export interface ISurveyQuestion {
  questionId: string;
  questionType: 'single_choice' | 'multiple_choice' | 'scale' | 'open_ended' | 'ranking';
  question: string;
  options?: { value: string; label: string }[];
  scaleMin?: number;
  scaleMax?: number;
  required?: boolean;
  category?: 'awareness' | 'perception' | 'intent' | 'satisfaction' | 'demographic' | 'behavior' | 'attitude';
}

export interface ISurvey extends Document {
  _id: mongoose.Types.ObjectId;
  studyId: mongoose.Types.ObjectId;
  surveyType: 'brand_lift' | 'conversion_lift' | 'custom';
  methodology: 'online_panel' | 'in_app' | 'email' | 'sms' | 'phone';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  questions: ISurveyQuestion[];
  targetSampleSize: number;
  actualSampleSize: number;
  incentiveAmount?: number;
  startDate: Date;
  endDate: Date;
  targeting?: {
    demographics?: Record<string, any>;
    behaviors?: string[];
    location?: string[];
  };
  responseRate?: number;
  completionRate?: number;
  averageCompletionTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyQuestionSchema = new Schema<ISurveyQuestion>(
  {
    questionId: { type: String, required: true },
    questionType: {
      type: String,
      required: true,
      enum: ['single_choice', 'multiple_choice', 'scale', 'open_ended', 'ranking']
    },
    question: { type: String, required: true },
    options: [{
      value: String,
      label: String
    }],
    scaleMin: Number,
    scaleMax: Number,
    required: { type: Boolean, default: true },
    category: {
      type: String,
      enum: ['awareness', 'perception', 'intent', 'satisfaction', 'demographic', 'behavior', 'attitude']
    }
  },
  { _id: false }
);

const SurveySchema = new Schema<ISurvey>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'LiftStudy', required: true, index: true },
    surveyType: {
      type: String,
      required: true,
      enum: ['brand_lift', 'conversion_lift', 'custom'],
      index: true
    },
    methodology: {
      type: String,
      required: true,
      enum: ['online_panel', 'in_app', 'email', 'sms', 'phone']
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true
    },
    questions: [SurveyQuestionSchema],
    targetSampleSize: { type: Number, required: true },
    actualSampleSize: { type: Number, default: 0 },
    incentiveAmount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targeting: {
      demographics: { type: Schema.Types.Mixed },
      behaviors: [String],
      location: [String]
    },
    responseRate: Number,
    completionRate: Number,
    averageCompletionTime: Number
  },
  {
    timestamps: true
  }
);

// Indexes
SurveySchema.index({ studyId: 1, surveyType: 1 });
SurveySchema.index({ status: 1, startDate: 1, endDate: 1 });

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);
export default Survey;