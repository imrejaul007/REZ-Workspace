import mongoose, { Document, Schema } from 'mongoose';
import { ChannelType, AttributionModel } from '../types';

export interface IChannel {
  channelId: string;
  name: string;
  type: ChannelType;
  spend: number;
  reach?: number;
  frequency?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  conversionsPerSpend?: number;
  revenuePerSpend?: number;
  dataPoints: Array<{
    date: Date;
    spend: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: number;
  }>;
}

export interface IChannelDocument extends IChannel, Document {}

const ChannelSchema = new Schema<IChannelDocument>(
  {
    channelId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['TV', 'DIGITAL', 'SOCIAL', 'SEARCH', 'DISPLAY', 'VIDEO', 'OOH', 'PRINT', 'AUDIO', 'INFLUENCER', 'AFFILIATE', 'EMAIL', 'SMS', 'OTHER'],
      required: true
    },
    spend: { type: Number, required: true, min: 0 },
    reach: { type: Number },
    frequency: { type: Number },
    impressions: { type: Number },
    clicks: { type: Number },
    conversions: { type: Number },
    revenue: { type: Number },
    conversionsPerSpend: { type: Number },
    revenuePerSpend: { type: Number },
    dataPoints: [
      {
        date: Date,
        spend: Number,
        impressions: Number,
        clicks: Number,
        conversions: Number,
        revenue: Number
      }
    ]
  },
  { timestamps: true }
);

ChannelSchema.index({ channelId: 1 });

export const Channel = mongoose.model<IChannelDocument>('Channel', ChannelSchema);