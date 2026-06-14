import { v4 as uuidv4 } from 'uuid';
import { RelaySession, RelayMessage } from '../models';
import { checkSpam } from './spamDetection';
import { awardKarma } from './karma';
import { safeQRNotifications } from '../../integrations/notifications';
import { karmaEventTypes } from '../../config/karma';
import { config } from '../../config';

/**
 * Relay Service
 * Handles anonymous message relay between finders and owners
 */

export interface SendMessageOptions {
 sessionId: string;
 senderId: string;
 senderRole: 'finder' | 'owner';
 content: string;
 type?: 'text' | 'template' | 'location';
 templateId?: string;
 locationData?: {
   lat: number;
   lng: number;
   address?: string;
 };
}

export interface CreateSessionOptions {
 shortcode: string;
 qrId: string;
 mode: string;
 ownerId: string;
 finderId?: string;
}

/**
 * Create a new relay session
 */
export async function createRelaySession(options: CreateSessionOptions): Promise<RelaySession> {
 const sessionId = `session_${uuidv4()}`;
 const expiresAt = new Date(Date.now() + config.session.expiryHours * 60 * 60 * 1000);

 const session = new RelaySession({
   sessionId,
   shortcode: options.shortcode,
   qrId: options.qrId,
   mode: options.mode,
   ownerId: options.ownerId,
   finderId: options.finderId,
   status: 'active',
   messageCount: 0,
   expiresAt,
 });

 await session.save();
 return session;
}

/**
 * Find or create session for a QR
 */
export async function findOrCreateSession(options: CreateSessionOptions): Promise<RelaySession> {
 // Check for existing active session
 const existing = await RelaySession.findOne({
   qrId: options.qrId,
   status: 'active',
 });

 if (existing) {
   // Update finder if not set
   if (!existing.finderId && options.finderId) {
     existing.finderId = options.finderId;
     await existing.save();
   }
   return existing;
 }

 return createRelaySession(options);
}

/**
 * Send a message via relay
 */
export async function sendRelayMessage(options: SendMessageOptions): Promise<RelayMessage> {
 const session = await RelaySession.findOne({ sessionId: options.sessionId });
 if (!session) {
   throw new Error('Session not found');
 }

 if (session.status !== 'active') {
   throw new Error('Session is not active');
 }

 // Check if blocked
 if (session.finderId === options.senderId) {
   // Finder is sending
 } else if (session.ownerId === options.senderId) {
   // Owner is sending
 } else {
   throw new Error('User is not part of this session');
 }

 // Spam check for text messages
 if (options.type === 'text' || !options.type) {
   const isSpam = await checkSpam(options.content);
   if (isSpam) {
     throw new Error('Message flagged as spam');
   }
 }

 // Create message
 const messageId = `msg_${uuidv4()}`;
 const expiresAt = new Date(Date.now() + config.session.messageExpiryDays * 24 * 60 * 60 * 1000);

 const message = new RelayMessage({
   messageId,
   sessionId: options.sessionId,
   senderId: options.senderId,
   senderRole: options.senderRole,
   content: options.content,
   type: options.type || 'text',
   templateId: options.templateId,
   locationData: options.locationData,
   expiresAt,
 });

 await message.save();

 // Update session
 session.messageCount += 1;
 session.updatedAt = new Date();
 if (options.senderRole === 'owner') {
   session.ownerRead = true;
 } else {
   session.finderRead = true;
 }
 await session.save();

 // Notify recipient
 const recipientId = options.senderRole === 'finder' ? session.ownerId : session.finderId;
 if (recipientId) {
   await safeQRNotifications.onNewMessage(session.qrId, recipientId);
 }

 // Award karma for template messages from finder
 if (options.senderRole === 'finder' && options.type === 'template') {
   await awardKarma({
     userId: options.senderId,
     eventType: karmaEventTypes.SAFE_QR_HELP_SENT,
     safeQRId: session.qrId,
     mode: session.mode,
     points: 5,
     metadata: { templateId: options.templateId },
   });
 }

 return message;
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(
 sessionId: string,
 limit = 50,
 before?: Date
): Promise<RelayMessage[]> {
 const query: Record<string, unknown> = { sessionId };
 if (before) {
   query.createdAt = { $lt: before };
 }

 return RelayMessage.find(query)
   .sort({ createdAt: -1 })
   .limit(limit)
   .lean();
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(sessionId: string, userId: string): Promise<number> {
 const session = await RelaySession.findOne({ sessionId });
 if (!session) return 0;

 // Messages where the recipient is the user and not read
 const query: Record<string, unknown> = {
   sessionId,
   read: false,
 };

 if (session.finderId === userId) {
   query.senderId = session.ownerId;
 } else if (session.ownerId === userId) {
   query.senderId = { $in: [session.finderId, { $exists: true }] };
 }

 return RelayMessage.countDocuments(query);
}

/**
 * Mark messages as read
 */
export async function markMessagesRead(sessionId: string, userId: string): Promise<void> {
 await RelayMessage.updateMany(
   {
     sessionId,
     senderId: { $ne: userId },
     read: false,
   },
   {
     $set: { read: true },
   }
 );

 // Update session read status
 const session = await RelaySession.findOne({ sessionId });
 if (session) {
   if (session.finderId === userId) {
     session.finderRead = true;
   } else if (session.ownerId === userId) {
     session.ownerRead = true;
   }
   await session.save();
 }
}

/**
 * Close a session
 */
export async function closeRelaySession(
 sessionId: string,
 status: 'closed' | 'resolved' = 'closed'
): Promise<void> {
 await RelaySession.findOneAndUpdate(
   { sessionId },
   {
     $set: {
       status,
       closedAt: new Date(),
     },
   }
 );
}

/**
 * Get user's active sessions
 */
export async function getUserSessions(userId: string): Promise<RelaySession[]> {
 return RelaySession.find({
   $or: [
     { ownerId: userId, status: 'active' },
     { finderId: userId, status: 'active' },
   ],
 })
   .sort({ updatedAt: -1 })
   .lean();
}

/**
 * Get session by ID
 */
export async function getRelaySession(sessionId: string): Promise<RelaySession | null> {
 return RelaySession.findOne({ sessionId });
}

/**
 * Mark item as found and credit helpers
 */
export async function markAsFound(
 sessionId: string,
 ownerId: string
): Promise<void> {
 const session = await RelaySession.findOne({ sessionId });
 if (!session || session.ownerId !== ownerId) {
   throw new Error('Not authorized');
 }

 // Close session as resolved
 session.status = 'resolved';
 session.closedAt = new Date();
 await session.save();

 // Award karma to finder
 if (session.finderId) {
   await awardKarma({
     userId: session.finderId,
     eventType: karmaEventTypes.SAFE_QR_ITEM_FOUND,
     safeQRId: session.qrId,
     mode: session.mode,
     points: 25,
     metadata: { sessionId },
   });
 }
}
