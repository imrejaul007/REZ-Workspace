/**
 * SOS Routes
 * Handles emergency SOS operations including triggering, responding, and tracking
 *
 * @module routes/sos
 *
 * Features:
 * - Emergency alert triggering with location
 * - Emergency contact notifications
 * - Nearby rider alerts for critical situations
 * - Responder management
 * - Response time tracking
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SOSEvent, RiderProfile, Ride } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';
import { getRABTULIntegration } from '../services/rabtul.integration';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for triggering SOS event */
const TriggerSOSSchema = z.object({
  rideId: z.string().optional(),
  bikeId: z.string().optional(),
  type: z.enum(['accident', 'medical', 'breakdown', 'assistance', 'safety_concern', 'lost']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().optional(),
    altitude: z.number().optional(),
    accuracy: z.number().optional(),
  }),
  photos: z.array(z.string()).optional(),
  voiceNote: z.string().optional(),
  convoyId: z.string().optional(),
});

/** Schema for updating SOS status */
const UpdateSOSSchema = z.object({
  status: z.enum(['acknowledged', 'responding', 'resolved', 'cancelled']).optional(),
  resolution: z.string().optional(),
});

/** Schema for responding to SOS */
const RespondSOSSchema = z.object({
  status: z.enum(['acknowledged', 'responding', 'arrived', 'declined']),
  eta: z.number().optional(),
  message: z.string().optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/sos
 * @desc Trigger emergency SOS alert
 * @access Private
 *
 * Sends alerts to emergency contacts and optionally nearby riders for critical situations.
 *
 * @requestBody - SOS event data including type, location, severity
 * @returns Created SOS event with notification status
 *
 * @example
 * POST /api/sos
 * {
 *   "type": "accident",
 *   "severity": "critical",
 *   "description": "Minor accident on highway",
 *   "location": {
 *     "coordinates": [72.8777, 19.0760],
 *     "address": "Mumbai-Pune Highway"
 *   }
 * }
 */
router.post('/',
  authenticate,
  validateBody(TriggerSOSSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const rabtul = getRABTULIntegration();

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    // Get active ride if not provided
    let rideId = req.body.rideId;
    if (!rideId) {
      const activeRide = await Ride.findOne({
        riderId: rider._id,
        status: 'active',
      });
      if (activeRide) {
        rideId = activeRide._id.toString();
      }
    }

    // Create SOS event
    const sosEvent = new SOSEvent({
      riderId: rider._id,
      rideId,
      bikeId: req.body.bikeId,
      type: req.body.type,
      severity: req.body.severity || 'medium',
      description: req.body.description,
      location: req.body.location,
      photos: req.body.photos,
      voiceNote: req.body.voiceNote,
      convoyId: req.body.convoyId,
      status: 'triggered',
      triggeredAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    await sosEvent.save();

    // Notify emergency contacts via RABTUL
    await rabtul.notifyEmergencyContacts(
      rider.emergencyContacts.map(c => ({
        name: c.name,
        phone: c.phone,
      })),
      rider.displayName,
      sosEvent.location.address || `${sosEvent.location.coordinates[1]}, ${sosEvent.location.coordinates[0]}`,
      sosEvent._id.toString()
    );

    sosEvent.notifiedContacts = true;
    await sosEvent.save();

    // Notify nearby riders for critical situations
    if (req.body.severity === 'critical' || req.body.type === 'accident') {
      const nearbyRiders = await RiderProfile.find({
        'homeLocation.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: sosEvent.location.coordinates,
            },
            $maxDistance: 20000, // 20km radius
          },
        },
      }).limit(20);

      const nearbyUserIds = nearbyRiders
        .filter(r => r._id.toString() !== rider._id.toString())
        .map(r => r.userId);

      if (nearbyUserIds.length > 0) {
        await rabtul.notifyNearbyRiders(nearbyUserIds, {
          sosId: sosEvent._id.toString(),
          riderName: rider.displayName,
          type: sosEvent.type,
          severity: sosEvent.severity,
          location: sosEvent.location.address || 'Unknown location',
        });
      }
    }

    logger.warn(`SOS triggered: ${sosEvent._id} by rider ${rider._id}, type: ${sosEvent.type}`);

    res.status(201).json({
      success: true,
      data: {
        sosId: sosEvent._id,
        status: sosEvent.status,
        triggeredAt: sosEvent.triggeredAt,
        emergencyContactsNotified: sosEvent.notifiedContacts,
      },
    });
  })
);

/**
 * @route GET /api/sos/:id
 * @desc Get SOS event by ID
 * @access Private
 *
 * @param id - SOS event MongoDB ID
 * @returns SOS event with rider and responder details
 *
 * @example
 * GET /api/sos/60d5ec9af682fbd12a0b1234
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const sosEvent = await SOSEvent.findById(req.params.id)
      .populate('riderId', 'displayName phone avatar bloodGroup emergencyContacts')
      .populate('responders.riderId', 'displayName phone avatar')
      .populate('resolvedBy', 'displayName');

    if (!sosEvent) {
      res.status(404).json({ error: 'SOS event not found' });
      return;
    }

    res.json({
      success: true,
      data: sosEvent,
    });
  })
);

/**
 * @route PUT /api/sos/:id
 * @desc Update SOS event status
 * @access Private (rider or responder only)
 *
 * @param id - SOS event MongoDB ID
 * @requestBody - { status?, resolution? }
 * @returns Updated SOS event
 *
 * @example
 * PUT /api/sos/60d5ec9af682fbd12a0b1234
 * { "status": "resolved", "resolution": "Help arrived, rider is safe" }
 */
router.put('/:id',
  authenticate,
  validateBody(UpdateSOSSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const sosEvent = await SOSEvent.findById(req.params.id);

    if (!sosEvent) {
      res.status(404).json({ error: 'SOS event not found' });
      return;
    }

    // Only rider or responder can update
    const isRider = sosEvent.riderId.toString() === rider._id.toString();
    const isResponder = sosEvent.responders.some(r => r.riderId.toString() === rider._id.toString());

    if (!isRider && !isResponder) {
      res.status(403).json({ error: 'Not authorized to update this SOS' });
      return;
    }

    // Update status based on action
    if (req.body.status === 'acknowledged') {
      await sosEvent.acknowledge();
    } else if (req.body.status === 'resolved') {
      await sosEvent.resolve(rider._id, req.body.resolution || 'Resolved');
    } else if (req.body.status === 'cancelled') {
      await sosEvent.cancel(req.body.resolution || 'Cancelled by rider');
    }

    res.json({
      success: true,
      data: sosEvent,
    });
  })
);

/**
 * @route POST /api/sos/:id/respond
 * @desc Respond to SOS event
 * @access Private
 *
 * @param id - SOS event MongoDB ID
 * @requestBody - { status, eta?, message? }
 * @returns Response confirmation
 *
 * @example
 * POST /api/sos/60d5ec9af682fbd12a0b1234/respond
 * { "status": "responding", "eta": 15, "message": "On my way!" }
 */
router.post('/:id/respond',
  authenticate,
  validateBody(RespondSOSSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const rabtul = getRABTULIntegration();

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const sosEvent = await SOSEvent.findById(req.params.id);

    if (!sosEvent) {
      res.status(404).json({ error: 'SOS event not found' });
      return;
    }

    if (sosEvent.status === 'resolved' || sosEvent.status === 'cancelled') {
      res.status(400).json({ error: 'SOS event is no longer active' });
      return;
    }

    // Cannot respond to own SOS
    if (sosEvent.riderId.toString() === rider._id.toString()) {
      res.status(400).json({ error: 'Cannot respond to your own SOS' });
      return;
    }

    // Add or update responder
    await sosEvent.addResponder(rider._id);
    await sosEvent.updateResponderStatus(rider._id, req.body.status, req.body.message);

    // Award coins for arriving
    if (req.body.status === 'arrived') {
      await rabtul.awardSOSReward(userId, sosEvent._id.toString());
    }

    // Notify SOS initiator
    const sosInitiator = await RiderProfile.findById(sosEvent.riderId);
    if (sosInitiator) {
      await rabtul.sendPush({
        userId: sosInitiator.userId,
        title: '🚨 Someone is responding to your SOS',
        body: `${rider.displayName} is ${req.body.status}! ETA: ${req.body.eta || 'unknown'} minutes`,
        data: {
          sosId: sosEvent._id.toString(),
          responderId: rider._id.toString(),
          status: req.body.status,
        },
        channel: 'sos',
      });
    }

    res.json({
      success: true,
      data: {
        status: req.body.status,
        eta: req.body.eta,
      },
    });
  })
);

/**
 * @route GET /api/sos/active/list
 * @desc Get all active SOS events
 * @access Private
 *
 * @returns List of active (triggered) SOS events
 *
 * @example
 * GET /api/sos/active/list
 */
router.get('/active/list',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const sosEvents = await SOSEvent.findActive()
      .populate('riderId', 'displayName phone avatar');

    res.json({
      success: true,
      data: sosEvents,
    });
  })
);

/**
 * @route GET /api/sos/nearby/list
 * @desc Get nearby active SOS events
 * @access Private
 *
 * @query lat - Latitude
 * @query lng - Longitude
 * @query radius - Radius in km (default: 20)
 * @returns List of nearby SOS events
 *
 * @example
 * GET /api/sos/nearby/list?lat=19.0760&lng=72.8777&radius=15
 */
router.get('/nearby/list',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = '20' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }

    const sosEvents = await SOSEvent.findNearbyActive(
      [parseFloat(lng as string), parseFloat(lat as string)],
      parseInt(radius as string)
    ).populate('riderId', 'displayName phone avatar');

    res.json({
      success: true,
      data: sosEvents,
    });
  })
);

/**
 * @route GET /api/sos/stats/summary
 * @desc Get SOS statistics summary
 * @access Private
 *
 * @query days - Number of days to analyze (default: 30)
 * @returns SOS statistics including total events, response times, resolution rates
 *
 * @example
 * GET /api/sos/stats/summary?days=7
 */
router.get('/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { days = '30' } = req.query;

    const stats = await SOSEvent.getStats(parseInt(days as string));

    res.json({
      success: true,
      data: {
        ...stats,
        avgResponseTimeMinutes: stats.avgResponseTime
          ? Math.round(stats.avgResponseTime / 60000)
          : 0,
      },
    });
  })
);

/**
 * @route POST /api/sos/:id/rate
 * @desc Rate SOS response
 * @access Private (SOS initiator only)
 *
 * @param id - SOS event MongoDB ID
 * @requestBody - { rating: 1-5, feedback?: string }
 * @returns Success message
 *
 * @example
 * POST /api/sos/60d5ec9af682fbd12a0b1234/rate
 * { "rating": 5, "feedback": "Quick response, very helpful!" }
 */
router.post('/:id/rate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { rating, feedback } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const sosEvent = await SOSEvent.findById(req.params.id);

    if (!sosEvent) {
      res.status(404).json({ error: 'SOS event not found' });
      return;
    }

    // Only SOS initiator can rate
    if (sosEvent.riderId.toString() !== rider._id.toString()) {
      res.status(403).json({ error: 'Only the SOS rider can rate' });
      return;
    }

    sosEvent.rating = rating;
    sosEvent.feedback = feedback;
    await sosEvent.save();

    res.json({
      success: true,
      message: 'Rating submitted',
    });
  })
);

export default router;
