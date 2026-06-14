import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * StoreAnalytics - Tracks events and analytics for REZ Now store pages.
 * Events include: link_click, qr_scan, page_view, download
 */
export interface IStoreAnalytics extends Document {
  storeId: Types.ObjectId;
  totalViews: number;
  totalClicks: number;
  totalScans: number;
  linkClicks: Map<string, number>; // linkId -> click count
  deviceBreakdown: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const StoreAnalyticsSchema = new Schema<IStoreAnalytics>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalScans: { type: Number, default: 0 },
    linkClicks: { type: Map, of: Number, default: {} },
    deviceBreakdown: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

StoreAnalyticsSchema.index({ storeId: 1 });

export const StoreAnalytics = mongoose.models.StoreAnalytics || mongoose.model<IStoreAnalytics>('StoreAnalytics', StoreAnalyticsSchema);

/**
 * StoreEvent - Individual analytics events for timeline and detailed tracking.
 */
export interface IStoreEvent extends Document {
  storeId: Types.ObjectId;
  eventType: 'link_click' | 'qr_scan' | 'page_view' | 'download';
  eventData: Record<string, unknown>;
  deviceInfo: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
  linkId?: string;
  timestamp: Date;
  createdAt: Date;
}

const StoreEventSchema = new Schema<IStoreEvent>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    eventType: {
      type: String,
      required: true,
      enum: ['link_click', 'qr_scan', 'page_view', 'download'],
    },
    eventData: { type: Schema.Types.Mixed, default: {} },
    deviceInfo: {
      userAgent: { type: String, default: '' },
      deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    },
    linkId: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

StoreEventSchema.index({ storeId: 1, timestamp: -1 });
StoreEventSchema.index({ storeId: 1, eventType: 1, timestamp: -1 });

export const StoreEvent = mongoose.models.StoreEvent || mongoose.model<IStoreEvent>('StoreEvent', StoreEventSchema);
