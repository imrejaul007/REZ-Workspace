import mongoose, { Document, Schema } from 'mongoose';
import { ConsentType, ComplianceFramework } from './Consent';

export interface IConsentTemplate extends Document {
  name: string;
  type: ConsentType;
  framework: ComplianceFramework;
  description: string;
  title: string;
  text: string;
  version: string;
  isRequired: boolean;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentTemplateSchema = new Schema<IConsentTemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(ConsentType),
      required: true
    },
    framework: {
      type: String,
      enum: Object.values(ComplianceFramework),
      default: ComplianceFramework.GDPR
    },
    description: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    version: {
      type: String,
      default: '1.0'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound index
ConsentTemplateSchema.index({ type: 1, framework: 1, isActive: 1 });

export const ConsentTemplate = mongoose.model<IConsentTemplate>('ConsentTemplate', ConsentTemplateSchema);