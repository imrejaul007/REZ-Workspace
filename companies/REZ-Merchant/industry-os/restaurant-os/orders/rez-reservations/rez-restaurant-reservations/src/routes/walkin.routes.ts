/**
 * Walk-in / Waitlist Routes
 */

import { Router, Request, Response } from 'express';
import { Waitlist, Table } from '../models';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Add to waitlist
router.post('/', async (req: Request, res: Response) => {
  try {
    const waitlistId = `WTL${Date.now()}${crypto.randomUUID().split('-')[0]}`;

    const position = await Waitlist.countDocuments({
      restaurantId: req.body.restaurantId,
      status: 'waiting',
    }) + 1;

    const waitlist = new Waitlist({
      waitlistId,
      ...req.body,
      position,
      status: 'waiting',
    });
    await waitlist.save();
    res.status(201).json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add to waitlist' });
  }
});

// Get waitlist
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, status } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    else query.status = 'waiting';

    const waitlist = await Waitlist.find(query).sort({ position: 1 });
    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist' });
  }
});

// Get estimated wait time
router.get('/wait-time/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { partySize } = req.query;

    const waitingCount = await Waitlist.countDocuments({
      restaurantId: req.params.restaurantId,
      status: 'waiting',
      partySize: { $lte: Number(partySize) },
    });

    const estimatedWait = waitingCount * 45;

    res.json({
      success: true,
      data: {
        partySize,
        waitingAhead: waitingCount,
        estimatedWaitMinutes: estimatedWait,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate wait time' });
  }
});

// Notify customer
router.post('/:waitlistId/notify', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const waitlist = await Waitlist.findOneAndUpdate(
      { waitlistId: req.params.waitlistId },
      { status: 'notified', notifiedAt: new Date() },
      { new: true }
    );
    if (!waitlist) {
      res.status(404).json({ success: false, error: 'Waitlist entry not found' });
      return;
    }
    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to notify customer' });
  }
});

// Seat from waitlist
router.post('/:waitlistId/seat', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const { tableId } = req.body;
    const waitlist = await Waitlist.findOneAndUpdate(
      { waitlistId: req.params.waitlistId },
      { status: 'seated', seatedAt: new Date() },
      { new: true }
    );

    if (!waitlist) {
      res.status(404).json({ success: false, error: 'Waitlist entry not found' });
      return;
    }

    if (tableId) {
      await Table.findOneAndUpdate({ tableId }, { status: 'occupied' });
    }

    await Waitlist.updateMany(
      { restaurantId: waitlist.restaurantId, status: 'waiting', position: { $gt: waitlist.position } },
      { $inc: { position: -1 } }
    );

    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to seat from waitlist' });
  }
});

// Customer left
router.post('/:waitlistId/left', async (req: Request, res: Response) => {
  try {
    const waitlist = await Waitlist.findOneAndUpdate(
      { waitlistId: req.params.waitlistId },
      { status: 'left' },
      { new: true }
    );

    if (!waitlist) {
      res.status(404).json({ success: false, error: 'Waitlist entry not found' });
      return;
    }

    await Waitlist.updateMany(
      { restaurantId: waitlist.restaurantId, status: 'waiting', position: { $gt: waitlist.position } },
      { $inc: { position: -1 } }
    );

    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// Remove from waitlist
router.delete('/:waitlistId', async (req: Request, res: Response) => {
  try {
    const waitlist = await Waitlist.findOneAndUpdate(
      { waitlistId: req.params.waitlistId },
      { status: 'cancelled' },
      { new: true }
    );

    if (!waitlist) {
      res.status(404).json({ success: false, error: 'Waitlist entry not found' });
      return;
    }

    await Waitlist.updateMany(
      { restaurantId: waitlist.restaurantId, status: 'waiting', position: { $gt: waitlist.position } },
      { $inc: { position: -1 } }
    );

    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove from waitlist' });
  }
});

export { router as walkinRoutes };
