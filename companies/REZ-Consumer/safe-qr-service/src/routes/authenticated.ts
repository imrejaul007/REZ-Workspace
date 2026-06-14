import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR } from '../shared/models';
import { createPetQR, getFullPetProfile, updatePetProfile, activateLostMode, markAsFound } from '../modes/pet/petService';
import { generateShortcodeSuffix, generateQRId } from '../shared/services/qrParser';
import { SafeQRMode, generateShortcode } from '../shared/schemas/safeQR';
import { ModeProfile } from '../shared/schemas/profile';
import { SafeQRSettings } from '../shared/schemas/safeQR';
import { sanitizeQRContent } from '../middleware/qrSanitizer';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/qr
 * Create a new Safe QR
 * SECURITY: Profile data is sanitized to prevent XSS/injection attacks
 */
router.post(
 '/qr',
 asyncHandler(async (req: Request, res: Response) => {
   const { mode, profile, settings } = req.body;

   if (!mode) {
     throw createError('Mode is required', 400, 'VALIDATION_ERROR');
   }

   if (!profile) {
     throw createError('Profile is required', 400, 'VALIDATION_ERROR');
   }

   // SECURITY: Sanitize profile text fields
   const sanitizedProfile: Record<string, unknown> = { mode };
   for (const [key, value] of Object.entries(profile)) {
     if (typeof value === 'string') {
       const result = sanitizeQRContent(value);
       if (result.isValid) {
         sanitizedProfile[key] = result.content;
       } else {
         throw createError(`Invalid profile field "${key}": ${result.warnings.join('; ')}`, 400, 'VALIDATION_ERROR');
       }
     } else {
       sanitizedProfile[key] = value;
     }
   }

   const shortcode = generateShortcode(mode as SafeQRMode, generateShortcodeSuffix());
   const qrId = generateQRId(mode as SafeQRMode);

   const qr = new SafeQR({
     shortcode,
     qrId,
     mode,
     ownerId: req.userId!,
     status: 'active',
     profile: sanitizedProfile,
     settings: {
       allowMessages: settings?.allowMessages ?? true,
       allowContactRequests: settings?.allowContactRequests ?? true,
       shareLocationOnScan: settings?.shareLocationOnScan ?? false,
       notifyOnScan: settings?.notifyOnScan ?? true,
       autoActivateLost: settings?.autoActivateLost ?? false,
       requireApproval: settings?.requireApproval ?? true,
     } as unknown,
     qrPayload: {
       v: 1,
       type: 'safe',
       mode,
       id: qrId,
       shortcode,
     },
     stats: {
       totalScans: 0,
       uniqueScanners: 0,
       totalMessages: 0,
     },
     karma: {
       isRegistered: true,
     },
   });

   await qr.save();

   res.status(201).json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       qrId: qr.qrId,
       mode: qr.mode,
       qrUrl: `https://rez.app/s/${qr.shortcode}`,
     },
   });
 })
);

/**
 * GET /api/qr/my
 * List user's QRs
 */
router.get(
 '/qr/my',
 asyncHandler(async (req: Request, res: Response) => {
   const qrs = await SafeQR.find({ ownerId: req.userId })
     .select('shortcode qrId mode status stats createdAt')
     .sort({ createdAt: -1 });

   res.json({
     success: true,
     data: qrs.map((qr) => ({
       shortcode: qr.shortcode,
       qrId: qr.qrId,
       mode: qr.mode,
       status: qr.status,
       stats: qr.stats,
       createdAt: qr.createdAt,
     })),
   });
 })
);

/**
 * GET /api/qr/:shortcode
 * Get QR details (owner only)
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

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       qrId: qr.qrId,
       mode: qr.mode,
       status: qr.status,
       profile: qr.profile,
       settings: qr.settings,
       stats: qr.stats,
       qrUrl: `https://rez.app/s/${qr.shortcode}`,
       qrPayload: qr.qrPayload,
       createdAt: qr.createdAt,
       updatedAt: qr.updatedAt,
     },
   });
 })
);

/**
 * PUT /api/qr/:shortcode
 * Update QR settings
 */
router.put(
 '/qr/:shortcode',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { settings, status } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   if (settings) {
     qr.settings = {
       ...qr.settings,
       ...settings,
     };
   }

   if (status) {
     qr.status = status;
   }

   qr.updatedAt = new Date();
   await qr.save();

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       status: qr.status,
       settings: qr.settings,
     },
   });
 })
);

/**
 * DELETE /api/qr/:shortcode
 * Delete QR
 */
router.delete(
 '/qr/:shortcode',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   await SafeQR.deleteOne({ shortcode: normalizedShortcode });

   res.json({
     success: true,
     message: 'QR deleted successfully',
   });
 })
);

/**
 * POST /api/qr/:shortcode/lost
 * Activate lost mode
 */
router.post(
 '/qr/:shortcode/lost',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { lastSeenLocation, reward } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   // Use mode-specific activation
   let result;
   if (qr.mode === 'pet') {
     result = await activateLostMode({
       shortcode: normalizedShortcode,
       ownerId: req.userId!,
       lastSeenLocation,
       reward,
     });
   } else {
     // Generic activation
     qr.status = 'lost';
     qr.lostModeActivatedAt = new Date();
     await qr.save();
     result = qr;
   }

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       status: 'lost',
       lostModeActivatedAt: qr.lostModeActivatedAt,
     },
   });
 })
);

/**
 * POST /api/qr/:shortcode/found
 * Mark as found
 */
router.post(
 '/qr/:shortcode/found',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { helperIds } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   // Use mode-specific resolution
   if (qr.mode === 'pet') {
     await markAsFound(normalizedShortcode, req.userId!, helperIds);
   } else {
     qr.status = 'active';
     qr.lostModeActivatedAt = undefined;
     await qr.save();
   }

   res.json({
     success: true,
     data: {
       shortcode: qr.shortcode,
       status: 'active',
     },
   });
 })
);

/**
 * GET /api/qr/:shortcode/profile
 * Get full profile (owner only)
 */
router.get(
 '/qr/:shortcode/profile',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   // Mode-specific profile retrieval
   let profile = qr.profile;
   if (qr.mode === 'pet') {
     profile = await getFullPetProfile(normalizedShortcode, req.userId!);
   }

   res.json({
     success: true,
     data: profile,
   });
 })
);

/**
 * PUT /api/qr/:shortcode/profile
 * Update profile
 * SECURITY: Profile data is sanitized to prevent XSS/injection attacks
 */
router.put(
 '/qr/:shortcode/profile',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { profile } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   // SECURITY: Sanitize profile text fields
   const sanitizedProfile: Record<string, unknown> = { ...qr.profile };
   for (const [key, value] of Object.entries(profile)) {
     if (typeof value === 'string') {
       const result = sanitizeQRContent(value);
       if (result.isValid) {
         sanitizedProfile[key] = result.content;
       } else {
         throw createError(`Invalid profile field "${key}": ${result.warnings.join('; ')}`, 400, 'VALIDATION_ERROR');
       }
     } else {
       sanitizedProfile[key] = value;
     }
   }

   qr.profile = sanitizedProfile;
   qr.updatedAt = new Date();
   await qr.save();

   res.json({
     success: true,
     data: qr.profile,
   });
 })
);

export default router;
