/**
 * REZ Mind Hotel - Knowledge Routes
 *
 * Endpoints for user knowledge base management:
 * - POST /knowledge/signal - Add a user signal
 * - GET /knowledge/profile/:userId - Get user profile
 * - PUT /knowledge/preferences/:userId - Update preferences
 * - GET /knowledge/personalization/:userId - Get personalization data
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userKnowledgeService, UserSignal, UserPreferences } from '../services/user-knowledge.service';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const signalContextSchema = z.object({
  hotelId: z.string().optional(),
  roomId: z.string().optional(),
  bookingId: z.string().optional(),
  location: z.string().optional(),
  device: z.string().optional(),
});

const addSignalSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  eventData: z.record(z.unknown()).optional().default({}),
  timestamp: z.string().datetime().optional(),
  source: z.string().min(1, 'source is required'),
  context: signalContextSchema.optional().default({}),
});

const updatePreferencesSchema = z.object({
  roomType: z.string().optional(),
  bedType: z.string().optional(),
  floor: z.string().optional(),
  smoking: z.boolean().optional(),
  earlyCheckin: z.boolean().optional(),
  lateCheckout: z.boolean().optional(),
});

// ─── POST /knowledge/signal ────────────────────────────────────────────────────

/**
 * Add a new signal for a user
 */
router.post('/signal', async (req: Request, res: Response) => {
  try {
    const data = addSignalSchema.parse(req.body);

    const signal = await userKnowledgeService.addSignal(data.userId, {
      eventType: data.eventType,
      eventData: data.eventData,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      source: data.source,
      context: data.context,
    });

    res.status(201).json({
      success: true,
      data: {
        signalId: signal.userId, // MongoDB will generate the actual ID
        signal,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }
    console.error('[Knowledge] Add signal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add signal',
    });
  }
});

// ─── GET /knowledge/profile/:userId ──────────────────────────────────────────

/**
 * Get the complete user profile including preferences, history, and signals
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'userId parameter is required',
      });
      return;
    }

    const profile = await userKnowledgeService.getProfile(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('[Knowledge] Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
});

// ─── PUT /knowledge/preferences/:userId ───────────────────────────────────────

/**
 * Update user preferences
 */
router.put('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'userId parameter is required',
      });
      return;
    }

    const data = updatePreferencesSchema.parse(req.body);

    const preferences = await userKnowledgeService.updatePreferences(userId, data);

    res.json({
      success: true,
      data: {
        preferences,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }
    console.error('[Knowledge] Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
});

// ─── GET /knowledge/personalization/:userId ───────────────────────────────────

/**
 * Get personalization data including user segment and recommendations
 */
router.get('/personalization/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'userId parameter is required',
      });
      return;
    }

    const personalization = await userKnowledgeService.getPersonalization(userId);

    res.json({
      success: true,
      data: personalization,
    });
  } catch (error) {
    console.error('[Knowledge] Get personalization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalization data',
    });
  }
});

// ─── GET /knowledge/recommendations/:userId ────────────────────────────────────

/**
 * Get recommendations based on user profile (bonus endpoint)
 */
router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'userId parameter is required',
      });
      return;
    }

    const recommendations = await userKnowledgeService.getRecommendations(userId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('[Knowledge] Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
    });
  }
});

export default router;
