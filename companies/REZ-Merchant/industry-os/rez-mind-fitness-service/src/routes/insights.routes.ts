import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  fitnessRecommendationsService,
  MemberProfile,
  WorkoutRecommendation,
  ClassSuggestion,
  TrainerMatch
} from '../services/FitnessRecommendations';
import {
  memberInsightsService,
  MemberActivity,
  EngagementScore,
  ChurnPrediction,
  MemberActivityMetrics
} from '../services/MemberInsights';

const router = Router();

// Validation schemas
const MemberProfileSchema = z.object({
  memberId: z.string(),
  fitnessGoals: z.array(z.string()),
  preferredWorkoutTypes: z.array(z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'recovery'])),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  availableDays: z.array(z.number().min(0).max(6)),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])),
  workoutHistory: z.array(z.object({
    type: z.string(),
    frequency: z.number(),
    lastPerformed: z.string()
  })).optional(),
  injuries: z.array(z.string()).optional(),
  classHistory: z.array(z.object({
    classId: z.string(),
    attendedCount: z.number()
  })).optional()
});

const MemberActivitySchema = z.object({
  memberId: z.string(),
  checkIns: z.array(z.object({
    timestamp: z.string(),
    duration: z.number(),
    workoutType: z.string().optional(),
    classId: z.string().optional()
  })),
  membershipStartDate: z.string(),
  lastVisitDate: z.string(),
  classHistory: z.array(z.object({
    classId: z.string(),
    className: z.string(),
    instructor: z.string(),
    attendedAt: z.string()
  })).optional(),
  referrals: z.array(z.object({
    referredMemberId: z.string(),
    referredAt: z.string()
  })).optional(),
  feedback: z.array(z.object({
    rating: z.number().min(1).max(5),
    submittedAt: z.string()
  })).optional()
});

// ============================================================================
// WORKOUT RECOMMENDATIONS
// ============================================================================

/**
 * POST /api/insights/workouts/recommendations
 * Get personalized workout recommendations
 */
router.post('/workouts/recommendations', async (req: Request, res: Response) => {
  try {
    const validationResult = MemberProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const profile: MemberProfile = validationResult.data;
    const limit = parseInt(req.query.limit as string) || 5;

    const recommendations = await fitnessRecommendationsService.getWorkoutRecommendations(profile, limit);

    res.json({
      success: true,
      data: {
        memberId: profile.memberId,
        recommendations,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating workout recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate workout recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CLASS SUGGESTIONS
// ============================================================================

/**
 * POST /api/insights/classes/suggestions
 * Get personalized class suggestions
 */
router.post('/classes/suggestions', async (req: Request, res: Response) => {
  try {
    const { profile, availableClasses } = req.body;

    const profileValidation = MemberProfileSchema.safeParse(profile);
    if (!profileValidation.success) {
      return res.status(400).json({
        error: 'Invalid profile data',
        details: profileValidation.error.errors
      });
    }

    if (!Array.isArray(availableClasses)) {
      return res.status(400).json({
        error: 'availableClasses must be an array'
      });
    }

    const suggestions = await fitnessRecommendationsService.getClassSuggestions(
      profileValidation.data,
      availableClasses
    );

    res.json({
      success: true,
      data: {
        memberId: profile.memberId,
        suggestions,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating class suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate class suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TRAINER MATCHING
// ============================================================================

/**
 * POST /api/insights/trainers/match
 * Get matched trainers for a member
 */
router.post('/trainers/match', async (req: Request, res: Response) => {
  try {
    const { profile, trainers } = req.body;

    const profileValidation = MemberProfileSchema.safeParse(profile);
    if (!profileValidation.success) {
      return res.status(400).json({
        error: 'Invalid profile data',
        details: profileValidation.error.errors
      });
    }

    if (!Array.isArray(trainers)) {
      return res.status(400).json({
        error: 'trainers must be an array'
      });
    }

    const matches = await fitnessRecommendationsService.getTrainerMatches(
      profileValidation.data,
      trainers
    );

    res.json({
      success: true,
      data: {
        memberId: profile.memberId,
        matches,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error matching trainers:', error);
    res.status(500).json({
      error: 'Failed to match trainers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ENGAGEMENT SCORING
// ============================================================================

/**
 * POST /api/insights/engagement/score
 * Calculate member engagement score
 */
router.post('/engagement/score', async (req: Request, res: Response) => {
  try {
    const validationResult = MemberActivitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const activity: MemberActivity = validationResult.data;
    const engagementScore = await memberInsightsService.calculateEngagementScore(activity);

    res.json({
      success: true,
      data: engagementScore
    });
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    res.status(500).json({
      error: 'Failed to calculate engagement score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CHURN PREDICTION
// ============================================================================

/**
 * POST /api/insights/churn/predict
 * Predict member churn probability
 */
router.post('/churn/predict', async (req: Request, res: Response) => {
  try {
    const validationResult = MemberActivitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const activity: MemberActivity = validationResult.data;
    const churnPrediction = await memberInsightsService.predictChurn(activity);

    res.json({
      success: true,
      data: churnPrediction
    });
  } catch (error) {
    console.error('Error predicting churn:', error);
    res.status(500).json({
      error: 'Failed to predict churn',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ACTIVITY METRICS
// ============================================================================

/**
 * POST /api/insights/activity/metrics
 * Get detailed activity metrics for a member
 */
router.post('/activity/metrics', async (req: Request, res: Response) => {
  try {
    const validationResult = MemberActivitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const activity: MemberActivity = validationResult.data;
    const metrics = await memberInsightsService.getActivityMetrics(activity);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error calculating activity metrics:', error);
    res.status(500).json({
      error: 'Failed to calculate activity metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// BATCH ENDPOINTS
// ============================================================================

/**
 * POST /api/insights/batch/engagement
 * Calculate engagement scores for multiple members
 */
router.post('/batch/engagement', async (req: Request, res: Response) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({
        error: 'activities must be an array'
      });
    }

    const results: EngagementScore[] = [];
    const errors: { memberId: string; error: string }[] = [];

    for (const activity of activities) {
      const validationResult = MemberActivitySchema.safeParse(activity);
      if (!validationResult.success) {
        errors.push({
          memberId: activity.memberId || 'unknown',
          error: validationResult.error.message
        });
        continue;
      }

      try {
        const score = await memberInsightsService.calculateEngagementScore(validationResult.data);
        results.push(score);
      } catch (error) {
        errors.push({
          memberId: activity.memberId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors: errors.length > 0 ? errors : undefined,
        processed: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error in batch engagement calculation:', error);
    res.status(500).json({
      error: 'Failed to process batch engagement request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/batch/churn
 * Predict churn for multiple members
 */
router.post('/batch/churn', async (req: Request, res: Response) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({
        error: 'activities must be an array'
      });
    }

    const results: ChurnPrediction[] = [];
    const errors: { memberId: string; error: string }[] = [];

    for (const activity of activities) {
      const validationResult = MemberActivitySchema.safeParse(activity);
      if (!validationResult.success) {
        errors.push({
          memberId: activity.memberId || 'unknown',
          error: validationResult.error.message
        });
        continue;
      }

      try {
        const prediction = await memberInsightsService.predictChurn(validationResult.data);
        results.push(prediction);
      } catch (error) {
        errors.push({
          memberId: activity.memberId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors: errors.length > 0 ? errors : undefined,
        processed: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error in batch churn prediction:', error);
    res.status(500).json({
      error: 'Failed to process batch churn prediction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/insights/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-mind-fitness-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
