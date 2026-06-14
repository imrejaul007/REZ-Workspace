import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContentTemplate } from '../models/Personalization';
import { PersonalizationService } from '../services/personalizationService';

const router = Router();

// Validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contentType: z.enum(['email', 'linkedin', 'sequence', 'social', 'ad']),
  subject: z.string().optional(),
  title: z.string().optional(),
  body: z.string().min(1),
  cta: z.object({
    text: z.string(),
    url: z.string().url()
  }).optional(),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'date', 'boolean', 'array']),
    source: z.enum(['contact', 'company', 'deal', 'custom', 'ai']),
    defaultValue: z.string().optional(),
    description: z.string().optional()
  })).optional(),
  variants: z.array(z.object({
    name: z.string(),
    weight: z.number().min(0).max(100).default(50),
    subject: z.string().optional(),
    body: z.string()
  })).optional()
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

// Create template
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateTemplateSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const template = new ContentTemplate({
      ...data,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// List templates
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      contentType,
      isActive = 'true'
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (contentType) query.contentType = contentType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [templates, total] = await Promise.all([
      ContentTemplate.find(query)
        .select('-body')
        .sort({ usageCount: -1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      ContentTemplate.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get template
router.get('/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const template = await ContentTemplate.findOne({
      _id: req.params.templateId,
      tenantId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// Update template
router.patch('/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateTemplateSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const template = await ContentTemplate.findOneAndUpdate(
      { _id: req.params.templateId, tenantId },
      {
        $set: data,
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// Delete template (soft delete)
router.delete('/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const template = await ContentTemplate.findOneAndUpdate(
      { _id: req.params.templateId, tenantId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Preview template with sample data
router.post('/:templateId/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactData, companyData, dealData, customVariables } = z.object({
      contactData: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        fullName: z.string().optional(),
        email: z.string().optional(),
        title: z.string().optional(),
        companyName: z.string().optional(),
        industry: z.string().optional()
      }).optional(),
      companyData: z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        revenue: z.number().optional(),
        founded: z.number().optional()
      }).optional(),
      dealData: z.object({
        title: z.string().optional(),
        value: z.number().optional(),
        stage: z.string().optional()
      }).optional(),
      customVariables: z.record(z.string()).optional()
    }).parse(req.body);

    const output = await PersonalizationService.generateContent({
      templateId: req.params.templateId,
      contactId: 'preview',
      contactData,
      companyData,
      dealData,
      customVariables
    });

    res.json({
      success: true,
      data: output
    });
  } catch (error) {
    next(error);
  }
});

// Get template metrics
router.get('/:templateId/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await PersonalizationService.getTemplateMetrics(req.params.templateId);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

// Duplicate template
router.post('/:templateId/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const original = await ContentTemplate.findOne({
      _id: req.params.templateId,
      tenantId
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const duplicate = new ContentTemplate({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      usageCount: 0,
      avgOpenRate: undefined,
      avgClickRate: undefined,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await duplicate.save();

    res.status(201).json({
      success: true,
      data: duplicate
    });
  } catch (error) {
    next(error);
  }
});

export default router;
