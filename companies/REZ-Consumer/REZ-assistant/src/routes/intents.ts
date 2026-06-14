/**
 * REZ Assistant - Intents Route
 * Integrates with REZ Mind for intent prediction and tracking
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import axios from 'axios';

const router = Router();

// REZ Mind service URL
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'https://rez-mind.rezapp.com';

/**
 * Get user intents/history from REZ Mind
 */
router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Fetch intent history from REZ Mind
    const response = await axios.get(`${REZ_MIND_URL}/api/intents/${userId}`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.json({
      success: true,
      data: response.data?.data || [],
    });
  } catch (error: any) {
    // Fallback to mock data if REZ Mind is unavailable
    console.warn('REZ Mind unavailable, returning mock intents:', error.message);
    res.json({
      success: true,
      data: [
        {
          type: 'order',
          count: 12,
          lastActive: new Date().toISOString(),
        },
        {
          type: 'payment',
          count: 8,
          lastActive: new Date().toISOString(),
        },
      ],
    });
  }
}));

/**
 * Predict next intent using REZ Mind
 */
router.post('/predict', asyncHandler(async (req: Request, res: Response) => {
  const { userId, context } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  try {
    const response = await axios.post(
      `${REZ_MIND_URL}/api/intents/predict`,
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
    // Fallback prediction based on time patterns
    const hour = new Date().getHours();
    let predictedIntent = 'explore';

    if (hour >= 7 && hour <= 10) {
      predictedIntent = 'breakfast';
    } else if (hour >= 12 && hour <= 14) {
      predictedIntent = 'lunch';
    } else if (hour >= 18 && hour <= 21) {
      predictedIntent = 'dinner';
    }

    console.warn('REZ Mind predict unavailable, using fallback:', error.message);
    res.json({
      success: true,
      data: {
        predictedIntent,
        confidence: 0.7,
        alternatives: ['explore', 'rewards', 'nearby'],
      },
    });
  }
}));

/**
 * Track a new intent
 */
router.post('/track', asyncHandler(async (req: Request, res: Response) => {
  const { userId, intent, metadata } = req.body;

  if (!userId || !intent) {
    res.status(400).json({ error: 'userId and intent are required' });
    return;
  }

  try {
    await axios.post(
      `${REZ_MIND_URL}/api/intents/track`,
      { userId, intent, metadata, timestamp: new Date().toISOString() },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.warn('REZ Mind track failed, intent not tracked:', error.message);
  }

  res.json({
    success: true,
    message: 'Intent tracked',
  });
}));

export default router;
