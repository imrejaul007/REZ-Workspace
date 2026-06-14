import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  contentId: string;
  name: string;
  type: 'banner' | 'ad' | 'email' | 'notification' | 'landing_page' | 'popup';
  companyId: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  elements: {
    type: 'text' | 'image' | 'video' | 'button' | 'form';
    content: string;
    style?: Record<string, unknown>;
    targetUrl?: string;
  }[];
  targetAudience: { segments?: string[]; ageRange?: string[]; location?: string[] };
  schedule: { startDate?: Date; endDate?: Date; daysOfWeek?: number[] };
  variants: string[];
  clickRate: number;
  impressionCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    contentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['banner', 'ad', 'email', 'notification', 'landing_page', 'popup'], required: true },
    companyId: { type: String, required: true, index: true },
    status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
    elements: [{
      type: { type: String, enum: ['text', 'image', 'video', 'button', 'form'], required: true },
      content: { type: String, required: true },
      style: { type: Schema.Types.Mixed },
      targetUrl: { type: String }
    }],
    targetAudience: {
      segments: [{ type: String }],
      ageRange: [{ type: String }],
      location: [{ type: String }]
    },
    schedule: {
      startDate: { type: Date },
      endDate: { type: Date },
      daysOfWeek: [{ type: Number }]
    },
    variants: [{ type: String }],
    clickRate: { type: Number, default: 0 },
    impressionCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

ContentSchema.index({ companyId: 1, status: 1 });
ContentSchema.index({ type: 1, status: 1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);