import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'all';
  postId?: mongoose.Types.ObjectId;
  scheduleId?: mongoose.Types.ObjectId;
  color: string;
  tags: string[];
  reminders: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    description: String,
    startDate: { type: Date, required: true, index: true },
    endDate: Date,
    allDay: { type: Boolean, default: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'all'],
      default: 'all'
    },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule' },
    color: { type: String, default: '#3B82F6' },
    tags: { type: [String], default: [] },
    reminders: { type: [Date], default: [] }
  },
  { timestamps: true }
);

CalendarSchema.index({ userId: 1, startDate: 1 });
CalendarSchema.index({ userId: 1, platform: 1 });

export const Calendar = mongoose.model<ICalendarEvent>('Calendar', CalendarSchema);