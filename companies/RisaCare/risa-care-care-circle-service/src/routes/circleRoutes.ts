import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { circleService, CreateCircleDto, InviteMemberDto } from '../services/circleService';
import { sharingService, ShareVisitDto, ShareRecordDto, ShareMedicationDto } from '../services/sharingService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createCircleSchema = z.object({
  patientProfileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  settings: z.object({
    allowSharing: z.boolean().optional(),
    notifyOnActivity: z.boolean().optional(),
    emergencyAccess: z.boolean().optional()
  }).optional()
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['caregiver', 'family', 'friend', 'medical-professional']),
  permissions: z.object({
    viewHealthRecords: z.boolean().optional(),
    viewMedications: z.boolean().optional(),
    viewAppointments: z.boolean().optional(),
    receiveAlerts: z.boolean().optional(),
    manageAppointments: z.boolean().optional(),
    shareRecords: z.boolean().optional()
  }).optional()
});

const acceptInviteSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});

const shareVisitSchema = z.object({
  sharedBy: z.string().uuid(),
  visitId: z.string(),
  visitSummary: z.string(),
  sharedWith: z.array(z.string().uuid()).optional(),
  permissions: z.object({
    canView: z.boolean().optional(),
    canDownload: z.boolean().optional(),
    canShare: z.boolean().optional(),
    canComment: z.boolean().optional()
  }).optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional()
});

const shareRecordSchema = shareVisitSchema.extend({
  recordId: z.string(),
  recordType: z.enum(['report', 'vitals', 'medication']),
  recordSummary: z.string()
}).omit({ visitId: true, visitSummary: true });

const shareMedicationSchema = z.object({
  sharedBy: z.string().uuid(),
  medicationId: z.string(),
  medicationSummary: z.string(),
  sharedWith: z.array(z.string().uuid()).optional(),
  notes: z.string().optional()
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
 * POST /care-circle
 * Create a new care circle
 */
router.post(
  '/',
  validate(createCircleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const circleData: CreateCircleDto = req.body;
    const circle = await circleService.createCircle(circleData);

    logger.info('Care circle created via API', { circleId: circle.id });

    res.status(201).json({
      success: true,
      data: circle
    });
  })
);

/**
 * GET /care-circle/:profileId
 * Get care circle for a profile
 */
router.get(
  '/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const circle = await circleService.getCircleByProfile(profileId);

    if (!circle) {
      res.status(404).json({
        success: false,
        error: 'Care circle not found'
      });
      return;
    }

    res.json({
      success: true,
      data: circle
    });
  })
);

/**
 * GET /care-circle/id/:id
 * Get care circle by ID
 */
router.get(
  '/id/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const circle = await circleService.getCircleById(id);

    if (!circle) {
      res.status(404).json({
        success: false,
        error: 'Care circle not found'
      });
      return;
    }

    res.json({
      success: true,
      data: circle
    });
  })
);

/**
 * POST /care-circle/:id/invite
 * Invite a member to the circle
 */
router.post(
  '/:id/invite',
  validate(inviteMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const inviteData: InviteMemberDto = req.body;

    const result = await circleService.inviteMember(id, inviteData);

    logger.info('Member invited via API', { circleId: id, inviteId: result.inviteId });

    res.status(201).json({
      success: true,
      data: {
        inviteId: result.inviteId,
        inviteCode: result.inviteCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  })
);

/**
 * POST /care-circle/invite/:inviteId/accept
 * Accept an invitation
 */
router.post(
  '/invite/:inviteId/accept',
  validate(acceptInviteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { inviteId } = req.params;
    const { profileId, name, email, phone } = req.body;

    const circle = await circleService.acceptInvite(inviteId, profileId, { name, email, phone });

    if (!circle) {
      res.status(400).json({
        success: false,
        error: 'Failed to accept invitation'
      });
      return;
    }

    logger.info('Invitation accepted via API', { inviteId, profileId });

    res.json({
      success: true,
      data: circle
    });
  })
);

/**
 * DELETE /care-circle/:id/member/:memberId
 * Remove a member from the circle
 */
router.delete(
  '/:id/member/:memberId',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, memberId } = req.params;
    const removedBy = req.headers['x-user-id'] as string;

    if (!removedBy) {
      res.status(401).json({
        success: false,
        error: 'User ID required'
      });
      return;
    }

    const circle = await circleService.removeMember(id, memberId, removedBy);

    if (!circle) {
      res.status(400).json({
        success: false,
        error: 'Failed to remove member'
      });
      return;
    }

    logger.info('Member removed via API', { circleId: id, memberId });

    res.json({
      success: true,
      data: circle
    });
  })
);

/**
 * PATCH /care-circle/:id/member
 * Update member permissions
 */
router.patch(
  '/:id/member',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { memberId, role, permissions } = req.body;

    const circle = await circleService.updateMember(id, { memberId, role, permissions });

    if (!circle) {
      res.status(400).json({
        success: false,
        error: 'Failed to update member'
      });
      return;
    }

    res.json({
      success: true,
      data: circle
    });
  })
);

/**
 * POST /care-circle/:id/share/visit
 * Share a visit with the circle
 */
router.post(
  '/:id/share/visit',
  validate(shareVisitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const shareData: ShareVisitDto = {
      circleId: id,
      ...req.body
    };

    if (req.body.expiresAt) {
      shareData.expiresAt = new Date(req.body.expiresAt);
    }

    const sharedItem = await sharingService.shareVisit(shareData);

    logger.info('Visit shared via API', { circleId: id, visitId: req.body.visitId });

    res.status(201).json({
      success: true,
      data: sharedItem
    });
  })
);

/**
 * POST /care-circle/:id/share/record
 * Share a record with the circle
 */
router.post(
  '/:id/share/record',
  validate(shareRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const shareData: ShareRecordDto = {
      circleId: id,
      ...req.body
    };

    if (req.body.expiresAt) {
      shareData.expiresAt = new Date(req.body.expiresAt);
    }

    const sharedItem = await sharingService.shareRecord(shareData);

    logger.info('Record shared via API', { circleId: id, recordId: req.body.recordId });

    res.status(201).json({
      success: true,
      data: sharedItem
    });
  })
);

/**
 * POST /care-circle/:id/share/medication
 * Share medication with the circle
 */
router.post(
  '/:id/share/medication',
  validate(shareMedicationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const shareData: ShareMedicationDto = {
      circleId: id,
      ...req.body
    };

    const sharedItem = await sharingService.shareMedication(shareData);

    logger.info('Medication shared via API', { circleId: id, medicationId: req.body.medicationId });

    res.status(201).json({
      success: true,
      data: sharedItem
    });
  })
);

/**
 * GET /care-circle/:id/shared
 * Get shared items for a circle
 */
router.get(
  '/:id/shared',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { profileId, itemType, limit, offset } = req.query;

    const result = await sharingService.getSharedItems(id, {
      profileId: profileId as string,
      itemType: itemType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  })
);

export default router;
