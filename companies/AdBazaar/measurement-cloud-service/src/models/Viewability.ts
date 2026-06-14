import mongoose, { Document, Schema } from 'mongoose';

// Viewability standards
export enum ViewabilityStandard {
  IAB_STANDARD = 'iab', // 50% of pixels visible for 1 second (display), 50% for 2 seconds (video)
  MRC_STANDARD = 'mrc', // Media Rating Council standard
  OMID_STANDARD = 'omid', // Open Measurement Interface Definition
  CUSTOM = 'custom'
}

// Viewability status
export enum ViewabilityStatus {
  VIEWABLE = 'viewable',
  NOT_VIEWABLE = 'not_viewable',
  UNMEASURABLE = 'unmeasurable'
}

// Viewability measurement interface
export interface IViewabilityMeasurement {
  impressionId: string;
  timestamp: Date;
  standard: ViewabilityStandard;
  status: ViewabilityStatus;
  viewableTime: number; // milliseconds
  visibleArea: number; // percentage
  inViewStart?: Date;
  inViewEnd?: Date;
  playerState?: {
    paused: boolean;
    muted: boolean;
    fullscreen: boolean;
    autoplay: boolean;
  };
  metadata?: Record<string, unknown>;
}

// Viewability document interface
export interface IViewability extends Document {
  campaignId: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  viewableImpressions: number;
  totalImpressions: number;
  viewabilityRate: number;
  measurableRate: number;
  standard: ViewabilityStandard;
  metrics: {
    avgViewableTime: number;
    medianViewableTime: number;
    pctFullyOnScreen: number;
    pct50OnScreen: number;
    pct100OnScreen: number;
  };
  breakdown: {
    device: {
      desktop: number;
      mobile: number;
      tablet: number;
      ctv: number;
    };
    format: {
      display: number;
      video: number;
      native: number;
    };
    placement: {
      preRoll: number;
      midRoll: number;
      postRoll: number;
      inFeed: number;
      banner: number;
    };
  };
  measurements: IViewabilityMeasurement[];
  fraudIndicators?: {
    suspiciousPatterns: number;
    nonHumanTraffic: number;
    viewabilityAnomalies: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Viewability schema
const viewabilitySchema = new Schema<IViewability>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    viewableImpressions: {
      type: Number,
      required: true
    },
    totalImpressions: {
      type: Number,
      required: true
    },
    viewabilityRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    measurableRate: {
      type: Number,
      min: 0,
      max: 100
    },
    standard: {
      type: String,
      enum: Object.values(ViewabilityStandard),
      required: true
    },
    metrics: {
      avgViewableTime: { type: Number, default: 0 },
      medianViewableTime: { type: Number, default: 0 },
      pctFullyOnScreen: { type: Number, default: 0 },
      pct50OnScreen: { type: Number, default: 0 },
      pct100OnScreen: { type: Number, default: 0 }
    },
    breakdown: {
      device: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 },
        ctv: { type: Number, default: 0 }
      },
      format: {
        display: { type: Number, default: 0 },
        video: { type: Number, default: 0 },
        native: { type: Number, default: 0 }
      },
      placement: {
        preRoll: { type: Number, default: 0 },
        midRoll: { type: Number, default: 0 },
        postRoll: { type: Number, default: 0 },
        inFeed: { type: Number, default: 0 },
        banner: { type: Number, default: 0 }
      }
    },
    measurements: [
      {
        impressionId: String,
        timestamp: Date,
        standard: String,
        status: String,
        viewableTime: Number,
        visibleArea: Number,
        inViewStart: Date,
        inViewEnd: Date,
        playerState: {
          paused: Boolean,
          muted: Boolean,
          fullscreen: Boolean,
          autoplay: Boolean
        },
        metadata: { type: Schema.Types.Mixed }
      }
    ],
    fraudIndicators: {
      suspiciousPatterns: { type: Number, default: 0 },
      nonHumanTraffic: { type: Number, default: 0 },
      viewabilityAnomalies: { type: Number, default: 0 }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes
viewabilitySchema.index({ campaignId: 1, timestamp: -1 });
viewabilitySchema.index({ campaignId: 1, 'period.start': 1, 'period.end': 1 });
viewabilitySchema.index({ standard: 1 });

export const Viewability = mongoose.model<IViewability>('Viewability', viewabilitySchema);

// Video viewability for CTV/streaming
export interface IVideoViewability extends Document {
  campaignId: string;
  videoId: string;
  sessionId: string;
  timestamp: Date;
  playerInfo: {
    playerType: string;
    playerVersion: string;
    sdkVersion: string;
  };
  videoInfo: {
    duration: number;
    currentPosition: number;
    isMidroll: boolean;
  };
  viewability: {
    status: ViewabilityStatus;
    visibleArea: number;
    audibleInView: boolean;
    fullyOnScreen: boolean;
    inViewStartTime: Date;
    inViewEndTime?: Date;
    totalViewableTime: number;
  };
  completionRate: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const videoViewabilitySchema = new Schema<IVideoViewability>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    videoId: {
      type: String,
      required: true
    },
    sessionId: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    playerInfo: {
      playerType: String,
      playerVersion: String,
      sdkVersion: String
    },
    videoInfo: {
      duration: Number,
      currentPosition: Number,
      isMidroll: Boolean
    },
    viewability: {
      status: {
        type: String,
        enum: Object.values(ViewabilityStatus)
      },
      visibleArea: Number,
      audibleInView: Boolean,
      fullyOnScreen: Boolean,
      inViewStartTime: Date,
      inViewEndTime: Date,
      totalViewableTime: Number
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

videoViewabilitySchema.index({ campaignId: 1, timestamp: -1 });
videoViewabilitySchema.index({ sessionId: 1 });

export const VideoViewability = mongoose.model<IVideoViewability>(
  'VideoViewability',
  videoViewabilitySchema
);

// Index for models
export const models = {
  Measurement: mongoose.model('Measurement', new Schema({}, { strict: false }),
  Attribution: mongoose.model('Attribution', new Schema({}, { strict: false })),
  BrandSafety: mongoose.model('BrandSafety', new Schema({}, { strict: false })),
  Viewability: mongoose.model('Viewability', new Schema({}, { strict: false }))
};