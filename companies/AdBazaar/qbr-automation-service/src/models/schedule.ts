import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  customerId: string;
  customerName: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  scheduledDate: Date;
  reminderDays: number[];
  status: 'scheduled' | 'completed' | 'cancelled';
  autoGenerate: boolean;
  templateId?: string;
  assignedTo?: string;
  attendees: string[];
  notes?: string;
  remindersSent: {
    days: number;
    sentAt: Date;
    type: 'email' | 'notification';
  }[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
    year: { type: Number, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    reminderDays: [{ type: Number, default: [7, 3, 1] }],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      required: true,
      default: 'scheduled',
    },
    autoGenerate: { type: Boolean, default: true },
    templateId: { type: String },
    assignedTo: { type: String },
    attendees: [{ type: String }],
    notes: { type: String },
    remindersSent: [{
      days: { type: Number, required: true },
      sentAt: { type: Date, required: true },
      type: { type: String, enum: ['email', 'notification'], required: true },
    }],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'qbr_schedules',
  }
);

ScheduleSchema.index({ quarter: 1, year: 1, status: 1 });
ScheduleSchema.index({ scheduledDate: 1, status: 1 });
ScheduleSchema.index({ assignedTo: 1, status: 1 });

export const ScheduleModel = mongoose.model<ISchedule>('QBRSchedule', ScheduleSchema);