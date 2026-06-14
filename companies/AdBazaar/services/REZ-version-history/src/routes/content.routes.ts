import { Router, Request, Response } from 'express';
import { contentService } from '../services/content.service';
import { auditService } from '../services/audit.service';
import { ApiResponse, ContentItem, EntityType } from '../types';

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

// Create content item
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const content = await contentService.create(tenantId, req.body);

    // Log audit
    auditService.log(content.id, tenantId, userId, 'version_created', {
      details: { action: 'created', entityType: content.entityType },
    });

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
      message: 'Content created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create content',
    };
    res.status(400).json(response);
  }
});

// Get all content items
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const entityType = req.query.entityType as EntityType | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const items = await contentService.findAll(tenantId, { entityType, limit, offset });
    const response: ApiResponse<ContentItem[]> = {
      success: true,
      data: items,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
    res.status(500).json(response);
  }
});

// Get content by entity
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const content = await contentService.findByEntity(
      tenantId,
      req.params.entityType as EntityType,
      req.params.entityId
    );

    if (!content) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Content not found',
      };
      return res.status(404).json(response);
    }

    // Log access
    auditService.log(content.id, tenantId, getUserId(req), 'content_accessed');

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
    res.status(500).json(response);
  }
});

// Get content by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const content = await contentService.findById(tenantId, req.params.id);

    if (!content) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Content not found',
      };
      return res.status(404).json(response);
    }

    // Log access
    auditService.log(content.id, tenantId, getUserId(req), 'content_accessed');

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
    res.status(500).json(response);
  }
});

// Update content
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const content = await contentService.update(tenantId, req.params.id, req.body);

    if (!content) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Content not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
      message: 'Content updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content',
    };
    res.status(400).json(response);
  }
});

// Delete content
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await contentService.delete(tenantId, req.params.id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Content not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Content deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete content',
    };
    res.status(500).json(response);
  }
});

export default router;
