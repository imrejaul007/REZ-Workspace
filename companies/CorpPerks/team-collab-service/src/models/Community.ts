import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  communityId: string;
  companyId: string;
  name: string;
  description: string;
  icon: string;
  coverImage?: string;
  type: 'public' | 'private' | 'hidden';
  category: 'interest' | 'project' | 'department' | 'location' | 'other';
  ownerId: string;
  ownerName: string;
  memberCount: number;
  postCount: number;
  isActive: boolean;
  rules?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    communityId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'users' },
    coverImage: { type: String },
    type: { type: String, enum: ['public', 'private', 'hidden'], default: 'public' },
    category: {
      type: String,
      enum: ['interest', 'project', 'department', 'location', 'other'],
      default: 'interest',
    },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, required: true },
    memberCount: { type: Number, default: 1 },
    postCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    rules: { type: [String] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

CommunitySchema.index({ companyId: 1, isActive: 1, type: 1 });
CommunitySchema.index({ category: 1, isActive: 1 });
CommunitySchema.index({ tags: 1 });

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);

// Community Member
export interface ICommunityMember extends Document {
  communityId: string;
  userId: string;
  userName: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  lastActiveAt?: Date;
  notificationsEnabled: boolean;
}

const CommunityMemberSchema = new Schema<ICommunityMember>(
  {
    communityId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ userId: 1, joinedAt: -1 });

export const CommunityMember = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);

// Community Post
export interface ICommunityPost extends Document {
  postId: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'link' | 'poll';
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
  }>;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    postId: { type: String, required: true, unique: true, index: true },
    communityId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'link', 'poll'], default: 'text' },
    attachments: [
      {
        id: String,
        filename: String,
        url: String,
        mimeType: String,
      },
    ],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ communityId: 1, createdAt: -1 });
CommunityPostSchema.index({ authorId: 1, createdAt: -1 });

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
