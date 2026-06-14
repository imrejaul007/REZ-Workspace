import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISettlement extends Document {
  merchantId: Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  grossRevenue: number;
  platformFee: number;
  refunds: number;
  netAmount: number;
  status: 'calculated' | 'approved' | 'paid' | 'disputed';
  payoutId?: Types.ObjectId;
  breakdown?: {
    completedOrdersCount: number;
    completedOrdersTotal: number;
    platformFeeRate: number;
    refundedOrdersCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    grossRevenue: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    refunds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['calculated', 'approved', 'paid', 'disputed'],
      default: 'calculated',
      index: true,
    },
    payoutId: {
      type: Schema.Types.ObjectId,
      ref: 'Payout',
    },
    breakdown: {
      completedOrdersCount: { type: Number, default: 0 },
      completedOrdersTotal: { type: Number, default: 0 },
      platformFeeRate: { type: Number, default: 0.05 },
      refundedOrdersCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

// Indexes for efficient queries
SettlementSchema.index({ merchantId: 1, 'period.startDate': 1, 'period.endDate': 1 });
SettlementSchema.index({ merchantId: 1, status: 1 });
SettlementSchema.index({ createdAt: -1 });

// Cross-field validation: netAmount must equal grossRevenue - platformFee - refunds
SettlementSchema.pre('validate', function (next) {
  const expected = this.grossRevenue - this.platformFee - this.refunds;
  if (Math.abs(this.netAmount - expected) > 0.01) {
    return next(new Error('netAmount must equal grossRevenue - platformFee - refunds'));
  }
  next();
});

export const Settlement = mongoose.models.Settlement || mongoose.model('Settlement', SettlementSchema);
