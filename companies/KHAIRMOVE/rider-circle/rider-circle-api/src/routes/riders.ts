/**
 * Rider Routes
 * Handles all rider profile operations including SafeQR, trust scores, and social features
 *
 * @module routes/riders
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { RiderProfile } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { config } from '../config/index';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for creating a new rider profile */
const CreateRiderSchema = z.object({
  displayName: z.string().min(2).max(50),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
    isPrimary: z.boolean().optional(),
  })).optional(),
  ridingStyle: z.enum(['commuter', 'tourer', 'adventure', 'sport']).optional(),
  experience: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  homeLocation: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
});

/** Schema for updating rider profile (all fields optional) */
const UpdateRiderSchema = CreateRiderSchema.partial();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a SafeQR code for emergency identification
 * @param riderId - The rider's user ID
 * @returns Base64-encoded QR code image data URL
 */
async function generateSafeQRCode(riderId: string): Promise<string> {
  const qrData = {
    id: riderId,
    type: 'rider',
    app: 'ridercircle',
    timestamp: Date.now(),
  };

  const token = Buffer.from(JSON.stringify(qrData)).toString('base64');
  const qrImage = await QRCode.toDataURL(token, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return qrImage;
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/riders
 * @desc Create a new rider profile
 * @access Private (requires authentication)
 *
 * @requestBody - RiderProfile data including displayName, phone, optional fields
 * @returns Created rider profile with SafeQR code
 *
 * @example
 * POST /api/riders
 * {
 *   "displayName": "John Rider",
 *   "phone": "+919876543210",
 *   "ridingStyle": "adventure",
 *   "experience": "intermediate"
 * }
 */
router.post('/',
  authenticate,
  validateBody(CreateRiderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    // Check if profile already exists
    const existing = await RiderProfile.findOne({ userId });
    if (existing) {
      res.status(409).json({ error: 'Rider profile already exists' });
      return;
    }

    // Generate SafeQR for emergency identification
    const safeQRCode = await generateSafeQRCode(userId);

    // Create profile
    const rider = new RiderProfile({
      userId,
      safeQRCode,
      ...req.body,
    });

    await rider.save();

    logger.info(`Rider profile created: ${rider._id}`);

    res.status(201).json({
      success: true,
      data: rider,
    });
  })
);

/**
 * @route GET /api/riders/me
 * @desc Get current authenticated rider's profile
 * @access Private
 *
 * @returns Rider profile with populated bikes, followers, and following
 *
 * @example
 * GET /api/riders/me
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId })
      .populate('bikes', 'nickname make model avatar')
      .populate('followers', 'displayName avatar')
      .populate('following', 'displayName avatar');

    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    res.json({
      success: true,
      data: rider,
    });
  })
);

/**
 * @route GET /api/riders/:id
 * @desc Get rider profile by ID
 * @access Private
 *
 * @param id - Rider profile MongoDB ID
 * @returns Rider profile with populated relations
 *
 * @example
 * GET /api/riders/60d5ec9af682fbd12a0b1234
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await RiderProfile.findById(req.params.id)
      .populate('bikes', 'nickname make model avatar')
      .populate('followers', 'displayName avatar')
      .populate('following', 'displayName avatar');

    if (!rider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    res.json({
      success: true,
      data: rider,
    });
  })
);

/**
 * @route PUT /api/riders/:id
 * @desc Update rider profile
 * @access Private (owner only)
 *
 * @param id - Rider profile MongoDB ID
 * @requestBody - Partial rider profile data
 * @returns Updated rider profile
 *
 * @example
 * PUT /api/riders/60d5ec9af682fbd12a0b1234
 * { "bio": "Adventure seeker!", "ridingStyle": "sport" }
 */
router.put('/:id',
  authenticate,
  validateBody(UpdateRiderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({
      _id: req.params.id,
      userId,
    });

    if (!rider) {
      res.status(404).json({ error: 'Rider not found or unauthorized' });
      return;
    }

    Object.assign(rider, req.body);
    await rider.save();

    res.json({
      success: true,
      data: rider,
    });
  })
);

/**
 * @route GET /api/riders/:id/safeqr
 * @desc Get rider's SafeQR code for emergencies
 * @access Private
 *
 * @param id - Rider profile MongoDB ID
 * @returns QR code data and emergency contact info
 *
 * @example
 * GET /api/riders/60d5ec9af682fbd12a0b1234/safeqr
 */
router.get('/:id/safeqr',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await RiderProfile.findById(req.params.id);

    if (!rider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        qrCode: rider.safeQRCode,
        riderId: rider._id,
        displayName: rider.displayName,
        bloodGroup: rider.bloodGroup,
        emergencyContacts: rider.emergencyContacts,
      },
    });
  })
);

/**
 * @route POST /api/riders/safeqr/verify
 * @desc Verify a SafeQR code (scan endpoint)
 * @access Public (used by first responders in emergencies)
 *
 * @requestBody - { token: Base64 encoded QR data }
 * @returns Rider emergency info for first responders
 *
 * @example
 * POST /api/riders/safeqr/verify
 * { "token": "eyJpZCI6IiIsInR5cGUiOiJyaWRlciJ9..." }
 */
router.post('/safeqr/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

      if (decoded.type !== 'rider' || decoded.app !== 'ridercircle') {
        res.status(400).json({ error: 'Invalid QR code' });
        return;
      }

      const rider = await RiderProfile.findById(decoded.id)
        .select('displayName avatar bloodGroup emergencyContacts medicalNotes');

      if (!rider) {
        res.status(404).json({ error: 'Rider not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          riderId: rider._id,
          displayName: rider.displayName,
          avatar: rider.avatar,
          bloodGroup: rider.bloodGroup,
          emergencyContacts: rider.emergencyContacts,
          medicalNotes: rider.medicalNotes,
        },
      });
    } catch {
      res.status(400).json({ error: 'Invalid QR code format' });
    }
  })
);

/**
 * @route GET /api/riders/:id/bikes
 * @desc Get all bikes owned by a rider
 * @access Private
 *
 * @param id - Rider profile MongoDB ID
 * @returns Array of bike digital twins
 *
 * @example
 * GET /api/riders/60d5ec9af682fbd12a0b1234/bikes
 */
router.get('/:id/bikes',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await RiderProfile.findById(req.params.id)
      .populate('bikes');

    if (!rider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    res.json({
      success: true,
      data: rider.bikes,
    });
  })
);

/**
 * @route GET /api/riders/:id/stats
 * @desc Get rider statistics
 * @access Private
 *
 * @param id - Rider profile MongoDB ID
 * @returns Rider stats including totalRides, distance, trustScore, badges
 *
 * @example
 * GET /api/riders/60d5ec9af682fbd12a0b1234/stats
 */
router.get('/:id/stats',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await RiderProfile.findById(req.params.id);

    if (!rider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        totalRides: rider.totalRides,
        totalDistance: rider.totalDistance,
        trustScore: rider.trustScore,
        verifiedRides: rider.verifiedRides,
        badges: rider.badges,
        followersCount: rider.followersCount,
        followingCount: rider.followingCount,
        ridingStyle: rider.ridingStyle,
        experience: rider.experience,
      },
    });
  })
);

/**
 * @route GET /api/riders/:id/trust-score
 * @desc Get rider's trust score
 * @access Public (for displaying on profiles)
 *
 * @param id - Rider profile MongoDB ID
 * @returns Trust score with level indicator (trusted/verified/new)
 *
 * @example
 * GET /api/riders/60d5ec9af682fbd12a0b1234/trust-score
 */
router.get('/:id/trust-score',
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await RiderProfile.findById(req.params.id)
      .select('trustScore verifiedRides totalRides badges');

    if (!rider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        trustScore: rider.trustScore,
        verifiedRides: rider.verifiedRides,
        totalRides: rider.totalRides,
        badges: rider.badges,
        level: rider.trustScore >= 80 ? 'trusted' : rider.trustScore >= 50 ? 'verified' : 'new',
      },
    });
  })
);

/**
 * @route POST /api/riders/:id/follow
 * @desc Follow or unfollow a rider
 * @access Private
 *
 * @param id - Target rider profile MongoDB ID
 * @returns Updated follow status and counts
 *
 * @example
 * POST /api/riders/60d5ec9af682fbd12a0b1234/follow
 */
router.post('/:id/follow',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const targetId = req.params.id;

    // Cannot follow yourself
    if (userId === targetId) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    const [currentRider, targetRider] = await Promise.all([
      RiderProfile.findOne({ userId }),
      RiderProfile.findById(targetId),
    ]);

    if (!currentRider || !targetRider) {
      res.status(404).json({ error: 'Rider not found' });
      return;
    }

    const isFollowing = currentRider.following.some(id => id.toString() === targetId);

    if (isFollowing) {
      // Unfollow
      currentRider.following = currentRider.following.filter(id => id.toString() !== targetId);
      targetRider.followers = targetRider.followers.filter(id => id.toString() !== currentRider._id);
    } else {
      // Follow
      currentRider.following.push(targetRider._id);
      targetRider.followers.push(currentRider._id);
    }

    await Promise.all([currentRider.save(), targetRider.save()]);

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followersCount: targetRider.followersCount,
        followingCount: currentRider.followingCount,
      },
    });
  })
);

/**
 * @route GET /api/riders
 * @desc Search riders with filters
 * @access Private
 *
 * @query q - Search query (name)
 * @query city - Filter by city
 * @query ridingStyle - Filter by riding style
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20)
 * @returns Paginated list of riders sorted by trust score
 *
 * @example
 * GET /api/riders?q=john&city=Mumbai&ridingStyle=adventure&page=1&limit=10
 */
router.get('/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, city, ridingStyle, page = '1', limit = '20' } = req.query;

    const query: any = {};

    // Text search
    if (q) {
      query.$text = { $search: q as string };
    }

    // Location filter
    if (city) {
      query['homeLocation.city'] = city;
    }

    // Style filter
    if (ridingStyle) {
      query.ridingStyle = ridingStyle;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [riders, total] = await Promise.all([
      RiderProfile.find(query)
        .select('displayName avatar bio ridingStyle homeLocation trustScore totalRides')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ trustScore: -1 }),
      RiderProfile.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: riders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

export default router;
