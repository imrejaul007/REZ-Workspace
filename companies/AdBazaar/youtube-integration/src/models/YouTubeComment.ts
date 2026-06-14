import mongoose, { Document, Schema } from 'mongoose';

export type CommentModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface IYouTubeComment extends Document {
  id: string;
  youtubeCommentId: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  authorName: string;
  authorChannelId?: string;
  text: string;
  likeCount: number;
  publishedAt: Date;
  moderationStatus: CommentModerationStatus;
  moderationNote?: string;
  moderatedAt?: Date;
  moderationAction?: 'approve' | 'reject' | 'flag';
  createdAt: Date;
  updatedAt: Date;
}

const YouTubeCommentSchema = new Schema<IYouTubeComment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    youtubeCommentId: {
      type: String,
      required: true,
      index: true,
    },
    youtubeVideoId: {
      type: String,
      required: true,
      index: true,
    },
    youtubeChannelId: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorChannelId: {
      type: String,
    },
    text: {
      type: String,
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    moderationNote: {
      type: String,
    },
    moderatedAt: {
      type: Date,
    },
    moderationAction: {
      type: String,
      enum: ['approve', 'reject', 'flag'],
    },
  },
  {
    timestamps: true,
  }
);

YouTubeCommentSchema.index({ youtubeCommentId: 1 });
YouTubeCommentSchema.index({ youtubeVideoId: 1, moderationStatus: 1 });
YouTubeCommentSchema.index({ moderationStatus: 1, createdAt: -1 });

export const YouTubeComment = mongoose.model<IYouTubeComment>('YouTubeComment', YouTubeCommentSchema);

export default YouTubeComment;