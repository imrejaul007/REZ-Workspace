import mongoose, { Schema, Document } from 'mongoose';

// Location data structure
export interface ITopLocation {
  city: string;
  country?: string;
  percentage: number;
}

// Age range gender breakdown
export interface IAgeRangeGender {
  range: string;
  male: number;
  female: number;
  other?: number;
}

// Active hours data
export interface IActiveHours {
  hour: number;
  percentage: number;
}

// Active days data
export interface IActiveDays {
  day: string;
  percentage: number;
}

// Follower growth data point
export interface IFollowerGrowth {
  date: Date;
  count: number;
  change: number;
}

// Online followers data
export interface IOnlineFollowers {
  dayOfWeek: string;
  hour: number;
  percentage: number;
}

// Audience Country/Age/Gender breakdown
export interface IAudienceCountry {
  country: string;
  percentage: number;
  change?: number;
}

export interface IAudienceAge {
  ageRange: string;
  male: number;
  female: number;
  other?: number;
  percentage: number;
}

// Audience Insights Document Interface
export interface IAudienceInsights extends Document {
  accountId: string;
  date: Date;
  topLocations: ITopLocation[];
  ageRanges: IAgeRangeGender[];
  genderSplit: {
    male: number;
    female: number;
    other?: number;
  };
  activeHours: IActiveHours[];
  activeDays: IActiveDays[];
  followerGrowth: IFollowerGrowth[];
  onlineFollowers?: IOnlineFollowers[];
  audienceCountry: IAudienceCountry[];
  audienceAge: IAudienceAge[];
  audienceGenderAge?: {
    [key: string]: { male: number; female: number; other?: number };
  };
  reachedAudience?: {
    byCountry: { [country: string]: number };
    byAge: { [age: string]: number };
    byGender: { male: number; female: number };
  };
  engagedAudience?: {
    byCountry: { [country: string]: number };
    byAge: { [age: string]: number };
    byGender: { male: number; female: number };
  };
  impressionsByCountry?: { [country: string]: number };
  followerSource?: { [source: string]: number };
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for AudienceInsights
const TopLocationSchema = new Schema<ITopLocation>(
  {
    city: { type: String, required: true },
    country: { type: String, default: null },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const AgeRangeGenderSchema = new Schema<IAgeRangeGender>(
  {
    range: { type: String, required: true },
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  { _id: false }
);

const ActiveHoursSchema = new Schema<IActiveHours>(
  {
    hour: { type: Number, required: true, min: 0, max: 23 },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const ActiveDaysSchema = new Schema<IActiveDays>(
  {
    day: { type: String, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const FollowerGrowthSchema = new Schema<IFollowerGrowth>(
  {
    date: { type: Date, required: true },
    count: { type: Number, required: true },
    change: { type: Number, default: 0 },
  },
  { _id: false }
);

const OnlineFollowersSchema = new Schema<IOnlineFollowers>(
  {
    dayOfWeek: { type: String, required: true },
    hour: { type: Number, required: true, min: 0, max: 23 },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const AudienceCountrySchema = new Schema<IAudienceCountry>(
  {
    country: { type: String, required: true },
    percentage: { type: Number, required: true },
    change: { type: Number, default: 0 },
  },
  { _id: false }
);

const AudienceAgeSchema = new Schema<IAudienceAge>(
  {
    ageRange: { type: String, required: true },
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const AudienceInsightsSchema = new Schema<IAudienceInsights>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    topLocations: {
      type: [TopLocationSchema],
      default: [],
    },
    ageRanges: {
      type: [AgeRangeGenderSchema],
      default: [],
    },
    genderSplit: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    activeHours: {
      type: [ActiveHoursSchema],
      default: [],
    },
    activeDays: {
      type: [ActiveDaysSchema],
      default: [],
    },
    followerGrowth: {
      type: [FollowerGrowthSchema],
      default: [],
    },
    onlineFollowers: {
      type: [OnlineFollowersSchema],
      default: [],
    },
    audienceCountry: {
      type: [AudienceCountrySchema],
      default: [],
    },
    audienceAge: {
      type: [AudienceAgeSchema],
      default: [],
    },
    audienceGenderAge: {
      type: Map,
      of: new Schema(
        {
          male: { type: Number, default: 0 },
          female: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => new Map(),
    },
    reachedAudience: {
      byCountry: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      byAge: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      byGender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
      },
    },
    engagedAudience: {
      byCountry: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      byAge: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      byGender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
      },
    },
    impressionsByCountry: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    followerSource: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'audience_insights',
  }
);

// Compound index for efficient queries
AudienceInsightsSchema.index({ accountId: 1, date: -1 });
AudienceInsightsSchema.index({ 'topLocations.city': 1 });
AudienceInsightsSchema.index({ 'ageRanges.range': 1 });

// Static method to get latest audience insights
AudienceInsightsSchema.statics.findLatest = function (
  accountId: string
): Promise<IAudienceInsights | null> {
  return this.findOne({ accountId }).sort({ date: -1 }).exec();
};

// Static method to get audience insights for date range
AudienceInsightsSchema.statics.findByDateRange = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<IAudienceInsights[]> {
  return this.find({
    accountId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .exec();
};

// Static method to get follower growth trend
AudienceInsightsSchema.statics.getFollowerGrowthTrend = function (
  accountId: string,
  days: number = 30
): Promise<IFollowerGrowth[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { accountId, date: { $gte: startDate } } },
    { $unwind: '$followerGrowth' },
    { $sort: { 'followerGrowth.date': 1 } },
    {
      $group: {
        _id: '$followerGrowth.date',
        count: { $first: '$followerGrowth.count' },
        change: { $first: '$followerGrowth.change' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1, change: 1 } },
  ]).exec();
};

// Static method to get peak active hours
AudienceInsightsSchema.statics.getPeakActiveHours = async function (
  accountId: string
): Promise<{ peakHours: number[]; peakDays: string[] }> {
  const latest = await this.findOne({ accountId }).sort({ date: -1 }).exec();

  if (!latest) {
    return { peakHours: [], peakDays: [] };
  }

  // Find top 3 peak hours
  const sortedHours = [...latest.activeHours].sort(
    (a, b) => b.percentage - a.percentage
  );
  const peakHours = sortedHours.slice(0, 3).map((h) => h.hour);

  // Find top 3 peak days
  const sortedDays = [...latest.activeDays].sort(
    (a, b) => b.percentage - a.percentage
  );
  const peakDays = sortedDays.slice(0, 3).map((d) => d.day);

  return { peakHours, peakDays };
};

export const AudienceInsights =
  mongoose.models.AudienceInsights ||
  mongoose.model<IAudienceInsights>('AudienceInsights', AudienceInsightsSchema);