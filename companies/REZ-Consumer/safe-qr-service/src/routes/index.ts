import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SafeQR, ScanEvent, RelaySession } from '../shared/models';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { getPublicPetProfile, createPetQR } from '../modes/pet/petService';
import { getTemplates } from '../shared/schemas/templates';
import { safeQRNotifications } from '../integrations/notifications';
import { intentGraph } from '../integrations/rezIntelligence';
import { findOrCreateSession, sendRelayMessage } from '../shared/services/relay';
import { checkRateLimit, recordAction } from '../shared/services/rateLimitService';
import { checkSpam } from '../shared/services/spamDetection';
import { sanitizeQRContent, validateForStorage } from '../middleware/qrSanitizer';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
 res.json({
   status: 'ok',
   service: 'rez-safe-qr-service',
   timestamp: new Date().toISOString(),
 });
});

/**
 * GET /api/scan/:shortcode
 * Scan a Safe QR - public endpoint
 */
router.get(
 '/scan/:shortcode',
 optionalAuth,
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   // Fetch QR
   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   // Track scan event
   const scanEvent = new ScanEvent({
     shortcode: qr.shortcode,
     qrId: qr.qrId,
     mode: qr.mode,
     ownerId: qr.ownerId,
     scannerId: req.userId,
     scannerIp: req.ip,
     action: 'view',
     scanSource: req.headers['x-app-source'] as string || 'unknown',
   });
   await scanEvent.save();

   // Update QR stats
   qr.stats.totalScans += 1;
   qr.stats.lastScanAt = new Date();
   await qr.save();

   // Get public profile based on mode
   let publicProfile: unknown = null;
   if (qr.mode === 'pet') {
     publicProfile = await getPublicPetProfile(normalizedShortcode);
   }

   // Get templates for this mode
   const templates = getTemplates(qr.mode);

   // Track intent
   await intentGraph.trackScan(req.userId, qr.qrId, qr.mode, 'view');

   // Notify owner (if enabled)
   if (qr.settings.notifyOnScan && req.userId !== qr.ownerId) {
     await safeQRNotifications.onScan(qr.qrId, qr.ownerId, qr.mode, req.userId);
   }

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       mode: qr.mode,
       status: qr.status,
       profile: publicProfile,
       templates,
       settings: {
         allowMessages: qr.settings.allowMessages,
         allowContactRequests: qr.settings.allowContactRequests,
       },
     },
   });
 })
);

/**
 * POST /api/scan/:shortcode/message
 * Send a message via Safe QR (public endpoint)
 * SECURITY: Message content is sanitized to prevent XSS/injection attacks
 */
router.post(
 '/scan/:shortcode/message',
 optionalAuth,
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { content, type = 'text', templateId, location } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   if (!content) {
     throw createError('Message content required', 400, 'VALIDATION_ERROR');
   }

   // SECURITY: Sanitize message content to prevent XSS and injection attacks
   const sanitizedResult = sanitizeQRContent(content);
   if (!sanitizedResult.isValid) {
     throw createError('Invalid message content: ' + sanitizedResult.warnings.join('; '), 400, 'VALIDATION_ERROR');
   }

   const sanitizedContent = sanitizedResult.content;

   // Fetch QR
   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (!qr.settings.allowMessages) {
     throw createError('Messages not allowed for this QR', 403, 'FORBIDDEN');
   }

   // Rate limit check
   const senderId = req.userId || req.ip || 'anonymous';
   const rateLimit = await checkRateLimit(senderId, 'message');
   if (!rateLimit.allowed) {
     throw createError('Rate limited. Try again later.', 429, 'RATE_LIMITED');
   }

   // Spam check for text messages (use sanitized content)
   if (type === 'text') {
     const isSpam = await checkSpam(sanitizedContent);
     if (isSpam) {
       throw createError('Message flagged as spam', 400, 'SPAM_DETECTED');
     }
   }

   // Find or create session
   const session = await findOrCreateSession({
     shortcode: qr.shortcode,
     qrId: qr.qrId,
     mode: qr.mode,
     ownerId: qr.ownerId,
     finderId: req.userId,
   });

   // Send message (use sanitized content)
   const message = await sendRelayMessage({
     sessionId: session.sessionId,
     senderId: senderId as string,
     senderRole: 'finder',
     content: sanitizedContent,
     type,
     templateId,
     locationData: location,
   });

   // Record rate limit action
   await recordAction(senderId as string, 'message');

   // Update QR stats
   qr.stats.totalMessages += 1;
   await qr.save();

   // Track intent
   await intentGraph.trackScan(req.userId, qr.qrId, qr.mode, 'contact');

   // Track scan event
   const scanEvent = new ScanEvent({
     shortcode: qr.shortcode,
     qrId: qr.qrId,
     mode: qr.mode,
     ownerId: qr.ownerId,
     scannerId: req.userId,
     scannerIp: req.ip,
     action: 'template_sent',
     sessionId: session.sessionId,
   });
   await scanEvent.save();

   res.status(201).json({
     success: true,
     data: {
       messageId: message.messageId,
       sessionId: session.sessionId,
     },
   });
 })
);

/**
 * GET /api/scan/:shortcode/contact-request
 * Get contact request form (public endpoint)
 */
router.get(
 '/scan/:shortcode/contact-request',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (!qr.settings.allowContactRequests) {
     throw createError('Contact requests not allowed', 403, 'FORBIDDEN');
   }

   const templates = getTemplates(qr.mode);

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       mode: qr.mode,
       allowCustomMessage: qr.settings.allowMessages,
       templates,
     },
   });
 })
);

export default router;
