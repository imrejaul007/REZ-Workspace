import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR } from '../shared/models';

const router = Router();

/**
 * GET /api/qr/:shortcode/generate
 * Generate QR code image
 */
router.get(
 '/:shortcode/generate',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { format = 'png', size = 300, dark = '000000', light = 'ffffff', download } = req.query;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   // Build QR payload
   const payload = JSON.stringify(qr.qrPayload);

   const options: QRCode.QRCodeToDataURLOptions = {
     width: parseInt(size as string) || 300,
     margin: 2,
     color: {
       dark: `#${dark}`,
       light: `#${light}`,
     },
     errorCorrectionLevel: 'M',
   };

   if (format === 'svg') {
     const svg = await QRCode.toString(payload, { type: 'svg', ...options });
     res.setHeader('Content-Type', 'image/svg+xml');
     if (download) {
       res.setHeader('Content-Disposition', `attachment; filename="${normalizedShortcode}.svg"`);
     }
     res.send(svg);
   } else {
     const dataUrl = await QRCode.toDataURL(payload, options);
     const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

     res.setHeader('Content-Type', 'image/png');
     if (download) {
       res.setHeader('Content-Disposition', `attachment; filename="${normalizedShortcode}.png"`);
     }
     res.send(Buffer.from(base64Data, 'base64'));
   }
 })
);

/**
 * GET /api/qr/:shortcode/link
 * Get QR link for sharing
 */
router.get(
 '/:shortcode/link',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   const baseUrl = process.env.QR_BASE_URL || 'https://rez.app/s';
   const link = `${baseUrl}/${normalizedShortcode}`;

   res.json({
     success: true,
     data: {
       shortcode: normalizedShortcode,
       mode: qr.mode,
       link,
       qrUrl: `${link}/qr`,
       scanUrl: link,
     },
   });
 })
);

/**
 * POST /api/qr/generate-bulk
 * Generate multiple QR codes (for events, schools, etc.)
 */
router.post(
 '/generate-bulk',
 authenticate,
 asyncHandler(async (req: Request, res: Response) => {
   const { count = 10, mode, prefix } = req.body;

   if (!mode && !prefix) {
     throw createError('mode or prefix is required', 400, 'VALIDATION_ERROR');
   }

   const limit = Math.min(count, 100);
   const qrs: unknown[] = [];

   for (let i = 0; i < limit; i++) {
     const shortcode = `${prefix || 'REZX'}${randomBytes(2).toString('hex').substring(0, 2).toUpperCase()}`;
     const qrId = `bulk_${Date.now()}_${i}`;

     const qr = new SafeQR({
       shortcode,
       qrId,
       mode: mode || 'event',
       ownerId: req.userId!,
       status: 'active',
       profile: { mode: mode || 'event' },
       settings: {
         allowMessages: true,
         allowContactRequests: true,
         notifyOnScan: true,
       },
       qrPayload: {
         v: 1,
         type: 'safe',
         mode: mode || 'event',
         id: qrId,
         shortcode,
       },
       stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
       karma: { isRegistered: true },
     });

     await qr.save();
     qrs.push({
       shortcode,
       qrId,
       mode: qr.mode,
       link: `https://rez.app/s/${shortcode}`,
     });
   }

   res.status(201).json({
     success: true,
     data: {
       count: qrs.length,
       qrs,
     },
   });
 })
);

export default router;
