// ============================================================================
// SUTAR Memory Bridge - TTL Manager Service
// ============================================================================

import { Memory, MemoryTTL } from '../types/index';
import { memoryService } from './MemoryService';
import { MemoryFactory } from '../types/memory';

interface TTLConfig {
  checkIntervalMs: number;
  defaultTTLSeconds: number;
  maxTTLSeconds: number;
  minTTLSeconds: number;
  autoCleanup: boolean;
  batchSize: number;
}

interface TTLStats {
  totalWithTTL: number;
  expiredCount: number;
  expiringSoon: number;
  autoRenewed: number;
  lastCleanup: string | null;
  nextCheck: string;
}

class TTLManager {
  private config: TTLConfig = {
    checkIntervalMs: 60000, // 1 minute
    defaultTTLSeconds: 7 * 24 * 60 * 60, // 7 days
    maxTTLSeconds: 365 * 24 * 60 * 60, // 1 year
    minTTLSeconds: 60, // 1 minute
    autoCleanup: true,
    batchSize: 100,
  };

  private intervalId: NodeJS.Timeout | null = null;
  private stats: TTLStats = {
    totalWithTTL: 0,
    expiredCount: 0,
    expiringSoon: 0,
    autoRenewed: 0,
    lastCleanup: null,
    nextCheck: new Date(Date.now() + 60000).toISOString(),
  };

  private cleanupListeners: Array<(expiredIds: string[]) => void> = [];

  /**
   * Start the TTL manager
   */
  start(): void {
    if (this.intervalId) {
      console.log('[TTL] Manager already running');
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkExpiredMemories();
    }, this.config.checkIntervalMs);

    console.log(`[TTL] Manager started with ${this.config.checkIntervalMs}ms check interval`);

    // Run initial check
    this.checkExpiredMemories();
  }

  /**
   * Stop the TTL manager
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[TTL] Manager stopped');
    }
  }

  /**
   * Check and cleanup expired memories
   */
  checkExpiredMemories(): void {
    const expiredIds: string[] = [];
    const now = new Date();

    const memories = Array.from(memoryService.getAll().values());

    for (const memory of memories) {
      if (!memory.expiresAt) continue;

      const expiresAt = new Date(memory.expiresAt);

      // Check if expired
      if (expiresAt < now) {
        expiredIds.push(memory.id);

        // Handle auto-renewal if enabled
        if (memory.ttl?.autoRenew && memory.ttl.renewalCount < memory.ttl.maxRenewals) {
          this.renewMemory(memory);
        } else {
          // Mark as expired
          memory.status = 'expired';
          memory.updatedAt = now.toISOString();
          memoryService.getAll().set(memory.id, memory);
        }
      }
    }

    // Update stats
    this.stats.expiredCount = expiredIds.length;
    this.stats.lastCleanup = now.toISOString();
    this.stats.nextCheck = new Date(now.getTime() + this.config.checkIntervalMs).toISOString();

    // Cleanup expired memories if autoCleanup is enabled
    if (this.config.autoCleanup && expiredIds.length > 0) {
      this.cleanupExpiredMemories(expiredIds);
    }

    // Notify listeners
    if (expiredIds.length > 0) {
      this.notifyCleanupListeners(expiredIds);
    }
  }

  /**
   * Cleanup expired memories (hard delete)
   */
  cleanupExpiredMemories(expiredIds?: string[]): { success: boolean; cleaned: number } {
    const idsToClean = expiredIds || this.getExpiredMemoryIds();
    let cleaned = 0;

    for (const id of idsToClean) {
      const memory = memoryService.getWithoutAccess(id);
      if (memory && memory.status === 'expired') {
        memoryService.hardDelete(id);
        cleaned++;
      }
    }

    console.log(`[TTL] Cleaned up ${cleaned} expired memories`);

    return { success: true, cleaned };
  }

  /**
   * Get all expired memory IDs
   */
  getExpiredMemoryIds(): string[] {
    const now = new Date();
    const expiredIds: string[] = [];

    const memories = Array.from(memoryService.getAll().values());

    for (const memory of memories) {
      if (memory.expiresAt && new Date(memory.expiresAt) < now) {
        expiredIds.push(memory.id);
      }
    }

    return expiredIds;
  }

  /**
   * Get memories expiring soon
   */
  getExpiringSoon(secondsAhead: number = 3600): { memoryId: string; expiresAt: string; secondsRemaining: number }[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + secondsAhead * 1000);
    const expiring: { memoryId: string; expiresAt: string; secondsRemaining: number }[] = [];

    const memories = Array.from(memoryService.getAll().values());

    for (const memory of memories) {
      if (memory.expiresAt && memory.status === 'active') {
        const expiresAt = new Date(memory.expiresAt);
        if (expiresAt > now && expiresAt <= cutoff) {
          expiring.push({
            memoryId: memory.id,
            expiresAt: memory.expiresAt,
            secondsRemaining: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
          });
        }
      }
    }

    return expiring.sort((a, b) => a.secondsRemaining - b.secondsRemaining);
  }

  /**
   * Renew a memory's TTL
   */
  renewMemory(memory: Memory): boolean {
    if (!memory.ttl) return false;

    const ttl = memory.ttl;
    ttl.renewalCount++;
    ttl.expiresAt = new Date(Date.now() + ttl.ttlSeconds * 1000).toISOString();

    memory.expiresAt = ttl.expiresAt;
    memory.updatedAt = new Date().toISOString();

    memoryService.getAll().set(memory.id, memory);

    this.stats.autoRenewed++;

    console.log(`[TTL] Renewed memory ${memory.id} (renewal ${ttl.renewalCount}/${ttl.maxRenewals})`);

    return true;
  }

  /**
   * Set TTL for a memory
   */
  setTTL(memoryId: string, ttlSeconds: number, options: { autoRenew?: boolean; maxRenewals?: number } = {}): { success: boolean; error?: string } {
    // Validate TTL
    if (ttlSeconds < this.config.minTTLSeconds) {
      return { success: false, error: `TTL must be at least ${this.config.minTTLSeconds} seconds` };
    }

    if (ttlSeconds > this.config.maxTTLSeconds) {
      return { success: false, error: `TTL cannot exceed ${this.config.maxTTLSeconds} seconds` };
    }

    const result = memoryService.setTTL(
      memoryId,
      ttlSeconds,
      options.autoRenew || false,
      options.maxRenewals || 0
    );

    if (result.success) {
      this.stats.totalWithTTL++;
    }

    return result;
  }

  /**
   * Remove TTL from a memory
   */
  removeTTL(memoryId: string): { success: boolean } {
    const result = memoryService.removeTTL(memoryId);

    if (result.success) {
      this.stats.totalWithTTL = Math.max(0, this.stats.totalWithTTL - 1);
    }

    return result;
  }

  /**
   * Extend TTL for a memory
   */
  extendTTL(memoryId: string, additionalSeconds: number): { success: boolean; newExpiresAt?: string; error?: string } {
    const memory = memoryService.getWithoutAccess(memoryId);
    if (!memory) {
      return { success: false, error: 'Memory not found' };
    }

    if (!memory.ttl) {
      return { success: false, error: 'Memory does not have a TTL' };
    }

    const currentTTL = memory.ttl.ttlSeconds;
    const newTTL = currentTTL + additionalSeconds;

    if (newTTL > this.config.maxTTLSeconds) {
      return { success: false, error: `Extended TTL would exceed maximum of ${this.config.maxTTLSeconds} seconds` };
    }

    const result = memoryService.setTTL(memoryId, newTTL, memory.ttl.autoRenew, memory.ttl.maxRenewals);

    if (result.success && result.memory) {
      return { success: true, newExpiresAt: result.memory.expiresAt || undefined };
    }

    return { success: false, error: result.errors?.join(', ') };
  }

  /**
   * Update TTL manager configuration
   */
  updateConfig(config: Partial<TTLConfig>): void {
    const oldInterval = this.config.checkIntervalMs;

    this.config = { ...this.config, ...config };

    // Restart interval if check interval changed
    if (config.checkIntervalMs && config.checkIntervalMs !== oldInterval) {
      this.stop();
      this.start();
    }

    console.log('[TTL] Configuration updated:', this.config);
  }

  /**
   * Get TTL manager statistics
   */
  getStats(): TTLStats {
    // Recalculate dynamic stats
    const memories = Array.from(memoryService.getAll().values());
    this.stats.totalWithTTL = memories.filter(m => m.ttl !== undefined).length;

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 3600 * 1000);

    this.stats.expiringSoon = memories.filter(m => {
      if (!m.expiresAt || m.status !== 'active') return false;
      const expiresAt = new Date(m.expiresAt);
      return expiresAt > now && expiresAt <= oneHourFromNow;
    }).length;

    return { ...this.stats };
  }

  /**
   * Get TTL manager configuration
   */
  getConfig(): TTLConfig {
    return { ...this.config };
  }

  /**
   * Add a cleanup listener
   */
  onCleanup(listener: (expiredIds: string[]) => void): void {
    this.cleanupListeners.push(listener);
  }

  /**
   * Remove a cleanup listener
   */
  removeCleanupListener(listener: (expiredIds: string[]) => void): void {
    const index = this.cleanupListeners.indexOf(listener);
    if (index > -1) {
      this.cleanupListeners.splice(index, 1);
    }
  }

  /**
   * Notify all cleanup listeners
   */
  private notifyCleanupListeners(expiredIds: string[]): void {
    for (const listener of this.cleanupListeners) {
      try {
        listener(expiredIds);
      } catch (error) {
        console.error('[TTL] Cleanup listener error:', error);
      }
    }
  }

  /**
   * Get memory IDs with TTL (for debugging)
   */
  getMemoryIdsWithTTL(): string[] {
    const memories = Array.from(memoryService.getAll().values());
    return memories.filter(m => m.ttl !== undefined).map(m => m.id);
  }

  /**
   * Check if a specific memory is expired
   */
  isExpired(memoryId: string): boolean {
    const memory = memoryService.getWithoutAccess(memoryId);
    if (!memory || !memory.expiresAt) return false;
    return new Date(memory.expiresAt) < new Date();
  }

  /**
   * Get time remaining for a memory
   */
  getTimeRemaining(memoryId: string): number | null {
    const memory = memoryService.getWithoutAccess(memoryId);
    if (!memory || !memory.expiresAt) return null;

    const expiresAt = new Date(memory.expiresAt);
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();

    return remaining > 0 ? Math.floor(remaining / 1000) : null;
  }
}

// Export singleton instance
export const ttlManager = new TTLManager();
export { TTLManager, TTLConfig, TTLStats };
