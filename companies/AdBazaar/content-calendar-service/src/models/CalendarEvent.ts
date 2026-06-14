import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type EventStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface ICalendarEvent {
  id: string;
  postId: string;
  platform: string;
  accountId: string;
  date: Date;
  time: string;
  content: string;
  mediaPreview?: string;
  status: EventStatus;
  assignee?: string;
  color: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarEventDocument extends ICalendarEvent, Document {}

const CalendarEventSchema = new Schema<ICalendarEventDocument>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaPreview: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    assignee: {
      type: String,
      index: true,
    },
    color: {
      type: String,
      default: '#6B7280',
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'calendar_events',
  }
);

CalendarEventSchema.index({ date: 1, time: 1 });
CalendarEventSchema.index({ date: 1, platform: 1 });
CalendarEventSchema.index({ date: 1, status: 1 });

CalendarEventSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CalendarEvent = mongoose.model<ICalendarEventDocument>(
  'CalendarEvent',
  CalendarEventSchema
);