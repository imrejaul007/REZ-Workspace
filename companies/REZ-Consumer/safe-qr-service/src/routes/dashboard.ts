import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR, RelaySession, RelayMessage, ScanEvent, KarmaState } from '../shared/models';

const router = Router();

router.use(authenticate);

/**
 * GET /api/dashboard
 * Get user's complete dashboard data
 */
router.get(
 '/',
 asyncHandler(async (req: Request, res: Response) => {
   const userId = req.userId!;

   // Get all user's QRs with stats
   const qrs = await SafeQR.find({ ownerId: userId })
     .select('shortcode qrId mode status stats profile createdAt lostModeActivatedAt')
     .sort({ createdAt: -1 });

   // Get active sessions count
   const activeSessions = await RelaySession.countDocuments({
     ownerId: userId,
     status: 'active',
   });

   // Get total unread messages
   const unreadMessages = await RelayMessage.aggregate([
     { $match: { recipientId: userId, read: false } },
     { $count: 'count' },
   ]);

   // Get karma state
   const karma = await KarmaState.findOne({ userId });

   // Get recent scans (last 7 days)
   const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
   const recentScans = await ScanEvent.countDocuments({
     ownerId: userId,
     createdAt: { $gte: weekAgo },
   });

   // Calculate stats
   const totalScans = qrs.reduce((sum, qr) => sum + (qr.stats?.totalScans || 0), 0);
   const totalMessages = qrs.reduce((sum, qr) => sum + (qr.stats?.totalMessages || 0), 0);

   res.json({
     success: true,
     data: {
       stats: {
         totalQrs: qrs.length,
         totalScans,
         totalMessages,
         recentScans,
         activeSessions,
         unreadMessages: unreadMessages[0]?.count || 0,
       },
      karma: karma ? {
         totalPoints: karma.totalPoints,
         helpCount: karma.helpCount,
         level: karma.level,
         badge: karma.badge,
       } : {
         totalPoints: 0,
         helpCount: 0,
         level: 'Newbie',
         badge: '',
       },
       qrs: qrs.map((qr) => ({
         shortcode: qr.shortcode,
         qrId: qr.qrId,
         mode: qr.mode,
         status: qr.status,
         stats: qr.stats,
         isLost: qr.status === 'lost',
         lostModeActivatedAt: qr.lostModeActivatedAt,
         createdAt: qr.createdAt,
       })),
     },
   });
 })
);

/**
 * GET /api/dashboard/alerts
 * Get alerts for user (new messages, scans, etc.)
 */
router.get(
 '/alerts',
 asyncHandler(async (req: Request, res: Response) => {
   const userId = req.userId!;
   const limit = parseInt(req.query.limit as string) || 10;

   // Get recent sessions with unread messages
   const sessions = await RelaySession.find({ ownerId: userId, status: 'active' })
     .sort({ updatedAt: -1 })
     .limit(limit);

   const alerts: unknown[] = [];

   for (const session of sessions) {
     const unread = await RelayMessage.countDocuments({
       sessionId: session.sessionId,
       read: false,
     });

     if (unread > 0) {
       alerts.push({
         type: 'new_message',
         sessionId: session.sessionId,
         shortcode: session.shortcode,
         mode: session.mode,
         unreadCount: unread,
         createdAt: session.createdAt,
       });
     }
   }

   // Get recent scans
   const recentScans = await ScanEvent.find({ ownerId: userId })
     .sort({ createdAt: -1 })
     .limit(limit)
     .lean();

   for (const scan of recentScans) {
     alerts.push({
       type: 'scan',
       shortcode: scan.shortcode,
       mode: scan.mode,
       action: scan.action,
       createdAt: scan.createdAt,
     });
   }

   // Sort by date
   alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

   res.json({
     success: true,
     data: alerts.slice(0, limit),
   });
 })
);

/**
 * GET /api/dashboard/feed
 * Get user's karma feed posts
 */
router.get(
 '/feed',
 asyncHandler(async (req: Request, res: Response) => {
   const userId = req.userId!;

   const posts = await RelaySession.aggregate([
     { $match: { ownerId: userId } },
     {
       $lookup: {
         from: 'safeqrs',
         localField: 'shortcode',
         foreignField: 'shortcode',
         as: 'qr',
       },
     },
     { $unwind: '$qr' },
     {
       $project: {
         sessionId: '$sessionId',
         shortcode: 1,
         mode: 1,
         status: 1,
         messageCount: 1,
         qrStatus: '$qr.status',
         createdAt: 1,
       },
     },
   ]);

   res.json({
     success: true,
     data: posts,
   });
 })
);

export default router;
