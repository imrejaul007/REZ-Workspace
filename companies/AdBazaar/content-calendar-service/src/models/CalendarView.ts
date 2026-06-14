import mongoose, { Document, Schema } from 'mongoose';

export type CalendarViewType = 'month' | 'week' | 'day';

export interface ICalendarStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
}

export interface ICalendarView {
  userId: string;
  startDate: Date;
  endDate: Date;
  view: CalendarViewType;
  events: string[];
  stats: ICalendarStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarViewDocument extends ICalendarView, Document {}

const CalendarViewSchema = new Schema<ICalendarViewDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    view: {
      type: String,
      enum: ['month', 'week', 'day'],
      default: 'month',
    },
    events: [
      {
        type: String,
        ref: 'CalendarEvent',
      },
    ],
    stats: {
      total: { type: Number, default: 0 },
      published: { type: Number, default: 0 },
      scheduled: { type: Number, default: 0 },
      draft: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'calendar_views',
  }
);

CalendarViewSchema.index({ userId: 1, startDate: 1, endDate: 1 });

CalendarViewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CalendarView = mongoose.model<ICalendarViewDocument>(
  'CalendarView',
  CalendarViewSchema
);