/**
 * Hiring Routes
 *
 * When companies want to "hire" employees along with their professional twins
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin, AccessGrant } from '../index.js';

const router = Router();

// =============================================================================
// REQUEST ACCESS TO TWIN (Hire)
// =============================================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      twinId,
      companyCorpId,
      companyName,
      accessType,
      employmentStartDate,
      employmentEndDate
    } = req.body;

    // Verify twin exists
    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Check if already has active access
    const existingAccess = await AccessGrant.findOne({
      twinId,
      companyCorpId,
      isActive: true
    });

    if (existingAccess) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_HIRED', message: 'Company already has access to this twin' }
      });
    }

    // Create access grant (pending approval from employee)
    const grant = new AccessGrant({
      grantId: `GRANT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      twinId,
      ownerCorpId: twin.ownerCorpId,
      companyCorpId,
      companyName,
      accessType: accessType || 'USE',
      employmentStartDate: employmentStartDate || new Date(),
      employmentEndDate,
      isActive: false, // Requires employee approval
      usage: {
        totalInvocations: 0,
        avgSatisfaction: 0
      },
      expiresAt: employmentEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    });

    await grant.save();

    res.status(201).json({
      success: true,
      data: {
        grantId: grant.grantId,
        twinId,
        status: 'PENDING_APPROVAL',
        message: 'Access request sent to employee for approval'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// APPROVE/REJECT HIRE REQUEST (Employee approves)
// =============================================================================

router.patch('/:grantId', async (req: Request, res: Response) => {
  try {
    const { grantId } = req.params;
    const { action, employeeCorpId } = req.body;

    const grant = await AccessGrant.findOne({ grantId });

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grant not found' }
      });
    }

    // Verify employee owns the twin
    const twin = await ProfessionalTwin.findOne({ twinId: grant.twinId });
    if (!twin || twin.ownerCorpId !== employeeCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can approve/reject' }
      });
    }

    if (action === 'approve') {
      grant.isActive = true;
      await grant.save();

      res.json({
        success: true,
        data: {
          grantId: grant.grantId,
          status: 'APPROVED',
          message: 'Access granted. Company can now use your twin.'
        }
      });
    } else if (action === 'reject') {
      await AccessGrant.deleteOne({ grantId });

      res.json({
        success: true,
        data: {
          grantId,
          status: 'REJECTED',
          message: 'Access request declined.'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Action must be "approve" or "reject"' }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET PENDING HIRE REQUESTS (For employee)
// =============================================================================

router.get('/pending/:ownerCorpId', async (req: Request, res: Response) => {
  try {
    const { ownerCorpId } = req.params;

    const pendingGrants = await AccessGrant.find({
      ownerCorpId,
      isActive: false
    }).sort({ createdAt: -1 }).lean();

    // Get twin details
    const twinIds = pendingGrants.map(g => g.twinId);
    const twins = await ProfessionalTwin.find({ twinId: { $in: twinIds } }).lean();
    const twinMap = new Map(twins.map(t => [t.twinId, t]));

    res.json({
      success: true,
      data: {
        count: pendingGrants.length,
        requests: pendingGrants.map(g => {
          const twin = twinMap.get(g.twinId);
          return {
            grantId: g.grantId,
            twinId: g.twinId,
            twinType: twin?.twinType,
            companyName: g.companyName,
            accessType: g.accessType,
            createdAt: g.createdAt,
            action: 'approve | reject'
          };
        })
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET ACTIVE ACCESS GRANTS
// =============================================================================

router.get('/active/:companyCorpId', async (req: Request, res: Response) => {
  try {
    const { companyCorpId } = req.params;

    const activeGrants = await AccessGrant.find({
      companyCorpId,
      isActive: true
    }).sort({ createdAt: -1 }).lean();

    // Get twin details
    const twinIds = activeGrants.map(g => g.twinId);
    const twins = await ProfessionalTwin.find({ twinId: { $in: twinIds } }).lean();
    const twinMap = new Map(twins.map(t => [t.twinId, t]));

    // Calculate total productivity added
    const totalProductivity = twins.reduce(
      (sum, t) => sum + t.metrics.productivityMultiplier,
      0
    );

    res.json({
      success: true,
      data: {
        activeTwins: activeGrants.length,
        totalProductivityMultiplier: totalProductivity.toFixed(1),
        access: activeGrants.map(g => {
          const twin = twinMap.get(g.twinId);
          return {
            grantId: g.grantId,
            twinId: g.twinId,
            twinType: twin?.twinType,
            ownerName: twin?.ownerName,
            accessType: g.accessType,
            employmentStartDate: g.employmentStartDate,
            expiresAt: g.expiresAt,
            usage: g.usage
          };
        })
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// REVOKE ACCESS (Employee revokes company's access)
// =============================================================================

router.delete('/:grantId', async (req: Request, res: Response) => {
  try {
    const { grantId } = req.params;
    const { employeeCorpId } = req.body;

    const grant = await AccessGrant.findOne({ grantId });

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grant not found' }
      });
    }

    // Verify employee owns the twin
    const twin = await ProfessionalTwin.findOne({ twinId: grant.twinId });
    if (!twin || twin.ownerCorpId !== employeeCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can revoke access' }
      });
    }

    grant.isActive = false;
    await grant.save();

    res.json({
      success: true,
      data: {
        grantId: grant.grantId,
        status: 'REVOKED',
        message: 'Access revoked successfully.'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// USE TWIN (Log invocation)
// =============================================================================

router.post('/:grantId/invoke', async (req: Request, res: Response) => {
  try {
    const { grantId } = req.params;
    const { satisfaction, taskType } = req.body;

    const grant = await AccessGrant.findOne({ grantId, isActive: true });

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Active grant not found' }
      });
    }

    // Check if expired
    if (grant.expiresAt && new Date() > grant.expiresAt) {
      grant.isActive = false;
      await grant.save();
      return res.status(403).json({
        success: false,
        error: { code: 'EXPIRED', message: 'Access has expired' }
      });
    }

    // Update usage
    grant.usage.totalInvocations += 1;
    grant.usage.lastUsedAt = new Date();

    // Update satisfaction (rolling average)
    if (satisfaction) {
      const current = grant.usage.avgSatisfaction || 0;
      const count = grant.usage.totalInvocations;
      grant.usage.avgSatisfaction = ((current * (count - 1)) + satisfaction) / count;
    }

    await grant.save();

    // Also update the twin's reliability score
    const twin = await ProfessionalTwin.findOne({ twinId: grant.twinId });
    if (twin && satisfaction) {
      const reliability = (twin.metrics.reliabilityScore * 0.9) + (satisfaction * 10 * 0.1);
      twin.metrics.reliabilityScore = Math.round(reliability);
      twin.learning.lastActiveAt = new Date();
      await twin.save();
    }

    res.json({
      success: true,
      data: {
        invocationLogged: true,
        totalInvocations: grant.usage.totalInvocations,
        avgSatisfaction: grant.usage.avgSatisfaction.toFixed(1)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// BULK HIRE (Company hires employee + all their twins)
// =============================================================================

router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { ownerCorpId, companyCorpId, companyName, twinTypes } = req.body;

    // Get all twins for owner
    const twinFilter: any = { ownerCorpId, status: 'ACTIVE' };
    if (twinTypes && twinTypes.length > 0) {
      twinFilter.twinType = { $in: twinTypes };
    }

    const twins = await ProfessionalTwin.find(twinFilter);

    if (twins.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No twins found for this employee' }
      });
    }

    // Create grants for each twin
    const grants = [];
    for (const twin of twins) {
      // Check if already has access
      const existing = await AccessGrant.findOne({
        twinId: twin.twinId,
        companyCorpId,
        isActive: true
      });

      if (existing) {
        grants.push({ twinId: twin.twinId, status: 'ALREADY_HIRED', grantId: existing.grantId });
        continue;
      }

      const grant = new AccessGrant({
        grantId: `GRANT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        twinId: twin.twinId,
        ownerCorpId: twin.ownerCorpId,
        companyCorpId,
        companyName,
        accessType: 'USE',
        employmentStartDate: new Date(),
        isActive: true, // Auto-approved for bulk hire
        usage: { totalInvocations: 0, avgSatisfaction: 0 }
      });

      await grant.save();
      grants.push({ twinId: twin.twinId, status: 'HIRED', grantId: grant.grantId });
    }

    // Calculate total productivity
    const totalProductivity = twins.reduce(
      (sum, t) => sum + t.metrics.productivityMultiplier,
      0
    );

    res.status(201).json({
      success: true,
      data: {
        employee: twins[0].ownerName,
        twinsHired: grants.filter(g => g.status === 'HIRED').length,
        alreadyHired: grants.filter(g => g.status === 'ALREADY_HIRED').length,
        totalProductivityMultiplier: totalProductivity.toFixed(1),
        message: `Hired ${twins[0].ownerName} + ${grants.length} professional twins`,
        grants
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

export { router as hiringRoutes };
