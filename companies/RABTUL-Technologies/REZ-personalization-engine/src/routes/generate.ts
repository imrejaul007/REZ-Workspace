import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GeneratedContent } from '../models/Personalization';
import { PersonalizationService, PersonalizationInput } from '../services/personalizationService';

const router = Router();

// Validation schemas
const GenerateContentSchema = z.object({
  templateId: z.string(),
  contactId: z.string(),
  dealId: z.string().optional(),
  contactData: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    title: z.string().optional(),
    companyName: z.string().optional(),
    industry: z.string().optional(),
    linkedInUrl: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  companyData: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    revenue: z.number().optional(),
    founded: z.number().optional(),
    website: z.string().optional(),
    description: z.string().optional()
  }).optional(),
  dealData: z.object({
    title: z.string().optional(),
    value: z.number().optional(),
    stage: z.string().optional(),
    probability: z.number().optional(),
    closeDate: z.string().optional(),
    nextStep: z.string().optional()
  }).optional(),
  customVariables: z.record(z.string()).optional(),
  save: z.boolean().default(false)
});

const UpdateStatusSchema = z.object({
  status: z.enum(['sent', 'opened', 'clicked', 'replied', 'bounced'])
});

// Generate content
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GenerateContentSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const input: PersonalizationInput = {
      templateId: data.templateId,
      contactId: data.contactId,
      dealId: data.dealId,
      contactData: data.contactData,
      companyData: data.companyData,
      dealData: data.dealData,
      customVariables: data.customVariables
    };

    const output = await PersonalizationService.generateContent(input);

    // Save if requested
    if (data.save) {
      await PersonalizationService.saveGeneratedContent(tenantId, input, output);
    }

    res.json({
      success: true,
      data: output
    });
  } catch (error) {
    next(error);
  }
});

// Batch generate
router.post('/generate/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = z.object({
      items: z.array(GenerateContentSchema).min(1).max(100)
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;
    const results = [];

    for (const item of items) {
      try {
        const input: PersonalizationInput = {
          templateId: item.templateId,
          contactId: item.contactId,
          dealId: item.dealId,
          contactData: item.contactData,
          companyData: item.companyData,
          dealData: item.dealData,
          customVariables: item.customVariables
        };

        const output = await PersonalizationService.generateContent(input);

        if (item.save) {
          await PersonalizationService.saveGeneratedContent(tenantId, input, output);
        }

        results.push({
          contactId: item.contactId,
          success: true,
          data: output
        });
      } catch (err) {
        results.push({
          contactId: item.contactId,
          success: false,
          error: err instanceof Error ? err.message : 'Generation failed'
        });
      }
    }

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get generated content
router.get('/content/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const content = await GeneratedContent.findOne({
      _id: req.params.contentId,
      tenantId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
});

// List generated content
router.get('/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      templateId,
      contactId,
      dealId,
      status
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (templateId) query.templateId = templateId;
    if (contactId) query.contactId = contactId;
    if (dealId) query.dealId = dealId;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [contents, total] = await Promise.all([
      GeneratedContent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GeneratedContent.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contents,
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

// Update content status
router.patch('/content/:contentId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateStatusSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const updateData: Record<string, unknown> = {
      status: data.status
    };

    // Set timestamps based on status
    switch (data.status) {
      case 'sent':
        updateData.sentAt = new Date();
        break;
      case 'opened':
        updateData.openedAt = new Date();
        break;
      case 'clicked':
        updateData.clickedAt = new Date();
        break;
      case 'replied':
        updateData.repliedAt = new Date();
        break;
    }

    const content = await GeneratedContent.findOneAndUpdate(
      { _id: req.params.contentId, tenantId },
      { $set: updateData },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
});

// Get performance stats
router.get('/stats/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { templateId, startDate, endDate } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (templateId) query.templateId = templateId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const contents = await GeneratedContent.find(query);

    const stats = {
      total: contents.length,
      byStatus: {} as Record<string, number>,
      byVariant: {} as Record<string, number>,
      openRate: 0,
      clickRate: 0,
      replyRate: 0
    };

    let sent = 0;
    let opened = 0;
    let clicked = 0;
    let replied = 0;

    for (const content of contents) {
      stats.byStatus[content.status] = (stats.byStatus[content.status] || 0) + 1;

      if (content.variantName) {
        stats.byVariant[content.variantName] = (stats.byVariant[content.variantName] || 0) + 1;
      }

      if (content.sentAt) sent++;
      if (content.openedAt) opened++;
      if (content.clickedAt) clicked++;
      if (content.repliedAt) replied++;
    }

    if (sent > 0) {
      stats.openRate = Math.round((opened / sent) * 100 * 10) / 10;
      stats.clickRate = Math.round((clicked / sent) * 100 * 10) / 10;
      stats.replyRate = Math.round((replied / sent) * 100 * 10) / 10;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
