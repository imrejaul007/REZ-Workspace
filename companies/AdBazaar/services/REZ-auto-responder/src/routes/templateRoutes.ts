import { Router, Request, Response } from 'express';
import { z } from 'zod';
import responderService from '../services/responderService';
import {
  AutoReplyTemplate,
  ResponseChannel,
  ResponsePlatform,
  TriggerMatchType,
  ApiResponse,
  PaginatedResponse
} from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  channel: z.nativeEnum(ResponseChannel),
  platforms: z.array(z.nativeEnum(ResponsePlatform)).optional(),
  triggers: z.array(z.object({
    keyword: z.string().min(1).max(200),
    matchType: z.enum(['exact', 'contains', 'starts_with', 'ends_with', 'regex']).default('contains'),
    caseSensitive: z.boolean().default(false)
  })).optional(),
  hashtags: z.array(z.string().max(100)).optional(),
  responseText: z.string().min(1).max(2000),
  responseMedia: z.array(z.string().url()).optional(),
  useAiResponse: z.boolean().default(false),
  aiPrompt: z.string().max(500).optional(),
  delayMinutes: z.number().int().min(0).max(1440).default(0),
  priority: z.number().int().min(0).default(0),
  responseLimit: z.number().int().min(0).optional()
});

const updateTemplateSchema = createTemplateSchema.partial();

// Middleware
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Templates CRUD
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createTemplateSchema.parse(req.body);

    const template = responderService.createTemplate(validatedData, tenantId);

    const response: ApiResponse<AutoReplyTemplate> = {
      success: true,
      data: template,
      message: 'Auto-reply template created successfully'
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
    logger.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const channel = req.query.channel as ResponseChannel | undefined;
    const platform = req.query.platform as ResponsePlatform | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const { templates, total } = responderService.getTemplates(tenantId, {
      channel,
      platform,
      isActive,
      page,
      limit
    });

    const response: PaginatedResponse<AutoReplyTemplate> = {
      success: true,
      data: templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const template = responderService.getTemplate(req.params.id, tenantId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const response: ApiResponse<AutoReplyTemplate> = {
      success: true,
      data: template
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = updateTemplateSchema.parse(req.body);

    const template = responderService.updateTemplate(req.params.id, validatedData, tenantId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const response: ApiResponse<AutoReplyTemplate> = {
      success: true,
      data: template,
      message: 'Template updated successfully'
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
    logger.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = responderService.deleteTemplate(req.params.id, tenantId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const template = responderService.toggleTemplate(req.params.id, tenantId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const response: ApiResponse<AutoReplyTemplate> = {
      success: true,
      data: template,
      message: `Template ${template.isActive ? 'enabled' : 'disabled'}`
    };
    res.json(response);
  } catch (error) {
    logger.error('Error toggling template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Test template
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Test content is required' });
    }

    const result = responderService.testTemplate(req.params.id, content, tenantId);

    const response: ApiResponse<typeof result> = {
      success: result.success,
      data: result,
      message: result.matched ? 'Match found' : 'No match'
    };
    res.json(response);
  } catch (error) {
    logger.error('Error testing template:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
