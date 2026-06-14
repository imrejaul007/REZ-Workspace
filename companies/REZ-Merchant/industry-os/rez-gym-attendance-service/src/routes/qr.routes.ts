/**
 * QR Routes
 */

import { Router, Request, Response } from 'express';
import { QRSession } from '../models/QRSession';

const router = Router();

// POST /api/qr/generate - Generate QR session
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, gymId } = req.body;

    // Invalidate existing unused sessions
    await QRSession.updateMany(
      { userId, gymId, isUsed: false },
      { $set: { expiresAt: new Date().toISOString() } }
    );

    const sessionId = `QRS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const qrCode = `GYM_${userId}_${Date.now()}`;

    // QR expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const session = new QRSession({
      sessionId,
      userId,
      gymId,
      qrCode,
      expiresAt,
      isUsed: false,
    });

    await session.save();

    res.status(201).json({ success: true, data: { qrCode, expiresAt } });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ success: false, error: 'Failed to generate QR' });
  }
});

// POST /api/qr/validate - Validate QR code
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;

    const session = await QRSession.findOne({ qrCode, isUsed: false });

    if (!session) {
      res.status(404).json({ success: false, error: 'Invalid or already used QR code' });
      return;
    }

    if (new Date() > new Date(session.expiresAt)) {
      res.status(400).json({ success: false, error: 'QR code expired' });
      return;
    }

    res.json({ success: true, data: { valid: true, sessionId: session.sessionId } });
  } catch (error) {
    console.error('Error validating QR:', error);
    res.status(500).json({ success: false, error: 'Failed to validate QR' });
  }
});

// POST /api/qr/use - Mark QR as used
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;

    const session = await QRSession.findOneAndUpdate(
      { qrCode, isUsed: false },
      {
        $set: {
          isUsed: true,
          usedAt: new Date().toISOString(),
        },
      },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, error: 'Invalid QR code' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error using QR:', error);
    res.status(500).json({ success: false, error: 'Failed to use QR' });
  }
});

export { router as qrRoutes };
