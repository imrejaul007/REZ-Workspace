// Copilot Routes
// Natural language AI copilot for workforce queries

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { copilotService } from '../services/index.js';
import { ApiResponse, CopilotQuery, CopilotResponse } from '../types/index.js';

const router = Router();

// Schema validation
const copilotQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(500),
  context: z.string().optional(),
  department: z.string().optional(),
});

// POST /api/v1/copilot/query
// Process natural language query
router.post('/query', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = copilotQuerySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
        timestamp: new Date(),
      });
      return;
    }

    const { query, context, department } = validation.data;

    // Extract tenant context from headers
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const userId = req.headers['x-user-id'] as string || 'unknown';

    const copilotQuery: CopilotQuery = {
      query,
      context,
      tenantId,
      userId,
      department,
    };

    const response = await copilotService.processQuery(copilotQuery);

    const apiResponse: ApiResponse<CopilotResponse> = {
      success: true,
      data: response,
      timestamp: new Date(),
    };

    res.json(apiResponse);
  } catch (error) {
    logger.error('Error processing copilot query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/copilot/suggestions
// Get suggested queries
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = {
      attrition: [
        'Why is attrition increasing?',
        'Which employees are at risk of leaving?',
        'How does our attrition compare to industry average?',
        'What factors are driving attrition in Engineering?',
        'Predict attrition for the next quarter',
      ],
      attendance: [
        'Show attendance trends for this week',
        'Why are late arrivals increasing?',
        'Compare attendance between departments',
        'What is the WFH compliance rate?',
        'Is there a pattern in sick leave usage?',
      ],
      productivity: [
        'What is the current productivity index?',
        'How can we improve team productivity?',
        'Show productivity trends over time',
        'What factors are affecting productivity?',
        'Compare productivity across teams',
      ],
      engagement: [
        'What is the current engagement score?',
        'Why is employee satisfaction declining?',
        'Show engagement by department',
        'What are the top drivers of engagement?',
        'Compare engagement scores over time',
      ],
      finance: [
        'What is the monthly payroll forecast?',
        'How much are we spending on overtime?',
        'What is the cost of attrition?',
        'Show hiring budget requirements',
        'Compare cost per employee across departments',
      ],
    };

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      timestamp: new Date(),
    });
  }
});

// POST /api/v1/copilot/explain
// Explain a specific metric or insight
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { metric, value, context } = req.body;

    if (!metric) {
      res.status(400).json({
        success: false,
        error: 'Metric is required',
        timestamp: new Date(),
      });
      return;
    }

    // Generate explanation based on metric
    const explanation = generateMetricExplanation(metric, value, context);

    res.json({
      success: true,
      data: {
        metric,
        explanation,
        confidence: 0.85,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error generating explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      timestamp: new Date(),
    });
  }
});

function generateMetricExplanation(
  metric: string,
  value: number,
  context?: string
): string {
  const metricLower = metric.toLowerCase();

  if (metricLower.includes('attrition') || metricLower.includes('turnover')) {
    return `Attrition rate of ${value}% indicates ${value > 10 ? 'elevated' : 'normal'} employee turnover. ` +
      `Industry average is typically 10-15% for technology companies. ` +
      `${value > 15 ? 'High attrition may indicate compensation, culture, or management issues.' : 'Within acceptable range.'}`;
  }

  if (metricLower.includes('attendance') || metricLower.includes('present')) {
    return `Attendance rate of ${value}% represents ${value >= 95 ? 'excellent' : value >= 90 ? 'good' : 'concerning'} compliance. ` +
      `Each percentage point of absenteeism costs approximately ₹${(value * 500).toLocaleString()} in lost productivity.`;
  }

  if (metricLower.includes('engagement') || metricLower.includes('satisfaction')) {
    return `Engagement score of ${value}/100 indicates ${value >= 75 ? 'healthy' : value >= 60 ? 'moderate' : 'low'} employee morale. ` +
      `High engagement correlates with 21% higher productivity and 41% lower absenteeism.`;
  }

  if (metricLower.includes('productivity')) {
    return `Productivity index of ${value * 100}% represents ${value >= 0.8 ? 'above target' : 'below target'} performance. ` +
      `Primary drivers are task completion rate and quality metrics.`;
  }

  return `The ${metric} value of ${value} ${context || 'falls within normal parameters'}. ` +
    `This metric is tracked to monitor workforce health and operational efficiency.`;
}

export default router;
