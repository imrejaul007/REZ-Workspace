import { z } from 'zod';

// ==========================================
// KARMA EVENT SCHEMA
// ==========================================

export const KarmaEventSchema = z.object({
 eventId: z.string(),
 userId: z.string(),
 eventType: z.string(),
 safeQRId: z.string().optional(),
 shortcode: z.string().optional(),
 mode: z.string().optional(),
 points: z.number(),
 reason: z.string().optional(),
 metadata: z.record(z.unknown()).optional(),
 createdAt: z.date(),
});
export type KarmaEventSchema = z.infer<typeof KarmaEventSchema>;

// ==========================================
// KARMA STATE SCHEMA
// ==========================================

export const KarmaLevel = z.enum(['Newbie', 'Active', 'Contributor', 'Helper', 'Guardian', 'Hero', 'Legend']);
export type KarmaLevel = z.infer<typeof KarmaLevel>;

export const Achievement = z.object({
 id: z.string(),
 name: z.string(),
 description: z.string().optional(),
 icon: z.string().optional(),
 earnedAt: z.date(),
});
export type Achievement = z.infer<typeof Achievement>;

export const KarmaStateSchema = z.object({
 userId: z.string(),
 totalPoints: z.number().default(0),
 helpCount: z.number().default(0),
 categories: z.record(z.string(), z.number()).default({}),
 currentStreak: z.number().default(0),
 longestStreak: z.number().default(0),
 lastHelpDate: z.date().optional(),
 level: KarmaLevel.default('Newbie'),
 badge: z.string().default('🟢'),
 achievements: z.array(Achievement).default([]),
 updatedAt: z.date(),
});
export type KarmaStateSchema = z.infer<typeof KarmaStateSchema>;

// ==========================================
// KARMA FEED POST SCHEMA
// ==========================================

export const FeedPostStatus = z.enum(['active', 'resolved', 'expired', 'cancelled']);
export type FeedPostStatus = z.infer<typeof FeedPostStatus>;

export const FeedPostType = z.enum(['lost_item', 'found_item', 'sighting']);
export type FeedPostType = z.infer<typeof FeedPostType>;

export const Helper = z.object({
 userId: z.string(),
 name: z.string(),
 avatar: z.string().optional(),
 karmaLevel: z.string().optional(),
 joinedAt: z.date(),
 lastSeenLocation: z.object({
   lat: z.number(),
   lng: z.number(),
   address: z.string().optional(),
 }).optional(),
 contributed: z.boolean().default(false),
 contributedAt: z.date().optional(),
});
export type Helper = z.infer<typeof Helper>;

export const Reward = z.object({
 amount: z.number(),
 currency: z.string().default('INR'),
 message: z.string().optional(),
});
export type Reward = z.infer<typeof Reward>;

export const LocationData = z.object({
 type: z.literal('Point').default('Point'),
 coordinates: z.tuple([z.number(), z.number()]).default([0, 0]), // [lng, lat]
 address: z.string().optional(),
 lastSeenAt: z.date().optional(),
});
export type LocationData = z.infer<typeof LocationData>;

export const KarmaFeedPostSchema = z.object({
 postId: z.string(),
 safeQRId: z.string(),
 shortcode: z.string(),
 mode: z.string(),
 type: FeedPostType,
 title: z.string(),
 description: z.string(),
 location: LocationData.optional(),
 photos: z.array(z.string()).default([]),
 reward: Reward.optional(),
 owner: z.object({
   id: z.string(),
   name: z.string(),
   karmaLevel: z.string().optional(),
   phone: z.string().optional(), // masked
   avatar: z.string().optional(),
 }),
 helpers: z.array(Helper).default([]),
 status: FeedPostStatus.default('active'),
 resolvedAt: z.date().optional(),
 resolvedBy: z.string().optional(),
 totalKarmaDistributed: z.number().default(0),
 expiresAt: z.date(),
 createdAt: z.date(),
 updatedAt: z.date(),
});
export type KarmaFeedPostSchema = z.infer<typeof KarmaFeedPostSchema>;

// ==========================================
// CREATE FEED POST INPUT
// ==========================================

export const CreateFeedPostInput = z.object({
 safeQRId: z.string(),
 shortcode: z.string(),
 mode: z.string(),
 type: FeedPostType.default('lost_item'),
 title: z.string().min(1).max(100),
 description: z.string().min(1).max(500),
 location: z.object({
   lat: z.number(),
   lng: z.number(),
   address: z.string().optional(),
 }).optional(),
 photos: z.array(z.string()).max(5).default([]),
 reward: Reward.optional(),
});
export type CreateFeedPostInput = z.infer<typeof CreateFeedPostInput>;

// ==========================================
// TRUST SCORE SCHEMA
// ==========================================

export const Violation = z.object({
 type: z.enum(['spam', 'abuse', 'false_emergency', 'harassment', 'other']),
 count: z.number().default(1),
 lastAt: z.date(),
});
export type Violation = z.infer<typeof Violation>;

export const RateLimitStatus = z.object({
 messagesPerHour: z.number().default(0),
 contactsPerDay: z.number().default(0),
 blockedUntil: z.date().optional(),
});
export type RateLimitStatus = z.infer<typeof RateLimitStatus>;

export const TrustScoreSchema = z.object({
 userId: z.string(),
 score: z.number().min(0).max(100).default(50),
 violations: z.array(Violation).default([]),
 rateLimits: RateLimitStatus.default({}),
 updatedAt: z.date(),
});
export type TrustScoreSchema = z.infer<typeof TrustScoreSchema>;
