import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  contentId: string;
  sessionId: string;
  userId?: string;
  eventType: 'view' | 'click' | 'scroll' | 'share' | 'download' | 'comment' | 'like' | 'save';
  eventData: {
    element?: string;
    position?: { x: number; y: number };
    scrollDepth?: number;
    referrer?: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    duration?: number;
    metadata?: Record<string, any>;
  };
  timestamp: Date;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    eventType: {
      type: String,
      enum: ['view', 'click', 'scroll', 'share', 'download', 'comment', 'like', 'save'],
      required: true,
      index: true
    },
    eventData: {
      element: String,
      position: {
        x: Number,
        y: Number
      },
      scrollDepth: Number,
      referrer: String,
      device: String,
      browser: String,
      os: String,
      country: String,
      region: String,
      duration: Number,
      metadata: Schema.Types.Mixed
    },
    timestamp: { type: Date, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EventSchema.index({ contentId: 1, eventType: 1, timestamp: -1 });
EventSchema.index({ sessionId: 1, timestamp: -1 });
EventSchema.index({ timestamp: -1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);