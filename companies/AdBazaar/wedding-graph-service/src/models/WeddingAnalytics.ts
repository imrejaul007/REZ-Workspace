import mongoose, { Document, Schema } from 'mongoose';

// Campaign interface for tracking ad campaigns
export interface ICampaign extends Document {
  campaignId: string;
  weddingId: string;
  name: string;
  type: 'awareness' | 'conversion' | 'retargeting' | 'lookalike';
  platform: 'google' | 'facebook' | 'instagram' | 'meta' | 'youtube' | 'tiktok';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'rejected';
  budget: {
    total: number;
    spent: number;
    dailyLimit?: number;
    currency: string;
  };
  targeting: {
    ageMin?: number;
    ageMax?: number;
    gender?: 'male' | 'female' | 'all';
    interests?: string[];
    locations?: string[];
    lookalikeSource?: string;
  };
  startDate: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversionRate: number;
  reach: number;
  frequency: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    saves: number;
  };
  cost: {
    total: number;
    perImpression: number;
    perClick: number;
    perConversion: number;
  };
  roas: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// WeddingAnalytics interface
export interface IWeddingAnalytics extends Document {
  weddingId: string;
  date: Date;
  dailyMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    reach: number;
    engagement: {
      likes: number;
      shares: number;
      comments: number;
      saves: number;
    };
  };
  campaignMetrics: {
    activeCampaigns: number;
    totalSpend: number;
    avgCtr: number;
    avgRoi: number;
  };
  guestMetrics: {
    totalGuests: number;
    confirmedGuests: number;
    pendingRsvps: number;
    giftSenders: number;
    avgGiftValue: number;
  };
  vendorMetrics: {
    bookedVendors: number;
    pendingBookings: number;
    totalVendorSpend: number;
  };
  budgetMetrics: {
    totalBudget: number;
    totalSpent: number;
    projectedSpend: number;
    budgetUtilization: number;
  };
  locationMetrics: {
    city: string;
    state: string;
    topLocations: {
      location: string;
      guestCount: number;
      percentage: number;
    }[];
  };
  dietaryMetrics: {
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    halal: number;
    kosher: number;
    other: number;
  };
  trendMetrics: {
    rsvpTrend: {
      date: string;
      count: number;
    }[];
    budgetTrend: {
      date: string;
      spent: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Campaign schema
const CampaignSchema = new Schema<ICampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    weddingId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['awareness', 'conversion', 'retargeting', 'lookalike'],
      default: 'awareness'
    },
    platform: {
      type: String,
      enum: ['google', 'facebook', 'instagram', 'meta', 'youtube', 'tiktok'],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'rejected'],
      default: 'draft'
    },
    budget: {
      total: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      dailyLimit: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    targeting: {
      ageMin: { type: Number, min: 18, max: 65 },
      ageMax: { type: Number, min: 18, max: 65 },
      gender: { type: String, enum: ['male', 'female', 'all'] },
      interests: [{ type: String }],
      locations: [{ type: String }],
      lookalikeSource: { type: String }
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    ctr: {
      type: Number,
      default: 0
    },
    cpc: {
      type: Number,
      default: 0
    },
    cpm: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    frequency: {
      type: Number,
      default: 0
    },
    engagement: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      saves: { type: Number, default: 0 }
    },
    cost: {
      total: { type: Number, default: 0 },
      perImpression: { type: Number, default: 0 },
      perClick: { type: Number, default: 0 },
      perConversion: { type: Number, default: 0 }
    },
    roas: {
      type: Number,
      default: 0
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'campaigns'
  }
);

// WeddingAnalytics schema
const WeddingAnalyticsSchema = new Schema<IWeddingAnalytics>(
  {
    weddingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    dailyMetrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      engagement: {
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        saves: { type: Number, default: 0 }
      }
    },
    campaignMetrics: {
      activeCampaigns: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
      avgCtr: { type: Number, default: 0 },
      avgRoi: { type: Number, default: 0 }
    },
    guestMetrics: {
      totalGuests: { type: Number, default: 0 },
      confirmedGuests: { type: Number, default: 0 },
      pendingRsvps: { type: Number, default: 0 },
      giftSenders: { type: Number, default: 0 },
      avgGiftValue: { type: Number, default: 0 }
    },
    vendorMetrics: {
      bookedVendors: { type: Number, default: 0 },
      pendingBookings: { type: Number, default: 0 },
      totalVendorSpend: { type: Number, default: 0 }
    },
    budgetMetrics: {
      totalBudget: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      projectedSpend: { type: Number, default: 0 },
      budgetUtilization: { type: Number, default: 0 }
    },
    locationMetrics: {
      city: { type: String },
      state: { type: String },
      topLocations: [
        {
          location: { type: String },
          guestCount: { type: Number },
          percentage: { type: Number }
        }
      ]
    },
    dietaryMetrics: {
      vegetarian: { type: Number, default: 0 },
      vegan: { type: Number, default: 0 },
      glutenFree: { type: Number, default: 0 },
      halal: { type: Number, default: 0 },
      kosher: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    trendMetrics: {
      rsvpTrend: [
        {
          date: { type: String },
          count: { type: Number }
        }
      ],
      budgetTrend: [
        {
          date: { type: String },
          spent: { type: Number }
        }
      ]
    }
  },
  {
    timestamps: true,
    collection: 'wedding_analytics'
  }
);

// Indexes
WeddingAnalyticsSchema.index({ weddingId: 1, date: -1 });

// Export models
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const WeddingAnalytics = mongoose.model<IWeddingAnalytics>('WeddingAnalytics', WeddingAnalyticsSchema);