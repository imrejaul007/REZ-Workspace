import mongoose, { Schema, Document, Model } from 'mongoose';
import { IActionItem, ActionItemStatus } from '../types';

export interface ActionItemDocument extends Omit<IActionItem, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const ActionItemSchema = new Schema<ActionItemDocument>(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    assigneeId: {
      type: String,
      required: true,
      index: true,
    },
    assigneeName: {
      type: String,
      required: true,
    },
    createdById: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    completedAt: {
      type: Date,
    },
    completedNote: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'action_items',
  }
);

// Indexes for efficient queries
ActionItemSchema.index({ assigneeId: 1, status: 1 });
ActionItemSchema.index({ dueDate: 1, status: 1 });
ActionItemSchema.index({ meetingId: 1, assigneeId: 1 });

// Virtual for checking if overdue
ActionItemSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed') return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Method to mark as completed
ActionItemSchema.methods.markCompleted = function (
  this: ActionItemDocument,
  note?: string
) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (note) {
    this.completedNote = note;
  }
  return this.save();
};

// Static method to get overdue items
ActionItemSchema.statics.findOverdue = function (
  assigneeId?: string
): Promise<ActionItemDocument[]> {
  const query: Record<string, unknown> = {
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() },
  };
  if (assigneeId) {
    query.assigneeId = assigneeId;
  }
  return this.find(query).sort({ dueDate: 1 });
};

// Static method to get user's action items
ActionItemSchema.statics.findByAssignee = function (
  assigneeId: string,
  options?: { status?: ActionItemStatus; limit?: number; skip?: number }
): Promise<ActionItemDocument[]> {
  const query: Record<string, unknown> = { assigneeId };
  if (options?.status) {
    query.status = options.status;
  }
  return this.find(query)
    .sort({ priority: -1, dueDate: 1, createdAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50);
};

export const ActionItem: Model<ActionItemDocument> = mongoose.model<ActionItemDocument>(
  'ActionItem',
  ActionItemSchema
);
