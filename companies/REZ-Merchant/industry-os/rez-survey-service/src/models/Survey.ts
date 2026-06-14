import mongoose, { Schema, Document } from 'mongoose';

export interface ISurvey extends Document {
  surveyId: string;
  hotelId: string;
  templateId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  channels: ('email' | 'sms' | 'whatsapp' | 'in_app')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>(
  {
    surveyId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    templateId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed'],
      default: 'draft',
      index: true,
    },
    channels: [{
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'in_app'],
    }],
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SurveySchema.index({ hotelId: 1, status: 1 });
SurveySchema.index({ templateId: 1 });

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);
