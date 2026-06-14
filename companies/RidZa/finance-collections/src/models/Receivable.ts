import mongoose, { Document, Schema } from 'mongoose';

// Enums for better type safety
export enum ReceivableStatus {
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  PAID = 'paid',
  WRITTEN_OFF = 'written_off',
}

export enum PaymentChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  CALL = 'call',
  LETTER = 'letter',
}

export enum AgingBucket {
  CURRENT = 'current',
  OVERDUE_1_30 = 'overdue_1_30',
  OVERDUE_31_60 = 'overdue_31_60',
  OVERDUE_61_90 = 'overdue_61_90',
  OVERDUE_91_PLUS = 'overdue_91_plus',
}

// Interface for Receivable document
export interface IReceivable extends Document {
  receivableId: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceNumber?: string;
  amount: number;
  paidAmount: number;
  currency: string;
  dueDate: Date;
  issueDate: Date;
  status: ReceivableStatus;
  followUpCount: number;
  lastFollowUpDate?: Date;
  nextFollowUpDate?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for FollowUp document
export interface IFollowUp extends Document {
  followUpId: string;
  receivableId: string;
  tenantId: string;
  channel: PaymentChannel;
  message: string;
  scheduledDate: Date;
  sentDate?: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  responseReceived?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Aging bucket interface
export interface AgingBucketData {
  bucket: AgingBucket;
  label: string;
  minDays: number;
  maxDays: number | null;
  totalAmount: number;
  count: number;
  receivables: Array<{
    receivableId: string;
    customerName: string;
    amount: number;
    daysOverdue: number;
    dueDate: Date;
  }>;
}

// Receivable Schema
const receivableSchema = new Schema<IReceivable>(
  {
    receivableId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
    invoiceNumber: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ReceivableStatus),
      default: ReceivableStatus.PENDING,
      index: true,
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    lastFollowUpDate: {
      type: Date,
    },
    nextFollowUpDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
receivableSchema.index({ tenantId: 1, status: 1 });
receivableSchema.index({ tenantId: 1, dueDate: 1 });
receivableSchema.index({ tenantId: 1, customerId: 1 });

// FollowUp Schema
const followUpSchema = new Schema<IFollowUp>(
  {
    followUpId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    receivableId: {
      type: String,
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(PaymentChannel),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    sentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    responseReceived: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
followUpSchema.index({ tenantId: 1, scheduledDate: 1 });
followUpSchema.index({ receivableId: 1, status: 1 });

// Export models (use existing connection if already defined)
export const Receivable = mongoose.models.Receivable as mongoose.Model<IReceivable> ||
  mongoose.model<IReceivable>('Receivable', receivableSchema);

export const FollowUp = mongoose.models.FollowUp as mongoose.Model<IFollowUp> ||
  mongoose.model<IFollowUp>('FollowUp', followUpSchema);

export default { Receivable, FollowUp };
