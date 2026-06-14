import mongoose, { Document, Schema } from 'mongoose';

export type DefaultViewType = 'month' | 'week' | 'day';

export interface IWorkingHours {
  start: string;
  end: string;
}

export interface IColorScheme {
  [platform: string]: string;
}

export interface ICalendarSettings {
  userId: string;
  defaultView: DefaultViewType;
  workingHours: IWorkingHours;
  blackoutDates: Date[];
  colorScheme: IColorScheme;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarSettingsDocument extends ICalendarSettings, Document {}

const CalendarSettingsSchema = new Schema<ICalendarSettingsDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    defaultView: {
      type: String,
      enum: ['month', 'week', 'day'],
      default: 'month',
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    blackoutDates: [
      {
        type: Date,
      },
    ],
    colorScheme: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'calendar_settings',
  }
);

CalendarSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    if (ret.colorScheme instanceof Map) {
      ret.colorScheme = Object.fromEntries(ret.colorScheme);
    }
    return ret;
  },
});

export const CalendarSettings = mongoose.model<ICalendarSettingsDocument>(
  'CalendarSettings',
  CalendarSettingsSchema
);