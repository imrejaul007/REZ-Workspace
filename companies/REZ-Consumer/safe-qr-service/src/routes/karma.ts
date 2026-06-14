import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
 getKarmaState,
 getKarmaHistory,
 getKarmaLeaderboard,
 getUserFeedPosts,
 getNearbyFeedPosts,
 createFeedPost,
 addHelperToFeedPost,
} from '../shared/services/karma';
import { SafeQR } from '../shared/models';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/karma/state
 * Get user's karma state
 */
router.get(
 '/state',
 asyncHandler(async (req: Request, res: Response) => {
   const state = await getKarmaState(req.userId!);

   res.json({
     success: true,
     data: state || {
       userId: req.userId,
       totalPoints: 0,
       helpCount: 0,
       level: 'Newbie',
       badge: '🟢',
     },
   });
 })
);

/**
 * GET /api/karma/history
 * Get user's karma history
 */
router.get(
 '/history',
 asyncHandler(async (req: Request, res: Response) => {
   const limit = parseInt(req.query.limit as string) || 50;
   const history = await getKarmaHistory(req.userId!, limit);

   res.json({
     success: true,
     data: history,
   });
 })
);

/**
 * GET /api/karma/leaderboard
 * Get karma leaderboard
 */
router.get(
 '/leaderboard',
 asyncHandler(async (req: Request, res: Response) => {
   const limit = parseInt(req.query.limit as string) || 10;
   const leaderboard = await getKarmaLeaderboard(limit);

   res.json({
     success: true,
     data: leaderboard,
   });
 })
);

/**
 * GET /api/karma/feed
 * Get user's feed posts
 */
router.get(
 '/feed',
 asyncHandler(async (req: Request, res: Response) => {
   const posts = await getUserFeedPosts(req.userId!);

   res.json({
     success: true,
     data: posts,
   });
 })
);

/**
 * POST /api/karma/feed/lost
 * Post lost item to karma feed
 */
router.post(
 '/feed/lost',
 asyncHandler(async (req: Request, res: Response) => {
   const { safeQRId, title, description, location, photos, reward } = req.body;

   if (!safeQRId || !title || !description) {
     throw createError('safeQRId, title, and description are required', 400, 'VALIDATION_ERROR');
   }

   // Get QR info
   const qr = await SafeQR.findOne({ qrId: safeQRId });
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   const post = await createFeedPost({
     safeQRId,
     shortcode: qr.shortcode,
     mode: qr.mode,
     type: 'lost_item',
     title,
     description,
     location,
     photos,
     reward,
     ownerId: req.userId!,
     ownerName: (qr.profile as unknown)?.name || 'Anonymous',
   });

   // Update QR with feed post ID
   qr.karma.feedPostId = post.postId;
   await qr.save();

   res.status(201).json({
     success: true,
     data: post,
   });
 })
);

/**
 * GET /api/karma/feed/nearby
 * Get nearby lost items
 */
router.get(
 '/feed/nearby',
 asyncHandler(async (req: Request, res: Response) => {
   const lat = parseFloat(req.query.lat as string);
   const lng = parseFloat(req.query.lng as string);
   const radius = parseInt(req.query.radius as string) || 5000;
   const mode = req.query.mode as string;

   if (isNaN(lat) || isNaN(lng)) {
     throw createError('lat and lng are required', 400, 'VALIDATION_ERROR');
   }

   const posts = await getNearbyFeedPosts(lat, lng, radius, mode);

   res.json({
     success: true,
     data: posts,
   });
 })
);

/**
 * POST /api/karma/feed/:postId/help
 * Join as helper on a lost item
 */
router.post(
 '/feed/:postId/help',
 asyncHandler(async (req: Request, res: Response) => {
   const { postId } = req.params;

   await addHelperToFeedPost(postId, {
     userId: req.userId!,
     name: req.user?.name || 'Anonymous',
   });

   res.json({
     success: true,
     message: 'You are now helping search!',
   });
 })
);

export default router;
