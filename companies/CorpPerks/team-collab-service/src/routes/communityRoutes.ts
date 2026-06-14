import { Router, Response } from 'express';
import { communityService } from '../services/communityService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ============= COMMUNITIES =============

/**
 * POST /api/communities
 * Create a new community
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { companyId, name, description, type, category, icon, coverImage, tags, rules } = req.body;

    const community = await communityService.createCommunity({
      companyId,
      name,
      description,
      ownerId: user.userId,
      ownerName: user.name,
      type,
      category,
      icon,
      coverImage,
      tags,
      rules,
    });

    res.status(201).json({ success: true, data: community });
  })
);

/**
 * GET /api/communities
 * Get communities with filters
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, type, category, userId, search, page, limit } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const result = await communityService.getCommunities(companyId as string, {
      type: type as 'public' | 'private' | 'hidden' | undefined,
      category: category as string,
      userId: userId as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.communities,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/communities/my
 * Get user's communities
 */
router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.query;
    const user = req.user!;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const communities = await communityService.getUserCommunities(user.userId, companyId as string);

    res.json({ success: true, data: communities });
  })
);

/**
 * GET /api/communities/:id
 * Get community by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const community = await communityService.getCommunityById(req.params.id);

    res.json({ success: true, data: community });
  })
);

/**
 * PATCH /api/communities/:id
 * Update community
 */
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const community = await communityService.updateCommunity(req.params.id, req.body);

    res.json({ success: true, data: community });
  })
);

/**
 * DELETE /api/communities/:id
 * Delete community
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await communityService.deleteCommunity(req.params.id);

    res.json({ success: true, message: 'Community deleted' });
  })
);

// ============= MEMBERS =============

/**
 * POST /api/communities/:id/join
 * Join a community
 */
router.post(
  '/:id/join',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const member = await communityService.addMember(req.params.id, {
      userId: user.userId,
      userName: user.name,
    });

    res.status(201).json({ success: true, data: member });
  })
);

/**
 * POST /api/communities/:id/leave
 * Leave a community
 */
router.post(
  '/:id/leave',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    await communityService.removeMember(req.params.id, user.userId);

    res.json({ success: true, message: 'Left community' });
  })
);

/**
 * GET /api/communities/:id/members
 * Get community members
 */
router.get(
  '/:id/members',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { role, page, limit } = req.query;

    const result = await communityService.getMembers(req.params.id, {
      role: role as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.members,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 50 },
    });
  })
);

/**
 * GET /api/communities/:id/check-membership
 * Check if user is a member
 */
router.get(
  '/:id/check-membership',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const isMember = await communityService.isMember(req.params.id, user.userId);

    res.json({ success: true, data: { isMember } });
  })
);

// ============= POSTS =============

/**
 * POST /api/communities/:id/posts
 * Create a post
 */
router.post(
  '/:id/posts',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { content, type, attachments } = req.body;

    const post = await communityService.createPost({
      communityId: req.params.id,
      authorId: user.userId,
      authorName: user.name,
      authorAvatar: user.avatar,
      content,
      type,
      attachments,
    });

    res.status(201).json({ success: true, data: post });
  })
);

/**
 * GET /api/communities/:id/posts
 * Get community posts
 */
router.get(
  '/:id/posts',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query;

    const result = await communityService.getPosts(req.params.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.posts,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/communities/posts/my
 * Get user's posts
 */
router.get(
  '/posts/my',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { page, limit } = req.query;

    const result = await communityService.getUserPosts(user.userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.posts,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/communities/posts/:id
 * Get post by ID
 */
router.get(
  '/posts/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const post = await communityService.getPostById(req.params.id);

    res.json({ success: true, data: post });
  })
);

/**
 * DELETE /api/communities/posts/:id
 * Delete post
 */
router.delete(
  '/posts/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await communityService.deletePost(req.params.id);

    res.json({ success: true, message: 'Post deleted' });
  })
);

export default router;
