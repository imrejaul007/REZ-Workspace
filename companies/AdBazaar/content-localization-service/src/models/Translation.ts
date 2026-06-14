import mongoose, { Document, Schema } from 'mongoose';

export interface ITranslation extends Document {
  _id: mongoose.Types.ObjectId;
  translationId: string;
  localizationId: string;
  field: string;
  sourceText: string;
  translatedText: string;
  sourceLocale: string;
  targetLocale: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  translator?: string;
  reviewer?: string;
  machineTranslated: boolean;
  editedFromMachine: boolean;
  confidence?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSchema = new Schema<ITranslation>(
  {
    translationId: { type: String, required: true, unique: true, index: true },
    localizationId: { type: String, required: true, index: true },
    field: { type: String, required: true },
    sourceText: { type: String, required: true },
    translatedText: { type: String, required: true },
    sourceLocale: { type: String, required: true },
    targetLocale: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
      index: true
    },
    translator: { type: String },
    reviewer: { type: String },
    machineTranslated: { type: Boolean, default: false },
    editedFromMachine: { type: Boolean, default: false },
    confidence: { type: Number },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    notes: { type: String },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

TranslationSchema.index({ localizationId: 1, field: 1 });
TranslationSchema.index({ translator: 1, status: 1 });
TranslationSchema.index({ targetLocale: 1, status: 1 });

export const Translation = mongoose.model<ITranslation>('Translation', TranslationSchema);