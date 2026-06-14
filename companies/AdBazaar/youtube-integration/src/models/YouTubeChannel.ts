import mongoose, { Document, Schema } from 'mongoose';

export interface IYouTubeChannel extends Document {
  id: string;
  youtubeChannelId: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  connectedAt: Date;
  accessToken?: string;
  refreshToken?: string;
  thumbnailUrl?: string;
  customUrl?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

const YouTubeChannelSchema = new Schema<IYouTubeChannel>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    youtubeChannelId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    customUrl: {
      type: String,
    },
    country: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

YouTubeChannelSchema.index({ youtubeChannelId: 1 });
YouTubeChannelSchema.index({ connectedAt: -1 });

export const YouTubeChannel = mongoose.model<IYouTubeChannel>('YouTubeChannel', YouTubeChannelSchema);

export default YouTubeChannel;