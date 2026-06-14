/**
 * REZ Meeting Notes Service - Meeting Note Model
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type MeetingType = 'discovery' | 'demo' | 'negotiation' | 'check_in' | 'standup' | 'brainstorm' | 'other';

export interface IActionItem {
  id: string;
  title: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface INoteSection {
  title: string;
  content: string;
  type: 'general' | 'key_points' | 'decisions' | 'questions' | 'action_items';
}

export interface IMeetingNote extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Meeting info
  noteId: string;
  title: string;
  type: MeetingType;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // minutes

  // Attendees
  hostId: string;
  hostName?: string;
  attendees: Array<{
    id: string;
    name: string;
    email?: string;
    role?: string;
  }>;

  // Content
  agenda?: string;
  sections: INoteSection[];
  summary?: string;
  keyDecisions: string[];
  questionsRaised: string[];

  // Action items
  actionItems: IActionItem[];

  // AI Analysis
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  topics?: string[];
  insights?: string[];

  // Links
  dealId?: string;
  dealName?: string;
  companyId?: string;
  companyName?: string;
  contactIds?: string[];
  recordingUrl?: string;
  transcriptId?: string;

  // Collaboration
  sharedWith: string[];
  isShared: boolean;
  lastEditedBy?: string;
  lastEditedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  assigneeId: String,
  assigneeName: String,
  dueDate: Date,
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { _id: false });

const NoteSectionSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['general', 'key_points', 'decisions', 'questions', 'action_items'], default: 'general' },
}, { _id: false });

const MeetingNoteSchema = new Schema<IMeetingNote>({
  tenantId: { type: String, required: true, index: true },
  noteId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['discovery', 'demo', 'negotiation', 'check_in', 'standup', 'brainstorm', 'other'], default: 'other' },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  hostId: { type: String, required: true },
  hostName: String,
  attendees: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: String,
    role: String,
  }],
  agenda: String,
  sections: [NoteSectionSchema],
  summary: String,
  keyDecisions: [String],
  questionsRaised: [String],
  actionItems: [ActionItemSchema],
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  sentimentScore: Number,
  topics: [String],
  insights: [String],
  dealId: String,
  dealName: String,
  companyId: String,
  companyName: String,
  contactIds: [String],
  recordingUrl: String,
  transcriptId: String,
  sharedWith: [String],
  isShared: { type: Boolean, default: false },
  lastEditedBy: String,
  lastEditedAt: Date,
}, { timestamps: true });

MeetingNoteSchema.index({ tenantId: 1, noteId: 1 });
MeetingNoteSchema.index({ tenantId: 1, dealId: 1 });
MeetingNoteSchema.index({ tenantId: 1, companyId: 1 });
MeetingNoteSchema.index({ tenantId: 1, hostId: 1 });
MeetingNoteSchema.index({ tenantId: 1, scheduledAt: -1 });

export const MeetingNoteModel: Model<IMeetingNote> = mongoose.model<IMeetingNote>('MeetingNote', MeetingNoteSchema);
export default MeetingNoteModel;
