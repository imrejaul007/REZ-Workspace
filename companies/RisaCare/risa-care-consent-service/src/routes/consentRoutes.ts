import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { consentService, GrantConsentDto, RevokeConsentDto, AddEntityDto } from '../services/consentService';
import { recordConsentService, GrantRecordConsentDto } from '../services/recordConsentService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const grantHealthcareConsentSchema = z.object({
  profileId: z.string().uuid(),
  consentType: z.enum(['hipaa', 'general', 'treatment', 'privacy', 'data-sharing', 'telehealth']),
  version: z.string().min(1),
  purposes: z.array(z.object({
    category: z.enum(['treatment', 'billing', 'research', 'marketing', 'third-party', 'emergency']),
    description: z.string(),
    allowed: z.boolean()
  })),
  grantedEntities: z.array(z.object({
    entityId: z.string(),
    entityType: z.enum(['provider', 'organization', 'app']),
    entityName: z.string(),
    permissions: z.array(z.string()),
    expiresAt: z.string().datetime().optional()
  })).optional(),
  expiresAt: z.string().datetime().optional(),
  grantedVia: z.enum(['web', 'mobile', 'verbal', 'written', 'api']).optional(),
  signature: z.object({
    signedBy: z.string(),
    signature: z.string(),
    method: z.enum(['electronic', 'manual', 'verbal'])
  }).optional(),
  documents: z.array(z.object({
    documentId: z.string(),
    documentType: z.string(),
    url: z.string().optional(),
    hash: z.string().optional()
  })).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

const revokeConsentSchema = z.object({
  profileId: z.string().uuid(),
  consentType: z.enum(['hipaa', 'general', 'treatment', 'privacy', 'data-sharing', 'telehealth']),
  reason: z.string().min(1),
  revokedBy: z.string()
});

const addEntitySchema = z.object({
  profileId: z.string().uuid(),
  consentType: z.enum(['hipaa', 'general', 'treatment', 'privacy', 'data-sharing', 'telehealth']),
  entity: z.object({
    entityId: z.string(),
    entityType: z.enum(['provider', 'organization', 'app']),
    entityName: z.string(),
    permissions: z.array(z.string()),
    expiresAt: z.string().datetime().optional()
  })
});

const grantRecordConsentSchema = z.object({
  recordId: z.string(),
  recordType: z.enum(['visit', 'medication', 'lab-result', 'imaging', 'procedure', 'vitals', 'document']),
  profileId: z.string().uuid(),
  grantedTo: z.object({
    entityId: z.string(),
    entityType: z.enum(['provider', 'organization', 'app', 'care-circle', 'individual']),
    entityName: z.string()
  }),
  consentType: z.enum(['share', 'view', 'edit', 'delete']),
  purpose: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  conditions: z.object({
    timeLimited: z.boolean().optional(),
    useLimited: z.boolean().optional(),
    maxUses: z.number().optional(),
    requiresReconsent: z.boolean().optional()
  }).optional(),
  grantedBy: z.string(),
  grantedVia: z.enum(['web', 'mobile', 'api']).optional(),
  ipAddress: z.string().optional()
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Validation middleware
const validate = (schema: z.ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };

/**
 * POST /consent/healthcare
 * Grant healthcare consent
 */
router.post(
  '/healthcare',
  validate(grantHealthcareConsentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const consentData: GrantConsentDto = req.body;

    if (req.body.expiresAt) {
      consentData.expiresAt = new Date(req.body.expiresAt);
    }

    if (req.body.grantedEntities) {
      consentData.grantedEntities = req.body.grantedEntities.map((e: any) => ({
        ...e,
        expiresAt: e.expiresAt ? new Date(e.expiresAt) : undefined
      }));
    }

    const consent = await consentService.grantConsent(consentData);

    logger.info('Healthcare consent granted via API', {
      consentId: consent.id,
      profileId: consent.profileId
    });

    res.status(201).json({
      success: true,
      data: consent
    });
  })
);

/**
 * DELETE /consent/healthcare/:type
 * Revoke healthcare consent
 */
router.delete(
  '/healthcare/:type',
  validate(revokeConsentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const { profileId, reason, revokedBy } = req.body;

    const consent = await consentService.revokeConsent({
      profileId,
      consentType: type as any,
      reason,
      revokedBy
    });

    if (!consent) {
      res.status(404).json({
        success: false,
        error: 'No active consent found to revoke'
      });
      return;
    }

    logger.info('Healthcare consent revoked via API', { consentId: consent.id });

    res.json({
      success: true,
      data: consent
    });
  })
);

/**
 * GET /consent/healthcare/:profileId
 * Get healthcare consent for profile
 */
router.get(
  '/healthcare/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { type } = req.query;

    const consents = await consentService.getConsentRecord(
      profileId,
      type as any
    );

    res.json({
      success: true,
      data: consents
    });
  })
);

/**
 * POST /consent/healthcare/check
 * Check if consent is valid
 */
router.post(
  '/healthcare/check',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId, consentType, purpose } = req.body;

    const isValid = await consentService.isConsentValid(
      profileId,
      consentType,
      purpose
    );

    res.json({
      success: true,
      data: { isValid }
    });
  })
);

/**
 * POST /consent/healthcare/verify
 * Verify/re-confirm consent
 */
router.post(
  '/healthcare/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId, consentType } = req.body;

    const consent = await consentService.verifyConsent(profileId, consentType);

    if (!consent) {
      res.status(404).json({
        success: false,
        error: 'No active consent found'
      });
      return;
    }

    res.json({
      success: true,
      data: consent
    });
  })
);

/**
 * POST /consent/healthcare/entity
 * Add entity to consent
 */
router.post(
  '/healthcare/entity',
  validate(addEntitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const entityData: AddEntityDto = {
      ...req.body,
      entity: {
        ...req.body.entity,
        expiresAt: req.body.entity.expiresAt ? new Date(req.body.entity.expiresAt) : undefined
      }
    };

    const consent = await consentService.addEntity(entityData);

    if (!consent) {
      res.status(400).json({
        success: false,
        error: 'Failed to add entity'
      });
      return;
    }

    res.json({
      success: true,
      data: consent
    });
  })
);

/**
 * DELETE /consent/healthcare/entity
 * Remove entity from consent
 */
router.delete(
  '/healthcare/entity',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId, consentType, entityId } = req.body;

    const consent = await consentService.removeEntity(
      profileId,
      consentType,
      entityId
    );

    if (!consent) {
      res.status(400).json({
        success: false,
        error: 'Failed to remove entity'
      });
      return;
    }

    res.json({
      success: true,
      data: consent
    });
  })
);

/**
 * GET /consent/healthcare/:profileId/audit
 * Get consent audit log
 */
router.get(
  '/healthcare/:profileId/audit',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { type } = req.query;

    const auditLog = await consentService.getAuditLog(
      profileId,
      type as any
    );

    res.json({
      success: true,
      data: auditLog
    });
  })
);

/**
 * POST /consent/record/:recordId
 * Grant record-level consent
 */
router.post(
  '/record/:recordId',
  validate(grantRecordConsentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const consentData: GrantRecordConsentDto = {
      recordId,
      ...req.body
    };

    if (req.body.expiresAt) {
      consentData.expiresAt = new Date(req.body.expiresAt);
    }

    const consent = await recordConsentService.grantRecordConsent(consentData);

    logger.info('Record consent granted via API', {
      consentId: consent.id,
      recordId
    });

    res.status(201).json({
      success: true,
      data: consent
    });
  })
);

/**
 * DELETE /consent/record/:recordId
 * Revoke record-level consent
 */
router.delete(
  '/record/:recordId',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const { entityId, revokedBy, reason } = req.body;

    const success = await recordConsentService.revokeRecordConsent(
      recordId,
      entityId,
      revokedBy,
      reason
    );

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'No active consent found to revoke'
      });
      return;
    }

    res.json({
      success: true
    });
  })
);

/**
 * GET /consent/record/:recordId
 * Get consents for a record
 */
router.get(
  '/record/:recordId',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;

    const consents = await recordConsentService.getRecordConsents(recordId);

    res.json({
      success: true,
      data: consents
    });
  })
);

/**
 * POST /consent/record/check
 * Check record access
 */
router.post(
  '/record/check',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId, entityId, requiredPermission } = req.body;

    const hasAccess = await recordConsentService.checkRecordAccess({
      recordId,
      entityId,
      requiredPermission
    });

    res.json({
      success: true,
      data: { hasAccess }
    });
  })
);

/**
 * GET /consent/records/profile/:profileId
 * Get all record consents for a profile
 */
router.get(
  '/records/profile/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;

    const consents = await recordConsentService.getProfileRecordConsents(profileId);

    res.json({
      success: true,
      data: consents
    });
  })
);

/**
 * GET /consent/records/entity/:entityId
 * Get all record consents for an entity
 */
router.get(
  '/records/entity/:entityId',
  asyncHandler(async (req: Request, res: Response) => {
    const { entityId } = req.params;

    const consents = await recordConsentService.getEntityConsents(entityId);

    res.json({
      success: true,
      data: consents
    });
  })
);

/**
 * POST /consent/records/bulk
 * Bulk grant record consent
 */
router.post(
  '/records/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordIds, profileId, recordType, grantedTo, consentType, purpose, grantedBy } = req.body;

    const consents = await recordConsentService.bulkGrantConsent(
      recordIds,
      profileId,
      recordType,
      grantedTo,
      consentType,
      purpose,
      grantedBy
    );

    logger.info('Bulk record consent granted via API', { count: consents.length });

    res.status(201).json({
      success: true,
      data: consents
    });
  })
);

export default router;
