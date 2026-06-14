/**
 * REZ Go QR Generator Routes
 *
 * Generates QR codes for:
 * - Store entry (go-session)
 * - Product QR (go-product)
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { GoStore } from '../models/GoStore.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();

/**
 * Generate store entry QR
 * GET /api/qr/store/:storeId
 */
router.get('/store/:storeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    // Get store info
    const store = await GoStore.findOne({ storeId });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Generate QR payload
    const payload = {
      intent: 'go-session',
      v: 1,
      storeId: store.storeId,
      action: 'start',
      storeName: store.name,
    };

    // Generate unique session for tracking
    const trackingId = `QR-${uuidv4().substring(0, 8)}`;

    // In production, this would generate an actual QR code image
    // For now, return the payload that can be used with any QR generator
    const qrData = JSON.stringify(payload);

    res.json({
      success: true,
      store: {
        storeId: store.storeId,
        name: store.name,
        logo: store.logo,
        address: store.address,
        storeType: store.storeType,
      },
      qr: {
        data: qrData,
        payload,
        trackingId,
        // In production, include actual QR code URL:
        // imageUrl: `${config.BASE_URL}/qr/image/${trackingId}.png`
      },
      instructions: [
        'Print this QR and display it at the store entrance',
        'Customers scan this QR to start shopping',
        'Ensure QR is placed at eye level and well-lit area',
      ],
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

/**
 * Generate bulk store QR codes
 * POST /api/qr/store/:storeId/bulk
 */
router.post('/store/:storeId/bulk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { count = 3 } = req.body;

    const store = await GoStore.findOne({ storeId });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const qrCodes = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const trackingId = `QR-${uuidv4().substring(0, 8)}`;
      qrCodes.push({
        id: trackingId,
        payload: {
          intent: 'go-session',
          v: 1,
          storeId: store.storeId,
          action: 'start',
          storeName: store.name,
          trackingId,
        },
        position: i + 1,
      });
    }

    res.json({
      success: true,
      store: {
        storeId: store.storeId,
        name: store.name,
      },
      qrCodes,
      count: qrCodes.length,
    });
  } catch (error) {
    console.error('Bulk QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate bulk QR codes' });
  }
});

/**
 * Generate product QR code
 * GET /api/qr/product/:barcode
 */
router.get('/product/:barcode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const { sessionId, storeId } = req.query;

    if (!sessionId || !storeId) {
      return res.status(400).json({
        error: 'sessionId and storeId are required',
      });
    }

    const payload = {
      intent: 'go-product',
      v: 1,
      storeId,
      sessionId,
      barcode,
      productId: `PROD-${barcode}`,
    };

    const qrData = JSON.stringify(payload);

    res.json({
      success: true,
      qr: {
        data: qrData,
        payload,
        barcode,
      },
    });
  } catch (error) {
    console.error('Product QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate product QR' });
  }
});

/**
 * Get QR download link (for printing)
 * GET /api/qr/download/:trackingId
 */
router.get('/download/:trackingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const { format = 'png', size = 300 } = req.query;

    // In production, this would generate and serve the actual QR image
    // For now, return a placeholder response
    res.json({
      success: true,
      download: {
        trackingId,
        format,
        size: Number(size),
        // In production:
        // url: `${config.CDN_URL}/qr/${trackingId}.${format}`,
        message: 'QR code image generation would happen here',
      },
    });
  } catch (error) {
    console.error('QR download error:', error);
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

/**
 * Get merchant's stores with QR status
 * GET /api/qr/merchant/stores
 */
router.get('/merchant/stores', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).user?.merchantId;
    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant ID not found' });
    }

    const stores = await GoStore.find({ merchantId });

    const storesWithQR = stores.map((store) => ({
      storeId: store.storeId,
      name: store.name,
      goEnabled: store.goEnabled,
      status: store.status,
      qrGenerated: !!store.qrCode,
      lastGenerated: store.qrCode ? new Date() : null,
    }));

    res.json({
      success: true,
      stores: storesWithQR,
    });
  } catch (error) {
    console.error('Merchant stores error:', error);
    res.status(500).json({ error: 'Failed to get merchant stores' });
  }
});

export default router;
