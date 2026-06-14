import mongoose, { Document, Schema } from 'mongoose';

// Report Types
export type ReportType =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'payroll'
  | 'performance'
  | 'custom';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: ReportType;
  data: Record<string, unknown>;
  generatedAt: Date;
  generatedBy?: string;
  filters?: {
    startDate?: Date;
    endDate?: Date;
    department?: string;
    employeeId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['dashboard', 'employees', 'attendance', 'payroll', 'performance', 'custom'],
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String,
    },
    filters: {
      startDate: Date,
      endDate: Date,
      department: String,
      employeeId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReportSchema.index({ type: 1, generatedAt: -1 });
ReportSchema.index({ name: 1 });
ReportSchema.index({ generatedAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
