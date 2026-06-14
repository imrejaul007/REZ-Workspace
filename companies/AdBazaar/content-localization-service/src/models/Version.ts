import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalizationVersion extends Document {
  _id: mongoose.Types.ObjectId;
  versionId: string;
  localizationId: string;
  version: number;
  translations: Array<{
    field: string;
    translatedText: string;
  }>;
  changes?: string;
  createdBy: string;
  createdAt: Date;
}

const LocalizationVersionSchema = new Schema<ILocalizationVersion>(
  {
    versionId: { type: String, required: true, unique: true, index: true },
    localizationId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    translations: [{
      field: { type: String, required: true },
      translatedText: { type: String, required: true }
    }],
    changes: { type: String },
    createdBy: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LocalizationVersionSchema.index({ localizationId: 1, version: -1 });

export const LocalizationVersion = mongoose.model<ILocalizationVersion>('LocalizationVersion', LocalizationVersionSchema);