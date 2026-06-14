import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  GetCorpIdDataSchema,
  GetCorpIdDataResponse,
  GetCIScoreResponse,
  GetTrustReportResponse,
  VerifyProfileResponse,
  AppError,
  ErrorResponse,
} from '../types';
import { verifyJWT, verifyInternalToken, requireRole, verifyProfileAccess } from '../middleware/auth';
import { getCorpIdByProfileId } from '../services/profileSyncService';
import { getCIScoreForProfile, getCIScoreBreakdown } from '../services/ciScoreService';
import { getVerificationStatus, getVerificationSummary } from '../services/verificationService';
import { getTrustReport, getTrustSummary } from '../services/trustService';

const router = Router();

// ============================================
// Validation Error Handler
// ============================================

function handleZodError(error: z.ZodError, res: Response): void {
  const details = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request parameters',
      details,
    },
  } as ErrorResponse);
}

// ============================================
// GET /api/profile/:id/corpid - Get CorpID data for profile
// ============================================

/**
 * @route GET /api/profile/:id/corpid
 * @desc Get CorpID data for a profile
 * @access Authenticated users (with profile access) or internal services
 */
router.get(
  '/:id/corpid',
  verifyJWT,
  verifyProfileAccess,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;

      // Validate request
      const validationResult = GetCorpIdDataSchema.safeParse({
        profileId,
        includeScores: req.query.includeScores !== 'false',
        includeVerification: req.query.includeVerification !== 'false',
      });

      if (!validationResult.success) {
        handleZodError(validationResult.error, res);
        return;
      }

      const corpIdRecord = await getCorpIdByProfileId(profileId);

      if (!corpIdRecord) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CORP_ID_NOT_FOUND',
            message: `CorpID not found for profile ${profileId}`,
          },
        } as ErrorResponse);
        return;
      }

      const response: GetCorpIdDataResponse = {
        profileId,
        corpIdRecord,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/profile/:id/ci-score - Get CI Score for profile
// ============================================

/**
 * @route GET /api/profile/:id/ci-score
 * @desc Get CI Score for a profile
 * @access Authenticated users (with profile access) or internal services
 */
router.get(
  '/:id/ci-score',
  verifyJWT,
  verifyProfileAccess,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;
      const forceRefresh = req.query.forceRefresh === 'true';

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ErrorResponse);
        return;
      }

      const ciScore = await getCIScoreForProfile(profileId, forceRefresh);

      const response: GetCIScoreResponse = {
        profileId,
        ciScore,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/profile/:id/ci-score/breakdown - Get CI Score breakdown
// ============================================

/**
 * @route GET /api/profile/:id/ci-score/breakdown
 * @desc Get CI Score breakdown with explanations
 * @access HR or Admin only
 */
router.get(
  '/:id/ci-score/breakdown',
  verifyJWT,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ErrorResponse);
        return;
      }

      const breakdown = await getCIScoreBreakdown(profileId);

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/profile/:id/verification - Get verification status
// ============================================

/**
 * @route GET /api/profile/:id/verification
 * @desc Get verification status for a profile
 * @access Authenticated users (with profile access) or internal services
 */
router.get(
  '/:id/verification',
  verifyJWT,
  verifyProfileAccess,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ErrorResponse);
        return;
      }

      const verification = await getVerificationStatus(profileId);
      const summary = await getVerificationSummary(profileId);

      res.json({
        success: true,
        data: {
          verification,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/profile/:id/trust-report - Get full trust report
// ============================================

/**
 * @route GET /api/profile/:id/trust-report
 * @desc Get full trust report for a profile
 * @access Authenticated users (with profile access) or internal services
 */
router.get(
  '/:id/trust-report',
  verifyJWT,
  verifyProfileAccess,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;
      const forceRefresh = req.query.forceRefresh === 'true';

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ErrorResponse);
        return;
      }

      const trustReport = await getTrustReport(profileId, forceRefresh);
      const summary = await getTrustSummary(profileId);

      const response: GetTrustReportResponse = {
        profileId,
        trustReport,
      };

      res.json({
        ...response,
        summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/profile/:id/summary - Get complete profile summary
// ============================================

/**
 * @route GET /api/profile/:id/summary
 * @desc Get complete CorpID summary for a profile
 * @access Authenticated users (with profile access) or internal services
 */
router.get(
  '/:id/summary',
  verifyJWT,
  verifyProfileAccess,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileId = req.params.id;

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ErrorResponse);
        return;
      }

      const [corpIdRecord, ciScore, verification, trustReport] = await Promise.all([
        getCorpIdByProfileId(profileId),
        getCIScoreForProfile(profileId),
        getVerificationStatus(profileId),
        getTrustReport(profileId),
      ]);

      if (!corpIdRecord) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CORP_ID_NOT_FOUND',
            message: `CorpID not found for profile ${profileId}`,
          },
        } as ErrorResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          profileId,
          corpIdRecord,
          ciScore,
          verification,
          trustReport,
          links: {
            ciScoreBreakdown: `/api/profile/${profileId}/ci-score/breakdown`,
            verificationSummary: `/api/profile/${profileId}/verification`,
            trustSummary: `/api/profile/${profileId}/trust-report`,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
