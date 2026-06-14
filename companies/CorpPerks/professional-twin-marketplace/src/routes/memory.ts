/**
 * Memory Routes - Query and Learn from Memory Services
 *
 * Provides memory integration for twins:
 * - Sync memories from HOJAI/REZ Memory
 * - Query twin's accumulated knowledge
 * - Record learning from memories
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin } from '../index.js';
import {
  syncTwinMemories,
  queryTwinMemories,
  recordMemoryLearning,
  fetchHojaiMemories,
  fetchRezMemories,
  storeHojaiMemory,
  storeRezMemory,
  checkMemoryBridgeHealth
} from '../services/memory-bridge.js';

const router = Router();

// =============================================================================
// SYNC MEMORIES TO TWIN
// =============================================================================

/**
 * Sync all memories from memory services to twin
 */
router.post('/:twinId/sync', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Sync memories
    const result = await syncTwinMemories(twinId);

    res.json({
      success: true,
      data: {
        twinId,
        synced: result.synced,
        memoryCount: result.memories.length,
        lastSync: new Date().toISOString()
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
 * Sync memories for all twins of an owner
 */
router.post('/owner/:corpId/sync-all', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const twins = await ProfessionalTwin.find({
      ownerCorpId: corpId,
      status: { $ne: 'ARCHIVED' }
    });

    const results = [];
    let totalSynced = 0;

    for (const twin of twins) {
      const result = await syncTwinMemories(twin.twinId);
      results.push({
        twinId: twin.twinId,
        twinType: twin.twinType,
        synced: result.synced
      });
      totalSynced += result.synced;
    }

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        twinsProcessed: twins.length,
        totalMemoriesSynced: totalSynced,
        results
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
// QUERY TWIN MEMORIES
// =============================================================================

/**
 * Query twin's memories (hybrid search)
 */
router.get('/:twinId/memories', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { query, limit = 20 } = req.query;

    if (!query) {
      // Return all memories if no query
      const twin = await ProfessionalTwin.findOne({ twinId });
      if (!twin) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Twin not found' }
        });
      }

      // Fetch directly from memory services
      const [hojai, rez] = await Promise.all([
        fetchHojaiMemories(twin.ownerCorpId),
        fetchRezMemories(twin.ownerCorpId)
      ]);

      const memories = [...hojai, ...rez].slice(0, parseInt(limit as string));

      return res.json({
        success: true,
        data: {
          twinId,
          count: memories.length,
          memories
        }
      });
    }

    // Search memories
    const memories = await queryTwinMemories(twinId, query as string);

    res.json({
      success: true,
      data: {
        twinId,
        query: query,
        count: memories.length,
        memories: memories.slice(0, parseInt(limit as string))
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
 * Get memories by type
 */
router.get('/:twinId/memories/:type', async (req: Request, res: Response) => {
  try {
    const { twinId, type } = req.params;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Fetch and filter by type
    const [hojai, rez] = await Promise.all([
      fetchHojaiMemories(twin.ownerCorpId),
      fetchRezMemories(twin.ownerCorpId)
    ]);

    const memories = [...hojai, ...rez].filter(
      m => m.type.toLowerCase() === type.toLowerCase()
    );

    res.json({
      success: true,
      data: {
        twinId,
        type,
        count: memories.length,
        memories
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
// RECORD LEARNING FROM MEMORY
// =============================================================================

/**
 * Record learning from a memory
 */
router.post('/:twinId/learn', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { memoryId, knowledgeGain, skillImprovement, insight } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Fetch the memory
    const memories = await queryTwinMemories(twinId, '');
    const memory = memories.find(m => m.memoryId === memoryId);

    // Record learning
    await recordMemoryLearning(twinId, memory, {
      knowledgeGain,
      skillImprovement,
      insight
    });

    // Update twin metrics
    const update: any = {
      'learning.lastActiveAt': new Date()
    };

    if (knowledgeGain && knowledgeGain.length > 0) {
      update['knowledge.expertise'] = [...new Set([...twin.knowledge.expertise, ...knowledgeGain])];
    }

    if (skillImprovement) {
      update['metrics.knowledgeScore'] = Math.min(100, twin.metrics.knowledgeScore + skillImprovement);
    }

    await ProfessionalTwin.findOneAndUpdate({ twinId }, { $set: update });

    res.json({
      success: true,
      data: {
        twinId,
        learned: {
          knowledgeGain,
          skillImprovement,
          insight
        },
        metrics: update['metrics.knowledgeScore']
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
 * Bulk learn from memories
 */
router.post('/:twinId/learn/bulk', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { learnings } = req.body;

    if (!learnings || !Array.isArray(learnings)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'learnings array required' }
      });
    }

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    const memories = await queryTwinMemories(twinId, '');

    let knowledgeGained: string[] = [];
    let totalImprovement = 0;

    for (const learning of learnings) {
      await recordMemoryLearning(twinId, memories[0], learning);
      if (learning.knowledgeGain) {
        knowledgeGained = [...knowledgeGained, ...learning.knowledgeGain];
      }
      if (learning.skillImprovement) {
        totalImprovement += learning.skillImprovement;
      }
    }

    // Update twin
    await ProfessionalTwin.findOneAndUpdate(
      { twinId },
      {
        $set: {
          'learning.lastActiveAt': new Date(),
          'learning.totalTrainingHours': twin.learning.totalTrainingHours + learnings.length * 0.5,
          'metrics.knowledgeScore': Math.min(100, twin.metrics.knowledgeScore + totalImprovement),
          'knowledge.expertise': [...new Set([...twin.knowledge.expertise, ...knowledgeGained])]
        }
      }
    );

    res.json({
      success: true,
      data: {
        twinId,
        learningsApplied: learnings.length,
        knowledgeGained: knowledgeGained.length,
        skillImprovement: totalImprovement
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
// STORE NEW MEMORY
// =============================================================================

/**
 * Store a new memory for the twin
 */
router.post('/:twinId/memories', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;
    const { content, type, tags, importance } = req.body;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Store in both memory services
    const [hojaiId, rezId] = await Promise.all([
      storeHojaiMemory(twin.ownerCorpId, type || 'event', content, { tags, importance }),
      storeRezMemory(twin.ownerCorpId, content, type || 'event', tags || [])
    ]);

    // Update twin
    await ProfessionalTwin.findOneAndUpdate(
      { twinId },
      {
        $set: { 'learning.lastActiveAt': new Date() },
        $inc: { 'learning.sources.$[elem].dataPoints': 1 },
        $push: {
          'learning.sources': {
            sourceType: 'MANUAL_MEMORY',
            lastSync: new Date(),
            dataPoints: 1
          }
        }
      }
    );

    res.status(201).json({
      success: true,
      data: {
        twinId,
        memoryIds: {
          hojai: hojaiId,
          rez: rezId
        }
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
// MEMORY BRIDGE STATUS
// =============================================================================

/**
 * Check memory bridge health
 */
router.get('/bridge/status', async (_req: Request, res: Response) => {
  try {
    const health = await checkMemoryBridgeHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * Get learning summary for twin
 */
router.get('/:twinId/learning-summary', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;

    const twin = await ProfessionalTwin.findOne({ twinId });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Get memory counts
    const [hojai, rez] = await Promise.all([
      fetchHojaiMemories(twin.ownerCorpId),
      fetchRezMemories(twin.ownerCorpId)
    ]);

    // Calculate learning velocity
    const sources = twin.learning.sources || [];
    const memorySource = sources.find((s: any) =>
      s.sourceType === 'MEMORY_SYNC' || s.sourceType === 'MANUAL_MEMORY'
    );

    res.json({
      success: true,
      data: {
        twinId,
        twinType: twin.twinType,
        ownerCorpId: twin.ownerCorpId,

        learning: {
          totalHours: twin.learning.totalTrainingHours,
          lastActive: twin.learning.lastActiveAt,
          sources: twin.learning.sources.length,
          dataPoints: memorySource?.dataPoints || 0
        },

        memories: {
          total: hojai.length + rez.length,
          hojai: hojai.length,
          rez: rez.length
        },

        metrics: twin.metrics,

        knowledge: {
          domains: twin.knowledge.domains.length,
          expertise: twin.knowledge.expertise.length,
          tools: twin.knowledge.tools.length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

export { router as memoryRoutes };
