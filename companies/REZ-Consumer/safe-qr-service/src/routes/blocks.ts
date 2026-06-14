import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UserBlock, RelayMessage, ScanEvent } from '../shared/models';
import { awardKarma } from '../shared/services/karma';
import { karmaEventTypes } from '../config/karma';
import { safeQRNotifications } from '../integrations/notifications';

const router = Router();

router.use(authenticate);

/**
 * GET /api/blocks
 * List blocked users
 */
router.get(
 '/',
 asyncHandler(async (req: Request, res: Response) => {
   const blocks = await UserBlock.getBlockedUsers(req.userId!);
   res.json({ success: true, data: blocks });
 })
);

/**
 * POST /api/blocks
 * Block a user
 */
router.post(
 '/',
 asyncHandler(async (req: Request, res: Response) => {
   const { userId, reason } = req.body;
   if (!userId) throw createError('userId is required', 400, 'VALIDATION_ERROR');

   const isBlocked = await UserBlock.isBlocked(req.userId!, userId);
   if (isBlocked) throw createError('User already blocked', 409, 'CONFLICT');

   await UserBlock.blockUser(req.userId!, userId, reason);

   // Penalize karma
   await awardKarma({
     userId,
     eventType: karmaEventTypes.SAFE_QR_BLOCKED,
     points: -5,
     reason: 'Blocked by another user',
   });

   res.status(201).json({ success: true, message: 'User blocked' });
 })
);

/**
 * DELETE /api/blocks/:userId
 * Unblock a user
 */
router.delete(
 '/:userId',
 asyncHandler(async (req: Request, res: Response) => {
   const { userId } = req.params;
   await UserBlock.unblockUser(req.userId!, userId);
   res.json({ success: true, message: 'User unblocked' });
 })
);

/**
 * POST /api/reports
 * Report a message or user
 */
router.post(
 '/report',
 asyncHandler(async (req: Request, res: Response) => {
   const { type, targetId, reason, messageId } = req.body;
   if (!type || !targetId) throw createError('type and targetId are required', 400, 'VALIDATION_ERROR');

   if (type === 'message' && messageId) {
     const message = await RelayMessage.findOne({ messageId });
     if (!message) throw createError('Message not found', 404, 'NOT_FOUND');

     message.isFlagged = true;
     message.flags.push({ type: 'reported', by: req.userId!, reason, at: new Date() });
     await message.save();

     // Penalize sender karma
     await awardKarma({
       userId: message.senderId,
       eventType: reason === 'spam' ? karmaEventTypes.SAFE_QR_SPAM : karmaEventTypes.SAFE_QR_ABUSE,
       points: reason === 'spam' ? -30 : -20,
       reason: `Reported as ${reason}`,
     });
   }

   logger.info(`Report: ${type} ${targetId} by ${req.userId}. Reason: ${reason}`);
   res.status(201).json({ success: true, message: 'Report submitted' });
 })
);

export default router;
