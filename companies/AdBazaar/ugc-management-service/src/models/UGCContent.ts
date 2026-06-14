import mongoose, { Document, Schema } from 'mongoose';

export interface IUGCContent extends Document {
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  originalUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  author: {
    platformUserId: string;
    username: string;
    displayName: string;
    followerCount: number;
    profileImage?: string;
  };
  hashtags: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  campaignId?: mongoose.Types.ObjectId;
  status: 'collected' | 'pending_review' | 'approved' | 'rejected' | 'displayed';
  rightsStatus: 'none' | 'requested' | 'granted' | 'denied';
  rightsRequestedAt?: Date;
  rightsGrantedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  displayedOn: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UGCContentSchema = new Schema<IUGCContent>(
  {
    platform: {
      type: String,
      enum: ['instagram', 'twitter', 'facebook', 'tiktok'],
      required: true,
      index: true
    },
    originalUrl: {
      type: String,
      required: true,
      unique: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    author: {
      platformUserId: { type: String, required: true },
      username: { type: String, required: true },
      displayName: { type: String, required: true },
      followerCount: { type: Number, default: 0 },
      profileImage: { type: String }
    },
    hashtags: [{
      type: String,
      index: true
    }],
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'UGCCampaign',
      index: true
    },
    status: {
      type: String,
      enum: ['collected', 'pending_review', 'approved', 'rejected', 'displayed'],
      default: 'pending_review',
      index: true
    },
    rightsStatus: {
      type: String,
      enum: ['none', 'requested', 'granted', 'denied'],
      default: 'none',
      index: true
    },
    rightsRequestedAt: Date,
    rightsGrantedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    displayedOn: [{
      type: String
    }],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    sentimentScore: Number,
    moderationNotes: String
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
UGCContentSchema.index({ campaignId: 1, status: 1 });
UGCContentSchema.index({ 'author.platformUserId': 1 });
UGCContentSchema.index({ createdAt: -1 });
UGCContentSchema.index({ hashtags: 1, status: 1 });

export const UGCContent = mongoose.model<IUGCContent>('UGCContent', UGCContentSchema);