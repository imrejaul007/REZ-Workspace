import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAgendaItem } from '../types';

export interface AgendaItemDocument extends Omit<IAgendaItem, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const AgendaItemSchema = new Schema<AgendaItemDocument>(
  {
    agendaItemId: {
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    topicType: {
      type: String,
      required: true,
      enum: ['discussion', 'update', 'decision', 'feedback', 'goal', 'blocker', 'other'],
    },
    proposedById: {
      type: String,
      required: true,
    },
    proposedByName: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      min: 1,
      max: 120,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    collection: 'agenda_items',
  }
);

// Indexes
AgendaItemSchema.index({ meetingId: 1, order: 1 });
AgendaItemSchema.index({ meetingId: 1, isCompleted: 1 });

// Method to mark as completed
AgendaItemSchema.methods.markCompleted = function (
  this: AgendaItemDocument,
  notes?: string
) {
  this.isCompleted = true;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Method to reorder
AgendaItemSchema.methods.reorder = function (
  this: AgendaItemDocument,
  newOrder: number
) {
  this.order = newOrder;
  return this.save();
};

// Static to get agenda for meeting
AgendaItemSchema.statics.findByMeeting = function (
  meetingId: string
): Promise<AgendaItemDocument[]> {
  return this.find({ meetingId }).sort({ order: 1, createdAt: 1 });
};

// Static to get completed agenda items
AgendaItemSchema.statics.findCompleted = function (
  meetingId: string
): Promise<AgendaItemDocument[]> {
  return this.find({ meetingId, isCompleted: true }).sort({ order: 1 });
};

// Static to get pending agenda items
AgendaItemSchema.statics.findPending = function (
  meetingId: string
): Promise<AgendaItemDocument[]> {
  return this.find({ meetingId, isCompleted: false }).sort({ order: 1 });
};

export const AgendaItem: Model<AgendaItemDocument> = mongoose.model<AgendaItemDocument>(
  'AgendaItem',
  AgendaItemSchema
);
