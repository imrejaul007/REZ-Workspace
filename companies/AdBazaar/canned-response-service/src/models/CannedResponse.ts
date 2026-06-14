/**
 * CannedResponse Model - Mongoose schema for support response templates
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum ResponseStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export interface ICannedResponse extends Document {
  responseId: string;
  title: string;
  content: string;
  shortcut?: string;
  categoryId: string;
  tags: string[];
  status: ResponseStatus;
  authorId: string;
  authorName: string;
  usageCount: number;
  lastUsedAt?: Date;
  variables: string[];
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cannedResponseSchema = new Schema<ICannedResponse>(
  {
    responseId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true },
    shortcut: { type: String, index: true },
    categoryId: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    status: {
      type: String,
      enum: Object.values(ResponseStatus),
      default: ResponseStatus.ACTIVE,
      index: true,
    },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: Date,
    variables: [{ type: String }],
    isGlobal: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
cannedResponseSchema.index({ title: 'text', content: 'text' });
cannedResponseSchema.index({ shortcut: 1, status: 1 });
cannedResponseSchema.index({ categoryId: 1, status: 1 });
cannedResponseSchema.index({ usageCount: -1 });

export const CannedResponse = mongoose.model<ICannedResponse>('CannedResponse', cannedResponseSchema);
export default CannedResponse;