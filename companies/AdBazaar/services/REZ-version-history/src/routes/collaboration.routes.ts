import { Router, Request, Response } from 'express';
import { collaborationService } from '../services/collaboration.service';
import { auditService } from '../services/audit.service';
import { ApiResponse, Collaborator, CollaborationEvent } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

const getUserId = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Add collaborator
router.post('/:contentId/collaborators', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const collaborator = await collaborationService.addCollaborator(
      req.params.contentId,
      tenantId,
      req.body
    );

    // Log audit
    auditService.log(req.params.contentId, tenantId, userId, 'collaborator_added', {
      details: { collaboratorId: collaborator.userId },
    });

    const response: ApiResponse<Collaborator> = {
      success: true,
      data: collaborator,
      message: 'Collaborator added successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add collaborator',
    };
    res.status(400).json(response);
  }
});

// Get collaborators
router.get('/:contentId/collaborators', async (req: Request, res: Response) => {
  try {
    const collaborators = await collaborationService.getCollaborators(req.params.contentId);
    const response: ApiResponse<Collaborator[]> = {
      success: true,
      data: collaborators,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch collaborators',
    };
    res.status(500).json(response);
  }
});

// Remove collaborator
router.delete('/:contentId/collaborators/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const removed = await collaborationService.removeCollaborator(
      req.params.contentId,
      tenantId,
      req.params.userId
    );

    if (!removed) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collaborator not found',
      };
      return res.status(404).json(response);
    }

    // Log audit
    auditService.log(req.params.contentId, tenantId, userId, 'collaborator_removed', {
      details: { removedUserId: req.params.userId },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Collaborator removed successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove collaborator',
    };
    res.status(500).json(response);
  }
});

// Get collaboration events
router.get('/:contentId/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const events = await collaborationService.getEvents(req.params.contentId, { limit, since });
    const response: ApiResponse<CollaborationEvent[]> = {
      success: true,
      data: events,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch events',
    };
    res.status(500).json(response);
  }
});

// Get recent activity
router.get('/activity/recent', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : undefined;

    const events = await collaborationService.getRecentActivity(tenantId, { limit, hours });
    const response: ApiResponse<CollaborationEvent[]> = {
      success: true,
      data: events,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch activity',
    };
    res.status(500).json(response);
  }
});

export default router;
