/**
 * Expiry Tracking Routes
 */

import { Router, Request, Response } from 'express';
import { ExpiryTracking } from '../models';

const router = Router();

// Add item for tracking
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = new ExpiryTracking({
      itemId: `EXP${Date.now()}`,
      ...req.body,
      status: 'fresh',
    });
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add item' });
  }
});

// Get tracked items
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, status, category } = req.query;
    const query: unknown = {};
    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    if (category) query.category = category;
    const items = await ExpiryTracking.find(query).sort({ expiryDate: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Get expiring soon
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const { restaurantId, days } = req.query;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + (Number(days) || 7));
    const items = await ExpiryTracking.find({
      restaurantId,
      status: { $in: ['fresh', 'expiring-soon'] },
      expiryDate: { $lte: thresholdDate },
    }).sort({ expiryDate: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expiring items' });
  }
});

// Dispose item
router.post('/:itemId/dispose', async (req: Request, res: Response) => {
  try {
    const { disposedQuantity, reason, disposedBy } = req.body;
    const item = await ExpiryTracking.findOneAndUpdate(
      { itemId: req.params.itemId },
      {
        status: 'disposed',
        disposedAt: new Date(),
        disposedQuantity: disposedQuantity || 0,
        disposalReason: reason,
        disposedBy,
      },
      { new: true }
    );
    if (!item) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to dispose item' });
  }
});

// Disposal report
router.get('/report/disposal', async (req: Request, res: Response) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const disposed = await ExpiryTracking.find({
      restaurantId,
      status: 'disposed',
      disposedAt: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) },
    });
    const totalDisposed = disposed.reduce((sum, item) => sum + (item.disposedQuantity || item.quantity), 0);
    const byReason = disposed.reduce((acc, item) => {
      const reason = item.disposalReason || 'unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    res.json({
      success: true,
      data: { totalItems: disposed.length, totalQuantity: totalDisposed, byReason },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

export { router as expiryRoutes };
