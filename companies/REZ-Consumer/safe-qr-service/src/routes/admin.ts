import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR, ScanEvent, RelayMessage, KarmaEvent, KarmaFeedPost } from '../shared/models';
import { verifyInternalToken } from '../middleware/auth';

const router = Router();

// Admin routes - require internal token or admin role
router.use(verifyInternalToken);

/**
 * GET /api/admin/qr
 * List all QRs (paginated)
 */
router.get(
 '/qr',
 asyncHandler(async (req: Request, res: Response) => {
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const mode = req.query.mode as string;
   const status = req.query.status as string;

   const query: unknown = {};
   if (mode) query.mode = mode;
   if (status) query.status = status;

   const skip = (page - 1) * limit;

   const [qrs, total] = await Promise.all([
     SafeQR.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
     SafeQR.countDocuments(query),
   ]);

   res.json({
     success: true,
     data: {
       qrs: qrs.map((qr) => ({
         shortcode: qr.shortcode,
         qrId: qr.qrId,
         mode: qr.mode,
         status: qr.status,
         ownerId: qr.ownerId,
         stats: qr.stats,
         createdAt: qr.createdAt,
       })),
       pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit),
       },
     },
   });
 })
);

/**
 * GET /api/admin/qr/:shortcode
 * Get QR details
 */
router.get(
 '/qr/:shortcode',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   res.json({
     success: true,
     data: qr,
   });
 })
);

/**
 * DELETE /api/admin/qr/:shortcode
 * Delete QR (admin)
 */
router.delete(
 '/qr/:shortcode',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { reason } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   // Log admin action
   logger.info(`Admin deleted QR ${normalizedShortcode}. Reason: ${reason}`);

   await SafeQR.deleteOne({ shortcode: normalizedShortcode });

   res.json({
     success: true,
     message: 'QR deleted successfully',
   });
 })
);

/**
 * GET /api/admin/scans
 * Get scan analytics
 */
router.get(
 '/scans',
 asyncHandler(async (req: Request, res: Response) => {
   const { from, to, mode } = req.query;

   const match: unknown = {};
   if (mode) match.mode = mode;
   if (from || to) {
     match.createdAt = {};
     if (from) match.createdAt.$gte = new Date(from as string);
     if (to) match.createdAt.$lte = new Date(to as string);
   }

   const stats = await ScanEvent.aggregate([
     { $match: match },
     {
       $group: {
         _id: '$mode',
         totalScans: { $sum: 1 },
         uniqueScanners: { $addToSet: '$scannerId' },
         contacts: {
           $sum: { $cond: [{ $eq: ['$action', 'contact'] }, 1, 0] },
         },
       },
     },
     {
       $project: {
         mode: '$_id',
         totalScans: 1,
         uniqueScanners: { $size: '$uniqueScanners' },
         contacts: 1,
         _id: 0,
       },
     },
   ]);

   const total = await ScanEvent.countDocuments(match);

   res.json({
     success: true,
     data: {
       stats,
       total,
     },
   });
 })
);

/**
 * GET /api/admin/flags
 * Get flagged messages
 */
router.get(
 '/flags',
 asyncHandler(async (req: Request, res: Response) => {
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const skip = (page - 1) * limit;

   const [messages, total] = await Promise.all([
     RelayMessage.find({ isFlagged: true })
       .skip(skip)
       .limit(limit)
       .sort({ createdAt: -1 })
       .lean(),
     RelayMessage.countDocuments({ isFlagged: true }),
   ]);

   res.json({
     success: true,
     data: {
       messages,
       pagination: { page, limit, total, pages: Math.ceil(total / limit) },
     },
   });
 })
);

/**
 * PUT /api/admin/flags/:messageId
 * Resolve flagged message
 */
router.put(
 '/flags/:messageId',
 asyncHandler(async (req: Request, res: Response) => {
   const { messageId } = req.params;
   const { action, reason } = req.body;

   const message = await RelayMessage.findOne({ messageId });
   if (!message) {
     throw createError('Message not found', 404, 'NOT_FOUND');
   }

   if (action === 'dismiss') {
     message.isFlagged = false;
     message.flags = [];
     await message.save();
   } else if (action === 'warn') {
     logger.info(`Warning sent to ${message.senderId} for message ${messageId}`);
   } else if (action === 'ban') {
     // Could implement user ban here
     logger.info(`User ${message.senderId} banned for message ${messageId}`);
   }

   res.json({
     success: true,
     message: `Action '${action}' completed`,
   });
 })
);

/**
 * GET /api/admin/karma
 * Get karma leaderboard (admin view)
 */
router.get(
 '/karma',
 asyncHandler(async (req: Request, res: Response) => {
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const skip = (page - 1) * limit;

   // Get karma events and aggregate
   const leaderboard = await KarmaEvent.aggregate([
     {
       $group: {
         _id: '$userId',
         totalPoints: { $sum: '$points' },
         eventCount: { $sum: 1 },
         lastEvent: { $max: '$createdAt' },
       },
     },
     { $sort: { totalPoints: -1 } },
     { $skip: skip },
     { $limit: limit },
     {
       $project: {
         userId: '$_id',
         totalPoints: 1,
         eventCount: 1,
         lastEvent: 1,
         _id: 0,
       },
     },
   ]);

   res.json({
     success: true,
     data: leaderboard,
   });
 })
);

/**
 * PUT /api/admin/karma/:userId
 * Adjust user karma (admin)
 */
router.put(
 '/karma/:userId',
 asyncHandler(async (req: Request, res: Response) => {
   const { userId } = req.params;
   const { points, reason } = req.body;

   if (typeof points !== 'number') {
     throw createError('points must be a number', 400, 'VALIDATION_ERROR');
   }

   // Create karma event for adjustment
   const event = new KarmaEvent({
     eventId: `admin_${Date.now()}`,
     userId,
     eventType: 'ADMIN_ADJUSTMENT',
     points,
     reason: `Admin: ${reason || 'No reason provided'}`,
   });
   await event.save();

   res.json({
     success: true,
     message: `Karma adjusted by ${points} points`,
   });
 })
);

/**
 * GET /api/admin/feed
 * Get feed posts
 */
router.get(
 '/feed',
 asyncHandler(async (req: Request, res: Response) => {
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const status = req.query.status as string;
   const skip = (page - 1) * limit;

   const query: unknown = {};
   if (status) query.status = status;

   const [posts, total] = await Promise.all([
     KarmaFeedPost.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
     KarmaFeedPost.countDocuments(query),
   ]);

   res.json({
     success: true,
     data: {
       posts,
       pagination: { page, limit, total, pages: Math.ceil(total / limit) },
     },
   });
 })
);

/**
 * GET /api/admin/stats
 * Get system stats
 */
router.get(
 '/stats',
 asyncHandler(async (req: Request, res: Response) => {
   const [
     totalQRs,
     activeQRs,
     lostQRs,
     totalScans,
     activeSessions,
     flaggedMessages,
     activePosts,
   ] = await Promise.all([
     SafeQR.countDocuments(),
     SafeQR.countDocuments({ status: 'active' }),
     SafeQR.countDocuments({ status: 'lost' }),
     ScanEvent.countDocuments(),
     RelayMessage.aggregate([
       { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
       { $count: 'count' },
     ]),
     RelayMessage.countDocuments({ isFlagged: true }),
     KarmaFeedPost.countDocuments({ status: 'active' }),
   ]);

   res.json({
     success: true,
     data: {
       qrs: { total: totalQRs, active: activeQRs, lost: lostQRs },
       scans: { total: totalScans },
       sessions: { activeToday: activeSessions[0]?.count || 0 },
       moderation: { flagged: flaggedMessages },
       feed: { activePosts },
     },
   });
 })
);

export default router;
