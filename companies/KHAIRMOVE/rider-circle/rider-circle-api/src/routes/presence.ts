import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { getPresenceService } from '../services/presence.service';
import { getSocketManager } from '../events/socket';

const router = Router();

const UpdatePresenceSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  status: z.enum(['online', 'riding', 'idle']).optional(),
  rideId: z.string().optional(),
  groupId: z.string().optional(),
  eventId: z.string().optional(),
});

// Update own presence
router.post('/update',
  authenticate,
  validateBody(UpdatePresenceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const presenceService = getPresenceService();

    const presence = await presenceService.updatePresence(userId, {
      ...req.body,
      coordinates: req.body.coordinates,
    });

    // Also update socket manager if available
    const socketManager = getSocketManager();
    if (socketManager) {
      const rider = await import('../models/rider').then(m => m.RiderProfile.findById(userId).lean());
      socketManager.emitToRider(userId, 'presence:updated', {
        success: true,
        status: presence.status,
      });
    }

    res.json({
      success: true,
      data: presence,
    });
  })
);

// Go offline
router.post('/offline',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const presenceService = getPresenceService();

    await presenceService.goOffline(userId);

    // Notify socket manager
    const socketManager = getSocketManager();
    if (socketManager) {
      socketManager.emitToAll('presence:offline', { riderId: userId });
    }

    res.json({
      success: true,
      message: 'Gone offline',
    });
  })
);

// Get nearby riders
router.get('/nearby',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = '10', status } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }

    const presenceService = getPresenceService();
    const nearby = await presenceService.getNearbyRiders(
      [parseFloat(lng as string), parseFloat(lat as string)],
      parseFloat(radius as string),
      status as string | undefined
    );

    res.json({
      success: true,
      data: {
        count: nearby.length,
        riders: nearby,
      },
    });
  })
);

// Get city presence
router.get('/city/:city',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const presenceService = getPresenceService();
    const riders = await presenceService.getCityPresence(req.params.city);

    res.json({
      success: true,
      data: {
        city: req.params.city,
        count: riders.length,
        riders,
      },
    });
  })
);

// Get live stats (global presence)
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const presenceService = getPresenceService();
    const stats = await presenceService.getLiveStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// Get active rides
router.get('/rides/active',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { UserPresence } = await import('../services/presence.service');
    const rides = await UserPresence.findActiveRides();

    res.json({
      success: true,
      data: rides,
    });
  })
);

// Subscribe to presence updates (via WebSocket)
router.get('/subscribe',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { socketId } = req.query;

    if (!socketId) {
      res.status(400).json({ error: 'socketId required' });
      return;
    }

    // This endpoint is used by the mobile app to register its socket
    // The actual subscription happens via WebSocket
    res.json({
      success: true,
      message: 'Subscribe via WebSocket using PRESENCE_JOIN event',
      socketEvents: {
        PRESENCE_JOIN: 'presence:join',
        PRESENCE_UPDATE: 'presence:update',
        PRESENCE_NEARBY: 'presence:nearby',
      },
    });
  })
);

// Get presence by ride
router.get('/ride/:rideId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { UserPresence } = await import('../services/presence.service');
    const riders = await UserPresence.find({ rideId: req.params.rideId, status: 'riding' });

    res.json({
      success: true,
      data: {
        rideId: req.params.rideId,
        activeRiders: riders.length,
        riders,
      },
    });
  })
);

// Get presence by group
router.get('/group/:groupId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { UserPresence } = await import('../services/presence.service');
    const riders = await UserPresence.find({ groupId: req.params.groupId, status: { $ne: 'offline' } });

    res.json({
      success: true,
      data: {
        groupId: req.params.groupId,
        activeMembers: riders.length,
        riders,
      },
    });
  })
);

// Check for SOS nearby (for push notifications)
router.get('/sos/nearby',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = '20' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }

    const presenceService = getPresenceService();
    const nearby = await presenceService.checkSOSNearby(
      [parseFloat(lng as string), parseFloat(lat as string)],
      parseFloat(radius as string)
    );

    res.json({
      success: true,
      data: {
        canRespond: nearby.length,
        riders: nearby.map(r => ({
          riderId: r.userId,
          status: r.status,
          coordinates: r.coordinates,
        })),
      },
    });
  })
);

export default router;
