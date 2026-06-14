import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICalendarEvent, IAttendee, SyncStatus, EventStatus } from '../types';

export interface CalendarEventDocument extends Omit<ICalendarEvent, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const AttendeeSchema = new Schema(
  {
    attendeeId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String },
    status: {
      type: String,
      enum: ['accepted', 'declined', 'tentative', 'needs_action', 'not_invited'],
      default: 'not_invited',
    },
    responseComment: { type: String },
    isOrganizer: { type: Boolean, default: false },
    isCorpPerksUser: { type: Boolean, default: false },
    userId: { type: String },
  },
  { _id: false }
);

const CalendarEventSchema = new Schema<CalendarEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    externalEventId: {
      type: String,
      required: true,
      index: true,
    },
    connectionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'outlook', 'apple', 'corpperks'],
    },

    // Event Details
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String },
    location: { type: String },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['confirmed', 'tentative', 'cancelled'],
      default: 'confirmed',
    },

    // Attendees
    attendees: {
      type: [AttendeeSchema],
      default: [],
    },
    organizerName: { type: String },
    organizerEmail: { type: String },

    // Sync Information
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'conflict'],
      default: 'synced',
      index: true,
    },
    externalUrl: { type: String },
    meetingLink: { type: String },
    recurringEventId: { type: String },

    // CorpPerks Integration
    linkedMeetingId: { type: String, index: true },
    linkedProjectId: { type: String },
    isCorpPerksEvent: {
      type: Boolean,
      default: false,
    },

    // Metadata
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'calendar_events',
  }
);

// Compound indexes
CalendarEventSchema.index({ userId: 1, startTime: 1 });
CalendarEventSchema.index({ userId: 1, syncStatus: 1 });
CalendarEventSchema.index({ connectionId: 1, externalEventId: 1 }, { unique: true });
CalendarEventSchema.index({ companyId: 1, startTime: 1 });
CalendarEventSchema.index({ linkedMeetingId: 1, isCorpPerksEvent: 1 });

// Virtual for checking if event is in the past
CalendarEventSchema.virtual('isPast').get(function (this: CalendarEventDocument) {
  return this.endTime < new Date();
});

// Virtual for checking if event is ongoing
CalendarEventSchema.virtual('isOngoing').get(function (this: CalendarEventDocument) {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
});

// Static method to find events in date range
CalendarEventSchema.statics.findInRange = async function (
  userId: string,
  startDate: Date,
  endDate: Date,
  options?: {
    includeCorpPerksOnly?: boolean;
    status?: EventStatus[];
  }
): Promise<CalendarEventDocument[]> {
  const query: Record<string, unknown> = {
    userId,
    startTime: { $gte: startDate },
    endTime: { $lte: endDate },
  };

  if (options?.includeCorpPerksOnly) {
    query.isCorpPerksEvent = true;
  }

  if (options?.status) {
    query.status = { $in: options.status };
  }

  return this.find(query).sort({ startTime: 1 });
};

// Static method to find conflicting events
CalendarEventSchema.statics.findConflicts = async function (
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<CalendarEventDocument[]> {
  const query: Record<string, unknown> = {
    userId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };

  if (excludeEventId) {
    query.eventId = { $ne: excludeEventId };
  }

  return this.find(query).sort({ startTime: 1 });
};

// Static method to get upcoming events
CalendarEventSchema.statics.findUpcoming = async function (
  userId: string,
  limit: number = 10
): Promise<CalendarEventDocument[]> {
  return this.find({
    userId,
    startTime: { $gte: new Date() },
    status: { $ne: 'cancelled' },
  })
    .sort({ startTime: 1 })
    .limit(limit);
};

// Static method to get events by meeting ID
CalendarEventSchema.statics.findByMeetingId = async function (
  linkedMeetingId: string
): Promise<CalendarEventDocument[]> {
  return this.find({
    linkedMeetingId,
    isCorpPerksEvent: true,
  }).sort({ startTime: 1 });
};

export const CalendarEvent: Model<CalendarEventDocument> = mongoose.model<CalendarEventDocument>(
  'CalendarEvent',
  CalendarEventSchema
);
