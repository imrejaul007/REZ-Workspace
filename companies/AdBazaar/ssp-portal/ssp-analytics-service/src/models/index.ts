import mongoose, { Document, Schema, Model } from 'mongoose';

// Event type enum
export type EventType = 'impression' | 'view' | 'click' | 'engagement';

// Metadata interface for additional event data
export interface IEventMetadata {
  duration?: number; // Duration in milliseconds
  viewTime?: number;        // Time spent viewing (seconds)
  interactionType?: string; // Type of interaction (hover, tap, etc.)
  deviceType?: string;      // mobile, desktop, tablet, digital-signage
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
    country?: string;
  };
  screenSize?: {
    width: number;
    height: number;
  };
  visibilityPercentage?: number; // How much of the ad was visible (0-100)
  audioPlaying?: boolean;
  engagementScore?: number; // 0-100 engagement score
  demographicData?: {
    ageRange?: string;
    gender?: string;
    estimatedAge?: number;
  };
  contextData?: {
    venueType?: string;     // mall, airport, transit, etc.
    dayOfWeek?: string;
    timeOfDay?: string;
    weather?: string;
  };
  customData?: Record<string, unknown>;
}

// Analytics Event Interface
export interface IAnalyticsEvent extends Document {
  eventId: string;
  eventType: EventType;
  screenId: string;
  advertiserId: string;
  campaignId: string;
  creativeId: string;
  timestamp: Date;
  metadata: IEventMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Event Schema
const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      enum: ['impression', 'view', 'click', 'engagement'],
      index: true
    },
    screenId: {
      type: String,
      required: true,
      index: true
    },
    advertiserId: {
      type: String,
      required: true,
      index: true
    },
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    creativeId: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'analytics_events'
  }
);

// Compound indexes for common queries
AnalyticsEventSchema.index({ screenId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ advertiserId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ campaignId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ screenId: 1, eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ advertiserId: 1, eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ campaignId: 1, eventType: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - 90 days retention)
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for event age
AnalyticsEventSchema.virtual('ageInHours').get(function(this: IAnalyticsEvent) {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60));
});

// Static methods
AnalyticsEventSchema.statics = {
  // Count events by type for a screen
  async countByScreen(screenId: string, startDate?: Date, endDate?: Date): Promise<Record<EventType, number>> {
    const match: Record<string, unknown> = { screenId };
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) (match.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (match.timestamp as Record<string, Date>).$lte = endDate;
    }

    const results = await this.aggregate([
      { $match: match },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);

    const counts: Record<EventType, number> = {
      impression: 0,
      view: 0,
      click: 0,
      engagement: 0
    };

    results.forEach((r) => {
      counts[r._id as EventType] = r.count;
    });

    return counts;
  },

  // Get daily aggregation
  async getDailyStats(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    impressions: number;
    views: number;
    clicks: number;
    engagements: number;
  }>> {
    return this.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          events: { $push: { type: '$_id.eventType', count: '$count' } }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: {
            $ifNull: [
              { $arrayElemAt: [{ $filter: { input: '$events', as: 'e', cond: { $eq: ['$$e.type', 'impression'] } } }, 0] }, { count: 0 }
            ]
          },
          views: {
            $ifNull: [
              { $arrayElemAt: [{ $filter: { input: '$events', as: 'e', cond: { $eq: ['$$e.type', 'view'] } } }, 0] }, { count: 0 }
            ]
          },
          clicks: {
            $ifNull: [
              { $arrayElemAt: [{ $filter: { input: '$events', as: 'e', cond: { $eq: ['$$e.type', 'click'] } } }, 0] }, { count: 0 }
            ]
          },
          engagements: {
            $ifNull: [
              { $arrayElemAt: [{ $filter: { input: '$events', as: 'e', cond: { $eq: ['$$e.type', 'engagement'] } } }, 0] }, { count: 0 }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);
  },

  // Get engagement rate
  async getEngagementRate(startDate: Date, endDate: Date): Promise<{
    totalImpressions: number;
    totalViews: number;
    totalClicks: number;
    totalEngagements: number;
    viewRate: number;
    clickRate: number;
    engagementRate: number;
  }> {
    const results = await this.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalImpressions = 0;
    let totalViews = 0;
    let totalClicks = 0;
    let totalEngagements = 0;

    results.forEach((r) => {
      switch (r._id) {
        case 'impression': totalImpressions = r.count; break;
        case 'view': totalViews = r.count; break;
        case 'click': totalClicks = r.count; break;
        case 'engagement': totalEngagements = r.count; break;
      }
    });

    return {
      totalImpressions,
      totalViews,
      totalClicks,
      totalEngagements,
      viewRate: totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0,
      clickRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      engagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0
    };
  }
};

// Export the model
export const AnalyticsEvent: Model<IAnalyticsEvent> = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);

export default AnalyticsEvent;