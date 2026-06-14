import mongoose, { Document, Schema } from 'mongoose';

export interface ILocale extends Document {
  _id: mongoose.Types.ObjectId;
  localeId: string;
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  isDefault: boolean;
  region?: string;
  variants: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LocaleSchema = new Schema<ILocale>(
  {
    localeId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    nativeName: { type: String, required: true },
    direction: {
      type: String,
      enum: ['ltr', 'rtl'],
      default: 'ltr'
    },
    isActive: { type: Boolean, default: true, index: true },
    isDefault: { type: Boolean, default: false },
    region: { type: String },
    variants: [String]
  },
  { timestamps: true }
);

export const Locale = mongoose.model<ILocale>('Locale', LocaleSchema);