import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { SpaIntelligence } from '../services/spaIntelligence';
import { RecommendationsService } from '../services/recommendations';
import { TherapistMatcher } from '../services/therapistMatcher';
import { SpaMind } from '../models';
import { validateBody } from '../middleware/validation';
import { consultationRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse, ConsultationResponse } from '../types';
import { getCustomerIntent, trackAIRecommendationEvent } from '../integrations/rabtul';

const router = Router();

// Validation schemas
const CustomerPreferencesSchema = z.object({
  skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive', 'acne-prone', 'mature']).optional(),
  concerns: z.array(z.string()).optional(),
  budget: z.enum(['economy', 'mid-range', 'premium', 'luxury']).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  duration: z.number().min(15).max(180).optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  preferredTherapistGender: z.enum(['male', 'female', 'no-preference']).optional(),
  atmosphere: z.enum(['tranquil', 'energetic', 'social', 'private']).optional(),
});

const PastVisitSchema = z.object({
  treatmentId: z.string(),
  treatmentName: z.string().optional(),
  date: z.string().datetime().or(z.date()),
  satisfaction: z.number().min(0).max(5),
  therapistId: z.string().optional(),
  notes: z.string().optional(),
});

const ConsultationRequestSchema = z.object({
  merchantId: z.string().min(3).max(100),
  customerId: z.string().min(1).max(100),
  customerName: z.string().optional(),
  preferences: CustomerPreferencesSchema,
  pastVisits: z.array(PastVisitSchema).optional(),
  sessionId: z.string().uuid().optional(),
  requestedTreatments: z.array(z.string()).optional(),
});

// POST /consult - AI Consultation
router.post(
  '/',
  consultationRateLimiter,
  validateBody(ConsultationRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const {
      merchantId,
      customerId,
      customerName,
      preferences,
      pastVisits,
      sessionId: providedSessionId,
      requestedTreatments,
    } = req.body;

    logger.info('AI consultation requested', {
      merchantId,
      customerId,
      hasPastVisits: !!pastVisits?.length,
      requestedTreatments: requestedTreatments?.length,
    });

    // Generate session ID if not provided
    const sessionId = providedSessionId || uuidv4();

    try {
      // Get treatment recommendations
      let recommendations = await SpaIntelligence.getTreatmentRecommendations(
        preferences,
        pastVisits,
        5
      );

      // If specific treatments requested, filter/prioritize
      if (requestedTreatments && requestedTreatments.length > 0) {
        const prioritized = recommendations.filter((r) =>
          requestedTreatments.includes(r.treatment.treatmentId)
        );
        const others = recommendations.filter(
          (r) => !requestedTreatments.includes(r.treatment.treatmentId)
        );
        recommendations = [...prioritized, ...others];
      }

      // Get therapist matches for top recommended treatments
      const therapistMatches = recommendations.length > 0
        ? await TherapistMatcher.matchTherapists(
            recommendations[0].treatment.treatmentId,
            preferences,
            3
          )
        : [];

      // Get upsell opportunities based on top treatment
      const upsellOpportunities =
        recommendations.length > 0
          ? RecommendationsService.getUpsellOpportunities(
              recommendations[0].treatment.treatmentId,
              preferences,
              recommendations
            )
          : [];

      // Get suggested wellness packages
      const suggestedPackages = RecommendationsService.getSuggestedPackages(
        preferences,
        recommendations
      );

      // Segment customer
      const customerSegmentation = SpaIntelligence.segmentCustomer(
        preferences,
        pastVisits
      );

      // Predict lifetime value
      const lifetimeValuePrediction = SpaIntelligence.predictLifetimeValue(
        preferences,
        pastVisits,
        customerSegmentation
      );

      // Generate insights
      const insights = generateConsultationInsights(
        preferences,
        recommendations,
        customerSegmentation,
        lifetimeValuePrediction
      );

      // Save session to database
      const sessionData = {
        merchantId,
        customerId,
        sessionId,
        customerName,
        preferences,
        pastVisits,
        requestedTreatments,
        timestamp: new Date(),
      };

      await SpaMind.create({
        merchantId,
        sessionId,
        customerId,
        analysis: {
          customerSegmentation,
          preferences,
        },
        recommendations,
        therapistMatches,
        lifetimeValuePrediction,
        sessionData,
      });

      // Get customer intent from RABTUL Intent Graph for analytics
      try {
        await getCustomerIntent(customerId, { merchantId, category: 'spa' });
      } catch (intentError) {
        logger.debug('Intent fetch failed (non-critical)', { error: intentError });
      }

      // Track AI recommendation event via RABTUL SDK
      try {
        await trackAIRecommendationEvent({
          customerId,
          merchantId,
          sessionId,
          recommendations: recommendations.map(r => ({
            treatmentId: r.treatment.treatmentId,
            treatmentName: r.treatment.name,
            score: r.score,
            reason: r.reason || '',
          })),
          consultationType: pastVisits?.length ? 'follow_up' : 'initial',
          responseShown: true,
          actionTaken: undefined,
        });
      } catch (trackError) {
        logger.warn('Failed to track AI recommendation event', { error: trackError, sessionId });
      }

      logger.info('AI consultation completed', {
        sessionId,
        merchantId,
        customerId,
        recommendationsCount: recommendations.length,
        therapistMatchesCount: therapistMatches.length,
        processingTimeMs: Date.now() - startTime,
      });

      const response: ApiResponse<ConsultationResponse> = {
        success: true,
        data: {
          sessionId,
          customerId,
          recommendations,
          therapistMatches,
          upsellOpportunities,
          suggestedPackages,
          customerSegmentation,
          lifetimeValuePrediction,
          insights,
        },
        meta: {
          requestId: sessionId,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('AI consultation failed', { error, merchantId, customerId });
      throw error;
    }
  })
);

// GET /consult/:sessionId - Get previous consultation session
router.get(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    const session = await SpaMind.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Consultation session '${sessionId}' not found`,
        },
      });
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId: session.sessionId,
        customerId: session.customerId,
        recommendations: session.recommendations,
        therapistMatches: session.therapistMatches,
        lifetimeValuePrediction: session.lifetimeValuePrediction,
        sessionAge: Date.now() - session.createdAt.getTime(),
        createdAt: session.createdAt,
      },
    };

    res.status(200).json(response);
  })
);

// Helper function to generate consultation insights
function generateConsultationInsights(
  preferences: any,
  recommendations: any[],
  segmentation: any,
  clv: any
): string[] {
  const insights: string[] = [];

  // Segmentation insight
  insights.push(
    `Customer belongs to the "${segmentation.segmentName}" segment with ${segmentation.retentionRate * 100}% retention rate.`
  );

  // Budget insight
  if (preferences.budget) {
    const budgetLabel = preferences.budget === 'luxury' || preferences.budget === 'premium'
      ? 'high-value'
      : preferences.budget === 'mid-range'
      ? 'moderate-value'
      : 'value-conscious';
    insights.push(`This is a ${budgetLabel} customer with potential for ${budgetLabel === 'high-value' ? 'premium upsells' : 'package deals'}.`);
  }

  // Top recommendation insight
  if (recommendations.length > 0) {
    const top = recommendations[0];
    insights.push(
      `Top treatment "${top.treatment.name}" matches with ${Math.round(top.score)}% compatibility.`
    );
  }

  // CLV insight
  if (clv) {
    insights.push(
      `Predicted lifetime value: $${clv.predictedCLV} (${clv.confidence * 100}% confidence) - ${clv.tier} tier customer.`
    );
  }

  // Concern-based insight
  if (preferences.concerns && preferences.concerns.length > 0) {
    insights.push(
      `Focus areas: ${preferences.concerns.join(', ')}. Recommended treatments address all concerns.`
    );
  }

  // Seasonal insight
  const currentMonth = new Date().getMonth() + 1;
  if (recommendations.some((r: any) => r.seasonalRelevance > 0)) {
    const seasonNames: Record<number, string> = {
      12: 'winter holiday', 1: 'new year wellness', 2: 'spring prep',
      3: 'spring renewal', 4: 'spring refresh', 5: 'pre-summer',
      6: 'summer glow', 7: 'summer maintenance', 8: 'late summer',
      9: 'back-to-routine', 10: 'fall wellness', 11: 'pre-holiday'
    };
    insights.push(
      `Current season (${seasonNames[currentMonth] || 'unknown'}) aligns well with recommended treatments.`
    );
  }

  return insights;
}

export default router;