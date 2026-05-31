"use strict";
// ============================================
// HOJAI AI - Marketing Agent Social Media Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const socialMediaManager_1 = require("../services/socialMediaManager");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.socialRoutes = router;
// Validation schemas
const CreatePostSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(types_1.SocialPlatform),
    content: zod_1.z.string().min(1).max(2000),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    hashtags: zod_1.z.array(zod_1.z.string().max(30)).optional(),
    mentions: zod_1.z.array(zod_1.z.string()).optional(),
    scheduledFor: zod_1.z.string().datetime().optional(),
    title: zod_1.z.string().max(200).optional(),
    campaignId: zod_1.z.string().uuid().optional()
});
const SchedulePostSchema = zod_1.z.object({
    scheduledFor: zod_1.z.string().datetime()
});
const ListPostsSchema = validation_1.PaginationSchema.extend({
    platform: zod_1.z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'threads', 'reddit']).optional(),
    status: zod_1.z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
    campaignId: zod_1.z.string().uuid().optional()
}).omit({ sort: true, sortBy: true });
const CreateSocialCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    platforms: zod_1.z.array(zod_1.z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'threads', 'reddit'])).min(1),
    posts: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'threads', 'reddit']),
        content: zod_1.z.string().min(1).max(2000),
        mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
        scheduledFor: zod_1.z.string().datetime().optional()
    })).min(1),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional()
});
/**
 * POST /api/social/post
 * Create a social media post
 */
router.post('/post', (0, validation_1.validateBody)(CreatePostSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const post = await socialMediaManager_1.socialMediaManager.createPost(tenantId, {
            platform: req.body.platform,
            content: req.body.content,
            mediaUrls: req.body.mediaUrls,
            hashtags: req.body.hashtags,
            mentions: req.body.mentions,
            scheduledFor: req.body.scheduledFor,
            title: req.body.title,
            campaignId: req.body.campaignId
        });
        logger_1.logger.info('Social post created', { tenantId, postId: post.id, platform: req.body.platform });
        res.json({
            success: true,
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Create post failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to create post'
            }
        });
    }
});
/**
 * POST /api/social/post/:id/schedule
 * Schedule a post for publishing
 */
router.post('/post/:id/schedule', (0, validation_1.validateBody)(SchedulePostSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const post = await socialMediaManager_1.socialMediaManager.schedulePost(tenantId, req.params.id, req.body.scheduledFor);
        if (!post) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Schedule post failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'SCHEDULE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to schedule post'
            }
        });
    }
});
/**
 * POST /api/social/post/:id/publish
 * Publish a post immediately
 */
router.post('/post/:id/publish', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const result = await socialMediaManager_1.socialMediaManager.publishPost(tenantId, req.params.id);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'PUBLISH_FAILED',
                    message: result.error
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { post: result.post }
        });
    }
    catch (error) {
        logger_1.logger.error('Publish post failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'PUBLISH_FAILED',
                message: error instanceof Error ? error.message : 'Failed to publish post'
            }
        });
    }
});
/**
 * GET /api/social/posts
 * List all social posts
 */
router.get('/posts', (0, validation_1.validateBody)(ListPostsSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const pagination = (0, validation_1.getPaginationOptions)(req.body);
        const result = await socialMediaManager_1.socialMediaManager.listPosts(tenantId, {
            platform: req.body.platform,
            status: req.body.status,
            campaignId: req.body.campaignId,
            limit: pagination.limit,
            offset: pagination.skip
        });
        res.json((0, validation_1.formatPaginatedResponse)(result.items, result.total, (req.body.page || 1), (req.body.limit || 20)));
    }
    catch (error) {
        logger_1.logger.error('List posts failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_FAILED',
                message: error instanceof Error ? error.message : 'Failed to list posts'
            }
        });
    }
});
/**
 * GET /api/social/post/:id
 * Get post by ID
 */
router.get('/post/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const posts = await socialMediaManager_1.socialMediaManager.listPosts(tenantId, {
            limit: 1,
            offset: 0
        });
        const post = posts.items.find(p => p.id === req.params.id);
        if (!post) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { post }
        });
    }
    catch (error) {
        logger_1.logger.error('Get post failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get post'
            }
        });
    }
});
/**
 * GET /api/social/post/:id/analytics
 * Get post analytics
 */
router.get('/post/:id/analytics', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const analytics = await socialMediaManager_1.socialMediaManager.getPostAnalytics(tenantId, req.params.id);
        if (!analytics) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Get post analytics failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'ANALYTICS_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get analytics'
            }
        });
    }
});
/**
 * POST /api/social/campaign
 * Create a multi-platform social campaign
 */
router.post('/campaign', (0, validation_1.validateBody)(CreateSocialCampaignSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const result = await socialMediaManager_1.socialMediaManager.createCampaign(tenantId, {
            name: req.body.name,
            platforms: req.body.platforms,
            posts: req.body.posts,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        });
        logger_1.logger.info('Social campaign created', { tenantId, campaignId: result.campaignId });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Create social campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_CAMPAIGN_FAILED',
                message: error instanceof Error ? error.message : 'Failed to create campaign'
            }
        });
    }
});
/**
 * DELETE /api/social/post/:id
 * Delete a post
 */
router.delete('/post/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const deleted = await socialMediaManager_1.socialMediaManager.deletePost(tenantId, req.params.id);
        if (!deleted) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { deleted: true }
        });
    }
    catch (error) {
        logger_1.logger.error('Delete post failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to delete post'
            }
        });
    }
});
//# sourceMappingURL=social.js.map