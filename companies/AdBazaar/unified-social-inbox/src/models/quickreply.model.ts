import mongoose, { Schema, Document } from 'mongoose';
import { IQuickReplyTemplate, Platform } from '../types';

export interface QuickReplyTemplateDocument extends Omit<IQuickReplyTemplate, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const QuickReplyTemplateSchema = new Schema<QuickReplyTemplateDocument>({
  name: { type: String, required: true },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'all'],
    default: 'all',
  },
  category: { type: String, required: true, index: true },
  content: { type: String, required: true },
  emoji: { type: String },
  variables: [{ type: String }],
  usageCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Indexes
QuickReplyTemplateSchema.index({ platform: 1, category: 1 });
QuickReplyTemplateSchema.index({ name: 'text' });

// Virtual for id field
QuickReplyTemplateSchema.virtual('id').get(function(this: QuickReplyTemplateDocument) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
QuickReplyTemplateSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const QuickReplyTemplate = mongoose.model<QuickReplyTemplateDocument>('QuickReplyTemplate', QuickReplyTemplateSchema);
