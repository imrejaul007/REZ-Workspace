import { Router } from 'express';
import {
  createInvite,
  listInvites,
  getInviteById,
  acceptInvite,
  declineInvite,
  listDeals,
  getMetrics,
} from '../controllers/index.js';
import {
  authMiddleware,
  requireRole,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware/index.js';
import {
  createInviteSchema,
  updateInviteStatusSchema,
  listInvitesQuerySchema,
  listDealsQuerySchema,
  inviteIdParamSchema,
} from '../types/schemas.js';

const router = Router();

/**
 * @route POST /api/pmp/invite
 * @desc Create a new PMP invite
 * @access Admin, Publisher
 */
router.post(
  '/invite',
  authMiddleware,
  requireRole('admin', 'publisher'),
  validateBody(createInviteSchema),
  createInvite
);

/**
 * @route GET /api/pmp/invites
 * @desc List all invites with pagination and filters
 * @access All authenticated users
 */
router.get(
  '/invites',
  authMiddleware,
  validateQuery(listInvitesQuerySchema),
  listInvites
);

/**
 * @route GET /api/pmp/invites/:id
 * @desc Get invite details by ID
 * @access All authenticated users
 */
router.get(
  '/invites/:id',
  authMiddleware,
  validateParams(inviteIdParamSchema),
  getInviteById
);

/**
 * @route POST /api/pmp/invites/:id/accept
 * @desc Accept an invite
 * @access Admin, Advertiser
 */
router.post(
  '/invites/:id/accept',
  authMiddleware,
  requireRole('admin', 'advertiser'),
  validateParams(inviteIdParamSchema),
  acceptInvite
);

/**
 * @route POST /api/pmp/invites/:id/decline
 * @desc Decline an invite
 * @access Admin, Advertiser
 */
router.post(
  '/invites/:id/decline',
  authMiddleware,
  requireRole('admin', 'advertiser'),
  validateParams(inviteIdParamSchema),
  validateBody(updateInviteStatusSchema),
  declineInvite
);

/**
 * @route GET /api/pmp/deals
 * @desc List accepted deals
 * @access All authenticated users
 */
router.get(
  '/deals',
  authMiddleware,
  validateQuery(listDealsQuerySchema),
  listDeals
);

/**
 * @route GET /api/pmp/metrics
 * @desc Get invite metrics
 * @access Admin only
 */
router.get(
  '/metrics',
  authMiddleware,
  requireRole('admin'),
  getMetrics
);

export default router;