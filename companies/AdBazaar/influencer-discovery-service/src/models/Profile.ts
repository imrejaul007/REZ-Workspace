import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const ProfileSchema = z.object({
  influencerId: z.string(),
  platform: z.string(),
  handle: z.string(),
  profileUrl: z.string().url().optional(),
  bio: z.string().optional(),
  profileImage: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
  followers: z.number(),
  following: z.number().optional(),
  posts: z.number().optional(),
  verified: z.boolean().optional(),
  badges: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  linkedAccounts: z.array(z.object({
    platform: z.string(),
    handle: z.string()
  })).optional(),
  lastSynced: z.date().optional(),
  syncStatus: z.enum(['synced', 'pending', 'failed']).default('pending')
});

export type IProfile = z.infer<typeof ProfileSchema>;

const profileSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
  platform: { type: String, required: true },
  handle: { type: String, required: true },
  profileUrl: { type: String },
  bio: { type: String },
  profileImage: { type: String },
  bannerImage: { type: String },
  followers: { type: Number, default: 0 },
  following: { type: Number },
  posts: { type: Number },
  verified: { type: Boolean, default: false },
  badges: [{ type: String }],
  contactEmail: { type: String },
  website: { type: String },
  linkedAccounts: [{
    platform: String,
    handle: String
  }],
  lastSynced: { type: Date },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

profileSchema.index({ platform: 1, handle: 1 }, { unique: true });
profileSchema.index({ influencerId: 1, platform: 1 });

export const Profile = mongoose.model<IProfile & Document>('Profile', profileSchema);
