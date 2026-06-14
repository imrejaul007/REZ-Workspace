import { Router, Response } from 'express';
import { z } from 'zod';
import { ReportTemplate, ReportInstance } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// Validation schema for generating reports
const generateReportSchema = z.object({
  templateId: z.string().min(1),
  params: z.array(z.object({
    filterId: z.string(),
    value: z.any(),
  })).optional(),
  saveInstance: z.boolean().optional(),
});

// GET /api/reports - List all report instances
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    if (req.query.templateId) filter.templateId = req.query.templateId;
    if (req.query.generatedBy) filter.generatedBy = req.query.generatedBy;

    const [instances, total] = await Promise.all([
      ReportInstance.find(filter)
        .populate('templateId', 'name type category')
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportInstance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/reports/:id - Get single report instance
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const instance = await ReportInstance.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('templateId');

    if (!instance) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: instance,
    });
  })
);

// POST /api/reports/generate - Generate report from template
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { templateId, params, saveInstance } = generateReportSchema.parse(req.body);

    // Get template
    const template = await ReportTemplate.findOne({
      _id: templateId,
      tenantId: req.tenantId,
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check access
    if (!template.isPublic && template.createdBy !== req.user?.userId && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    // Build params object from filter values
    const paramValues: Record<string, any> = {};
    params?.forEach(p => {
      paramValues[p.filterId] = p.value;
    });

    // Generate report data based on template widgets
    // In production, this would query actual data sources
    const generatedData: Record<string, any> = {};

    template.widgets?.forEach((widget: any) => {
      generatedData[widget.id] = {
        type: widget.type,
        title: widget.title,
        data: generateMockData(widget, paramValues),
      };
    });

    // Save instance if requested
    let instance = null;
    if (saveInstance) {
      instance = new ReportInstance({
        tenantId: req.tenantId,
        templateId: template._id,
        params: params || [],
        data: generatedData,
        generatedAt: new Date(),
        generatedBy: req.user?.userId || 'system',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      await instance.save();
    }

    res.json({
      success: true,
      data: {
        template: {
          _id: template._id,
          name: template.name,
          type: template.type,
          widgets: template.widgets,
          filters: template.filters,
        },
        params: paramValues,
        data: generatedData,
        generatedAt: new Date().toISOString(),
        instanceId: instance?._id,
      },
      message: 'Report generated successfully',
    });
  })
);

// DELETE /api/reports/:id - Delete report instance
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const instance = await ReportInstance.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!instance) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  })
);

// Helper function to generate mock data for widgets
function generateMockData(widget: any, params: Record<string, any>): any {
  const chartTypes = ['bar', 'line', 'pie', 'donut', 'area'];
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  switch (widget.type) {
    case 'metric':
      return {
        value: Math.floor(Math.random() * 1000),
        change: Math.floor(Math.random() * 20) - 5,
        unit: '%',
      };
    case 'table':
      return {
        columns: ['Name', 'Value', 'Status'],
        rows: [
          ['Item 1', Math.floor(Math.random() * 100), 'Active'],
          ['Item 2', Math.floor(Math.random() * 100), 'Pending'],
          ['Item 3', Math.floor(Math.random() * 100), 'Completed'],
        ],
      };
    case 'chart':
      return {
        labels,
        datasets: [{
          label: widget.title,
          data: labels.map(() => Math.floor(Math.random() * 100)),
        }],
        chartType: widget.visualization?.chartType || 'bar',
      };
    default:
      return { message: 'Widget data' };
  }
}

export default router;
