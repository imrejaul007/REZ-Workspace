/**
 * REZ Atlas v2 - Qualification Agent MongoDB Models
 * BANT/MEDDIC Lead Qualification
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// Question Schema
// ================================================
export interface IQuestion {
  id: string;
  category: 'budget' | 'authority' | 'need' | 'timeline';
  question: string;
  type: 'yes_no' | 'scale' | 'text';
  weight: number;
}

export interface IQuestionDocument extends IQuestion, Document {}

const QuestionSchema = new Schema<IQuestionDocument>({
  id: { type: String, required: true },
  category: { type: String, enum: ['budget', 'authority', 'need', 'timeline'], required: true },
  question: { type: String, required: true },
  type: { type: String, enum: ['yes_no', 'scale', 'text'], required: true },
  weight: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

// ================================================
// Qualification Result Schema
// ================================================
export interface IQualification extends Document {
  leadId: string;
  leadName: string;
  companyName: string;
  method: 'BANT' | 'MEDDIC' | 'ANUM';
  status: 'qualifying' | 'qualified' | 'disqualified' | 'needs更多信息';

  // BANT Scores
  budget: { score: number; notes: string };
  authority: { score: number; notes: string };
  need: { score: number; notes: string };
  timeline: { score: number; notes: string };

  // Overall
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  recommendation: 'hot' | 'warm' | 'cold' | 'nurture';
  nextSteps: string[];
  disqualifyReason: string | null;

  // Metadata
  questions: IQuestion[];
  answers: Record<string, string>;
  qualifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const QualificationSchema = new Schema<IQualification>({
  leadId: { type: String, required: true, index: true },
  leadName: { type: String, required: true },
  companyName: { type: String, required: true },
  method: { type: String, enum: ['BANT', 'MEDDIC', 'ANUM'], default: 'BANT' },
  status: { type: String, enum: ['qualifying', 'qualified', 'disqualified', 'needs更多信息'], default: 'qualifying', index: true },

  budget: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' }
  },
  authority: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' }
  },
  need: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' }
  },
  timeline: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' }
  },

  score: { type: Number, default: 0, min: 0, max: 100, index: true },
  grade: { type: String, enum: ['A', 'B', 'C', 'D'], index: true },
  recommendation: { type: String, enum: ['hot', 'warm', 'cold', 'nurture'], index: true },
  nextSteps: [{ type: String }],
  disqualifyReason: { type: String, default: null },

  questions: [QuestionSchema],
  answers: { type: Schema.Types.Mixed, default: {} },
  qualifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes
QualificationSchema.index({ leadId: 1, createdAt: -1 });
QualificationSchema.index({ grade: 1, score: -1 });
QualificationSchema.index({ recommendation: 1, status: 1 });

// Pre-save middleware to update timestamp
QualificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Question = mongoose.model<IQuestionDocument>('Question', QuestionSchema);
export const Qualification = mongoose.model<IQualification>('Qualification', QualificationSchema);
