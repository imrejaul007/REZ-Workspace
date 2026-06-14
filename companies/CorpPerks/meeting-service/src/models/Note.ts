import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMeetingNote, SentimentType } from '../types';

export interface MeetingNoteDocument extends Omit<IMeetingNote, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
  canView(userId: string): boolean;
}

const MeetingNoteSchema = new Schema<MeetingNoteDocument>(
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
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    discussionSummary: {
      type: String,
      maxlength: 2000,
    },
    decisions: {
      type: [String],
      default: [],
    },
    keyTakeaways: {
      type: [String],
      default: [],
    },
    actionItems: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String, required: true },
          size: { type: Number, required: true },
        },
      ],
      default: [],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    sharedWith: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'meeting_notes',
  }
);

// Indexes
MeetingNoteSchema.index({ meetingId: 1, createdAt: -1 });
MeetingNoteSchema.index({ authorId: 1, createdAt: -1 });
MeetingNoteSchema.index({ isPrivate: 1, sharedWith: 1 });

// Method for can view
MeetingNoteSchema.methods.canView = function (userId: string): boolean {
  if (!this.isPrivate) return true;
  if (this.authorId === userId) return true;
  return this.sharedWith.includes(userId);
};

// Static to get notes for meeting (with visibility filter)
MeetingNoteSchema.statics.findByMeeting = async function (
  meetingId: string,
  userId?: string
): Promise<MeetingNoteDocument[]> {
  const query: Record<string, unknown> = { meetingId };

  // If userId provided, filter by visibility
  if (userId) {
    query.$or = [
      { isPrivate: false },
      { authorId: userId },
      { sharedWith: userId },
    ];
  } else {
    query.isPrivate = false;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static to get all notes by author
MeetingNoteSchema.statics.findByAuthor = function (
  authorId: string,
  options?: { limit?: number; skip?: number }
): Promise<MeetingNoteDocument[]> {
  return this.find({ authorId })
    .sort({ createdAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50);
};

// Static to get notes where user was shared
MeetingNoteSchema.statics.findSharedWith = function (
  userId: string,
  options?: { limit?: number; skip?: number }
): Promise<MeetingNoteDocument[]> {
  return this.find({ sharedWith: userId })
    .sort({ createdAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50);
};

// Method to share with users
MeetingNoteSchema.methods.shareWith = function (
  this: MeetingNoteDocument,
  userIds: string[]
) {
  this.sharedWith = [...new Set([...this.sharedWith, ...userIds])];
  if (this.isPrivate && userIds.length > 0) {
    // Keep private but add shared users
  }
  return this.save();
};

// Method to revoke sharing
MeetingNoteSchema.methods.revokeSharing = function (
  this: MeetingNoteDocument,
  userIds: string[]
) {
  this.sharedWith = this.sharedWith.filter((id) => !userIds.includes(id));
  return this.save();
};

export const MeetingNote: Model<MeetingNoteDocument> = mongoose.model<MeetingNoteDocument>(
  'MeetingNote',
  MeetingNoteSchema
);
