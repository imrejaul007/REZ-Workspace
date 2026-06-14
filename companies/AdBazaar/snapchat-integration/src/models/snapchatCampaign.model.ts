import mongoose, { Schema, Document } from 'mongoose';

export type CampaignObjective = 'VIDEO_VIEW' | 'WEB_VIEW' | 'APP_INSTALL' | 'AUDIENCE' | 'BRAND_AWARENESS';
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface ITargeting {
  ageMin: number;
  ageMax: number;
  genders: string[];
  countries: string[];
  interests?: string[];
}

export interface ISnapchatCampaign {
  id: string;
  adAccountId: string;
  snapchatCampaignId: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  dailyBudget: number;
  totalBudget: number;
  startDate: Date;
  endDate?: Date;
  targeting: ITargeting;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISnapchatCampaignDocument extends ISnapchatCampaign, Document {
  _id: mongoose.Types.ObjectId;
}

const TargetingSchema = new Schema<ITargeting>(
  {
    ageMin: { type: Number, default: 13 },
    ageMax: { type: Number, default: 65 },
    genders: { type: [String], default: ['ALL'] },
    countries: { type: [String], default: ['US'] },
    interests: { type: [String] },
  },
  { _id: false }
);

const SnapchatCampaignSchema = new Schema<ISnapchatCampaignDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    adAccountId: { type: String, required: true, index: true },
    snapchatCampaignId: { type: String, index: true },
    name: { type: String, required: true },
    objective: {
      type: String,
      enum: ['VIDEO_VIEW', 'WEB_VIEW', 'APP_INSTALL', 'AUDIENCE', 'BRAND_AWARENESS'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'PAUSED',
    },
    dailyBudget: { type: Number, default: 0 },
    totalBudget: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    targeting: { type: TargetingSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'snapchat_campaigns',
  }
);

SnapchatCampaignSchema.index({ adAccountId: 1, status: 1 });
SnapchatCampaignSchema.index({ snapchatCampaignId: 1 });

export const SnapchatCampaign = mongoose.model<ISnapchatCampaignDocument>(
  'SnapchatCampaign',
  SnapchatCampaignSchema
);
