import { logger } from '../../shared/logger';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { planService } from '../services/planService';
import { policyService } from '../services/policyService';
import { claimService } from '../services/claimService';
import { recommendationService } from '../services/recommendationService';
import { providerService } from '../services/providerService';
import {
  PlanType,
  ClaimType,
  PlanSearchParams,
  ComparePlansRequest,
  RecommendationRequest,
  InitiateClaimRequest,
  AddPolicyRequest,
  UploadDocumentRequest,
} from '../models/insurance';

const router = Router();

// Validation schemas
const PlanSearchSchema = z.object({
  query: z.string().optional(),
  type: z.nativeEnum(PlanType).optional(),
  minCoverage: z.coerce.number().optional(),
  maxCoverage: z.coerce.number().optional(),
  minPremium: z.coerce.number().optional(),
  maxPremium: z.coerce.number().optional(),
  providerId: z.string().optional(),
  age: z.coerce.number().optional(),
  familySize: z.coerce.number().optional(),
  sortBy: z.enum(['premium', 'coverage', 'provider']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const ComparePlansSchema = z.object({
  planIds: z.array(z.string()).min(2).max(5),
});

const RecommendationRequestSchema = z.object({
  userId: z.string(),
  age: z.number().min(1).max(120),
  income: z.number().optional(),
  familySize: z.number().min(1),
  healthConditions: z.array(z.string()).optional(),
  budget: z.number().optional(),
  existingCoverage: z.number().optional(),
});

const InitiateClaimSchema = z.object({
  policyId: z.string(),
  userId: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  type: z.nativeEnum(ClaimType),
  amount: z.number().positive(),
  diagnosis: z.string().min(5),
  hospitalId: z.string().optional(),
  hospitalName: z.string().optional(),
  treatmentDate: z.string(),
});

const AddPolicySchema = z.object({
  userId: z.string(),
  planId: z.string(),
  coveredMembers: z.array(
    z.object({
      name: z.string(),
      relationship: z.string(),
      dateOfBirth: z.string(),
      gender: z.enum(['male', 'female', 'other']),
      aadharNumber: z.string().optional(),
    })
  ),
  startDate: z.string(),
  premiumPaid: z.number().positive(),
});

const UploadDocumentSchema = z.object({
  documents: z.array(
    z.object({
      type: z.enum([
        'discharge_summary',
        'medical_reports',
        'hospital_bills',
        'prescriptions',
        'lab_reports',
        'claim_form',
        'identity_proof',
        'bank_details',
        'others',
      ]),
      fileName: z.string(),
      fileUrl: z.string().url(),
    })
  ),
});

// Middleware to handle validation errors
const validate = (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync(req.query || req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
};

// ==================== PLAN ROUTES ====================

/**
 * @route GET /plans
 * @desc Search and filter insurance plans
 */
router.get('/plans', validate(PlanSearchSchema), async (req: Request, res: Response) => {
  try {
    const params: PlanSearchParams = {
      query: req.query.query as string,
      type: req.query.type as PlanType | undefined,
      minCoverage: req.query.minCoverage ? Number(req.query.minCoverage) : undefined,
      maxCoverage: req.query.maxCoverage ? Number(req.query.maxCoverage) : undefined,
      minPremium: req.query.minPremium ? Number(req.query.minPremium) : undefined,
      maxPremium: req.query.maxPremium ? Number(req.query.maxPremium) : undefined,
      providerId: req.query.providerId as string,
      age: req.query.age ? Number(req.query.age) : undefined,
      familySize: req.query.familySize ? Number(req.query.familySize) : undefined,
      sortBy: req.query.sortBy as 'premium' | 'coverage' | 'provider' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await planService.searchPlans(params);
    res.json(result);
  } catch (error) {
    logger.error('Error searching plans:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /plans/recommend
 * @desc Get recommended plans based on user profile
 */
router.get('/plans/recommend', async (req: Request, res: Response) => {
  try {
    const age = parseInt(req.query.age as string);
    const familySize = parseInt(req.query.familySize as string);

    if (isNaN(age) || isNaN(familySize)) {
      res.status(400).json({
        success: false,
        error: 'Age and familySize are required query parameters',
      });
      return;
    }

    const result = await recommendationService.getQuickRecommendations({
      age,
      familySize,
      top: req.query.top ? parseInt(req.query.top as string) : 3,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /plans/:planId
 * @desc Get detailed information about a specific plan
 */
router.get('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const result = await planService.getPlanDetails(req.params.planId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting plan details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /plans/compare
 * @desc Compare multiple plans side by side
 */
router.post('/plans/compare', validate(ComparePlansSchema), async (req: Request, res: Response) => {
  try {
    const { planIds } = req.body as ComparePlansRequest;
    const result = await planService.comparePlans(planIds);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error comparing plans:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== POLICY ROUTES ====================

/**
 * @route POST /policies
 * @desc Add a new policy for a user
 */
router.post('/policies', validate(AddPolicySchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as AddPolicyRequest;
    const result = await policyService.addPolicy(request);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error adding policy:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /policies/user/:userId
 * @desc Get all policies for a user
 */
router.get('/policies/user/:userId', async (req: Request, res: Response) => {
  try {
    const result = await policyService.getPolicies(req.params.userId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting user policies:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /policies/:policyId
 * @desc Get detailed information about a specific policy
 */
router.get('/policies/:policyId', async (req: Request, res: Response) => {
  try {
    const result = await policyService.getPolicyDetails(req.params.policyId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting policy details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /policies/:policyId/summary
 * @desc Get coverage summary for a user's policies
 */
router.get('/policies/:policyId/summary', async (req: Request, res: Response) => {
  try {
    // Get userId from policy and then get summary
    const policyResult = await policyService.getPolicyDetails(req.params.policyId);
    if (!policyResult.success || !policyResult.data) {
      res.status(404).json({ success: false, error: 'Policy not found' });
      return;
    }
    const result = await policyService.getCoverageSummary(policyResult.data.userId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting coverage summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /policies/:policyId/renew
 * @desc Renew an existing policy
 */
router.post('/policies/:policyId/renew', async (req: Request, res: Response) => {
  try {
    const result = await policyService.renewPolicy(req.params.policyId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error renewing policy:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /policies/:policyId/cancel
 * @desc Cancel a policy
 */
router.post('/policies/:policyId/cancel', async (req: Request, res: Response) => {
  try {
    const result = await policyService.cancelPolicy(req.params.policyId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error cancelling policy:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== CLAIM ROUTES ====================

/**
 * @route POST /claims
 * @desc Initiate a new claim
 */
router.post('/claims', validate(InitiateClaimSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as InitiateClaimRequest;
    const result = await claimService.initiateClaim(request);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error initiating claim:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /claims/user/:userId
 * @desc Get claim history for a user
 */
router.get('/claims/user/:userId', async (req: Request, res: Response) => {
  try {
    const result = await claimService.getClaimHistory(req.params.userId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting claim history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /claims/:claimId
 * @desc Get detailed information about a specific claim
 */
router.get('/claims/:claimId', async (req: Request, res: Response) => {
  try {
    const result = await claimService.trackClaim(req.params.claimId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting claim details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route PUT /claims/:claimId/documents
 * @desc Upload documents for a claim
 */
router.put('/claims/:claimId/documents', validate(UploadDocumentSchema), async (req: Request, res: Response) => {
  try {
    const { documents } = req.body as { documents: UploadDocumentRequest[] };
    const result = await claimService.uploadDocuments(req.params.claimId, documents);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error uploading documents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route DELETE /claims/:claimId/documents/:documentId
 * @desc Delete a document from a claim
 */
router.delete('/claims/:claimId/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const result = await claimService.deleteDocument(req.params.claimId, req.params.documentId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /claims/:claimId/settlement
 * @desc Calculate expected settlement for a claim
 */
router.get('/claims/:claimId/settlement', async (req: Request, res: Response) => {
  try {
    const result = await claimService.calculateExpectedSettlement(req.params.claimId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error calculating settlement:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /claims/stats
 * @desc Get overall claims statistics
 */
router.get('/claims/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await claimService.getClaimsStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting claims stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== PROVIDER ROUTES ====================

/**
 * @route GET /providers
 * @desc List all insurance providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const result = await providerService.getProviders({
      sortBy: req.query.sortBy as 'name' | 'claimsRate' | 'turnaround' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting providers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /providers/top
 * @desc Get top-rated providers
 */
router.get('/providers/top', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const result = await providerService.getTopProviders(limit);
    res.json(result);
  } catch (error) {
    logger.error('Error getting top providers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /providers/search
 * @desc Search providers by name
 */
router.get('/providers/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
      return;
    }
    const result = await providerService.searchProviders(query);
    res.json(result);
  } catch (error) {
    logger.error('Error searching providers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /providers/:providerId
 * @desc Get detailed information about a provider
 */
router.get('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const result = await providerService.getProviderDetails(req.params.providerId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting provider details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /providers/:providerId/stats
 * @desc Get claims statistics for a provider
 */
router.get('/providers/:providerId/stats', async (req: Request, res: Response) => {
  try {
    const result = await providerService.getClaimsStats(req.params.providerId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting provider stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /providers/compare
 * @desc Compare multiple providers
 */
router.post('/providers/compare', async (req: Request, res: Response) => {
  try {
    const { providerIds } = req.body as { providerIds: string[] };
    if (!providerIds || !Array.isArray(providerIds)) {
      res.status(400).json({ success: false, error: 'providerIds array is required' });
      return;
    }
    const result = await providerService.compareProviders(providerIds);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error comparing providers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== RECOMMENDATION ROUTES ====================

/**
 * @route POST /recommendations
 * @desc Get personalized plan recommendations
 */
router.post('/recommendations', validate(RecommendationRequestSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as RecommendationRequest;
    const result = await recommendationService.getRecommendations(request);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /recommendations/:recommendationId
 * @desc Get a saved recommendation
 */
router.get('/recommendations/:recommendationId', async (req: Request, res: Response) => {
  try {
    const result = await recommendationService.getRecommendationById(req.params.recommendationId);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error getting recommendation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /recommendations/premium
 * @desc Calculate premium estimate
 */
router.post('/recommendations/premium', async (req: Request, res: Response) => {
  try {
    const { age, sumInsured, familySize, healthConditions, tenure } = req.body;
    const result = await recommendationService.calculatePremium({
      age,
      sumInsured,
      familySize,
      healthConditions,
      tenure,
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error calculating premium:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route POST /recommendations/eligibility
 * @desc Assess eligibility for a plan
 */
router.post('/recommendations/eligibility', async (req: Request, res: Response) => {
  try {
    const { age, healthConditions, planId } = req.body;
    const result = await recommendationService.assessEligibility({
      age,
      healthConditions,
      planId,
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Error assessing eligibility:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
