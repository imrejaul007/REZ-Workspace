import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklist extends Document {
  name: string;
  type: 'standard' | 'enterprise' | 'agency' | 'publisher' | 'creator';
  description: string;
  steps: {
    order: number;
    name: string;
    description: string;
    required: boolean;
    category: string;
    estimatedMinutes: number;
    dependencies: string[];
    resources: {
      title: string;
      url?: string;
      type: 'video' | 'doc' | 'link';
    }[];
  }[];
  version: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistSchema = new Schema<IChecklist>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['standard', 'enterprise', 'agency', 'publisher', 'creator'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    steps: [{
      order: { type: Number, required: true },
      name: { type: String, required: true },
      description: { type: String },
      required: { type: Boolean, default: true },
      category: { type: String, required: true },
      estimatedMinutes: { type: Number, default: 15 },
      dependencies: [{ type: String }],
      resources: [{
        title: { type: String, required: true },
        url: { type: String },
        type: { type: String, enum: ['video', 'doc', 'link'], default: 'doc' },
      }],
    }],
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'checklists',
  }
);

ChecklistSchema.index({ type: 1, active: 1 });
ChecklistSchema.index({ name: 1 });

export const ChecklistModel = mongoose.model<IChecklist>('Checklist', ChecklistSchema);