import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * EventAnalytics - Daily analytics tracking for events.
 * Aggregates sales, checkins, no-shows, refunds, and revenue metrics.
 */
export interface IEventAnalytics extends Document {
  eventId: Types.ObjectId;
  storeId: Types.ObjectId;
  date: Date;
  ticketsSold: number;
  ticketsAvailable: number;
  revenue: number;
  checkins: number;
  noShows: number;
  refunds: number;
  refundAmount: number;
  avgTicketPrice: number;
  occupancyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventAnalyticsSchema = new Schema<IEventAnalytics>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    date: { type: Date, required: true },
    ticketsSold: { type: Number, default: 0 },
    ticketsAvailable: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    checkins: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    avgTicketPrice: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Compound unique index: one analytics record per event per day
EventAnalyticsSchema.index({ eventId: 1, date: 1 }, { unique: true });
EventAnalyticsSchema.index({ eventId: 1 });
EventAnalyticsSchema.index({ storeId: 1, date: -1 });

export const EventAnalytics = mongoose.models.EventAnalytics || mongoose.model<IEventAnalytics>('EventAnalytics', EventAnalyticsSchema);
