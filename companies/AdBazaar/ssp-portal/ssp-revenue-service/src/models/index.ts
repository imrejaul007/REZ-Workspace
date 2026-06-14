import mongoose, { Schema, Document } from 'mongoose';

export type RevenueType = 'impression' | 'click' | 'booking' | 'commission';
export type PeriodType = 'daily' | 'weekly' | 'monthly';
export type CurrencyType = 'INR';

export interface IRevenueRecord extends Document {
  recordId: string;
  type: RevenueType;
  amount: number;
  currency: CurrencyType;
  screenId?: string;
  advertiserId?: string;
  campaignId?: string;
  bookingId?: string;
  period: PeriodType;
  periodDate: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueRecordSchema = new Schema<IRevenueRecord>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['impression', 'click', 'booking', 'commission'],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      enum: ['INR'],
    },
    screenId: {
      type: String,
      index: true,
    },
    advertiserId: {
      type: String,
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    bookingId: {
      type: String,
      index: true,
    },
    period: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly'],
      index: true,
    },
    periodDate: {
      type: Date,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'revenue_records',
  }
);

// Compound indexes for common queries
RevenueRecordSchema.index({ screenId: 1, periodDate: 1 });
RevenueRecordSchema.index({ advertiserId: 1, periodDate: 1 });
RevenueRecordSchema.index({ campaignId: 1, periodDate: 1 });
RevenueRecordSchema.index({ type: 1, periodDate: 1 });

// Virtual for formatted amount
RevenueRecordSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Ensure virtuals are included in JSON output
RevenueRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const RevenueRecord = mongoose.model<IRevenueRecord>(
  'RevenueRecord',
  RevenueRecordSchema
);

export default RevenueRecord;
