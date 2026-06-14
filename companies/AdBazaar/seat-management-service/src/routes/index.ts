import { Router, Request, Response, NextFunction } from 'express';
import { seatService } from '../services/seat.service';
import { permissionService } from '../services/permission.service';
import { organizationService } from '../services/organization.service';
import { usageService } from '../services/usage.service';
import { inviteService } from '../services/invite.service';
import { schemas, validateRequest } from '../utils/validation';
import { logger } from 'utils/logger.js';
import { PermissionResource, PermissionAction, UsagePeriod } from '../models';

const router = Router();

// Validation helper
const validate = (schema: unknown) => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (schema) {
      // Simple validation - in production use full Zod validation
      next();
    } else {
      next();
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error instanceof Error ? error.message : 'Invalid request'
    });
  }
};

// ==================== SEAT ROUTES ====================

// Create seat
router.post('/api/seats', validate(schemas.createSeat), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seat = await seatService.createSeat(req.body);
    res.status(201).json({
      success: true,
      data: seat
    });
  } catch (error) {
    next(error);
  }
});

// Get seat by ID
router.get('/api/seats/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seat = await seatService.getSeatById(req.params.id);
    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Seat not found'
      });
      return;
    }
    res.json({
      success: true,
      data: seat
    });
  } catch (error) {
    next(error);
  }
});

// List seats
router.get('/api/seats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, status, role, search, page, limit } = req.query;
    const result = await seatService.listSeats({
      organizationId: organizationId as string,
      status: status as any,
      role: role as any,
      search: search as string,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });
    res.json({
      success: true,
      data: result.seats,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update seat
router.put('/api/seats/:id', validate(schemas.updateSeat), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seat = await seatService.updateSeat(req.params.id, req.body);
    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Seat not found'
      });
      return;
    }
    res.json({
      success: true,
      data: seat
    });
  } catch (error) {
    next(error);
  }
});

// Set permissions for seat
router.post('/api/seats/:id/permissions', validate(schemas.setPermission), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permission = await permissionService.setPermissions({
      ...req.body,
      seatId: req.params.id
    });
    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    next(error);
  }
});

// Get permissions for seat
router.get('/api/seats/:id/permissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await permissionService.getPermissions(req.params.id);
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    next(error);
  }
});

// Activate seat
router.post('/api/seats/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seat = await seatService.activateSeat(req.params.id);
    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Seat not found'
      });
      return;
    }
    res.json({
      success: true,
      data: seat,
      message: 'Seat activated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate seat
router.post('/api/seats/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seat = await seatService.deactivateSeat(req.params.id);
    if (!seat) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Seat not found'
      });
      return;
    }
    res.json({
      success: true,
      data: seat,
      message: 'Seat deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get usage analytics for seat
router.get('/api/seats/:id/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as UsagePeriod) || UsagePeriod.DAILY;
    const analytics = await usageService.getUsageAnalytics(req.params.id, period);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Invite user
router.post('/api/seats/:id/invite', validate(schemas.inviteUser), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inviteService.inviteUser({
      ...req.body,
      invitedBy: req.params.id
    });
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get team members
router.get('/api/seats/:id/team', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await seatService.getTeamMembers(req.params.id);
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ORGANIZATION ROUTES ====================

// Get organization seat overview
router.get('/api/organization/:id/seats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await organizationService.getSeatOverview(req.params.id);
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
});

// Get organization billing info
router.get('/api/organization/:id/billing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const billing = await organizationService.getBillingInfo(req.params.id);
    res.json({
      success: true,
      data: billing
    });
  } catch (error) {
    next(error);
  }
});

// Create organization
router.post('/api/organizations', validate(schemas.createOrganization), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationService.createOrganization(req.body);
    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
});

// Get organization by ID
router.get('/api/organizations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationService.getOrganizationById(req.params.id);
    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Organization not found'
      });
      return;
    }
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
});

// Update organization
router.put('/api/organizations/:id', validate(schemas.updateOrganization), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationService.updateOrganization(req.params.id, req.body);
    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Organization not found'
      });
      return;
    }
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
});

// Update billing
router.put('/api/organizations/:id/billing', validate(schemas.updateBilling), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationService.updateBilling(req.params.id, req.body);
    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Organization not found'
      });
      return;
    }
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
});

// Add seats to organization
router.post('/api/organizations/:id/seats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { additionalSeats } = req.body;
    const organization = await organizationService.addSeats(req.params.id, additionalSeats);
    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Organization not found'
      });
      return;
    }
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
});

// ==================== INVITATION ROUTES ====================

// Accept invitation
router.post('/api/invitations/accept', validate(schemas.acceptInvitation), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteToken, userId } = req.body;
    const seat = await inviteService.acceptInvitation(inviteToken, userId);
    res.json({
      success: true,
      data: seat,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Resend invitation
router.post('/api/invitations/:id/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inviteService.resendInvitation(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Cancel invitation
router.delete('/api/invitations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inviteService.cancelInvitation(req.params.id);
    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get pending invitations for organization
router.get('/api/organizations/:id/invitations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitations = await inviteService.getPendingInvitations(req.params.id);
    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
});

// ==================== USAGE ROUTES ====================

// Record usage
router.post('/api/usage/record', validate(schemas.recordUsage), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usage = await usageService.recordUsage(req.body);
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

// Get organization usage summary
router.get('/api/organizations/:id/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as UsagePeriod) || UsagePeriod.DAILY;
    const summary = await usageService.getOrganizationUsageSummary(req.params.id, period);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// Get organization seat usage breakdown
router.get('/api/organizations/:id/usage/seats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as UsagePeriod) || UsagePeriod.DAILY;
    const limit = Number(req.query.limit) || 20;
    const usage = await usageService.getOrganizationSeatUsage(req.params.id, period, limit);
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

export default router;