import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventTwin extends Document {
  _id: mongoose.Types.ObjectId;
  event_id: string;
  twin_id: string;
  event_type: 'concert' | 'festival' | 'sports' | 'theater' | 'conference' | 'exhibition' | 'meeting' | 'private' | 'virtual' | 'hybrid';
  name: string;
  description?: string;
  attributes: {
    category?: string;
    genre: string[];
    age_restriction?: string;
    dress_code?: string;
    is_private: boolean;
    is_virtual: boolean;
    is_hybrid: boolean;
  };
  schedule: {
    start_date_time: Date;
    end_date_time: Date;
    timezone?: string;
    doors_open?: string;
    recurrence?: {
      pattern: string;
      interval: number;
      end_date?: Date;
    };
  };
  venue: {
    venue_id?: string;
    virtual_platform?: string;
    room_name?: string;
  };
  ticketing: {
    total_capacity: number;
    tickets_sold: number;
    tickets_reserved: number;
    tickets_available: number;
    pricing: Array<{
      tier: string;
      price: number;
      currency: string;
      quantity: number;
    }>;
    sales_status: 'not_started' | 'on_sale' | 'sold_out' | 'cancelled';
    waitlist_enabled: boolean;
    transfer_enabled: boolean;
  };
  attendance_metrics: {
    expected_attendance: number;
    actual_attendance: number;
    virtual_attendees: number;
    no_show_rate: number;
    avg_dwell_time: number;
    peak_attendance: number;
    avg_check_in_time: number;
  };
  engagement_metrics: {
    social_mentions: number;
    sentiment: { positive: number; neutral: number; negative: number };
    qr_scans: number;
    content_views: number;
    ticket_resales: number;
  };
  sponsorships: Array<{
    brand_id: string;
    sponsorship_level: 'title' | 'presenting' | 'gold' | 'silver' | 'bronze';
    value: number;
    currency: string;
    deliverables: string[];
  }>;
  relationships: {
    venues: Array<{ venue_id: string; location_type: string }>;
    creators: Array<{ creator_id: string; role: string; is_headliner: boolean }>;
    content: Array<{ content_id: string; usage_type: string }>;
    audiences: Array<{ audience_id: string; ticket_status: string }>;
  };
  version: number;
  created_at: Date;
  updated_at: Date;
  managing_agent?: string;
}

const EventTwinSchema = new Schema<IEventTwin>({
  event_id: { type: String, required: true, unique: true, index: true },
  twin_id: { type: String, required: true, unique: true, index: true },
  event_type: {
    type: String,
    enum: ['concert', 'festival', 'sports', 'theater', 'conference', 'exhibition', 'meeting', 'private', 'virtual', 'hybrid'],
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  description: String,
  attributes: {
    category: String,
    genre: [{ type: String }],
    age_restriction: String,
    dress_code: String,
    is_private: { type: Boolean, default: false },
    is_virtual: { type: Boolean, default: false },
    is_hybrid: { type: Boolean, default: false },
  },
  schedule: {
    start_date_time: { type: Date, required: true },
    end_date_time: { type: Date, required: true },
    timezone: String,
    doors_open: String,
    recurrence: {
      pattern: String,
      interval: Number,
      end_date: Date,
    },
  },
  venue: {
    venue_id: String,
    virtual_platform: String,
    room_name: String,
  },
  ticketing: {
    total_capacity: { type: Number, default: 0 },
    tickets_sold: { type: Number, default: 0 },
    tickets_reserved: { type: Number, default: 0 },
    tickets_available: { type: Number, default: 0 },
    pricing: [{
      tier: String,
      price: Number,
      currency: { type: String, default: 'USD' },
      quantity: Number,
    }],
    sales_status: {
      type: String,
      enum: ['not_started', 'on_sale', 'sold_out', 'cancelled'],
      default: 'not_started',
    },
    waitlist_enabled: { type: Boolean, default: false },
    transfer_enabled: { type: Boolean, default: false },
  },
  attendance_metrics: {
    expected_attendance: { type: Number, default: 0 },
    actual_attendance: { type: Number, default: 0 },
    virtual_attendees: { type: Number, default: 0 },
    no_show_rate: { type: Number, default: 0 },
    avg_dwell_time: { type: Number, default: 0 },
    peak_attendance: { type: Number, default: 0 },
    avg_check_in_time: { type: Number, default: 0 },
  },
  engagement_metrics: {
    social_mentions: { type: Number, default: 0 },
    sentiment: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
    qr_scans: { type: Number, default: 0 },
    content_views: { type: Number, default: 0 },
    ticket_resales: { type: Number, default: 0 },
  },
  sponsorships: [{
    brand_id: String,
    sponsorship_level: { type: String, enum: ['title', 'presenting', 'gold', 'silver', 'bronze'] },
    value: Number,
    currency: { type: String, default: 'USD' },
    deliverables: [{ type: String }],
  }],
  relationships: {
    venues: [{ venue_id: String, location_type: String }],
    creators: [{ creator_id: String, role: String, is_headliner: Boolean }],
    content: [{ content_id: String, usage_type: String }],
    audiences: [{ audience_id: String, ticket_status: String }],
  },
  version: { type: Number, default: 1 },
  managing_agent: { type: String, default: 'venue-agent' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

EventTwinSchema.index({ event_type: 1, 'schedule.start_date_time': 1 });
EventTwinSchema.index({ 'schedule.start_date_time': 1 });
EventTwinSchema.index({ 'ticketing.sales_status': 1 });
EventTwinSchema.index({ 'relationships.venues.venue_id': 1 });
EventTwinSchema.index({ 'relationships.creators.creator_id': 1 });

EventTwinSchema.virtual('id').get(function() { return this._id.toHexString(); });
EventTwinSchema.set('toJSON', { virtuals: true });
EventTwinSchema.set('toObject', { virtuals: true });

export const EventTwinModel: Model<IEventTwin> = mongoose.model<IEventTwin>('EventTwin', EventTwinSchema);