import mongoose, { Schema, Document } from 'mongoose';

export interface IPixelEvent {
  eventType: string;
  timestamp: Date;
  userId?: string;
  email?: string;
  phone?: string;
  eventData?: Record<string, unknown>;
}

export interface ISnapchatPixel {
  id: string;
  adAccountId: string;
  name: string;
  description: string;
  pixelId?: string;
  pixelType: 'WEB' | 'APP';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  webUrl?: string;
  appIds?: string[];
  events: IPixelEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISnapchatPixelDocument extends ISnapchatPixel, Document {
  _id: mongoose.Types.ObjectId;
}

const PixelEventSchema = new Schema<IPixelEvent>(
  {
    eventType: { type: String, required: true },
    timestamp: { type: Date, required: true },
    userId: { type: String },
    email: { type: String },
    phone: { type: String },
    eventData: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const SnapchatPixelSchema = new Schema<ISnapchatPixelDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    adAccountId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    pixelId: { type: String, index: true },
    pixelType: { type: String, enum: ['WEB', 'APP'], default: 'WEB' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
      default: 'ACTIVE',
    },
    webUrl: { type: String },
    appIds: { type: [String] },
    events: { type: [PixelEventSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'snapchat_pixels',
  }
);

SnapchatPixelSchema.index({ adAccountId: 1, status: 1 });
SnapchatPixelSchema.index({ pixelId: 1 });

export const SnapchatPixel = mongoose.model<ISnapchatPixelDocument>(
  'SnapchatPixel',
  SnapchatPixelSchema
);
