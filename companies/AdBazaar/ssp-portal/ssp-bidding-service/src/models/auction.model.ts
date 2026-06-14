import mongoose, { Document, Schema } from 'mongoose';

export type AuctionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface IAuction extends Document {
  auctionId: string;
  slotId: string;
  bidFloor: number;
  status: AuctionStatus;
  timeoutMs: number;
  metadata?: Record<string, any>;
  startedAt: Date;
  endedAt?: Date;
  winningBidId?: string;
  winningAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
  {
    auctionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slotId: {
      type: String,
      required: true,
      index: true,
    },
    bidFloor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    timeoutMs: {
      type: Number,
      required: true,
      min: 50,
      max: 5000,
      default: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      required: false,
    },
    winningBidId: {
      type: String,
      required: false,
    },
    winningAmount: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'auctions',
  }
);

// Indexes
auctionSchema.index({ slotId: 1, status: 1 });
auctionSchema.index({ status: 1, startedAt: -1 });

// Virtual for checking if auction is still active
auctionSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function () {
  if (this.status !== 'active') return 0;
  const elapsed = Date.now() - this.startedAt.getTime();
  return Math.max(0, this.timeoutMs - elapsed);
});

// Ensure virtuals are included in JSON output
auctionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const result = { ...ret } as Record<string, unknown>;
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Auction = mongoose.model<IAuction>('Auction', auctionSchema);