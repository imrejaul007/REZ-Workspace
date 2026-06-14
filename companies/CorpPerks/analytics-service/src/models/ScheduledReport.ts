import mongoose, { Document, Schema } from 'mongoose';

// Schedule frequency types
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// Report format types
export type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json';

export interface IScheduledReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  reportName: string;
  reportType: string;
  schedule: {
    frequency: ScheduleFrequency;
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    hour: number; // 0-23
    minute: number; // 0-59
    timezone: string;
  };
  recipients: {
    email: string;
    name?: string;
  }[];
  format: ReportFormat;
  filters?: {
    startDate?: Date;
    endDate?: Date;
    department?: string;
    employeeId?: string;
  };
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReport>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    reportName: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: true,
      enum: ['dashboard', 'employees', 'attendance', 'payroll', 'performance', 'custom'],
    },
    schedule: {
      frequency: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23,
      },
      minute: {
        type: Number,
        required: true,
        min: 0,
        max: 59,
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
    },
    recipients: [
      {
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        name: {
          type: String,
          trim: true,
        },
      },
    ],
    format: {
      type: String,
      enum: ['pdf', 'csv', 'excel', 'json'],
      default: 'pdf',
    },
    filters: {
      startDate: Date,
      endDate: Date,
      department: String,
      employeeId: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRunAt: {
      type: Date,
    },
    nextRunAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ScheduledReportSchema.index({ isActive: 1, nextRunAt: 1 });
ScheduledReportSchema.index({ 'recipients.email': 1 });
ScheduledReportSchema.index({ reportType: 1 });

export const ScheduledReport = mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);
