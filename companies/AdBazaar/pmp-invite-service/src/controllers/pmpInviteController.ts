import { Request, Response } from 'express';
import { pmpInviteService } from '../services/index.js';
import {
  recordInviteCreated,
  recordInviteAccepted,
  recordInviteDeclined,
} from '../middleware/metrics.js';
import {
  createInviteSchema,
  updateInviteStatusSchema,
  listInvitesQuerySchema,
  listDealsQuerySchema,
  inviteIdParamSchema,
  CreateInviteInput,
  ListInvitesQueryInput,
  ListDealsQueryInput,
  UpdateInviteStatusInput,
} from '../types/schemas.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

/**
 * Create a new PMP invite
 * POST /api/pmp/invite
 */
export async function createInvite(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = createInviteSchema.parse(req.body) as CreateInviteInput;

    const invite = await pmpInviteService.createInvite(validatedData, {
      createdBy: req.user?.userId || 'system',
    });

    // Record metrics
    recordInviteCreated(validatedData.dealType);

    res.status(201).json({
      success: true,
      data: invite,
      message: 'PMP invite created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create invite',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * List invites with pagination and filters
 * GET /api/pmp/invites
 */
export async function listInvites(req: Request, res: Response): Promise<void> {
  try {
    const validatedQuery = listInvitesQuerySchema.parse(req.query) as ListInvitesQueryInput;

    const result = await pmpInviteService.listInvites({
      status: validatedQuery.status,
      publisherId: validatedQuery.publisherId,
      advertiserId: validatedQuery.advertiserId,
      dealType: validatedQuery.dealType,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to list invites',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Get invite details by ID
 * GET /api/pmp/invites/:id
 */
export async function getInviteById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = inviteIdParamSchema.parse(req.params);

    const invite = await pmpInviteService.getInviteById(id);

    if (!invite) {
      throw new NotFoundError('Invite');
    }

    res.status(200).json({
      success: true,
      data: invite,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get invite',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Accept an invite
 * POST /api/pmp/invites/:id/accept
 */
export async function acceptInvite(req: Request, res: Response): Promise<void> {
  try {
    const { id } = inviteIdParamSchema.parse(req.params);

    const invite = await pmpInviteService.acceptInvite(id, {
      userId: req.user?.userId || 'unknown',
      userRole: req.user?.role || 'advertiser',
    });

    // Record metrics
    recordInviteAccepted(invite.dealType);

    res.status(200).json({
      success: true,
      data: invite,
      message: 'Invite accepted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('expired')
          ? 410
          : 400;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to accept invite',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Decline an invite
 * POST /api/pmp/invites/:id/decline
 */
export async function declineInvite(req: Request, res: Response): Promise<void> {
  try {
    const { id } = inviteIdParamSchema.parse(req.params);
    const validatedData = updateInviteStatusSchema.parse(req.body) as UpdateInviteStatusInput;

    const invite = await pmpInviteService.declineInvite(
      id,
      validatedData,
      {
        userId: req.user?.userId || 'unknown',
        userRole: req.user?.role || 'advertiser',
        message: validatedData.message,
      }
    );

    // Record metrics
    recordInviteDeclined(invite.dealType);

    res.status(200).json({
      success: true,
      data: invite,
      message: 'Invite declined successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('expired')
          ? 410
          : 400;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to decline invite',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * List accepted deals
 * GET /api/pmp/deals
 */
export async function listDeals(req: Request, res: Response): Promise<void> {
  try {
    const validatedQuery = listDealsQuerySchema.parse(req.query) as ListDealsQueryInput;

    const result = await pmpInviteService.listDeals({
      publisherId: validatedQuery.publisherId,
      advertiserId: validatedQuery.advertiserId,
      dealType: validatedQuery.dealType,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to list deals',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Get invite metrics
 * GET /api/pmp/metrics
 */
export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    const metrics = await pmpInviteService.getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      timestamp: new Date().toISOString(),
    });
  }
}