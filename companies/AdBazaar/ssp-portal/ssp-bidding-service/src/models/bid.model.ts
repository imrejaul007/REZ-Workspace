import mongoose, { Document, Schema } from 'mongoose';

export type BidStatus = 'pending' | 'won' | 'lost' | 'expired';

export interface IBid extends Document {
  bidId: string;
  auctionId: string;
  advertiserId: string;
  campaignId: string;
  slotId: string;
  amount: number;
  currency: 'INR';
  status: BidStatus;
  creativeId?: string;
  bidFloor: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    bidId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    auctionId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    slotId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'expired'],
      default: 'pending',
      index: true,
    },
    creativeId: {
      type: String,
      required: false,
    },
    bidFloor: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'bids',
  }
);

// Compound indexes for common queries
bidSchema.index({ auctionId: 1, amount: -1 });
bidSchema.index({ advertiserId: 1, status: 1 });
bidSchema.index({ campaignId: 1, createdAt: -1 });
bidSchema.index({ slotId: 1, timestamp: -1 });

// Virtual for checking if bid can be cancelled
bidSchema.virtual('canCancel').get(function () {
  return this.status === 'pending';
});

// Ensure virtuals are included in JSON output
bidSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const result = { ...ret } as Record<string, unknown>;
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Bid = mongoose.model<IBid>('Bid', bidSchema);