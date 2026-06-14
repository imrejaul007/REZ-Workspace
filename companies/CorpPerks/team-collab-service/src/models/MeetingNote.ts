import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMeetingNote, ActionItem } from '../types/index.js';

export interface MeetingNoteDocument extends Omit<IMeetingNote, '_id'>, Document {}

const actionItemRefSchema = new Schema(
  {
    id: { type: String, required: true },
    task: { type: String, required: true },
    assigneeId: { type: String, required: true },
    assigneeName: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const meetingNoteSchema = new Schema<MeetingNoteDocument>(
  {
    noteId: {
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
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    decisions: {
      type: [String],
      default: [],
    },
    actionItems: {
      type: [actionItemRefSchema],
      default: [],
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
meetingNoteSchema.index({ meetingId: 1, generatedAt: -1 });

// Method to update content
meetingNoteSchema.methods.updateContent = function (content: string, summary: string): void {
  this.content = content;
  this.summary = summary;
};

// Static method to get notes for a meeting
meetingNoteSchema.statics.findByMeeting = async function (
  meetingId: string
): Promise<MeetingNoteDocument | null> {
  return this.findOne({ meetingId }).sort({ generatedAt: -1 });
};

// Static method to get all notes for a user (from meetings they attended)
meetingNoteSchema.statics.findRecentForUser = async function (
  userId: string,
  options: { limit?: number } = {}
): Promise<MeetingNoteDocument[]> {
  const { limit = 20 } = options;
  return this.find({ 'actionItems.assigneeId': userId })
    .sort({ generatedAt: -1 })
    .limit(limit);
};

export const MeetingNote: Model<MeetingNoteDocument> = mongoose.model<MeetingNoteDocument>(
  'MeetingNote',
  meetingNoteSchema
);
