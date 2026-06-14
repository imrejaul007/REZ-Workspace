import mongoose, { Schema, Document } from 'mongoose';

export interface IQBR extends Document {
  customerId: string;
  customerName: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: Date;
  completedDate?: Date;
  sections: {
    sectionId: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completedAt?: Date;
  }[];
  assignedTo?: string;
  attendees: string[];
  meetingLink?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const QBRSchema = new Schema<IQBR>(
  {
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true, index: true },
    year: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'cancelled'],
      required: true,
      default: 'planned',
      index: true,
    },
    scheduledDate: { type: Date, index: true },
    completedDate: { type: Date },
    sections: [{
      sectionId: { type: String, required: true },
      name: { type: String, required: true },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        required: true,
        default: 'pending',
      },
      completedAt: { type: Date },
    }],
    assignedTo: { type: String, index: true },
    attendees: [{ type: String }],
    meetingLink: { type: String },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'qbrs',
  }
);

QBRSchema.index({ customerId: 1, quarter: 1, year: 1 });
QBRSchema.index({ quarter: 1, year: 1, status: 1 });
QBRSchema.index({ scheduledDate: 1 });
QBRSchema.index({ assignedTo: 1, status: 1 });

export const QBRModel = mongoose.model<IQBR>('QBR', QBRSchema);