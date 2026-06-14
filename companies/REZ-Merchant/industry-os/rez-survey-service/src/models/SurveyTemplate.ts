import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyQuestion {
  id: string;
  type: 'rating' | 'nps' | 'text' | 'multiple_choice' | 'scale';
  question: string;
  required: boolean;
  options?: Array<{ value: string | number; label: string }>;
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface ISurveyTemplate extends Document {
  templateId: string;
  hotelId: string | null;
  name: string;
  type: 'nps' | 'csat' | 'ces';
  questions: ISurveyQuestion[];
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyQuestionSchema = new Schema<ISurveyQuestion>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['rating', 'nps', 'text', 'multiple_choice', 'scale'], required: true },
    question: { type: String, required: true },
    required: { type: Boolean, default: true },
    options: [{
      value: { type: Schema.Types.Mixed, required: true },
      label: { type: String, required: true },
    }],
    scaleMin: Number,
    scaleMax: Number,
    minLabel: String,
    maxLabel: String,
  },
  { _id: false }
);

const SurveyTemplateSchema = new Schema<ISurveyTemplate>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['nps', 'csat', 'ces'], required: true },
    questions: [SurveyQuestionSchema],
    isGlobal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SurveyTemplateSchema.index({ hotelId: 1, isGlobal: 1 });
SurveyTemplateSchema.index({ type: 1 });

export const SurveyTemplate = mongoose.model<ISurveyTemplate>('SurveyTemplate', SurveyTemplateSchema);
