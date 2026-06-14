import { Router, Request, Response } from 'express';
import { humanTwinService } from '../services/humanTwinService.js';
import {
  DomainType,
  HumanTwinState,
  TwinInsight,
  TwinPrediction,
  TimelineEvent,
  ApiResponse,
} from '../models/humanTwin.js';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; service: string }> = {
    success: true,
    data: {
      status: 'healthy',
      service: 'Human Twin Service',
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// Get complete human twin state
router.get('/twin/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const twin = await humanTwinService.getHumanTwin(userId);

    const response: ApiResponse<HumanTwinState> = {
      success: true,
      data: twin,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get human twin',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Get specific domain score
router.get('/twin/:userId/domain/:domain', async (req: Request, res: Response) => {
  try {
    const { userId, domain } = req.params;

    // Validate domain
    const validDomains: DomainType[] = [
      'physical_health',
      'mental_wellness',
      'sexual_wellness',
      'lifestyle',
      'work_life',
      'family',
      'relationship',
    ];

    if (!validDomains.includes(domain as DomainType)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const twin = await humanTwinService.getHumanTwin(userId);
    const domainScore = twin.domains[domain as DomainType];

    const response: ApiResponse<typeof domainScore> = {
      success: true,
      data: domainScore,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get domain score',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Update domain score
router.put('/twin/:userId/domain/:domain', async (req: Request, res: Response) => {
  try {
    const { userId, domain } = req.params;
    const { score, metadata } = req.body;

    // Validate domain
    const validDomains: DomainType[] = [
      'physical_health',
      'mental_wellness',
      'sexual_wellness',
      'lifestyle',
      'work_life',
      'family',
      'relationship',
    ];

    if (!validDomains.includes(domain as DomainType)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > 100) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Score must be a number between 0 and 100',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const updatedScore = await humanTwinService.updateDomainScore(
      userId,
      domain as DomainType,
      score
    );

    const response: ApiResponse<typeof updatedScore> = {
      success: true,
      data: updatedScore,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update domain score',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Generate cross-domain insights
router.get('/twin/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insights = await humanTwinService.generateInsights(userId);

    const response: ApiResponse<TwinInsight[]> = {
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Generate predictions
router.get('/twin/:userId/predictions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const predictions = await humanTwinService.generatePredictions(userId);

    const response: ApiResponse<TwinPrediction[]> = {
      success: true,
      data: predictions,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate predictions',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Get overall score with breakdown
router.get('/twin/:userId/score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const scoreData = await humanTwinService.getOverallScore(userId);

    const response: ApiResponse<typeof scoreData> = {
      success: true,
      data: scoreData,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get overall score',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Get timeline events
router.get('/twin/:userId/timeline', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const timeline = await humanTwinService.getTimeline(userId);

    const response: ApiResponse<TimelineEvent[]> = {
      success: true,
      data: timeline,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get timeline',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Clear twin cache (admin endpoint)
router.delete('/twin/:userId/cache', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    humanTwinService.clearCache(userId);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: `Cache cleared for user ${userId}` },
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

// Get all domain scores (summary)
router.get('/twin/:userId/domains', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const twin = await humanTwinService.getHumanTwin(userId);

    const domainsSummary = Object.entries(twin.domains).map(([domain, data]) => ({
      domain,
      score: data.score,
      trend: data.trend,
      lastUpdated: data.lastUpdated,
    }));

    const response: ApiResponse<typeof domainsSummary> = {
      success: true,
      data: domainsSummary,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get domains summary',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;