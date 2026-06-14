import { Router, Request, Response } from 'express';
import { z } from 'zod';
import audienceService from '../services/audienceService';
import {
  DmpProvider,
  AudienceStatus,
  AudienceType,
  ApiResponse,
  PaginatedResponse,
  Audience
} from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createAudienceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  provider: z.nativeEnum(DmpProvider),
  audienceType: z.nativeEnum(AudienceType),
  identifiers: z.array(z.object({
    type: z.string(),
    format: z.string().optional()
  })).optional(),
  lookbackDays: z.number().int().min(1).max(365).optional(),
  metadata: z.record(z.any()).optional()
});

const updateAudienceSchema = createAudienceSchema.partial();

// Middleware
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Create audience
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createAudienceSchema.parse(req.body);

    const audience = audienceService.createAudience(validatedData, tenantId);

    const response: ApiResponse<Audience> = {
      success: true,
      data: audience,
      message: 'Audience created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating audience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List audiences
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const provider = req.query.provider as DmpProvider | undefined;
    const status = req.query.status as AudienceStatus | undefined;
    const audienceType = req.query.audienceType as AudienceType | undefined;

    const { audiences, total } = audienceService.getAudiences(tenantId, {
      provider,
      status,
      audienceType,
      page,
      limit
    });

    const response: PaginatedResponse<Audience> = {
      success: true,
      data: audiences,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching audiences:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get audience
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const audience = audienceService.getAudience(req.params.id, tenantId);

    if (!audience) {
      return res.status(404).json({ success: false, error: 'Audience not found' });
    }

    const response: ApiResponse<Audience> = {
      success: true,
      data: audience
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching audience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update audience
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = updateAudienceSchema.parse(req.body);

    const audience = audienceService.updateAudience(req.params.id, validatedData, tenantId);

    if (!audience) {
      return res.status(404).json({ success: false, error: 'Audience not found' });
    }

    const response: ApiResponse<Audience> = {
      success: true,
      data: audience,
      message: 'Audience updated successfully'
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error updating audience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete audience
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = audienceService.deleteAudience(req.params.id, tenantId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Audience not found' });
    }

    res.json({ success: true, message: 'Audience deleted successfully' });
  } catch (error) {
    logger.error('Error deleting audience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Upload members to audience
router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const uploadSchema = z.object({
      members: z.array(z.object({
        identifier: z.string(),
        identifierType: z.string(),
        traits: z.record(z.any()).optional()
      })),
      overwrite: z.boolean().optional()
    });

    const validatedData = uploadSchema.parse(req.body);
    const result = audienceService.uploadMembers({
      audienceId: req.params.id,
      ...validatedData
    }, tenantId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Uploaded ${result.success} members`
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error uploading members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get audience members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { members, total } = audienceService.getMembers(req.params.id, tenantId, { page, limit });

    const response: PaginatedResponse<typeof members[0]> = {
      success: true,
      data: members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
