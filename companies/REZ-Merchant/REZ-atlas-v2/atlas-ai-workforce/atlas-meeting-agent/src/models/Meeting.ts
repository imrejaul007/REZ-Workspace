/**
 * REZ Atlas v2 - Meeting Agent MongoDB Models
 * Meeting Booking & Calendar Management
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// Meeting Schema
// ================================================
export interface IMeeting extends Document {
  leadId: string;
  leadName: string;
  leadEmail: string;
  companyName: string;
  product: string;

  // Scheduling
  scheduledAt: Date | null;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

  // Details
  agenda: string;
  notes: string;

  // Calendar
  calendarEventId: string | null;
  meetingLink: string | null;

  // Outcomes
  outcome: string | null;
  nextSteps: string[];
  followUpRequired: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
  leadId: { type: String, required: true, index: true },
  leadName: { type: String, required: true },
  leadEmail: { type: String, required: true },
  companyName: { type: String, required: true },
  product: { type: String, default: '' },
  scheduledAt: { type: Date, default: null },
  duration: { type: Number, default: 30 },
  type: { type: String, enum: ['video', 'phone', 'in-person'], default: 'video' },
  status: { type: String, enum: ['proposed', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'proposed', index: true },
  agenda: { type: String, default: '' },
  notes: { type: String, default: '' },
  calendarEventId: { type: String, default: null },
  meetingLink: { type: String, default: null },
  outcome: { type: String, default: null },
  nextSteps: [{ type: String }],
  followUpRequired: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

MeetingSchema.index({ status: 1, scheduledAt: 1 });
MeetingSchema.index({ leadId: 1, status: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);

// ================================================
// TimeSlot Schema
// ================================================
export interface ITimeSlot extends Document {
  start: Date;
  end: Date;
  available: boolean;
  bookedBy: string | null;
  bookedAt: Date | null;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  available: { type: Boolean, default: true },
  bookedBy: { type: String, default: null },
  bookedAt: { type: Date, default: null },
});

TimeSlotSchema.index({ start: 1, end: 1 });
TimeSlotSchema.index({ available: 1, start: 1 });

export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);

// ================================================
// CalendarEvent Schema
// ================================================
export interface ICalendarEvent extends Document {
  title: string;
  start: Date;
  end: Date;
  attendees: string[];
  meetingLink: string;
  meetingId: string;
  createdAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  attendees: [{ type: String }],
  meetingLink: { type: String, required: true },
  meetingId: { type: String, required: true, index: true },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);