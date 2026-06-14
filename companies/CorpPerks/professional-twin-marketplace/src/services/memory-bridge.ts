/**
 * Memory Bridge - HOJAI Memory & REZ Memory Cloud Integration
 *
 * Connects Professional Twins to memory services:
 * - HOJAI Memory (4520) - Context, preferences, timeline
 * - REZ Memory Cloud (4210) - User profiles, facts, behavioral patterns
 *
 * This enables twins to:
 * - Learn from accumulated memory
 * - Query past experiences
 * - Build knowledge graphs
 */

import fetch from 'node-fetch';
import { ProfessionalTwin } from '../index.js';

// =============================================================================
// CONFIG
// =============================================================================

const HOJAI_MEMORY_URL = process.env.HOJAI_MEMORY_URL || 'http://localhost:4520';
const REZ_MEMORY_URL = process.env.REZ_MEMORY_URL || 'http://localhost:4210';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'corpid-internal-token';

// =============================================================================
// TYPES
// =============================================================================

interface MemoryEvent {
  memoryId: string;
  type: 'conversation' | 'fact' | 'preference' | 'event' | 'decision' | 'idea';
  content: string;
  summary?: string;
  tags: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
  recallCount: number;
}

interface TwinMemory {
  twinId: string;
  memories: MemoryEvent[];
  lastSyncAt: Date;
}

// =============================================================================
// HOJAI MEMORY INTEGRATION
// =============================================================================

/**
 * Fetch memories from HOJAI Memory for a CorpID
 */
export async function fetchHojaiMemories(corpId: string): Promise<MemoryEvent[]> {
  try {
    const response = await fetch(`${HOJAI_MEMORY_URL}/api/memory/individual/${corpId}`, {
      method: 'GET',
      headers: {
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) {
      logger.info(`⚠️  HOJAI Memory returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const memories = Array.isArray(data) ? data : data.data || [];

    return memories.map((m: any) => ({
      memoryId: m.id || m.memoryId,
      type: m.type?.toLowerCase() || 'event',
      content: m.content || m.value || '',
      summary: m.summary,
      tags: m.tags || [],
      importance: m.importance || 'medium',
      createdAt: new Date(m.createdAt || m.timestamp),
      recallCount: m.usage_count || m.recallCount || 0
    }));
  } catch (error) {
    logger.info(`⚠️  HOJAI Memory connection failed:`, (error as Error).message);
    return [];
  }
}

/**
 * Fetch timeline events from HOJAI Memory
 */
export async function fetchHojaiTimeline(corpId: string): Promise<any[]> {
  try {
    const response = await fetch(`${HOJAI_MEMORY_URL}/api/timeline/${corpId}`, {
      method: 'GET',
      headers: {
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    logger.info(`⚠️  HOJAI Timeline connection failed`);
    return [];
  }
}

/**
 * Fetch context from HOJAI Memory
 */
export async function fetchHojaiContext(corpId: string): Promise<any | null> {
  try {
    const response = await fetch(`${HOJAI_MEMORY_URL}/api/context/${corpId}/summary`, {
      method: 'GET',
      headers: {
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    logger.info(`⚠️  HOJAI Context connection failed`);
    return null;
  }
}

/**
 * Store memory event in HOJAI Memory
 */
export async function storeHojaiMemory(
  corpId: string,
  type: string,
  content: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const response = await fetch(`${HOJAI_MEMORY_URL}/api/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        scope_type: 'individual',
        scope_id: corpId,
        type,
        key: `twin_${type}_${Date.now()}`,
        value: content,
        source: 'professional_twin',
        confidence: 0.8,
        importance: metadata?.importance || 0.5,
        tags: metadata?.tags || ['twin', 'learning'],
        metadata
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.id || data.data?.id || null;
  } catch (error) {
    logger.info(`⚠️  Failed to store memory in HOJAI`);
    return null;
  }
}

// =============================================================================
// REZ MEMORY CLOUD INTEGRATION
// =============================================================================

/**
 * Fetch memories from REZ Memory Cloud
 */
export async function fetchRezMemories(userId: string): Promise<MemoryEvent[]> {
  try {
    const response = await fetch(`${REZ_MEMORY_URL}/api/memory?userId=${userId}`, {
      method: 'GET',
      headers: {
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const memories = Array.isArray(data.data) ? data.data : [];

    return memories.map((m: any) => ({
      memoryId: m.memoryId,
      type: m.category?.toLowerCase() || 'event',
      content: m.content,
      summary: m.summary,
      tags: m.tags || [],
      importance: m.importance?.toLowerCase() || 'medium',
      createdAt: new Date(m.createdAt || Date.now()),
      recallCount: m.recallCount || 0
    }));
  } catch (error) {
    logger.info(`⚠️  REZ Memory Cloud connection failed`);
    return [];
  }
}

/**
 * Fetch user profile from REZ Memory Cloud
 */
export async function fetchRezProfile(userId: string): Promise<any | null> {
  try {
    const response = await fetch(`${REZ_MEMORY_URL}/api/profile/${userId}`, {
      method: 'GET',
      headers: {
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    logger.info(`⚠️  REZ Profile fetch failed`);
    return null;
  }
}

/**
 * Recall memories from REZ Memory Cloud (hybrid search)
 */
export async function recallRezMemories(
  userId: string,
  query: string
): Promise<MemoryEvent[]> {
  try {
    const response = await fetch(`${REZ_MEMORY_URL}/api/memory/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        userId,
        query,
        limit: 10
      })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const memories = data.data?.results || [];

    return memories.map((m: any) => ({
      memoryId: m.memoryId || m.id,
      type: m.category?.toLowerCase() || 'event',
      content: m.content,
      summary: m.summary,
      tags: m.tags || [],
      importance: m.importance?.toLowerCase() || 'medium',
      createdAt: new Date(m.createdAt || Date.now()),
      recallCount: m.recallCount || 0
    }));
  } catch (error) {
    logger.info(`⚠️  REZ Memory recall failed`);
    return [];
  }
}

/**
 * Store memory in REZ Memory Cloud
 */
export async function storeRezMemory(
  userId: string,
  content: string,
  category: string = 'event',
  tags: string[] = []
): Promise<string | null> {
  try {
    const response = await fetch(`${REZ_MEMORY_URL}/api/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        userId,
        content,
        category,
        tags: [...tags, 'twin', 'professional']
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.memoryId || null;
  } catch (error) {
    logger.info(`⚠️  Failed to store memory in REZ`);
    return null;
  }
}

// =============================================================================
// TWIN MEMORY SYNC
// =============================================================================

/**
 * Sync memories from both memory services to a twin
 */
export async function syncTwinMemories(twinId: string): Promise<{
  synced: number;
  memories: MemoryEvent[];
}> {
  // Extract corpId from twinId (format: TWIN-CI-IND-XXXXX-TWINTYPE)
  const parts = twinId.split('-');
  if (parts.length < 3) {
    return { synced: 0, memories: [] };
  }
  const corpId = parts.slice(0, 3).join('-');

  // Fetch from both sources
  const [hojaiMemories, rezMemories] = await Promise.all([
    fetchHojaiMemories(corpId),
    fetchRezMemories(corpId)
  ]);

  // Deduplicate by content
  const seen = new Set<string>();
  const allMemories: MemoryEvent[] = [];

  for (const memory of [...hojaiMemories, ...rezMemories]) {
    const key = memory.content.substring(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      allMemories.push(memory);
    }
  }

  // Update twin's learning source
  await ProfessionalTwin.findOneAndUpdate(
    { twinId },
    {
      $set: {
        'learning.lastActiveAt': new Date()
      },
      $push: {
        'learning.sources': {
          sourceType: 'MEMORY_SYNC',
          lastSync: new Date(),
          dataPoints: allMemories.length
        }
      }
    }
  );

  return {
    synced: allMemories.length,
    memories: allMemories
  };
}

/**
 * Query twin's memories
 */
export async function queryTwinMemories(
  twinId: string,
  query: string
): Promise<MemoryEvent[]> {
  // Extract corpId from twinId
  const parts = twinId.split('-');
  if (parts.length < 3) {
    return [];
  }
  const corpId = parts.slice(0, 3).join('-');

  // Try REZ Memory Cloud recall
  const memories = await recallRezMemories(corpId, query);

  // Also try HOJAI Memory search
  try {
    const response = await fetch(
      `${HOJAI_MEMORY_URL}/api/memory/individual/${corpId}/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': INTERNAL_TOKEN
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const searchResults = Array.isArray(data) ? data : data.data || [];

      for (const m of searchResults) {
        memories.push({
          memoryId: m.id,
          type: m.type?.toLowerCase() || 'event',
          content: m.content || m.value || '',
          summary: m.summary,
          tags: m.tags || [],
          importance: m.importance || 'medium',
          createdAt: new Date(m.createdAt),
          recallCount: m.usage_count || 0
        });
      }
    }
  } catch {
    // Ignore HOJAI search errors
  }

  return memories;
}

/**
 * Record learning from memory in twin
 */
export async function recordMemoryLearning(
  twinId: string,
  memory: MemoryEvent,
  learning: {
    knowledgeGain?: string[];
    skillImprovement?: number;
    insight?: string;
  }
): Promise<void> {
  const update: any = {
    'learning.lastActiveAt': new Date()
  };

  // Update knowledge if applicable
  if (learning.knowledgeGain && learning.knowledgeGain.length > 0) {
    update['knowledge.expertise'] = {
      $each: learning.knowledgeGain
    };
  }

  // Update metrics if applicable
  if (learning.skillImprovement) {
    const twin = await ProfessionalTwin.findOne({ twinId });
    if (twin) {
      update['metrics.knowledgeScore'] = Math.min(
        100,
        twin.metrics.knowledgeScore + learning.skillImprovement
      );
    }
  }

  await ProfessionalTwin.findOneAndUpdate(
    { twinId },
    {
      $set: update,
      $inc: {
        'learning.sources.$[elem].dataPoints': 1
      }
    },
    {
      arrayFilters: [{ 'elem.sourceType': 'MEMORY_SYNC' }]
    }
  );
}

// =============================================================================
// MEMORY BRIDGE HEALTH CHECK
// =============================================================================

export async function checkMemoryBridgeHealth(): Promise<{
  hojaiMemory: 'connected' | 'disconnected';
  rezMemory: 'connected' | 'disconnected';
}> {
  const [hojaiOk, rezOk] = await Promise.all([
    fetch(`${HOJAI_MEMORY_URL}/health`).then(r => r.ok).catch(() => false),
    fetch(`${REZ_MEMORY_URL}/health`).then(r => r.ok).catch(() => false)
  ]);

  return {
    hojaiMemory: hojaiOk ? 'connected' : 'disconnected',
    rezMemory: rezOk ? 'connected' : 'disconnected'
  };
}
