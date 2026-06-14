import { Router, Response } from 'express';
import { z } from 'zod';
import { ReportTemplate, ReportInstance } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// Validation schema for creating templates
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['attendance', 'performance', 'financial', 'custom', 'lms']),
  category: z.string().min(1),
  widgets: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['table', 'chart', 'metric', 'funnel', 'heatmap', 'timeline', 'gauge']),
    title: z.string().min(1),
    dataSource: z.string().min(1),
    query: z.object({
      fields: z.array(z.string()).optional(),
      filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'between']),
        value: z.any(),
      })).optional(),
      groupBy: z.string().optional(),
      orderBy: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
      })).optional(),
      limit: z.number().positive().optional(),
    }).optional(),
    visualization: z.object({
      chartType: z.enum(['bar', 'line', 'pie', 'donut', 'area', 'scatter', 'radar']).optional(),
      xAxis: z.string().optional(),
      yAxis: z.array(z.string()).optional(),
      colorScheme: z.array(z.string()).optional(),
      showLegend: z.boolean().optional(),
      showLabels: z.boolean().optional(),
      thresholds: z.array(z.object({
        value: z.number(),
        color: z.string(),
      })).optional(),
    }).optional(),
    layout: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  })).optional(),
  filters: z.array(z.object({
    id: z.string().min(1),
    field: z.string().min(1),
    label: z.string().min(1),
    fieldType: z.enum(['string', 'number', 'date', 'select', 'multiselect']),
    required: z.boolean().optional(),
    defaultValue: z.any().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
  })).optional(),
  isPublic: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/reports/templates - List all templates
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    // Apply filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isPublic === 'true') filter.isPublic = true;

    const [templates, total] = await Promise.all([
      ReportTemplate.find(filter)
        .select('-widgets -filters') // Exclude heavy fields for list
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportTemplate.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/reports/templates/types - Get template types
router.get(
  '/types',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const types = await ReportTemplate.distinct('type');
    res.json({ success: true, data: types });
  })
);

// GET /api/reports/templates/:id - Get single template with widgets
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const template = await ReportTemplate.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check access for private templates
    if (!template.isPublic && template.createdBy !== req.user?.userId && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: template,
    });
  })
);

// POST /api/reports/templates - Create new template
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = createTemplateSchema.parse(req.body);

    const template = new ReportTemplate({
      ...validated,
      tenantId: req.tenantId,
      createdBy: req.user?.userId || 'system',
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  })
);

// PATCH /api/reports/templates/:id - Update template
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = createTemplateSchema.partial().parse(req.body);

    const template = await ReportTemplate.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: { ...validated, updatedBy: req.user?.userId } },
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  })
);

// DELETE /api/reports/templates/:id - Delete template
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const template = await ReportTemplate.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Also delete associated instances
    await ReportInstance.deleteMany({
      templateId: template._id,
      tenantId: req.tenantId,
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  })
);

// POST /api/reports/templates/:id/duplicate - Duplicate template
router.post(
  '/:id/duplicate',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const original = await ReportTemplate.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!original) {
      throw new AppError('Template not found', 404);
    }

    const duplicate = new ReportTemplate({
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      category: original.category,
      widgets: original.widgets,
      filters: original.filters,
      isPublic: false,
      isDefault: false,
      tenantId: req.tenantId,
      createdBy: req.user?.userId || 'system',
    });

    await duplicate.save();

    res.status(201).json({
      success: true,
      data: duplicate,
      message: 'Template duplicated successfully',
    });
  })
);

export default router;
