import mongoose, { Document, Schema } from 'mongoose';

export type LiveStreamStatus = 'created' | 'live' | 'completed' | 'failed';

export interface ILiveStream extends Document {
  id: string;
  streamKey: string;
  youtubeChannelId: string;
  youtubeBroadcastId?: string;
  youtubeStreamId?: string;
  title: string;
  description?: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: LiveStreamStatus;
  currentViewers?: number;
  peakViewers?: number;
  totalViews?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiveStreamSchema = new Schema<ILiveStream>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    streamKey: {
      type: String,
      required: true,
    },
    youtubeChannelId: {
      type: String,
      required: true,
      index: true,
    },
    youtubeBroadcastId: {
      type: String,
      index: true,
    },
    youtubeStreamId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    privacyStatus: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    scheduledStartTime: {
      type: Date,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['created', 'live', 'completed', 'failed'],
      default: 'created',
    },
    currentViewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

LiveStreamSchema.index({ streamKey: 1 });
LiveStreamSchema.index({ youtubeBroadcastId: 1 });
LiveStreamSchema.index({ youtubeChannelId: 1, status: 1 });
LiveStreamSchema.index({ scheduledStartTime: 1 });

export const LiveStream = mongoose.model<ILiveStream>('LiveStream', LiveStreamSchema);

export default LiveStream;