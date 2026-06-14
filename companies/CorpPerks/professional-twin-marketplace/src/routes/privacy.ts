/**
 * Privacy Routes - Trust Architecture
 *
 * Users control exactly who can see what about their twins.
 * This is CRITICAL for trust:
 * - Current employer can see X
 * - Future employer can see Y
 * - Public can see Z
 * - Individual owns ALL data
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin, AccessGrant } from '../index.js';

const router = Router();

/**
 * Privacy Settings Schema
 */
interface PrivacySettings {
  // Who can see the twin in marketplace
  marketplaceVisibility: {
    visible: boolean;                    // Show in marketplace?
    includeInSearch: boolean;           // Appear in search results?
    showOwnerName: boolean;             // Real name or anonymous?
    showMetrics: boolean;                // Show productivity scores?
    showMetricsAbove: number;            // Only show if score > X
  };

  // Current employer access
  currentEmployer: {
    canView: boolean;                   // Can current employer see twin?
    canUse: boolean;                    // Can they use the twin?
    viewMetrics: boolean;               // See productivity metrics?
    viewBehavior: boolean;             // See work behavior patterns?
    viewMemories: boolean;             // See learning history?
    requireApproval: boolean;          // Require approval for each use?
  };

  // Future employer access (when hiring)
  futureEmployer: {
    canView: boolean;                  // Can future employer see twin?
    canUse: boolean;                   // Can they use the twin during employment?
    viewFullHistory: boolean;          // See complete learning history?
    viewPrivateSkills: boolean;        // See skills marked private?
    viewSalary: boolean;               // Salary expectations (if any)
    viewingDuration: 'employment' | '6months' | '1year' | 'forever';
  };

  // Public visibility
  publicProfile: {
    isPublic: boolean;                // Can anyone view basic profile?
    showSkills: boolean;                // Show skills list?
    showExperience: boolean;           // Show experience summary?
    showCertifications: boolean;       // Show certifications?
    showProductivityScore: boolean;   // Show combined productivity?
    showRecommendations: boolean;       // Show AI recommendations?
  };

  // Specific data controls
  dataSharing: {
    shareWithResearchers: boolean;      // Anonymized data for research?
    shareWithAI: boolean;             // Allow AI training on data?
    allowExport: boolean;             // Can export complete twin?
    allowBackup: boolean;             // Allow platform backup?
  };

  // Notification preferences
  notifications: {
    notifyOnAccess: boolean;          // Notify when someone accesses twin?
    notifyOnHireRequest: boolean;     // Notify when company wants to hire?
    notifyOnNewCompany: boolean;      // Notify when added to new company?
    notifyOnLearning: boolean;        // Notify when twin learns something?
  };
}

const DEFAULT_PRIVACY: PrivacySettings = {
  marketplaceVisibility: {
    visible: true,
    includeInSearch: true,
    showOwnerName: true,
    showMetrics: true,
    showMetricsAbove: 50
  },
  currentEmployer: {
    canView: true,
    canUse: true,
    viewMetrics: true,
    viewBehavior: false,
    viewMemories: false,
    requireApproval: false
  },
  futureEmployer: {
    canView: true,
    canUse: true,
    viewFullHistory: false,
    viewPrivateSkills: false,
    viewSalary: false,
    viewingDuration: 'employment'
  },
  publicProfile: {
    isPublic: false,
    showSkills: true,
    showExperience: true,
    showCertifications: true,
    showProductivityScore: false,
    showRecommendations: false
  },
  dataSharing: {
    shareWithResearchers: false,
    shareWithAI: true,
    allowExport: true,
    allowBackup: true
  },
  notifications: {
    notifyOnAccess: true,
    notifyOnHireRequest: true,
    notifyOnNewCompany: true,
    notifyOnLearning: false
  }
};

/**
 * Get Privacy Settings for a Twin
 */
router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { requesterCorpId } = req.query;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Check what the requester can see
    const accessLevel = await determineAccessLevel(twin, requesterCorpId as string);

    // Return appropriate privacy settings based on access level
    res.json({
      success: true,
      data: {
        twinId: twin.twinId,
        ownerCorpId: twin.ownerCorpId,
        isOwner: twin.ownerCorpId === requesterCorpId,
        accessLevel,
        privacy: accessLevel === 'owner' ? twin.privacy : getLimitedPrivacy(twin.privacy),
        defaultPrivacy: accessLevel === 'owner' ? DEFAULT_PRIVACY : null
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Update Privacy Settings (Owner Only)
 */
router.patch('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { ownerCorpId, settings } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Verify ownership
    if (twin.ownerCorpId !== ownerCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can update privacy settings' }
      });
    }

    // Validate settings
    const validatedSettings = validatePrivacySettings(settings);

    // Update privacy
    twin.privacy = {
      ...twin.privacy,
      ...validatedSettings
    };

    await twin.save();

    res.json({
      success: true,
      data: {
        twinId: twin.twinId,
        privacy: twin.privacy,
        message: 'Privacy settings updated successfully'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Update All Twins Privacy (Bulk)
 */
router.patch('/owner/:corpId/bulk', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { ownerCorpId, settings, twinTypes } = req.body;

    // Verify ownership
    if (corpId !== ownerCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can update privacy settings' }
      });
    }

    // Build filter
    const filter: any = { ownerCorpId: corpId };
    if (twinTypes && twinTypes.length > 0) {
      filter.twinType = { $in: twinTypes };
    }

    // Update all matching twins
    const result = await ProfessionalTwin.updateMany(
      filter,
      { $set: { 'privacy.shareWithCurrentEmployer': settings.shareWithCurrentEmployer ?? true } }
    );

    res.json({
      success: true,
      data: {
        twinsUpdated: result.modifiedCount,
        settings: settings,
        message: `Updated privacy for ${result.modifiedCount} twins`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Get Access Log (Who has accessed this twin)
 */
router.get('/:twinId/access-log', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { ownerCorpId } = req.query;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Verify ownership
    if (twin.ownerCorpId !== ownerCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can view access logs' }
      });
    }

    // Get all access grants
    const grants = await AccessGrant.find({ twinId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        twinId,
        totalAccess: grants.length,
        activeAccess: grants.filter(g => g.isActive).length,
        accesses: grants.map(g => ({
          companyCorpId: g.companyCorpId,
          companyName: g.companyName,
          accessType: g.accessType,
          isActive: g.isActive,
          employmentStartDate: g.employmentStartDate,
          employmentEndDate: g.employmentEndDate,
          usage: g.usage,
          createdAt: g.createdAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Revoke All Access (Emergency Privacy)
 */
router.post('/:twinId/revoke-all', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { ownerCorpId } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Verify ownership
    if (twin.ownerCorpId !== ownerCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can revoke access' }
      });
    }

    // Revoke all access
    const result = await AccessGrant.updateMany(
      { twinId, isActive: true },
      { $set: { isActive: false } }
    );

    // Update privacy to be more restrictive
    twin.privacy.shareWithCurrentEmployer = false;
    twin.privacy.shareWithFutureEmployer = false;
    await twin.save();

    res.json({
      success: true,
      data: {
        accessesRevoked: result.modifiedCount,
        privacyRestricted: true,
        message: 'All access revoked. Twin is now private.'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Apply Preset Privacy Profiles
 */
router.post('/:twinId/preset', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { ownerCorpId, preset } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Verify ownership
    if (twin.ownerCorpId !== ownerCorpId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only the twin owner can apply presets' }
      });
    }

    // Presets
    const presets: Record<string, Partial<PrivacySettings>> = {
      // Maximum privacy - only owner can see
      maximum: {
        marketplaceVisibility: { visible: false, includeInSearch: false, showOwnerName: false, showMetrics: false, showMetricsAbove: 100 },
        currentEmployer: { canView: true, canUse: false, viewMetrics: false, viewBehavior: false, viewMemories: false, requireApproval: true },
        futureEmployer: { canView: true, canUse: false, viewFullHistory: false, viewPrivateSkills: false, viewSalary: false, viewingDuration: 'employment' },
        publicProfile: { isPublic: false, showSkills: false, showExperience: false, showCertifications: false, showProductivityScore: false, showRecommendations: false }
      },

      // Balanced - visible but limited
      balanced: {
        marketplaceVisibility: { visible: true, includeInSearch: true, showOwnerName: true, showMetrics: true, showMetricsAbove: 50 },
        currentEmployer: { canView: true, canUse: true, viewMetrics: true, viewBehavior: false, viewMemories: false, requireApproval: false },
        futureEmployer: { canView: true, canUse: true, viewFullHistory: false, viewPrivateSkills: false, viewSalary: false, viewingDuration: 'employment' },
        publicProfile: { isPublic: true, showSkills: true, showExperience: true, showCertifications: true, showProductivityScore: true, showRecommendations: false }
      },

      // Open - full transparency
      open: {
        marketplaceVisibility: { visible: true, includeInSearch: true, showOwnerName: true, showMetrics: true, showMetricsAbove: 0 },
        currentEmployer: { canView: true, canUse: true, viewMetrics: true, viewBehavior: true, viewMemories: true, requireApproval: false },
        futureEmployer: { canView: true, canUse: true, viewFullHistory: true, viewPrivateSkills: true, viewSalary: false, viewingDuration: 'forever' },
        publicProfile: { isPublic: true, showSkills: true, showExperience: true, showCertifications: true, showProductivityScore: true, showRecommendations: true }
      },

      // Job Search - optimized for hiring
      jobSearch: {
        marketplaceVisibility: { visible: true, includeInSearch: true, showOwnerName: true, showMetrics: true, showMetricsAbove: 30 },
        currentEmployer: { canView: true, canUse: true, viewMetrics: true, viewBehavior: false, viewMemories: false, requireApproval: false },
        futureEmployer: { canView: true, canUse: true, viewFullHistory: true, viewPrivateSkills: true, viewSalary: false, viewingDuration: '1year' },
        publicProfile: { isPublic: true, showSkills: true, showExperience: true, showCertifications: true, showProductivityScore: true, showRecommendations: true }
      }
    };

    if (!presets[preset]) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PRESET', message: 'Invalid preset. Choose: maximum, balanced, open, jobSearch' }
      });
    }

    // Apply preset
    const newPrivacy = { ...twin.privacy.toObject(), ...presets[preset] };
    twin.privacy = newPrivacy as any;
    await twin.save();

    res.json({
      success: true,
      data: {
        twinId: twin.twinId,
        preset,
        privacy: twin.privacy,
        message: `Applied "${preset}" privacy preset`
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
// HELPERS
// =============================================================================

async function determineAccessLevel(twin: any, requesterCorpId?: string): Promise<string> {
  if (!requesterCorpId) return 'public';

  // Owner
  if (twin.ownerCorpId === requesterCorpId) return 'owner';

  // Check if requester is current employer
  const currentGrant = await AccessGrant.findOne({
    twinId: twin.twinId,
    companyCorpId: requesterCorpId,
    isActive: true
  });

  if (currentGrant) {
    return 'current_employer';
  }

  // Check if requester is a potential future employer
  const anyGrant = await AccessGrant.findOne({
    twinId: twin.twinId,
    companyCorpId: requesterCorpId
  });

  if (anyGrant) {
    return 'past_employer';
  }

  return 'public';
}

function getLimitedPrivacy(privacy: any): any {
  // Return only public-facing privacy settings
  return {
    shareWithCurrentEmployer: privacy.shareWithCurrentEmployer,
    shareWithFutureEmployer: privacy.shareWithFutureEmployer,
    showInResume: privacy.showInResume,
    verifiedClaims: privacy.verifiedClaims
  };
}

function validatePrivacySettings(settings: any): Partial<any> {
  const allowed = [
    'shareWithCurrentEmployer',
    'shareWithFutureEmployer',
    'showInResume',
    'verifiedClaims'
  ];

  const validated: any = {};

  for (const key of allowed) {
    if (settings[key] !== undefined) {
      validated[key] = settings[key];
    }
  }

  return validated;
}

export { router as privacyRoutes, DEFAULT_PRIVACY };
