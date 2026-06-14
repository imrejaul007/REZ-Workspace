import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { RelaySession, RelayMessage } from '../shared/models';
import {
 getUserSessions,
 getRelaySession,
 getSessionMessages,
 markMessagesRead,
 closeRelaySession,
} from '../shared/services/relay';
import { getUnreadCount } from '../shared/services/relay';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/sessions
 * List user's sessions (as owner or finder)
 */
router.get(
 '/',
 asyncHandler(async (req: Request, res: Response) => {
   const sessions = await getUserSessions(req.userId!);

   // Enrich sessions with unread counts
   const enrichedSessions = await Promise.all(
     sessions.map(async (session) => {
       const unreadCount = await getUnreadCount(session.sessionId, req.userId!);
       const lastMessage = await RelayMessage.findOne({ sessionId: session.sessionId })
         .sort({ createdAt: -1 })
         .lean();

       return {
         sessionId: session.sessionId,
         shortcode: session.shortcode,
         mode: session.mode,
         status: session.status,
         isOwner: session.ownerId === req.userId,
         unreadCount,
         lastMessage: lastMessage ? {
           content: lastMessage.content,
           senderRole: lastMessage.senderRole,
           createdAt: lastMessage.createdAt,
         } : null,
         expiresAt: session.expiresAt,
         createdAt: session.createdAt,
       };
     })
   );

   res.json({
     success: true,
     data: enrichedSessions,
   });
 })
);

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get(
 '/:sessionId',
 asyncHandler(async (req: Request, res: Response) => {
   const { sessionId } = req.params;

   const session = await getRelaySession(sessionId);
   if (!session) {
     throw createError('Session not found', 404, 'NOT_FOUND');
   }

   // Check access
   if (session.ownerId !== req.userId && session.finderId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   const unreadCount = await getUnreadCount(sessionId, req.userId!);

   res.json({
     success: true,
     data: {
       sessionId: session.sessionId,
       shortcode: session.shortcode,
       mode: session.mode,
       status: session.status,
       isOwner: session.ownerId === req.userId,
       isFinder: session.finderId === req.userId,
       unreadCount,
       messageCount: session.messageCount,
       expiresAt: session.expiresAt,
       createdAt: session.createdAt,
       closedAt: session.closedAt,
     },
   });
 })
);

/**
 * GET /api/sessions/:sessionId/messages
 * Get session messages
 */
router.get(
 '/:sessionId/messages',
 asyncHandler(async (req: Request, res: Response) => {
   const { sessionId } = req.params;
   const limit = parseInt(req.query.limit as string) || 50;
   const before = req.query.before as string;

   const session = await getRelaySession(sessionId);
   if (!session) {
     throw createError('Session not found', 404, 'NOT_FOUND');
   }

   // Check access
   if (session.ownerId !== req.userId && session.finderId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   const messages = await getSessionMessages(
     sessionId,
     limit,
     before ? new Date(before) : undefined
   );

   // Mark as read
   await markMessagesRead(sessionId, req.userId!);

   res.json({
     success: true,
     data: messages.map((msg) => ({
       messageId: msg.messageId,
       senderId: msg.senderId,
       senderRole: msg.senderRole,
       content: msg.content,
       type: msg.type,
       templateId: msg.templateId,
       read: msg.read,
       createdAt: msg.createdAt,
     })),
   });
 })
);

/**
 * POST /api/sessions/:sessionId/read
 * Mark messages as read
 */
router.post(
 '/:sessionId/read',
 asyncHandler(async (req: Request, res: Response) => {
   const { sessionId } = req.params;

   const session = await getRelaySession(sessionId);
   if (!session) {
     throw createError('Session not found', 404, 'NOT_FOUND');
   }

   // Check access
   if (session.ownerId !== req.userId && session.finderId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   await markMessagesRead(sessionId, req.userId!);

   res.json({
     success: true,
   });
 })
);

/**
 * DELETE /api/sessions/:sessionId
 * Close a session
 */
router.delete(
 '/:sessionId',
 asyncHandler(async (req: Request, res: Response) => {
   const { sessionId } = req.params;

   const session = await getRelaySession(sessionId);
   if (!session) {
     throw createError('Session not found', 404, 'NOT_FOUND');
   }

   // Only owner or finder can close
   if (session.ownerId !== req.userId && session.finderId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   await closeRelaySession(sessionId, 'closed');

   res.json({
     success: true,
   });
 })
);

export default router;
