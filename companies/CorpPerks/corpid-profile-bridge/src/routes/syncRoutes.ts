import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  ProfileToCorpIdSyncSchema,
  VerifyProfileSchema,
  SyncProfileToCorpIdResponse,
  VerifyProfileResponse,
  ErrorResponse,
  VerificationDocument,
  VerificationStatus,
} from '../types';
import { verifyJWT, verifyInternalToken, requireRole } from '../middleware/auth';
import {
  createCorpIdForProfile,
  updateCorpIdFromProfile,
  deleteCorpIdByProfileId,
  fullSyncFromProfile,
  getCorpIdByEmployeeId,
  getCorpIdsByCorporateId,
} from '../services/profileSyncService';
import {
  verifyIdentity,
  verifyEmployment,
  verifySkills,
  verifyEducation,
  verifyAll,
  addVerificationDocument,
} from '../services/verificationService';
import { getTrustLeaderboard, getTrustDistribution } from '../services/trustService';

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
// POST /api/sync/profile-to-corpid - Sync profile to CorpID
// ============================================

/**
 * @route POST /api/sync/profile-to-corpid
 * @desc Sync a RABTUL Profile to CorpID
 * @access Internal services only
 */
router.post(
  '/profile-to-corpid',
  verifyInternalToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationResult = ProfileToCorpIdSyncSchema.safeParse(req.body);

      if (!validationResult.success) {
        handleZodError(validationResult.error, res);
        return;
      }

      const { profileId, employeeId, corporateId, personalData, workData } = validationResult.data;

      const corpIdRecord = await createCorpIdForProfile({
        profileId,
        employeeId,
        corporateId,
        personalData,
        workData,
      });

      const response: SyncProfileToCorpIdResponse = {
        success: true,
        corpIdRecord,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PUT /api/sync/profile-to-corpid/:profileId - Update CorpID from Profile
// ============================================

/**
 * @route PUT /api/sync/profile-to-corpid/:profileId
 * @desc Update CorpID when RABTUL Profile is updated
 * @access Internal services only
 */
router.put(
  '/profile-to-corpid/:profileId',
  verifyInternalToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { profileId } = req.params;

      const corpIdRecord = await updateCorpIdFromProfile(profileId, req.body);

      res.json({
        success: true,
        corpIdRecord,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// POST /api/sync/full-sync/:profileId - Full sync from RABTUL Profile
// ============================================

/**
 * @route POST /api/sync/full-sync/:profileId
 * @desc Full sync from RABTUL Profile to CorpID
 * @access Internal services only
 */
router.post(
  '/full-sync/:profileId',
  verifyInternalToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { profileId } = req.params;
      const result = await fullSyncFromProfile(profileId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// DELETE /api/sync/profile-to-corpid/:profileId - Delete CorpID
// ============================================

/**
 * @route DELETE /api/sync/profile-to-corpid/:profileId
 * @desc Delete CorpID record (typically when employee leaves)
 * @access Admin only
 */
router.delete(
  '/profile-to-corpid/:profileId',
  verifyJWT,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { profileId } = req.params;
      const deleted = await deleteCorpIdByProfileId(profileId);

      res.json({
        success: deleted,
        message: deleted ? `CorpID for profile ${profileId} deleted` : 'CorpID not found',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// POST /api/profile/:id/verify - Trigger verification
// ============================================

/**
 * @route POST /api/profile/:id/verify
 * @desc Trigger verification for a profile
 * @access HR or Admin only
 */
router.post(
  '/profile/:id/verify',
  verifyJWT,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: profileId } = req.params;

      const validationResult = VerifyProfileSchema.safeParse({
        profileId,
        verificationTypes: req.body.verificationTypes || ['all'],
      });

      if (!validationResult.success) {
        handleZodError(validationResult.error, res);
        return;
      }

      const { verificationTypes } = validationResult.data;

      let verification: VerificationStatus;
      if (verificationTypes.includes('all')) {
        verification = await verifyAll(profileId);
      } else {
        // Run specified verifications
        const results = await Promise.allSettled(
          verificationTypes.map((type) => {
            switch (type) {
              case 'identity':
                return verifyIdentity(profileId, req.body.documents || []);
              case 'employment':
                return verifyEmployment(profileId);
              case 'skills':
                return verifySkills(profileId);
              case 'education':
                return verifyEducation(profileId);
              default:
                return Promise.resolve(null);
            }
          })
        );

        // Get current verification status
        verification = {
          identity: { verified: false, verifiedAt: null, verifiedBy: null, documents: [] },
          employment: { verified: false, verifiedAt: null, verifiedBy: null, documents: [] },
          skills: { verified: false, verifiedAt: null, verifiedBy: null, documents: [] },
          education: { verified: false, verifiedAt: null, verifiedBy: null, documents: [] },
          overall: false,
          lastVerified: new Date(),
        };

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const type = verificationTypes[index];
            if (type && type !== 'all') {
              (verification as unknown as Record<string, unknown>)[type] = result.value;
            }
          }
        });
      }

      const response: VerifyProfileResponse = {
        success: true,
        verification,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// POST /api/profile/:id/verify/document - Add verification document
// ============================================

/**
 * @route POST /api/profile/:id/verify/document
 * @desc Add verification document to a profile
 * @access Authenticated users (with profile access) or HR/Admin
 */
router.post(
  '/profile/:id/verify/document',
  verifyJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: profileId } = req.params;
      const { verificationType, documentType, documentId } = req.body;

      if (!verificationType || !documentType || !documentId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'verificationType, documentType, and documentId are required',
          },
        } as ErrorResponse);
        return;
      }

      const validTypes = ['identity', 'employment', 'skills', 'education'];
      if (!validTypes.includes(verificationType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: `verificationType must be one of: ${validTypes.join(', ')}`,
          },
        } as ErrorResponse);
        return;
      }

      const verification = await addVerificationDocument(profileId, verificationType, {
        type: documentType,
        documentId,
        uploadedAt: new Date(),
      });

      res.json({
        success: true,
        verification,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/sync/corporate/:corporateId/employees - Get all CorpID records for corporate
// ============================================

/**
 * @route GET /api/sync/corporate/:corporateId/employees
 * @desc Get all CorpID records for a corporate
 * @access HR or Admin only
 */
router.get(
  '/corporate/:corporateId/employees',
  verifyJWT,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { corporateId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const corpIdRecords = await getCorpIdsByCorporateId(corporateId);
      const paginatedRecords = corpIdRecords.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          corporateId,
          total: corpIdRecords.length,
          limit,
          offset,
          records: paginatedRecords,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/sync/employee/:employeeId/corpids - Get CorpID records by employee ID
// ============================================

/**
 * @route GET /api/sync/employee/:employeeId/corpids
 * @desc Get CorpID records for an employee
 * @access Authenticated users (with profile access) or HR/Admin
 */
router.get(
  '/employee/:employeeId/corpids',
  verifyJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const corpIdRecords = await getCorpIdByEmployeeId(employeeId);

      res.json({
        success: true,
        data: {
          employeeId,
          records: corpIdRecords,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/sync/corporate/:corporateId/leaderboard - Get trust leaderboard
// ============================================

/**
 * @route GET /api/sync/corporate/:corporateId/leaderboard
 * @desc Get trust leaderboard for a corporate
 * @access HR or Admin only
 */
router.get(
  '/corporate/:corporateId/leaderboard',
  verifyJWT,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { corporateId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const leaderboard = await getTrustLeaderboard(corporateId, limit);

      res.json({
        success: true,
        data: {
          corporateId,
          leaderboard,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET /api/sync/corporate/:corporateId/distribution - Get trust distribution
// ============================================

/**
 * @route GET /api/sync/corporate/:corporateId/distribution
 * @desc Get trust distribution for a corporate
 * @access HR or Admin only
 */
router.get(
  '/corporate/:corporateId/distribution',
  verifyJWT,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { corporateId } = req.params;
      const distribution = await getTrustDistribution(corporateId);

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
