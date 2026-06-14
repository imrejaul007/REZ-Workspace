// ============================================================================
// SUTAR Memory Bridge - Analytics Service
// ============================================================================

import { MemoryAnalytics, MemoryAccessStat, EntityStat, MemoryType, MemoryStatus } from '../types/index';
import { memoryService } from './MemoryService';
import { versionService } from './VersionService';
import { shareService } from './ShareService';
import { MemoryFactory } from '../types/memory';

class AnalyticsService {
  private accessLog: Array<{ memoryId: string; entityId: string; timestamp: string }> = [];
  private readonly MAX_LOG_SIZE = 10000;

  /**
   * Track memory access
   */
  trackAccess(memoryId: string, entityId: string): void {
    this.accessLog.push({
      memoryId,
      entityId,
      timestamp: new Date().toISOString(),
    });

    // Keep log size manageable
    if (this.accessLog.length > this.MAX_LOG_SIZE) {
      this.accessLog = this.accessLog.slice(-this.MAX_LOG_SIZE);
    }
  }

  /**
   * Get comprehensive memory analytics
   */
  getAnalytics(entityId?: string): MemoryAnalytics {
    const memories = entityId
      ? Array.from(memoryService.getAll().values()).filter(m => m.entityId === entityId)
      : Array.from(memoryService.getAll().values());

    const analytics: MemoryAnalytics = {
      totalMemories: 0,
      byType: { context: 0, fact: 0, preference: 0, history: 0, session: 0 },
      byStatus: { active: 0, archived: 0, deleted: 0, expired: 0 },
      totalAccessCount: 0,
      avgAccessCount: 0,
      memoriesWithTTL: 0,
      expiredMemories: 0,
      sharedMemories: 0,
      totalVersions: 0,
      topAccessed: [],
      storageSize: 0,
      last24h: [],
      last7d: [],
      byTag: {},
      entityStats: [],
    };

    // Filter for active or non-deleted memories
    const relevantMemories = memories.filter(m => m.status !== 'deleted');
    analytics.totalMemories = relevantMemories.length;

    // Aggregate by type and status
    for (const memory of relevantMemories) {
      analytics.byType[memory.type]++;
      analytics.totalAccessCount += memory.accessCount;
      analytics.storageSize += MemoryFactory.getSize(memory);

      // Check if expired
      if (MemoryFactory.isExpired(memory)) {
        analytics.expiredMemories++;
        analytics.byStatus.expired++;
      } else {
        analytics.byStatus[memory.status]++;
      }

      // Count memories with TTL
      if (memory.ttl) {
        analytics.memoriesWithTTL++;
      }

      // Aggregate by tag
      for (const tag of memory.tags) {
        analytics.byTag[tag] = (analytics.byTag[tag] || 0) + 1;
      }
    }

    // Calculate average access count
    if (relevantMemories.length > 0) {
      analytics.avgAccessCount = analytics.totalAccessCount / relevantMemories.length;
    }

    // Get top accessed memories
    const sortedByAccess = [...relevantMemories]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    analytics.topAccessed = sortedByAccess.map(m => ({
      memoryId: m.id,
      entityId: m.entityId,
      type: m.type,
      accessCount: m.accessCount,
      lastAccessed: m.lastAccessed,
    }));

    // Get recent accesses (last 24 hours)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentAccesses = this.accessLog.filter(a => new Date(a.timestamp) >= oneDayAgo);
    const recentAccessByMemory = new Map<string, MemoryAccessStat>();

    for (const access of recentAccesses) {
      const memory = memoryService.getWithoutAccess(access.memoryId);
      if (memory) {
        const existing = recentAccessByMemory.get(access.memoryId);
        if (existing) {
          existing.accessCount++;
        } else {
          recentAccessByMemory.set(access.memoryId, {
            memoryId: access.memoryId,
            entityId: access.entityId,
            type: memory.type,
            accessCount: 1,
            lastAccessed: access.timestamp,
          });
        }
      }
    }

    analytics.last24h = Array.from(recentAccessByMemory.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Get last 7 days accesses
    const weekAccesses = this.accessLog.filter(a => new Date(a.timestamp) >= sevenDaysAgo);
    const weekAccessByMemory = new Map<string, MemoryAccessStat>();

    for (const access of weekAccesses) {
      const memory = memoryService.getWithoutAccess(access.memoryId);
      if (memory) {
        const existing = weekAccessByMemory.get(access.memoryId);
        if (existing) {
          existing.accessCount++;
        } else {
          weekAccessByMemory.set(access.memoryId, {
            memoryId: access.memoryId,
            entityId: access.entityId,
            type: memory.type,
            accessCount: 1,
            lastAccessed: access.timestamp,
          });
        }
      }
    }

    analytics.last7d = Array.from(weekAccessByMemory.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Get entity statistics
    const entityMap = new Map<string, { memories: number; totalAccess: number; lastActivity: string }>();

    for (const memory of relevantMemories) {
      const entity = entityMap.get(memory.entityId) || { memories: 0, totalAccess: 0, lastActivity: '' };
      entity.memories++;
      entity.totalAccess += memory.accessCount;
      if (!entity.lastActivity || memory.lastAccessed > entity.lastActivity) {
        entity.lastActivity = memory.lastAccessed;
      }
      entityMap.set(memory.entityId, entity);
    }

    analytics.entityStats = Array.from(entityMap.entries())
      .map(([entityId, stats]) => ({
        entityId,
        memoryCount: stats.memories,
        avgAccessCount: stats.memories > 0 ? stats.totalAccess / stats.memories : 0,
        lastActivity: stats.lastActivity,
      }))
      .sort((a, b) => b.memoryCount - a.memoryCount)
      .slice(0, 20);

    // Get version statistics
    analytics.totalVersions = versionService.getTotalVersionCount();

    // Get share statistics
    const shareStats = shareService.getStats();
    analytics.sharedMemories = shareStats.activeShares;

    return analytics;
  }

  /**
   * Get usage trends over time
   */
  getUsageTrends(days: number = 7): { date: string; creations: number; accesses: number }[] {
    const trends: Map<string, { creations: number; accesses: number }> = new Map();
    const now = new Date();

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trends.set(dateStr, { creations: 0, accesses: 0 });
    }

    // Count creations by day
    const memories = Array.from(memoryService.getAll().values());
    for (const memory of memories) {
      const dateStr = memory.createdAt.split('T')[0];
      const existing = trends.get(dateStr);
      if (existing) {
        existing.creations++;
      }
    }

    // Count accesses by day
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    for (const access of this.accessLog) {
      if (new Date(access.timestamp) >= cutoff) {
        const dateStr = access.timestamp.split('T')[0];
        const existing = trends.get(dateStr);
        if (existing) {
          existing.accesses++;
        }
      }
    }

    return Array.from(trends.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get type distribution
   */
  getTypeDistribution(entityId?: string): { type: MemoryType; count: number; percentage: number }[] {
    const memories = entityId
      ? Array.from(memoryService.getAll().values()).filter(m => m.entityId === entityId && m.status !== 'deleted')
      : Array.from(memoryService.getAll().values()).filter(m => m.status !== 'deleted');

    const counts: Record<MemoryType, number> = { context: 0, fact: 0, preference: 0, history: 0, session: 0 };
    for (const memory of memories) {
      counts[memory.type]++;
    }

    const total = memories.length || 1;

    return (Object.keys(counts) as MemoryType[]).map(type => ({
      type,
      count: counts[type],
      percentage: (counts[type] / total) * 100,
    }));
  }

  /**
   * Get access patterns
   */
  getAccessPatterns(entityId?: string): { hour: number; count: number }[] {
    const accessCounts = new Array(24).fill(0);

    const accesses = entityId
      ? this.accessLog.filter(a => a.entityId === entityId)
      : this.accessLog;

    for (const access of accesses) {
      const hour = new Date(access.timestamp).getHours();
      accessCounts[hour]++;
    }

    return accessCounts.map((count, hour) => ({ hour, count }));
  }

  /**
   * Get tag cloud data
   */
  getTagCloud(entityId?: string): { tag: string; count: number; weight: number }[] {
    const memories = entityId
      ? Array.from(memoryService.getAll().values()).filter(m => m.entityId === entityId && m.status !== 'deleted')
      : Array.from(memoryService.getAll().values()).filter(m => m.status !== 'deleted');

    const tagCounts: Record<string, number> = {};
    for (const memory of memories) {
      for (const tag of memory.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const maxCount = Math.max(...Object.values(tagCounts), 1);

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        weight: count / maxCount,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  /**
   * Get storage breakdown
   */
  getStorageBreakdown(entityId?: string): { category: string; size: number; count: number }[] {
    const memories = entityId
      ? Array.from(memoryService.getAll().values()).filter(m => m.entityId === entityId)
      : Array.from(memoryService.getAll().values());

    const breakdown: Record<string, { size: number; count: number }> = {
      content: { size: 0, count: 0 },
      embeddings: { size: 0, count: 0 },
      metadata: { size: 0, count: 0 },
      tags: { size: 0, count: 0 },
    };

    for (const memory of memories) {
      breakdown.content.size += Buffer.byteLength(memory.content, 'utf8');
      breakdown.content.count++;

      if (memory.embedding) {
        breakdown.embeddings.size += memory.embedding.length * 8;
        breakdown.embeddings.count++;
      }

      breakdown.metadata.size += Buffer.byteLength(JSON.stringify(memory.metadata), 'utf8');

      for (const tag of memory.tags) {
        breakdown.tags.size += Buffer.byteLength(tag, 'utf8');
      }
      breakdown.tags.count += memory.tags.length;
    }

    return Object.entries(breakdown).map(([category, stats]) => ({
      category,
      ...stats,
    }));
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): {
    totalMemories: number;
    activeMemories: number;
    deletedMemories: number;
    shareRatio: number;
    versionRatio: number;
    avgAccessCount: number;
    storageUsed: number;
  } {
    const memories = Array.from(memoryService.getAll().values());
    const totalMemories = memories.length;
    const activeMemories = memories.filter(m => m.status === 'active').length;
    const deletedMemories = memories.filter(m => m.status === 'deleted').length;

    const totalAccess = memories.reduce((sum, m) => sum + m.accessCount, 0);
    const totalShares = shareService.getStats().totalShares;
    const totalVersions = versionService.getTotalVersionCount();

    const totalSize = memories.reduce((sum, m) => sum + MemoryFactory.getSize(m), 0);

    return {
      totalMemories,
      activeMemories,
      deletedMemories,
      shareRatio: totalMemories > 0 ? totalShares / totalMemories : 0,
      versionRatio: totalMemories > 0 ? totalVersions / totalMemories : 0,
      avgAccessCount: totalMemories > 0 ? totalAccess / totalMemories : 0,
      storageUsed: totalSize,
    };
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.accessLog = [];
    console.log('[ANALYTICS] Analytics data cleared');
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export { AnalyticsService };