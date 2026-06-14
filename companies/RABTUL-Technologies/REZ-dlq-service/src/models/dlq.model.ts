import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDLQEntry extends Document {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: {
    source: string;
    timestamp: Date;
    retryCount: number;
    originalQueue?: string;
    headers?: Record<string, string>;
  };
  status: 'pending' | 'replaying' | 'replayed' | 'failed' | 'discarded';
  replayAttempts: number;
  lastReplayAt?: Date;
  nextReplayAt?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  canRetry(maxRetries?: number): boolean;
  markAsReplaying(): void;
  markAsReplayed(): void;
  markAsFailed(error: string): void;
  calculateNextReplayTime(): Date;
}

interface IDLQEntryModel extends Model<IDLQEntry> {
  findPending(limit?: number): Promise<IDLQEntry[]>;
  findByEventType(eventType: string): Promise<IDLQEntry[]>;
  findByTags(tags: string[]): Promise<IDLQEntry[]>;
}

const DLQEntrySchema = new Schema<IDLQEntry>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    error: {
      message: { type: String, required: true },
      stack: { type: String },
      code: { type: String },
    },
    metadata: {
      source: { type: String, required: true },
      timestamp: { type: Date, required: true },
      retryCount: { type: Number, default: 0 },
      originalQueue: { type: String },
      headers: { type: Schema.Types.Mixed },
    },
    status: {
      type: String,
      enum: ['pending', 'replaying', 'replayed', 'failed', 'discarded'],
      default: 'pending',
      index: true,
    },
    replayAttempts: {
      type: Number,
      default: 0,
    },
    lastReplayAt: {
      type: Date,
    },
    nextReplayAt: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
DLQEntrySchema.index({ status: 1, createdAt: -1 });
DLQEntrySchema.index({ eventType: 1, status: 1 });
DLQEntrySchema.index({ tags: 1, status: 1 });
DLQEntrySchema.index({ nextReplayAt: 1 }, { sparse: true });

// Instance methods
DLQEntrySchema.methods.canRetry = function (maxRetries: number = 5): boolean {
  return this.replayAttempts < maxRetries && this.status !== 'replayed';
};

DLQEntrySchema.methods.markAsReplaying = function (): void {
  this.status = 'replaying';
};

DLQEntrySchema.methods.markAsReplayed = function (): void {
  this.status = 'replayed';
  this.lastReplayAt = new Date();
  this.replayAttempts += 1;
};

DLQEntrySchema.methods.markAsFailed = function (error: string): void {
  this.status = 'failed';
  this.replayAttempts += 1;
  this.nextReplayAt = this.calculateNextReplayTime();
};

DLQEntrySchema.methods.calculateNextReplayTime = function (): Date {
  const delays = [60000, 300000, 900000, 3600000, 86400000]; // 1m, 5m, 15m, 1h, 24h
  const delayIndex = Math.min(this.replayAttempts, delays.length - 1);
  const delay = delays[delayIndex];
  return new Date(Date.now() + delay);
};

// Static methods
DLQEntrySchema.statics.findPending = function (limit: number = 100): Promise<IDLQEntry[]> {
  return this.find({
    status: 'pending',
    $or: [
      { nextReplayAt: { $exists: false } },
      { nextReplayAt: { $lte: new Date() } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

DLQEntrySchema.statics.findByEventType = function (eventType: string): Promise<IDLQEntry[]> {
  return this.find({ eventType, status: 'pending' })
    .sort({ createdAt: -1 })
    .exec();
};

DLQEntrySchema.statics.findByTags = function (tags: string[]): Promise<IDLQEntry[]> {
  return this.find({ tags: { $in: tags }, status: 'pending' })
    .sort({ createdAt: -1 })
    .exec();
};

export const DLQEntry = mongoose.model<IDLQEntry, IDLQEntryModel>('DLQEntry', DLQEntrySchema);
