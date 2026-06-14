import mongoose, { Document, Schema } from 'mongoose';

export interface IYouTubePlaylist extends Document {
  id: string;
  youtubePlaylistId: string;
  youtubeChannelId: string;
  title: string;
  description: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const YouTubePlaylistSchema = new Schema<IYouTubePlaylist>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    youtubePlaylistId: {
      type: String,
      index: true,
    },
    youtubeChannelId: {
      type: String,
      required: true,
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
    privacyStatus: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'private',
    },
    thumbnailUrl: {
      type: String,
    },
    videoCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

YouTubePlaylistSchema.index({ youtubePlaylistId: 1 });
YouTubePlaylistSchema.index({ youtubeChannelId: 1 });

export const YouTubePlaylist = mongoose.model<IYouTubePlaylist>('YouTubePlaylist', YouTubePlaylistSchema);

export default YouTubePlaylist;