import mongoose, { Schema, Document } from 'mongoose';
import PlatformConfigSchema, { IPlatformConfig } from './platform-config.model';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type WorkflowStatus = 'pending' | 'review' | 'approved' | 'rejected';

export interface IMedia {
  url: string;
  type: 'image' | 'video' | 'gif';
  alt?: string;
}

export interface IContent {
  text: string;
  media: IMedia[];
}

export interface IPlatformAnalytics {
  publishedId?: string;
  publishedAt?: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
}

export interface IWorkflow {
  status: WorkflowStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface IUnifiedPost {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  content: IContent;
  platforms: IPlatformConfig[];
  scheduledTime?: Date;
  status: PostStatus;
  workflow: IWorkflow;
  analytics?: Record<string, IPlatformAnalytics>;
  versionHistory?: {
    version: number;
    content: IContent;
    updatedBy: string;
    updatedAt: Date;
    changeNote?: string;
  }[];
  conflictCheck?: {
    hasConflict: boolean;
    conflictingPosts?: string[];
    conflictReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUnifiedPostDocument extends Omit<IUnifiedPost, 'id'>, Document {
  toJSON(): IUnifiedPost;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'gif'], required: true },
    alt: { type: String },
  },
  { _id: false }
);

const ContentSchema = new Schema<IContent>(
  {
    text: { type: String, required: true, maxlength: 5000 },
    media: [MediaSchema],
  },
  { _id: false }
);

const WorkflowSchema = new Schema<IWorkflow>(
  {
    status: {
      type: String,
      enum: ['pending', 'review', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { _id: false }
);

const PlatformAnalyticsSchema = new Schema<IPlatformAnalytics>(
  {
    publishedId: { type: String },
    publishedAt: { type: Date },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
  },
  { _id: false }
);

const VersionHistorySchema = new Schema(
  {
    version: { type: Number, required: true },
    content: { type: ContentSchema, required: true },
    updatedBy: { type: String, required: true },
    updatedAt: { type: Date, required: true },
    changeNote: { type: String },
  },
  { _id: false }
);

const ConflictCheckSchema = new Schema(
  {
    hasConflict: { type: Boolean, default: false },
    conflictingPosts: [{ type: String }],
    conflictReason: { type: String },
  },
  { _id: false }
);

const UnifiedPostSchema = new Schema<IUnifiedPostDocument>(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: ContentSchema, required: true },
    platforms: [PlatformConfigSchema],
    scheduledTime: { type: Date, index: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    workflow: { type: WorkflowSchema, default: () => ({ status: 'pending' }) },
    analytics: {
      type: Map,
      of: PlatformAnalyticsSchema,
 },
    versionHistory: [VersionHistorySchema],
    conflictCheck: { type: ConflictCheckSchema },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
UnifiedPostSchema.index({ companyId: 1, status: 1 });
UnifiedPostSchema.index({ companyId: 1, scheduledTime: 1 });
UnifiedPostSchema.index({ userId: 1, createdAt: -1 });
UnifiedPostSchema.index({ companyId: 1, 'workflow.status': 1 });

export default mongoose.model<IUnifiedPostDocument>('UnifiedPost', UnifiedPostSchema);