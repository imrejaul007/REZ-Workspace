/**
 * Ride Routes
 * Handles all ride tracking operations including GPS tracking, routes, and stats
 *
 * @module routes/rides
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Ride, RiderProfile, BikeDigitalTwin } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for creating a new ride */
const CreateRideSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  bikeId: z.string(),
  type: z.enum(['solo', 'group', 'event']).optional(),
  groupId: z.string().optional(),
  eventId: z.string().optional(),
  plannedStartTime: z.string().datetime().optional(),
  plannedEndTime: z.string().datetime().optional(),
  startLocation: z.object({
    name: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().optional(),
  }),
  endLocation: z.object({
    name: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().optional(),
  }).optional(),
  route: z.object({
    name: z.string().optional(),
    waypoints: z.array(z.object({
      name: z.string().optional(),
      coordinates: z.tuple([z.number(), z.number()]),
      type: z.enum(['start', 'stop', 'fuel', 'food', 'viewpoint', 'checkpoint', 'end']).optional(),
    })).optional(),
    difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']).optional(),
    roadTypes: z.array(z.string()).optional(),
  }).optional(),
  sosEnabled: z.boolean().optional(),
  liveTracking: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/** Schema for adding GPS track point */
const AddTrackPointSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  timestamp: z.string().datetime().optional(),
  accuracy: z.number().optional(),
});

/** Schema for adding waypoint */
const AddWaypointSchema = z.object({
  name: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]),
  altitude: z.number().optional(),
  type: z.enum(['start', 'stop', 'fuel', 'food', 'viewpoint', 'checkpoint', 'end']),
  notes: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/** Schema for completing a ride */
const CompleteRideSchema = z.object({
  endLocation: z.object({
    name: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().optional(),
  }).optional(),
  expenses: z.object({
    fuel: z.number().optional(),
    tolls: z.number().optional(),
    food: z.number().optional(),
    accommodation: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 - [longitude, latitude] of point 1
 * @param coord2 - [longitude, latitude] of point 2
 * @returns Distance in kilometers
 */
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/** Convert degrees to radians */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate ride statistics from track data
 * @param ride - Ride document
 * @returns Stats object with speed, elevation, and timing data
 */
function calculateRideStats(ride: any): any {
  const track = ride.route.track;

  if (!track || track.length === 0) {
    return {
      distance: ride.route.distance,
      avgSpeed: 0,
      maxSpeed: 0,
      avgAltitude: 0,
      maxAltitude: 0,
      minAltitude: 0,
      totalAscent: ride.route.elevation?.gain || 0,
      totalDescent: ride.route.elevation?.loss || 0,
      movingTime: ride.duration || 0,
      stoppedTime: 0,
    };
  }

  let maxSpeed = 0;
  let maxAltitude = 0;
  let minAltitude = Infinity;
  let totalAscent = 0;
  let totalDescent = 0;
  let lastAltitude: number | undefined;

  for (const point of track) {
    if (point.speed && point.speed > maxSpeed) {
      maxSpeed = point.speed;
    }
    if (point.altitude !== undefined) {
      if (point.altitude > maxAltitude) maxAltitude = point.altitude;
      if (point.altitude < minAltitude) minAltitude = point.altitude;

      if (lastAltitude !== undefined) {
        const diff = point.altitude - lastAltitude;
        if (diff > 0) totalAscent += diff;
        else totalDescent += Math.abs(diff);
      }
      lastAltitude = point.altitude;
    }
  }

  const avgSpeed = ride.duration > 0
    ? (ride.route.distance / (ride.duration / 60))
    : 0;

  return {
    distance: ride.route.distance,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxSpeed: Math.round(maxSpeed * 10) / 10,
    avgAltitude: Math.round((maxAltitude + minAltitude) / 2),
    maxAltitude,
    minAltitude: minAltitude === Infinity ? 0 : minAltitude,
    totalAscent: Math.round(totalAscent),
    totalDescent: Math.round(totalDescent),
    movingTime: ride.duration || 0,
    stoppedTime: 0,
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/rides
 * @desc Start a new ride
 * @access Private
 *
 * @requestBody - Ride data including bike, locations, and optional settings
 * @returns Created ride with track URL
 *
 * @example
 * POST /api/rides
 * {
 *   "title": "Morning Ride to Lonavala",
 *   "bikeId": "60d5ec9af682fbd12a0b1234",
 *   "startLocation": { "coordinates": [72.8777, 19.0760], "name": "Mumbai" }
 * }
 */
router.post('/',
  authenticate,
  validateBody(CreateRideSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    // Get rider
    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    // Verify bike ownership
    const bike = await BikeDigitalTwin.findOne({
      _id: req.body.bikeId,
      riderId: rider._id,
    });

    if (!bike) {
      res.status(400).json({ error: 'Bike not found or not owned by you' });
      return;
    }

    // Check for active ride
    const activeRide = await Ride.findOne({
      riderId: rider._id,
      status: { $in: ['active', 'paused'] },
    });

    if (activeRide) {
      res.status(400).json({
        error: 'You have an active ride in progress',
        rideId: activeRide._id,
      });
      return;
    }

    // Create ride
    const ride = new Ride({
      riderId: rider._id,
      bikeId: bike._id,
      startTime: new Date(),
      status: 'active',
      liveTracking: req.body.liveTracking ?? true,
      sosEnabled: req.body.sosEnabled ?? true,
      ...req.body,
    });

    // Add start waypoint
    ride.route.waypoints.push({
      name: req.body.startLocation.name || 'Start',
      coordinates: req.body.startLocation.coordinates,
      type: 'start',
      timestamp: new Date(),
    });

    await ride.save();

    logger.info(`Ride started: ${ride._id} by rider ${rider._id}`);

    res.status(201).json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route GET /api/rides/active
 * @desc Get current active ride
 * @access Private
 *
 * @returns Active ride with bike info
 *
 * @example
 * GET /api/rides/active
 */
router.get('/active',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      riderId: rider._id,
      status: { $in: ['active', 'paused'] },
    }).populate('bikeId', 'nickname make model');

    if (!ride) {
      res.status(404).json({ error: 'No active ride found' });
      return;
    }

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route GET /api/rides/:id
 * @desc Get ride by ID
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Ride with populated rider, bike, and companion info
 *
 * @example
 * GET /api/rides/60d5ec9af682fbd12a0b1234
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const ride = await Ride.findById(req.params.id)
      .populate('riderId', 'displayName avatar')
      .populate('bikeId', 'nickname make model')
      .populate('companions', 'displayName avatar');

    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    // Check access for private rides
    const userId = req.userId!;
    const rider = await RiderProfile.findOne({ userId });

    if (ride.isPrivate && ride.riderId._id.toString() !== rider?._id.toString()) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route PUT /api/rides/:id
 * @desc Update ride details
 * @access Private (owner only)
 *
 * @param id - Ride MongoDB ID
 * @requestBody - { title?, description?, tags?, isPrivate? }
 * @returns Updated ride
 *
 * @example
 * PUT /api/rides/60d5ec9af682fbd12a0b1234
 * { "title": "Updated Title", "isPrivate": true }
 */
router.put('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
    });

    if (!ride) {
      res.status(404).json({ error: 'Ride not found or unauthorized' });
      return;
    }

    const { title, description, tags, isPrivate } = req.body;
    if (title) ride.title = title;
    if (description) ride.description = description;
    if (tags) ride.tags = tags;
    if (typeof isPrivate === 'boolean') ride.isPrivate = isPrivate;

    await ride.save();

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route POST /api/rides/:id/track
 * @desc Add GPS track point
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @requestBody - GPS coordinates and optional sensor data
 * @returns Updated track stats
 *
 * @example
 * POST /api/rides/60d5ec9af682fbd12a0b1234/track
 * {
 *   "coordinates": [72.8777, 19.0760],
 *   "altitude": 10,
 *   "speed": 45.5,
 *   "heading": 90
 * }
 */
router.post('/:id/track',
  authenticate,
  validateBody(AddTrackPointSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: 'active',
    });

    if (!ride) {
      res.status(404).json({ error: 'Active ride not found' });
      return;
    }

    const point = {
      coordinates: req.body.coordinates,
      altitude: req.body.altitude,
      speed: req.body.speed,
      heading: req.body.heading,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      accuracy: req.body.accuracy,
    };

    ride.route.track.push(point);

    // Update distance in real-time
    if (ride.route.track.length > 1) {
      const lastPoint = ride.route.track[ride.route.track.length - 2];
      const distance = calculateDistance(
        lastPoint.coordinates,
        point.coordinates
      );
      ride.route.distance += distance;
    }

    await ride.save();

    res.json({
      success: true,
      data: {
        trackPoints: ride.route.track.length,
        totalDistance: ride.route.distance,
      },
    });
  })
);

/**
 * @route GET /api/rides/:id/track
 * @desc Get ride track data
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Full track with coordinates and timestamps
 *
 * @example
 * GET /api/rides/60d5ec9af682fbd12a0b1234/track
 */
router.get('/:id/track',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const ride = await Ride.findById(req.params.id)
      .select('route.track startTime endTime status');

    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        track: ride.route.track,
        startTime: ride.startTime,
        endTime: ride.endTime,
        status: ride.status,
      },
    });
  })
);

/**
 * @route GET /api/rides/:id/stats
 * @desc Get ride statistics
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Distance, duration, speed, and elevation stats
 *
 * @example
 * GET /api/rides/60d5ec9af682fbd12a0b1234/stats
 */
router.get('/:id/stats',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const ride = await Ride.findById(req.params.id)
      .select('stats route.distance route.elevation duration startTime endTime status');

    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        distance: ride.route.distance,
        duration: ride.duration || (ride.endTime
          ? Math.round((ride.endTime.getTime() - ride.startTime.getTime() / 60000))
          : Math.round((Date.now() - ride.startTime.getTime() / 60000))),
        elevation: ride.route.elevation,
        stats: ride.stats,
      },
    });
  })
);

/**
 * @route POST /api/rides/:id/waypoint
 * @desc Add waypoint to ride
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @requestBody - Waypoint data
 * @returns Created waypoint
 *
 * @example
 * POST /api/rides/60d5ec9af682fbd12a0b1234/waypoint
 * {
 *   "name": "Fuel Station",
 *   "coordinates": [73.0123, 19.1234],
 *   "type": "fuel",
 *   "notes": "Petrol pump nearby"
 * }
 */
router.post('/:id/waypoint',
  authenticate,
  validateBody(AddWaypointSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: { $in: ['active', 'paused'] },
    });

    if (!ride) {
      res.status(404).json({ error: 'Active ride not found' });
      return;
    }

    const waypoint = {
      ...req.body,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    };

    ride.route.waypoints.push(waypoint);
    await ride.save();

    res.status(201).json({
      success: true,
      data: waypoint,
    });
  })
);

/**
 * @route GET /api/rides/:id/waypoints
 * @desc Get all waypoints for a ride
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Array of waypoints
 *
 * @example
 * GET /api/rides/60d5ec9af682fbd12a0b1234/waypoints
 */
router.get('/:id/waypoints',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const ride = await Ride.findById(req.params.id)
      .select('route.waypoints');

    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    res.json({
      success: true,
      data: ride.route.waypoints,
    });
  })
);

/**
 * @route POST /api/rides/:id/pause
 * @desc Pause active ride
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Updated ride with paused status
 *
 * @example
 * POST /api/rides/60d5ec9af682fbd12a0b1234/pause
 */
router.post('/:id/pause',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: 'active',
    });

    if (!ride) {
      res.status(404).json({ error: 'Active ride not found' });
      return;
    }

    ride.status = 'paused';
    await ride.save();

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route POST /api/rides/:id/resume
 * @desc Resume paused ride
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @returns Updated ride with active status
 *
 * @example
 * POST /api/rides/60d5ec9af682fbd12a0b1234/resume
 */
router.post('/:id/resume',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: 'paused',
    });

    if (!ride) {
      res.status(404).json({ error: 'Paused ride not found' });
      return;
    }

    ride.status = 'active';
    await ride.save();

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route POST /api/rides/:id/complete
 * @desc Complete active ride
 * @access Private
 *
 * @param id - Ride MongoDB ID
 * @requestBody - { endLocation?, expenses? }
 * @returns Completed ride with stats
 *
 * @example
 * POST /api/rides/60d5ec9af682fbd12a0b1234/complete
 * {
 *   "endLocation": { "coordinates": [73.0123, 19.1234], "name": "Lonavala" },
 *   "expenses": { "fuel": 500, "tolls": 100, "food": 200 }
 * }
 */
router.post('/:id/complete',
  authenticate,
  validateBody(CompleteRideSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: { $in: ['active', 'paused'] },
    });

    if (!ride) {
      res.status(404).json({ error: 'Active ride not found' });
      return;
    }

    // Complete the ride
    ride.status = 'completed';
    ride.endTime = new Date();
    ride.duration = Math.round((ride.endTime.getTime() - ride.startTime.getTime()) / 60000);
    ride.liveTracking = false;

    // Add end waypoint if location provided
    if (req.body.endLocation) {
      ride.route.endLocation = req.body.endLocation;
      ride.route.waypoints.push({
        name: req.body.endLocation.name || 'End',
        coordinates: req.body.endLocation.coordinates,
        type: 'end',
        timestamp: ride.endTime,
      });
    }

    // Update expenses
    if (req.body.expenses) {
      ride.expenses = {
        ...ride.expenses,
        ...req.body.expenses,
        total: (req.body.expenses.fuel || 0) +
               (req.body.expenses.tolls || 0) +
               (req.body.expenses.food || 0) +
               (req.body.expenses.accommodation || 0) +
               (req.body.expenses.other || 0),
      };
    }

    // Calculate final stats
    ride.stats = calculateRideStats(ride);

    // Generate shareable link
    ride.shareableLink = `ride/${uuidv4()}`;

    await ride.save();

    // Update rider stats
    await rider.incrementRideStats(ride.route.distance);

    // Update bike stats
    const bike = await BikeDigitalTwin.findById(ride.bikeId);
    if (bike) {
      bike.totalRides += 1;
      bike.totalDistance += ride.route.distance;
      await bike.save();
    }

    logger.info(`Ride completed: ${ride._id}, distance: ${ride.route.distance}km`);

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route DELETE /api/rides/:id
 * @desc Cancel/abort ride
 * @access Private (owner only)
 *
 * @param id - Ride MongoDB ID
 * @returns Cancelled ride
 *
 * @example
 * DELETE /api/rides/60d5ec9af682fbd12a0b1234
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      riderId: rider._id,
      status: { $in: ['active', 'paused', 'planned'] },
    });

    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    ride.status = 'cancelled';
    ride.liveTracking = false;
    await ride.save();

    res.json({
      success: true,
      data: ride,
    });
  })
);

/**
 * @route GET /api/rides
 * @desc Get ride history for current user
 * @access Private
 *
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20)
 * @query status - Filter by status (default: completed)
 * @returns Paginated list of rides
 *
 * @example
 * GET /api/rides?page=1&limit=10&status=completed
 */
router.get('/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page = '1', limit = '20', status } = req.query;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const query: any = { riderId: rider._id };
    if (status) {
      query.status = status;
    } else {
      query.status = 'completed';
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('bikeId', 'nickname make model')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Ride.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

/**
 * @route GET /api/rides/routes/discover
 * @desc Get public routes for discovery
 * @access Public
 *
 * @query limit - Number of results (default: 20)
 * @query difficulty - Filter by difficulty
 * @returns List of popular public routes
 *
 * @example
 * GET /api/rides/routes/discover?difficulty=moderate&limit=10
 */
router.get('/routes/discover',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '20', difficulty } = req.query;

    const query: any = { isPublicRoute: true, status: 'completed' };
    if (difficulty) {
      query['route.difficulty'] = difficulty;
    }

    const rides = await Ride.find(query)
      .populate('riderId', 'displayName avatar')
      .sort({ 'stats.distance': -1, startTime: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: rides,
    });
  })
);

export default router;
