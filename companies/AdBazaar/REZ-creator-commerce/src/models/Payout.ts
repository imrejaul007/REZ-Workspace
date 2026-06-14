import mongoose, { Schema, Model } from 'mongoose';
import {
  IPayout,
  IPayoutDocument,
  PayoutStatus,
  PayoutMethod,
} from '../types';

const PayoutSchema = new Schema<IPayout>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
    },
    method: {
      type: String,
      enum: Object.values(PayoutMethod),
      default: PayoutMethod.BANK_TRANSFER,
    },
    transactionId: {
      type: String,
    },
    bankReference: {
      type: String,
    },
    notes: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
PayoutSchema.index({ creatorId: 1, status: 1 });
PayoutSchema.index({ status: 1 });
PayoutSchema.index({ createdAt: -1 });
PayoutSchema.index({ creatorId: 1, createdAt: -1 });

// Static methods
PayoutSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ creatorId }).sort({ createdAt: -1 });
};

PayoutSchema.statics.findPending = function () {
  return this.find({ status: PayoutStatus.PENDING }).sort({ requestedAt: 1 });
};

PayoutSchema.statics.findProcessing = function () {
  return this.find({ status: PayoutStatus.PROCESSING }).sort({ requestedAt: 1 });
};

PayoutSchema.statics.findByStatus = function (status: PayoutStatus) {
  return this.find({ status }).sort({ requestedAt: -1 });
};

PayoutSchema.statics.getCreatorPayoutStats = async function (creatorId: string) {
  const stats = await this.aggregate([
    { $match: { creatorId: new mongoose.Types.ObjectId(creatorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const result = {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    totalPaidOut: 0,
  };

  stats.forEach((stat) => {
    const status = stat._id as PayoutStatus;
    result[status] = { count: stat.count, amount: stat.totalAmount };
    if (status === PayoutStatus.COMPLETED) {
      result.totalPaidOut = stat.totalAmount;
    }
  });

  return result;
};

PayoutSchema.statics.getPlatformPayoutStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const result = {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    totalPaidOut: 0,
  };

  stats.forEach((stat) => {
    const status = stat._id as PayoutStatus;
    result[status] = { count: stat.count, amount: stat.totalAmount };
    if (status === PayoutStatus.COMPLETED) {
      result.totalPaidOut = stat.totalAmount;
    }
  });

  return result;
};

// Instance method to process payout
PayoutSchema.methods.process = async function (transactionId?: string) {
  if (this.status !== PayoutStatus.PENDING) {
    throw new Error('Only pending payouts can be processed');
  }
  this.status = PayoutStatus.PROCESSING;
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return this.save();
};

// Instance method to complete payout
PayoutSchema.methods.complete = async function (bankReference?: string) {
  if (this.status !== PayoutStatus.PROCESSING) {
    throw new Error('Only processing payouts can be completed');
  }
  this.status = PayoutStatus.COMPLETED;
  this.processedAt = new Date();
  if (bankReference) {
    this.bankReference = bankReference;
  }
  return this.save();
};

// Instance method to fail payout
PayoutSchema.methods.fail = async function (reason: string) {
  this.status = PayoutStatus.FAILED;
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

export const Payout: Model<IPayoutDocument> = mongoose.model<IPayoutDocument>(
  'Payout',
  PayoutSchema
);

export default Payout;