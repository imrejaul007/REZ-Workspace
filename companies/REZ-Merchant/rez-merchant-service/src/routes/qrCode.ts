
/**
 * QR Code Generation routes - Generate styled QR codes for stores.
 *
 * Endpoints:
 * POST /qr/generate - Generate a QR code image
 * GET  /qr/:storeId/links - Get QR codes for all store links
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { StoreLink } from '../models/StoreLink';
import { merchantAuth } from '../middleware/auth';
import QRCode from 'qrcode';

// Type definitions for QR generation
interface QRGenerateRequest {
  storeId: string;
  type: 'store' | 'menu' | 'reservation' | 'custom';
  url: string;
  style?: {
    foregroundColor?: string;
    backgroundColor?: string;
    logo?: string;
    width?: number;
    margin?: number;
  };
}

interface QRStyle {
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string;
  width?: number;
  margin?: number;
}

const router = Router();
router.use(merchantAuth);

/**
 * Verify merchant owns the store.
 */
async function verifyStoreOwnership(storeId: string, merchantId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return false;
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    $or: [{ merchantId: new mongoose.Types.ObjectId(merchantId) }, { merchant: new mongoose.Types.ObjectId(merchantId) }],
  });
  return !!store;
}

/**
 * Validate hex color string.
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * POST /qr/generate
 * Generate a QR code image.
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { storeId, type, url, style } = req.body as QRGenerateRequest;

    // Validate required fields
    if (!storeId || !type || !url) {
      res.status(400).json({ success: false, message: 'storeId, type, and url are required' });
      return;
    }

    if (!['store', 'menu', 'reservation', 'custom'].includes(type)) {
      res.status(400).json({ success: false, message: 'type must be one of: store, menu, reservation, custom' });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({ success: false, message: 'Invalid URL' });
      return;
    }

    // Verify ownership
    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    // Build QR code options
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      width: Math.min(Math.max(style?.width || 300, 100), 1000),
      margin: Math.min(Math.max(style?.margin || 2, 0), 10),
      color: {
        dark: isValidHexColor(style?.foregroundColor || '#000000') ? style?.foregroundColor : '#000000',
        light: isValidHexColor(style?.backgroundColor || '#FFFFFF') ? style?.backgroundColor : '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    // Generate QR code as base64 data URL
    const qrDataUrl = await QRCode.toDataURL(url, qrOptions);

    // If logo is provided, we'd need canvas manipulation (out of scope for basic implementation)
    // For production, consider using a library like sharp or canvas to composite logo onto QR

    const result = {
      storeId,
      type,
      url,
      qrCode: qrDataUrl,
      style: {
        foregroundColor: qrOptions.color.dark,
        backgroundColor: qrOptions.color.light,
        width: qrOptions.width,
        margin: qrOptions.margin,
      },
    };

    res.json({ success: true, data: result });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /qr/generate/png
 * Generate a QR code as PNG buffer (for direct download).
 */
router.post('/generate/png', async (req: Request, res: Response) => {
  try {
    const { storeId, url, style } = req.body as QRGenerateRequest;

    if (!storeId || !url) {
      res.status(400).json({ success: false, message: 'storeId and url are required' });
      return;
    }

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const qrOptions: QRCode.QRCodeToFileOptions = {
      width: Math.min(Math.max(style?.width || 300, 100), 1000),
      margin: Math.min(Math.max(style?.margin || 2, 0), 10),
      color: {
        dark: isValidHexColor(style?.foregroundColor || '#000000') ? style?.foregroundColor : '#000000',
        light: isValidHexColor(style?.backgroundColor || '#FFFFFF') ? style?.backgroundColor : '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
      type: 'png',
    };

    // Return as base64 for direct usage
    const qrBase64 = await QRCode.toDataURL(url, qrOptions);
    const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');

    res.json({ success: true, data: { png: base64Data } });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /qr/:storeId/links
 * Get QR codes for all store links.
 */
router.get('/:storeId/links', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const baseUrl = req.query.baseUrl as string || '';

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const storeLink: unknown = await StoreLink.findOne({ storeId: new mongoose.Types.ObjectId(storeId) }).lean();
    if (!storeLink || !storeLink.links || storeLink.links.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // Generate QR codes for each link
    const qrCodes = await Promise.all(
      storeLink.links.map(async (link) => {
        const linkUrl = link.url.startsWith('http') ? link.url : `${baseUrl}${link.url}`;
        const qrDataUrl = await QRCode.toDataURL(linkUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        return {
          linkId: link.id,
          type: link.type,
          title: link.title,
          url: link.url,
          qrCode: qrDataUrl,
        };
      }),
    );

    res.json({ success: true, data: qrCodes });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
