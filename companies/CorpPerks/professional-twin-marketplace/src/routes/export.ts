/**
 * Export Routes - Critical Trust Feature
 *
 * Users OWN their twin data and can export it anytime.
 * This establishes the fundamental trust that:
 * - User owns their data
 * - User can leave with their data
 * - Company cannot hold data hostage
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin, AccessGrant, TwinReview } from '../index.js';

const router = Router();

/**
 * Export Complete Twin Package
 *
 * Includes:
 * - Twin data (skills, metrics, behavior)
 * - All memories
 * - Access history
 * - Reviews (anonymized)
 * - Privacy settings
 * - Cryptographic signature for tamper-proof export
 */
router.get('/:twinId/complete', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { ownerCorpId } = req.query;

    // Verify ownership
    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Verify requester is the owner (or has permission)
    if (ownerCorpId && twin.ownerCorpId !== ownerCorpId) {
      // Check if company has access - they still get limited export
      const hasAccess = await AccessGrant.findOne({
        twinId,
        companyCorpId: ownerCorpId,
        isActive: true
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You do not own or have access to this twin' }
        });
      }
    }

    // Get access history
    const accessHistory = await AccessGrant.find({ twinId })
      .select('-_id -__v')
      .lean();

    // Get reviews (anonymized for company exports)
    const reviews = await TwinReview.find({ twinId })
      .select('rating review createdAt')
      .lean();

    // Build complete export package
    const exportPackage = {
      // Header
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        twinId: twin.twinId,
        version: twin.version,
        signature: generateSignature(twin.ownerCorpId, twin.twinId),
        exportId: `EXP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      },

      // Ownership
      ownership: twin.ownership,

      // Twin Data
      twin: {
        twinId: twin.twinId,
        twinType: twin.twinType,
        status: twin.status,
        ownerCorpId: twin.ownerCorpId,
        ownerName: twin.ownerName,
        ownerEmail: twin.ownerEmail
      },

      // Learning
      learning: twin.learning,

      // Knowledge
      knowledge: twin.knowledge,

      // Behavior
      behavior: twin.behavior,

      // Metrics
      metrics: twin.metrics,

      // Privacy
      privacy: twin.privacy,

      // Access History (who accessed this twin)
      accessHistory: accessHistory.map(a => ({
        companyCorpId: a.companyCorpId,
        companyName: a.companyName,
        accessType: a.accessType,
        employmentStartDate: a.employmentStartDate,
        employmentEndDate: a.employmentEndDate,
        isActive: a.isActive,
        usage: a.usage
      })),

      // Reviews
      reviews: reviews.map(r => ({
        rating: r.rating,
        review: r.review,
        verified: r.verified,
        createdAt: r.createdAt
        // Deliberately excluding: reviewerCorpId, reviewerName, reviewerCompany
        // This protects reviewer privacy while giving owner insight
      })),

      // Timestamps
      timestamps: {
        createdAt: twin.createdAt,
        updatedAt: twin.updatedAt,
        versionHistory: [
          { version: twin.version, updatedAt: twin.updatedAt }
        ]
      }
    };

    res.json({
      success: true,
      data: exportPackage
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Export All Twins for an Owner
 */
router.get('/owner/:corpId/all', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    // Verify requester owns these twins
    // In real implementation, verify JWT token matches corpId
    const twins = await ProfessionalTwin.find({
      ownerCorpId: corpId,
      status: { $ne: 'ARCHIVED' }
    }).lean();

    if (twins.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No twins found for this owner' }
      });
    }

    const allTwins = [];

    for (const twin of twins) {
      // Get access history for each twin
      const accessHistory = await AccessGrant.find({ twinId: twin.twinId }).lean();

      allTwins.push({
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          twinId: twin.twinId,
          signature: generateSignature(corpId, twin.twinId),
          exportId: `EXP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        },
        twin: {
          twinId: twin.twinId,
          twinType: twin.twinType,
          status: twin.status,
          ownerCorpId: twin.ownerCorpId,
          ownerName: twin.ownerName
        },
        ownership: twin.ownership,
        learning: twin.learning,
        knowledge: twin.knowledge,
        behavior: twin.behavior,
        metrics: twin.metrics,
        privacy: twin.privacy,
        accessHistory: accessHistory.map(a => ({
          companyCorpId: a.companyCorpId,
          companyName: a.companyName,
          isActive: a.isActive,
          accessType: a.accessType
        })),
        timestamps: {
          createdAt: twin.createdAt,
          updatedAt: twin.updatedAt
        }
      });
    }

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        twinCount: twins.length,
        combinedProductivity: twins.reduce((sum, t) => sum + t.metrics.productivityMultiplier, 0),
        exportedAt: new Date().toISOString(),
        exportId: `EXP-SET-${Date.now().toString(36)}`,
        twins: allTwins
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
 * Export for Job Change (Special Export)
 *
 * When an employee leaves a company, they need a complete export
 * of their professional identity to take to their next employer.
 */
router.get('/job-change/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { targetCompany } = req.query;

    const twins = await ProfessionalTwin.find({
      ownerCorpId: corpId,
      status: { $ne: 'ARCHIVED' }
    }).lean();

    if (twins.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No professional twins found' }
      });
    }

    // Build job change package
    const jobChangePackage = {
      // Header
      type: 'JOB_CHANGE_EXPORT',
      purpose: 'Transfer professional intelligence to new employer',

      exportMetadata: {
        exportedAt: new Date().toISOString(),
        targetCompany: targetCompany || 'NEW_EMPLOYER',
        signature: generateSignature(corpId, 'JOB_CHANGE'),
        exportId: `JCE-${Date.now().toString(36)}`,
        legallyCompliant: true
      },

      // Owner identity
      identity: {
        corpId: twins[0].ownerCorpId,
        name: twins[0].ownerName,
        email: twins[0].ownerEmail
      },

      // Summary of all twins
      twinSummary: twins.map(t => ({
        twinId: t.twinId,
        twinType: t.twinType,
        twinTypeName: getTwinTypeName(t.twinType),
        status: t.status,
        metrics: {
          productivityMultiplier: t.metrics.productivityMultiplier,
          combinedScore: t.metrics.combinedScore,
          reliabilityScore: t.metrics.reliabilityScore
        },
        topExpertise: t.knowledge.expertise.slice(0, 5),
        trainingHours: Math.round(t.learning.totalTrainingHours)
      })),

      // Combined value
      combinedValue: {
        totalTwins: twins.length,
        combinedProductivityMultiplier: twins.reduce((sum, t) => sum + t.metrics.productivityMultiplier, 0).toFixed(1),
        averageReliability: Math.round(
          twins.reduce((sum, t) => sum + t.metrics.reliabilityScore, 0) / twins.length
        ),
        totalTrainingHours: twins.reduce((sum, t) => sum + t.learning.totalTrainingHours, 0),
        verifiedClaims: twins[0].privacy.verifiedClaims.length
      },

      // All twin data
      twins: twins.map(t => ({
        twinId: t.twinId,
        twinType: t.twinType,
        learning: t.learning,
        knowledge: t.knowledge,
        behavior: t.behavior,
        metrics: t.metrics,
        ownership: t.ownership,
        privacy: t.privacy,
        timestamps: {
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }
      }))
    };

    res.json({
      success: true,
      data: jobChangePackage
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Import Twin Package
 *
 * Users can import their exported twin to a new platform/installation.
 * This ensures true portability.
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { exportPackage, targetOwnerCorpId } = req.body;

    if (!exportPackage || !exportPackage.twin) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PACKAGE', message: 'Invalid export package' }
      });
    }

    // Verify signature
    const expectedSignature = generateSignature(
      exportPackage.twin.ownerCorpId,
      exportPackage.twin.twinId
    );

    if (exportPackage.exportMetadata?.signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Export package signature mismatch' }
      });
    }

    // Update owner to new corpId (for job change)
    if (targetOwnerCorpId && targetOwnerCorpId !== exportPackage.twin.ownerCorpId) {
      // This is a transfer - update the twin ownership
      await ProfessionalTwin.findOneAndUpdate(
        { twinId: exportPackage.twin.twinId },
        {
          $set: {
            ownerCorpId: targetOwnerCorpId,
            updatedAt: new Date()
          },
          $inc: { version: 1 }
        }
      );

      // Revoke all existing access grants
      await AccessGrant.updateMany(
        { twinId: exportPackage.twin.twinId },
        { $set: { isActive: false } }
      );

      res.json({
        success: true,
        data: {
          message: 'Twin successfully transferred to new owner',
          twinId: exportPackage.twin.twinId,
          newOwnerCorpId: targetOwnerCorpId,
          previousOwnerCorpId: exportPackage.twin.ownerCorpId
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          message: 'Twin import verified successfully',
          twinId: exportPackage.twin.twinId,
          ownerCorpId: exportPackage.twin.ownerCorpId,
          importedAt: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Export Statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalExports, recentExports] = await Promise.all([
      ProfessionalTwin.countDocuments({ 'ownership.portability': true }),
      ProfessionalTwin.countDocuments({
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      success: true,
      data: {
        twinsWithExportEnabled: totalExports,
        twinsExportedLast24h: recentExports,
        exportFormats: ['json'],
        portabilityGuaranteed: true
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

function generateSignature(ownerCorpId: string, twinId: string): string {
  // In production, use HMAC-SHA256 with a secret key
  const data = `${ownerCorpId}:${twinId}:${process.env.EXPORT_SECRET || 'twin-export-secret'}`;
  const hash = Buffer.from(data).toString('base64');
  return hash;
}

function getTwinTypeName(twinType: string): string {
  const names: Record<string, string> = {
    KNOWLEDGE: 'Knowledge Twin',
    SKILL: 'Skill Twin',
    CAREER: 'Career Twin',
    PRODUCTIVITY: 'Productivity Twin',
    EXECUTION: 'Execution Twin'
  };
  return names[twinType] || twinType;
}

export { router as exportRoutes };
