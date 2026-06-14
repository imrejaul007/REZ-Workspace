/**
 * QR Check-In routes.
 *
 * GET /qr/:storeId — returns QR payload and deep-link for store check-in
 *
 * Mirrors the monolith's GET /api/merchant/qr/:storeId from merchantQrRoutes.ts.
 * Auth is handled by this router via merchantAuth; the microservice owns the
 * Store model on the same MongoDB collection.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * GET /qr/:storeId
 * Returns a QR payload and deep-link for store check-in.
 * The authenticated merchant must own the requested store.
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' });
      return;
    }

    const store = await Store.findOne({
      _id: storeId,
      $or: [{ merchant: req.merchantId }, { merchantId: req.merchantId }],
    })
      .select('name logo merchant merchantId')
      .lean();

    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found or does not belong to this merchant' });
      return;
    }

    const qrPayload = { storeId, action: 'checkin', v: 1 };

    res.json({
      success: true,
      data: {
        storeId,
        storeName: (store as unknown).name,
        logo: (store as unknown).logo || null,
        qrPayload,
        qrString: JSON.stringify(qrPayload),
        deepLink: `rezapp://checkin?storeId=${storeId}`,
      },
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
