/**
 * Group Routes
 * Handles all group operations including creation, membership, and discovery
 *
 * @module routes/groups
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, RiderProfile } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for creating a new group */
const CreateGroupSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(1000),
  type: z.enum(['club', 'chapter', 'crew', 'community', 'brand']),
  focus: z.array(z.enum(['adventure', 'touring', 'sport', 'commuter', 'electric', 'cruiser', 'offroad'])),
  brand: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string().optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  meetingPoint: z.object({
    name: z.string(),
    address: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  isPrivate: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
  maxMembers: z.number().int().positive().optional(),
  avatar: z.string().url().optional(),
  coverImage: z.string().url().optional(),
});

/** Schema for updating group (all fields optional) */
const UpdateGroupSchema = CreateGroupSchema.partial();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a URL-friendly slug from group name
 * @param name - Group name
 * @returns URL-safe slug with timestamp
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/groups
 * @desc Create a new rider group
 * @access Private
 *
 * @requestBody - Group data including name, description, type, location
 * @returns Created group with owner membership
 *
 * @example
 * POST /api/groups
 * {
 *   "name": "Mumbai Riders Club",
 *   "description": "A community for adventure riders in Mumbai",
 *   "type": "club",
 *   "city": "Mumbai",
 *   "state": "Maharashtra",
 *   "focus": ["adventure", "touring"]
 * }
 */
router.post('/',
  authenticate,
  validateBody(CreateGroupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const slug = createSlug(req.body.name);

    const group = new Group({
      ...req.body,
      ownerId: rider._id,
      slug,
      members: [{
        riderId: rider._id,
        role: 'owner',
        joinedAt: new Date(),
        status: 'active',
      }],
    });

    await group.save();

    logger.info(`Group created: ${group._id} by rider ${rider._id}`);

    res.status(201).json({
      success: true,
      data: group,
    });
  })
);

/**
 * @route GET /api/groups
 * @desc Search and filter groups
 * @access Public
 *
 * @query q - Search query
 * @query city - Filter by city
 * @query state - Filter by state
 * @query type - Filter by group type
 * @query focus - Filter by riding focus
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20)
 * @returns Paginated list of groups
 *
 * @example
 * GET /api/groups?city=Mumbai&type=club&focus=adventure
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const { q, city, state, type, focus, page = '1', limit = '20' } = req.query;

    const query: any = { isActive: true };

    if (q) {
      query.$text = { $search: q as string };
    }

    if (city) query['city'] = city;
    if (state) query['state'] = state;
    if (type) query['type'] = type;
    if (focus) query['focus'] = focus;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [groups, total] = await Promise.all([
      Group.find(query)
        .select('name slug description type focus city state avatar memberCount followersCount isFeatured')
        .sort({ followersCount: -1, memberCount: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Group.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: groups,
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
 * @route GET /api/groups/:id
 * @desc Get group by ID or slug
 * @access Public
 *
 * @param id - Group MongoDB ID or slug
 * @returns Group details with owner info
 *
 * @example
 * GET /api/groups/mumbai-riders-club-abc123
 */
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const group = await Group.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id },
      ],
    }).populate('ownerId', 'displayName avatar');

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
  })
);

/**
 * @route PUT /api/groups/:id
 * @desc Update group details
 * @access Private (owner only)
 *
 * @param id - Group MongoDB ID or slug
 * @requestBody - Partial group data
 * @returns Updated group
 *
 * @example
 * PUT /api/groups/mumbai-riders-club-abc123
 * { "description": "Updated description", "isPrivate": true }
 */
router.put('/:id',
  authenticate,
  validateBody(UpdateGroupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const group = await Group.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check ownership
    if (!group.isOwner(rider._id)) {
      res.status(403).json({ error: 'Only owner can update group' });
      return;
    }

    Object.assign(group, req.body);
    await group.save();

    res.json({
      success: true,
      data: group,
    });
  })
);

/**
 * @route DELETE /api/groups/:id
 * @desc Delete group (soft delete)
 * @access Private (owner only)
 *
 * @param id - Group MongoDB ID or slug
 * @returns Success message
 *
 * @example
 * DELETE /api/groups/mumbai-riders-club-abc123
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

    const group = await Group.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check ownership
    if (!group.isOwner(rider._id)) {
      res.status(403).json({ error: 'Only owner can delete group' });
      return;
    }

    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  })
);

/**
 * @route POST /api/groups/:id/join
 * @desc Join a group
 * @access Private
 *
 * @param id - Group MongoDB ID or slug
 * @returns Join status (immediate or pending approval)
 *
 * @example
 * POST /api/groups/mumbai-riders-club-abc123/join
 */
router.post('/:id/join',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const group = await Group.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check if already member
    if (group.isMember(rider._id)) {
      res.status(400).json({ error: 'Already a member' });
      return;
    }

    // Check member limit
    if (group.maxMembers && group.memberCount >= group.maxMembers) {
      res.status(400).json({ error: 'Group is full' });
      return;
    }

    // Check trust score requirement
    if (rider.trustScore < group.minTrustScore) {
      res.status(400).json({
        error: `Minimum trust score of ${group.minTrustScore} required`,
        yourScore: rider.trustScore,
      });
      return;
    }

    await group.addMember(rider._id);

    res.json({
      success: true,
      data: {
        status: group.requiresApproval ? 'pending' : 'active',
        message: group.requiresApproval ? 'Waiting for approval' : 'Joined successfully',
      },
    });
  })
);

/**
 * @route POST /api/groups/:id/leave
 * @desc Leave a group
 * @access Private
 *
 * @param id - Group MongoDB ID or slug
 * @returns Success message
 *
 * @example
 * POST /api/groups/mumbai-riders-club-abc123/leave
 */
router.post('/:id/leave',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const group = await Group.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Owner cannot leave
    if (group.isOwner(rider._id)) {
      res.status(400).json({ error: 'Owner cannot leave. Transfer ownership first.' });
      return;
    }

    await group.removeMember(rider._id);

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  })
);

/**
 * @route GET /api/groups/:id/members
 * @desc Get group members
 * @access Public
 *
 * @param id - Group MongoDB ID or slug
 * @query role - Filter by role (owner, admin, member)
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 50)
 * @returns Paginated list of members
 *
 * @example
 * GET /api/groups/mumbai-riders-club-abc123/members?role=admin
 */
router.get('/:id/members',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '50', role } = req.query;

    const group = await Group.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Filter active members
    let members = group.members.filter(m => m.status === 'active');
    if (role) {
      members = members.filter(m => m.role === role);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const paginatedMembers = members.slice(skip, skip + parseInt(limit as string));

    // Populate rider details
    const populatedMembers = await RiderProfile.populate(paginatedMembers, {
      path: 'riderId',
      select: 'displayName avatar trustScore ridingStyle',
    });

    res.json({
      success: true,
      data: populatedMembers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: members.length,
        pages: Math.ceil(members.length / parseInt(limit as string)),
      },
    });
  })
);

/**
 * @route GET /api/groups/featured/list
 * @desc Get featured groups
 * @access Public
 *
 * @query limit - Number of results (default: 10)
 * @returns List of featured groups
 *
 * @example
 * GET /api/groups/featured/list?limit=5
 */
router.get('/featured/list',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    const groups = await Group.find({ isFeatured: true, isActive: true })
      .select('name slug description type focus city state avatar memberCount followersCount')
      .sort({ followersCount: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: groups,
    });
  })
);

/**
 * @route GET /api/groups/nearby/list
 * @desc Get groups near a location
 * @access Public
 *
 * @query lat - Latitude
 * @query lng - Longitude
 * @query radius - Radius in km (default: 50)
 * @returns List of nearby groups
 *
 * @example
 * GET /api/groups/nearby/list?lat=19.0760&lng=72.8777&radius=25
 */
router.get('/nearby/list',
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = '50' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }

    const groups = await Group.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: parseInt(radius as string) * 1000,
        },
      },
    })
      .select('name slug city state avatar memberCount')
      .limit(20);

    res.json({
      success: true,
      data: groups,
    });
  })
);

export default router;
