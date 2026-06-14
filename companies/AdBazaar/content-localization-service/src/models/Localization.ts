import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalization extends Document {
  _id: mongoose.Types.ObjectId;
  localizationId: string;
  contentId: string;
  contentType: string;
  sourceLocale: string;
  targetLocale: string;
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'published';
  translations: ITranslation[];
  metadata: {
    translator?: string;
    reviewer?: string;
    wordCount: number;
    characterCount: number;
  };
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ITranslation extends Document {
  translationId: string;
  field: string;
  sourceText: string;
  translatedText: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  translator?: string;
  reviewer?: string;
  machineTranslated: boolean;
  editedFromMachine: boolean;
  confidence?: number;
  notes?: string;
  completedAt?: Date;
}

const TranslationSchema = new Schema({
  translationId: { type: String, required: true },
  field: { type: String, required: true },
  sourceText: { type: String, required: true },
  translatedText: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  translator: { type: String },
  reviewer: { type: String },
  machineTranslated: { type: Boolean, default: false },
  editedFromMachine: { type: Boolean, default: false },
  confidence: { type: Number },
  notes: { type: String },
  completedAt: { type: Date }
}, { _id: false });

const LocalizationSchema = new Schema<ILocalization>(
  {
    localizationId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: { type: String, required: true },
    sourceLocale: { type: String, required: true },
    targetLocale: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'review', 'approved', 'published'],
      default: 'draft',
      index: true
    },
    translations: [TranslationSchema],
    metadata: {
      translator: { type: String },
      reviewer: { type: String },
      wordCount: { type: Number, default: 0 },
      characterCount: { type: Number, default: 0 }
    },
    version: { type: Number, default: 1 },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

LocalizationSchema.index({ contentId: 1, targetLocale: 1 });
LocalizationSchema.index({ sourceLocale: 1, targetLocale: 1 });
LocalizationSchema.index({ status: 1 });

export const Localization = mongoose.model<ILocalization>('Localization', LocalizationSchema);