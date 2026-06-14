import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalization extends Document {
  personalizationId: string;
  contentId: string;
  userId: string;
  companyId: string;
  variationId?: string;
  context: {
    location?: string;
    device?: string;
    timeOfDay?: string;
    weather?: string;
    browsingHistory?: string[];
    purchaseHistory?: string[];
  };
  personalizedElements: {
    originalElement: string;
    personalizedContent: string;
    reason: string;
  }[];
  renderedAt: Date;
  createdAt: Date;
}

const PersonalizationSchema = new Schema<IPersonalization>(
  {
    personalizationId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    variationId: { type: String },
    context: {
      location: { type: String },
      device: { type: String },
      timeOfDay: { type: String },
      weather: { type: String },
      browsingHistory: [{ type: String }],
      purchaseHistory: [{ type: String }]
    },
    personalizedElements: [{
      originalElement: { type: String },
      personalizedContent: { type: String },
      reason: { type: String }
    }],
    renderedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

PersonalizationSchema.index({ contentId: 1, userId: 1 });
PersonalizationSchema.index({ userId: 1, renderedAt: -1 });

export const Personalization = mongoose.model<IPersonalization>('Personalization', PersonalizationSchema);