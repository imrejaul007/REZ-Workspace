/**
 * REZ Assistant - Recommendations Route
 * Integrates with REZ Mind for personalized recommendations
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import axios from 'axios';

const router = Router();

// REZ Mind service URL
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'https://rez-mind.rezapp.com';

/**
 * Get personalized recommendations for user
 */
router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { type = 'all', limit = 10 } = req.query;

  try {
    const response = await axios.get(`${REZ_MIND_URL}/api/recommendations/${userId}`, {
      params: { type, limit },
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.json({
      success: true,
      data: response.data?.recommendations || [],
    });
  } catch (error: any) {
    // Fallback recommendations
    console.warn('REZ Mind unavailable, returning mock recommendations:', error.message);
    res.json({
      success: true,
      data: [
        {
          id: 'rec-1',
          type: 'restaurant',
          title: 'Try something new today',
          subtitle: 'Based on your preferences',
          score: 0.95,
        },
        {
          id: 'rec-2',
          type: 'offer',
          title: '20% off your next order',
          subtitle: 'Exclusive for you',
          score: 0.88,
        },
        {
          id: 'rec-3',
          type: 'place',
          title: 'Popular nearby',
          subtitle: 'Based on your location',
          score: 0.82,
        },
      ],
    });
  }
}));

/**
 * Refresh recommendations
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { userId, context } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  try {
    const response = await axios.post(
      `${REZ_MIND_URL}/api/recommendations/refresh`,
      { userId, context },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.warn('REZ Mind refresh unavailable:', error.message);
    res.json({
      success: true,
      data: { refreshed: false, message: 'Using cached recommendations' },
    });
  }
}));

/**
 * Get recommendation for specific context (e.g., "nearby", "time-based")
 */
router.post('/context', asyncHandler(async (req: Request, res: Response) => {
  const { userId, contextType, location, time } = req.body;

  if (!userId || !contextType) {
    res.status(400).json({ error: 'userId and contextType are required' });
    return;
  }

  try {
    const response = await axios.post(
      `${REZ_MIND_URL}/api/recommendations/context`,
      { userId, contextType, location, time },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    // Context-aware fallback
    let recommendation = {
      id: `ctx-${Date.now()}`,
      type: contextType,
      title: `Based on your ${contextType} context`,
      score: 0.75,
    };

    if (contextType === 'nearby') {
      recommendation = {
        ...recommendation,
        title: 'Popular places near you',
        subtitle: 'Based on your location',
      };
    } else if (contextType === 'time') {
      recommendation = {
        ...recommendation,
        title: 'Perfect for this time',
        subtitle: new Date().getHours() < 12 ? 'Breakfast spots' : 'Lunch options',
      };
    }

    console.warn('REZ Mind context unavailable, using fallback:', error.message);
    res.json({
      success: true,
      data: recommendation,
    });
  }
}));

export default router;
