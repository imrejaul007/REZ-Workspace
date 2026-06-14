import mongoose, { Schema } from 'mongoose';
import { IShiftTemplate } from '../types';

const ShiftTemplateSchema = new Schema<IShiftTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Calculate duration from start and end times
ShiftTemplateSchema.pre('save', function (next) {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);

  let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  // Handle overnight shifts (e.g., 22:00 - 06:00)
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  this.duration = durationMinutes;
  next();
});

// Index for efficient queries
ShiftTemplateSchema.index({ name: 1 });
ShiftTemplateSchema.index({ createdAt: -1 });

export const ShiftTemplate = mongoose.model<IShiftTemplate>('ShiftTemplate', ShiftTemplateSchema);
