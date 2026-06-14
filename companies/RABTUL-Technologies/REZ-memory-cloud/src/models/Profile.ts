/**
 * REZ Memory Cloud - Profile Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Preference schema
export interface IPreference {
  key: string;
  value: unknown;
  confidence: number; // 0-1
  source?: string;
  updatedAt: Date;
}

// Behavioral pattern
export interface IBehavioralPattern {
  pattern: string;
  frequency: number; // occurrences
  lastSeen: Date;
  context?: string;
}

// Profile interface
export interface IProfile extends Document {
  profileId: string;
  userId: string;
  preferences: IPreference[];
  behavioralPatterns: IBehavioralPattern[];
  facts: string[]; // Key facts about the user
  interests: string[];
  dislikes: string[];
  tags: string[];
  segments: string[]; // User segments
  memoryCount: number;
  lastMemoryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Profile schema
const PreferenceSchema = new Schema<IPreference>(
  {
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    confidence: { type: Number, default: 1.0, min: 0, max: 1 },
    source: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BehavioralPatternSchema = new Schema<IBehavioralPattern>(
  {
    pattern: { type: String, required: true },
    frequency: { type: Number, default: 1 },
    lastSeen: { type: Date, default: Date.now },
    context: { type: String },
  },
  { _id: false }
);

const ProfileSchema = new Schema<IProfile>(
  {
    profileId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, unique: true, index: true },
    preferences: { type: [PreferenceSchema], default: [] },
    behavioralPatterns: { type: [BehavioralPatternSchema], default: [] },
    facts: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    segments: { type: [String], default: [], index: true },
    memoryCount: { type: Number, default: 0 },
    lastMemoryAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ProfileSchema.index({ userId: 1, segments: 1 });
ProfileSchema.index({ tags: 1, segments: 1 });

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);

// Zod schemas
export const UpdatePreferenceSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  confidence: z.number().min(0).max(1).optional().default(1.0),
  source: z.string().optional(),
});

export type UpdatePreferenceInput = z.infer<typeof UpdatePreferenceSchema>;

export const AddFactSchema = z.object({
  fact: z.string().min(1).max(500),
  source: z.string().optional(),
});

export type AddFactInput = z.infer<typeof AddFactSchema>;

export const UpdateProfileSchema = z.object({
  interests: z.array(z.string()).max(100).optional(),
  dislikes: z.array(z.string()).max(100).optional(),
  tags: z.array(z.string()).max(50).optional(),
  segments: z.array(z.string()).max(20).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
