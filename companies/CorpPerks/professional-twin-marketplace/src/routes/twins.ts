/**
 * Professional Twin Routes
 *
 * CRUD operations for Professional Twins
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin } from '../index.js';

const router = Router();

// =============================================================================
// TWIN TYPES
// =============================================================================

export const TWIN_TYPES = {
  KNOWLEDGE: {
    name: 'Knowledge Twin',
    description: 'Knows everything you know',
    learnFrom: ['SkillNet', 'Work', 'Memory'],
    purpose: 'What you know'
  },
  SKILL: {
    name: 'Skill Twin',
    description: 'Can do everything you can do',
    learnFrom: ['SkillNet', 'Feedback', 'Projects'],
    purpose: 'What you can do'
  },
  CAREER: {
    name: 'Career Twin',
    description: 'Tracks where you\'re going',
    learnFrom: ['Work', 'Goals', 'Feedback'],
    purpose: 'Where you\'re going'
  },
  PRODUCTIVITY: {
    name: 'Productivity Twin',
    description: 'Optimizes how you work',
    learnFrom: ['Work patterns', 'Calendar'],
    purpose: 'How you work'
  },
  EXECUTION: {
    name: 'Execution Twin',
    description: 'Delegates tasks to AI',
    learnFrom: ['Projects', 'Performance'],
    purpose: 'What you delegate'
  }
};

// =============================================================================
// CREATE TWIN
// =============================================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      ownerCorpId,
      ownerName,
      ownerEmail,
      twinType,
      initialKnowledge,
      initialSkills
    } = req.body;

    // Validate twin type
    if (!Object.keys(TWIN_TYPES).includes(twinType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TWIN_TYPE',
          message: `Twin type must be one of: ${Object.keys(TWIN_TYPES).join(', ')}`
        }
      });
    }

    // Check if twin already exists for this owner and type
    const existing = await ProfessionalTwin.findOne({
      ownerCorpId,
      twinType
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: `${twinType} twin already exists for this owner`
        }
      });
    }

    // Create twin
    const twin = new ProfessionalTwin({
      twinId: `TWIN-${ownerCorpId}-${twinType}`,
      ownerCorpId,
      ownerName,
      ownerEmail,
      twinType,
      ownership: {
        ownedBy: 'EMPLOYEE',
        transferRights: true,
        portability: true
      },
      learning: {
        sources: [],
        totalTrainingHours: 0,
        lastActiveAt: new Date()
      },
      knowledge: {
        domains: initialKnowledge?.domains || [],
        expertise: initialKnowledge?.expertise || initialSkills || [],
        methodologies: initialKnowledge?.methodologies || [],
        tools: initialKnowledge?.tools || [],
        languages: initialKnowledge?.languages || ['English']
      },
      behavior: {
        workStyle: 'adaptive',
        communicationStyle: 'professional',
        decisionPattern: 'balanced',
        learningStyle: 'continuous',
        strengths: [],
        growthAreas: []
      },
      metrics: {
        productivityMultiplier: 1.0,
        knowledgeScore: 50,
        executionScore: 0,
        reliabilityScore: 90,
        combinedScore: 80
      },
      privacy: {
        shareWithCurrentEmployer: true,
        shareWithFutureEmployer: true,
        showInResume: true,
        verifiedClaims: []
      },
      status: 'TRAINING'
    });

    await twin.save();

    res.status(201).json({
      success: true,
      data: twin
    });
  } catch (error: any) {
    logger.error('Error creating twin:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// CREATE ALL 5 TWINS FOR AN EMPLOYEE
// =============================================================================

router.post('/create-set', async (req: Request, res: Response) => {
  try {
    const {
      ownerCorpId,
      ownerName,
      ownerEmail,
      role,
      skills,
      department
    } = req.body;

    // Create all 5 twins
    const twins = [];
    const twinTypes = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

    for (const twinType of twinTypes) {
      // Check if already exists
      const existing = await ProfessionalTwin.findOne({
        ownerCorpId,
        twinType
      });

      if (existing) {
        twins.push(existing);
        continue;
      }

      const twin = new ProfessionalTwin({
        twinId: `TWIN-${ownerCorpId}-${twinType}`,
        ownerCorpId,
        ownerName,
        ownerEmail,
        twinType,
        ownership: {
          ownedBy: 'EMPLOYEE',
          transferRights: true,
          portability: true
        },
        learning: {
          sources: [{ sourceType: 'INITIAL', lastSync: new Date(), dataPoints: 0 }],
          totalTrainingHours: 0,
          lastActiveAt: new Date()
        },
        knowledge: {
          domains: [department || 'General'],
          expertise: twinType === 'SKILL' ? skills || [] : [],
          methodologies: [],
          tools: twinType === 'SKILL' ? skills || [] : [],
          languages: ['English']
        },
        behavior: {
          workStyle: 'adaptive',
          communicationStyle: 'professional',
          decisionPattern: 'balanced',
          learningStyle: 'continuous',
          strengths: [],
          growthAreas: []
        },
        metrics: {
          productivityMultiplier: twinType === 'EXECUTION' ? 3.0 : 1.0,
          knowledgeScore: twinType === 'KNOWLEDGE' ? 50 : 0,
          executionScore: twinType === 'EXECUTION' ? 50 : 0,
          reliabilityScore: 90,
          combinedScore: 60
        },
        privacy: {
          shareWithCurrentEmployer: true,
          shareWithFutureEmployer: true,
          showInResume: twinType !== 'PRODUCTIVITY',
          verifiedClaims: []
        },
        status: 'TRAINING'
      });

      await twin.save();
      twins.push(twin);
    }

    res.status(201).json({
      success: true,
      data: {
        ownerCorpId,
        ownerName,
        twinsCreated: twins.length,
        twins: twins.map(t => ({
          twinId: t.twinId,
          twinType: t.twinType,
          status: t.status
        }))
      }
    });
  } catch (error: any) {
    logger.error('Error creating twin set:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET TWIN
// =============================================================================

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    res.json({
      success: true,
      data: twin
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET ALL TWINS FOR OWNER
// =============================================================================

router.get('/owner/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const twins = await ProfessionalTwin.find({
      ownerCorpId: corpId,
      status: { $ne: 'ARCHIVED' }
    }).sort({ twinType: 1 });

    // Calculate combined productivity
    const combinedProductivity = twins.reduce((sum, t) => sum + t.metrics.productivityMultiplier, 0);

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        twinCount: twins.length,
        combinedProductivity: combinedProductivity.toFixed(1),
        twins: twins.map(t => ({
          twinId: t.twinId,
          twinType: t.twinType,
          twinTypeName: TWIN_TYPES[t.twinType as keyof typeof TWIN_TYPES]?.name,
          status: t.status,
          metrics: t.metrics
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

// =============================================================================
// UPDATE TWIN
// =============================================================================

router.patch('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const updates = req.body;

    // Prevent updating ownership
    delete updates.twinId;
    delete updates.ownerCorpId;
    delete updates.ownership;

    const twin = await ProfessionalTwin.findOneAndUpdate(
      { twinId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    res.json({
      success: true,
      data: twin
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// UPDATE TWIN METRICS (from SkillNet or other learning sources)
// =============================================================================

router.patch('/:twinId/learn', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { source, dataPoints, metrics, knowledge } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Update learning sources
    const existingSource = twin.learning.sources.find(
      (s: any) => s.sourceType === source
    );

    if (existingSource) {
      existingSource.lastSync = new Date();
      existingSource.dataPoints += dataPoints || 0;
    } else {
      twin.learning.sources.push({
        sourceType: source,
        lastSync: new Date(),
        dataPoints: dataPoints || 0
      });
    }

    twin.learning.totalTrainingHours += (dataPoints || 0) * 0.1; // Rough estimate
    twin.learning.lastActiveAt = new Date();

    // Update metrics if provided
    if (metrics) {
      if (metrics.knowledgeScore) twin.metrics.knowledgeScore = metrics.knowledgeScore;
      if (metrics.executionScore) twin.metrics.executionScore = metrics.executionScore;
      if (metrics.reliabilityScore) twin.metrics.reliabilityScore = metrics.reliabilityScore;
      if (metrics.productivityMultiplier) {
        twin.metrics.productivityMultiplier = metrics.productivityMultiplier;
      }
    }

    // Calculate combined score
    twin.metrics.combinedScore = Math.round(
      (twin.metrics.knowledgeScore + twin.metrics.executionScore + twin.metrics.reliabilityScore) / 3
    );

    // Update knowledge if provided
    if (knowledge) {
      if (knowledge.domains) twin.knowledge.domains = [...new Set([...twin.knowledge.domains, ...knowledge.domains])];
      if (knowledge.expertise) twin.knowledge.expertise = [...new Set([...twin.knowledge.expertise, ...knowledge.expertise])];
      if (knowledge.tools) twin.knowledge.tools = [...new Set([...twin.knowledge.tools, ...knowledge.tools])];
    }

    // Update status if ready
    if (twin.learning.totalTrainingHours >= 100 && twin.status === 'TRAINING') {
      twin.status = 'ACTIVE';
    }

    await twin.save();

    res.json({
      success: true,
      data: {
        twinId: twin.twinId,
        learning: twin.learning,
        metrics: twin.metrics,
        status: twin.status
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
// ARCHIVE TWIN
// =============================================================================

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;

    const twin = await ProfessionalTwin.findOneAndUpdate(
      { twinId },
      {
        $set: {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    res.json({
      success: true,
      data: { message: 'Twin archived successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// LIST TWIN TYPES
// =============================================================================

router.get('/meta/types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: TWIN_TYPES
  });
});

export { router as twinRoutes };
