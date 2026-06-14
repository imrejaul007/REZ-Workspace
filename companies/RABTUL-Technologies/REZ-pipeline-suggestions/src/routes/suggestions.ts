import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Suggestion } from '../models/Pipeline';
import { PipelineSuggestionService } from '../services/pipelineSuggestionService';

const router = Router();

// Validation schemas
const CreateDealSignalSchema = z.object({
  dealId: z.string(),
  accountId: z.string().optional(),
  signalType: z.enum(['meeting_scheduled', 'email_opened', 'demo_completed',
    'pricing_discussed', 'decision_maker_met', 'contract_sent', 'renewal_due']),
  metadata: z.record(z.unknown()).optional()
});

// Generate suggestions
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pipelineId, accountId } = z.object({
      pipelineId: z.string(),
      accountId: z.string().optional()
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestions = await PipelineSuggestionService.generateSuggestions(
      tenantId,
      pipelineId,
      accountId
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
});

// List suggestions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      type
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [suggestions, total] = await Promise.all([
      Suggestion.find(query)
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Suggestion.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: suggestions,
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

// Get suggestion
router.get('/:suggestionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestion = await Suggestion.findOne({
      _id: req.params.suggestionId,
      tenantId
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
});

// Accept suggestion
router.patch('/:suggestionId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: req.params.suggestionId, tenantId },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date()
        }
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
});

// Dismiss suggestion
router.patch('/:suggestionId/dismiss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: req.params.suggestionId, tenantId },
      {
        $set: {
          status: 'dismissed',
          dismissedAt: new Date()
        }
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
});

// Complete suggestion
router.patch('/:suggestionId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: req.params.suggestionId, tenantId },
      {
        $set: {
          status: 'completed',
          completedAt: new Date()
        }
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
});

// Get suggestions by deal
router.get('/deal/:dealId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const suggestions = await Suggestion.find({
      tenantId,
      dealId: req.params.dealId
    }).sort({ priority: 1, createdAt: -1 });

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
});

// Get pending count
router.get('/stats/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const [total, critical, high, medium, low] = await Promise.all([
      Suggestion.countDocuments({ tenantId, status: 'pending' }),
      Suggestion.countDocuments({ tenantId, status: 'pending', priority: 'critical' }),
      Suggestion.countDocuments({ tenantId, status: 'pending', priority: 'high' }),
      Suggestion.countDocuments({ tenantId, status: 'pending', priority: 'medium' }),
      Suggestion.countDocuments({ tenantId, status: 'pending', priority: 'low' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byPriority: { critical, high, medium, low }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Record deal signal
router.post('/signals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateDealSignalSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // In production, this would integrate with Deal Intelligence service
    // For now, just acknowledge the signal

    res.json({
      success: true,
      data: {
        signalType: data.signalType,
        dealId: data.dealId,
        recorded: true
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
