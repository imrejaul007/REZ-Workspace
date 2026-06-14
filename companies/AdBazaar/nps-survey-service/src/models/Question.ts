import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  questionId: string;
  surveyId: string;
  text: string;
  type: 'nps' | 'rating' | 'text' | 'multiple_choice' | 'scale';
  scaleMin?: number;
  scaleMax?: number;
  options?: string[];
  isRequired: boolean;
  order: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionId: { type: String, required: true, unique: true, index: true },
    surveyId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['nps', 'rating', 'text', 'multiple_choice', 'scale'], required: true },
    scaleMin: { type: Number, default: 1 },
    scaleMax: { type: Number, default: 10 },
    options: [{ type: String }],
    isRequired: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

QuestionSchema.index({ surveyId: 1, order: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);