import { v4 as uuidv4 } from 'uuid';
import { KarmaEvent, KarmaState, KarmaFeedPost } from '../models';
import { karmaConfig, karmaEventTypes, getKarmaLevel } from '../../config/karma';
import { syncToRezIntelligence } from '../../integrations/rezIntelligence';

/**
 * Karma Service
 * Handles karma points, levels, and feed
 */

export interface AwardKarmaOptions {
 userId: string;
 eventType: string;
 safeQRId?: string;
 shortcode?: string;
 mode?: string;
 points: number;
 reason?: string;
 metadata?: Record<string, unknown>;
}

export interface CreateFeedPostOptions {
 safeQRId: string;
 shortcode: string;
 mode: string;
 type: 'lost_item' | 'found_item' | 'sighting';
 title: string;
 description: string;
 location?: {
   lat: number;
   lng: number;
   address?: string;
 };
 photos?: string[];
 reward?: {
   amount: number;
   currency?: string;
   message?: string;
 };
 ownerId: string;
 ownerName: string;
 ownerKarmaLevel?: string;
}

/**
 * Award karma points to a user
 */
export async function awardKarma(options: AwardKarmaOptions): Promise<KarmaEvent> {
 const eventId = `karma_${uuidv4()}`;

 // Create karma event
 const event = new KarmaEvent({
   eventId,
   userId: options.userId,
   eventType: options.eventType,
   safeQRId: options.safeQRId,
   shortcode: options.shortcode,
   mode: options.mode,
   points: options.points,
   reason: options.reason,
   metadata: options.metadata,
 });

 await event.save();

 // Update karma state
 await updateKarmaState(options.userId, options.points, options.mode);

 // Sync to REZ-Intelligence
 await syncToRezIntelligence('karma', {
   action: 'award',
   event: event.toObject(),
 });

 return event;
}

/**
 * Update user's karma state
 */
async function updateKarmaState(
 userId: string,
 points: number,
 mode?: string
): Promise<void> {
 let state = await KarmaState.findOne({ userId });
 if (!state) {
   state = new KarmaState({ userId });
 }

 state.addPoints(points, mode);
}

/**
 * Get user's karma state
 */
export async function getKarmaState(userId: string): Promise<KarmaState | null> {
 return KarmaState.findOne({ userId });
}

/**
 * Get or create karma state
 */
export async function getOrCreateKarmaState(userId: string): Promise<KarmaState> {
 let state = await KarmaState.findOne({ userId });
 if (!state) {
   state = new KarmaState({ userId });
   await state.save();
 }
 return state;
}

/**
 * Get karma history for a user
 */
export async function getKarmaHistory(
 userId: string,
 limit = 50
): Promise<KarmaEvent[]> {
 return KarmaEvent.find({ userId })
   .sort({ createdAt: -1 })
   .limit(limit)
   .lean();
}

/**
 * Get karma leaderboard
 */
export async function getKarmaLeaderboard(limit = 10): Promise<KarmaState[]> {
 return KarmaState.find()
   .sort({ totalPoints: -1 })
   .limit(limit)
   .select('userId totalPoints level badge helpCount')
   .lean();
}

/**
 * Create a karma feed post
 */
export async function createFeedPost(options: CreateFeedPostOptions): Promise<KarmaFeedPost> {
 const postId = `feed_${uuidv4()}`;
 const expiresAt = new Date(
   Date.now() + karmaConfig.feed.maxFeedAge
 );

 const post = new KarmaFeedPost({
   postId,
   safeQRId: options.safeQRId,
   shortcode: options.shortcode,
   mode: options.mode,
   type: options.type,
   title: options.title,
   description: options.description,
   location: options.location
     ? {
         type: 'Point',
         coordinates: [options.location.lng, options.location.lat],
         address: options.location.address,
         lastSeenAt: new Date(),
       }
     : undefined,
   photos: options.photos || [],
   reward: options.reward
     ? {
         amount: options.reward.amount,
         currency: options.reward.currency || 'INR',
         message: options.reward.message,
       }
     : undefined,
   owner: {
     id: options.ownerId,
     name: options.ownerName,
     karmaLevel: options.ownerKarmaLevel,
   },
   helpers: [],
   status: 'active',
   expiresAt,
 });

 await post.save();

 // Award karma for posting
 await awardKarma({
   userId: options.ownerId,
   eventType: karmaEventTypes.SAFE_QR_LOST_POSTED,
   safeQRId: options.safeQRId,
   shortcode: options.shortcode,
   mode: options.mode,
   points: karmaConfig.earned.shareLostItem,
   reason: 'Posted to karma feed',
 });

 // Sync to REZ-Intelligence
 await syncToRezIntelligence('feed', {
   action: 'create',
   post: post.toObject(),
 });

 return post;
}

/**
 * Add helper to feed post
 */
export async function addHelperToFeedPost(
 postId: string,
 helper: {
   userId: string;
   name: string;
   avatar?: string;
   karmaLevel?: string;
 }
): Promise<void> {
 const post = await KarmaFeedPost.findOne({ postId });
 if (!post) {
   throw new Error('Post not found');
 }

 await post.addHelper(helper);

 // Award karma for joining as helper
 await awardKarma({
   userId: helper.userId,
   eventType: karmaEventTypes.SAFE_QR_HELPER_JOINED,
   safeQRId: post.safeQRId,
   shortcode: post.shortcode,
   mode: post.mode,
   points: karmaConfig.earned.helperJoined,
   reason: 'Joined as helper on feed post',
 });
}

/**
 * Mark helper as contributed
 */
export async function markHelperContributed(
 postId: string,
 userId: string
): Promise<void> {
 const post = await KarmaFeedPost.findOne({ postId });
 if (!post) {
   throw new Error('Post not found');
 }

 await post.markHelperContributed(userId);
}

/**
 * Resolve feed post
 */
export async function resolveFeedPost(
 postId: string,
 resolvedBy: string,
 karmaDistribution?: Record<string, number>
): Promise<void> {
 const post = await KarmaFeedPost.findOne({ postId });
 if (!post) {
   throw new Error('Post not found');
 }

 // Award karma to helpers
 if (karmaDistribution) {
   let totalDistributed = 0;
   for (const [helperId, points] of Object.entries(karmaDistribution)) {
     await awardKarma({
       userId: helperId,
       eventType: karmaEventTypes.SAFE_QR_ITEM_FOUND,
       safeQRId: post.safeQRId,
       shortcode: post.shortcode,
       mode: post.mode,
       points: points as number,
       reason: 'Helped resolve feed post',
     });
     totalDistributed += points as number;
   }
   post.totalKarmaDistributed = totalDistributed;
 }

 post.resolve(resolvedBy);

 // Sync to REZ-Intelligence
 await syncToRezIntelligence('feed', {
   action: 'resolve',
   postId,
   resolvedBy,
 });
}

/**
 * Get nearby feed posts
 */
export async function getNearbyFeedPosts(
 lat: number,
 lng: number,
 radiusMeters = karmaConfig.feed.postRadius,
 mode?: string
): Promise<KarmaFeedPost[]> {
 const query: Record<string, unknown> = {
   status: 'active',
   location: {
     $nearSphere: {
       $geometry: {
         type: 'Point',
         coordinates: [lng, lat],
       },
       $maxDistance: radiusMeters,
     },
   },
 };

 if (mode) {
   query.mode = mode;
 }

 return KarmaFeedPost.find(query).limit(50).lean();
}

/**
 * Get feed post by ID
 */
export async function getFeedPost(postId: string): Promise<KarmaFeedPost | null> {
 return KarmaFeedPost.findOne({ postId });
}

/**
 * Get user's feed posts
 */
export async function getUserFeedPosts(userId: string): Promise<KarmaFeedPost[]> {
 return KarmaFeedPost.find({
   'owner.id': userId,
 })
   .sort({ createdAt: -1 })
   .lean();
}

/**
 * Get active feed posts
 */
export async function getActiveFeedPosts(limit = 50): Promise<KarmaFeedPost[]> {
 return KarmaFeedPost.find({ status: 'active' })
   .sort({ createdAt: -1 })
   .limit(limit)
   .lean();
}

/**
 * Cancel feed post
 */
export async function cancelFeedPost(
 postId: string,
 ownerId: string
): Promise<void> {
 const post = await KarmaFeedPost.findOne({ postId });
 if (!post) {
   throw new Error('Post not found');
 }

 if (post.owner.id !== ownerId) {
   throw new Error('Not authorized');
 }

 post.status = 'cancelled';
 await post.save();
}

/**
 * Check if first time helping in category
 */
export async function isFirstTimeInCategory(
 userId: string,
 mode: string
): Promise<boolean> {
 const state = await KarmaState.findOne({ userId });
 if (!state) return true;
 return !state.categories[mode] || state.categories[mode] === 0;
}
