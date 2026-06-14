// ============================================================================
// SUTAR Memory Bridge - Memory Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  Memory,
  MemoryType,
  MemoryStatus,
  MemoryTTL,
  CreateMemoryOptions,
  UpdateMemoryOptions,
  MemoryFilter,
  MemorySort,
  MemoryStats,
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT,
} from '../types/index';
import { MemoryFactory, MemoryValidator } from '../types/memory';
import { vectorService } from './VectorService';
import { semanticSearchService } from './SemanticSearchService';

class MemoryService {
  private memories: Map<string, Memory> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Create a new memory
   */
  async create(options: CreateMemoryOptions): Promise<{ success: boolean; memory?: Memory; errors?: string[] }> {
    const validation = MemoryValidator.validateCreate(options);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const memory = MemoryFactory.create(options);

    // Generate embedding if requested
    if (options.embedding) {
      memory.embedding = options.embedding;
    }

    // Store memory
    this.memories.set(memory.id, memory);
    this.indexMemory(memory);

    // Store embedding vector
    if (memory.embedding) {
      vectorService.storeEmbedding(memory.id, memory.embedding);
    }

    // Index for semantic search
    semanticSearchService.indexMemory(memory);

    console.log(`[MEMORY] Created: ${memory.id} (${memory.type}) for entity: ${memory.entityId}`);

    return { success: true, memory };
  }

  /**
   * Get a memory by ID
   */
  get(id: string): Memory | null {
    const memory = this.memories.get(id);
    if (!memory) return null;

    // Check if expired
    if (MemoryFactory.isExpired(memory)) {
      memory.status = 'expired';
      this.memories.set(id, memory);
    }

    // Update access tracking
    memory.accessCount++;
    memory.lastAccessed = new Date().toISOString();
    this.memories.set(id, memory);

    return memory;
  }

  /**
   * Get memory without updating access count
   */
  getWithoutAccess(id: string): Memory | null {
    return this.memories.get(id) || null;
  }

  /**
   * Update a memory
   */
  update(id: string, options: UpdateMemoryOptions): { success: boolean; memory?: Memory; errors?: string[] } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false, errors: ['Memory not found'] };
    }

    const validation = MemoryValidator.validateUpdate(options);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const updatedMemory = MemoryFactory.update(memory, options);
    this.memories.set(id, updatedMemory);
    this.indexMemory(updatedMemory);

    // Update embedding if changed
    if (options.embedding) {
      vectorService.storeEmbedding(id, options.embedding);
    }

    // Update semantic search index
    semanticSearchService.updateIndex(updatedMemory);

    console.log(`[MEMORY] Updated: ${id} (version: ${updatedMemory.version})`);

    return { success: true, memory: updatedMemory };
  }

  /**
   * Delete a memory (soft delete)
   */
  delete(id: string): { success: boolean; deletedId?: string } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false };
    }

    memory.status = 'deleted';
    memory.updatedAt = new Date().toISOString();
    this.memories.set(id, memory);

    // Remove from indexes
    this.removeFromIndexes(id);

    console.log(`[MEMORY] Deleted: ${id}`);

    return { success: true, deletedId: id };
  }

  /**
   * Hard delete a memory
   */
  hardDelete(id: string): boolean {
    if (!this.memories.has(id)) {
      return false;
    }

    this.removeFromIndexes(id);
    this.memories.delete(id);
    vectorService.deleteEmbedding(id);
    semanticSearchService.removeFromIndex(id);

    console.log(`[MEMORY] Hard deleted: ${id}`);

    return true;
  }

  /**
   * Find memories matching filter criteria
   */
  find(filter: MemoryFilter = {}, sort?: MemorySort, limit: number = DEFAULT_SEARCH_LIMIT, offset: number = 0): Memory[] {
    const validation = MemoryValidator.validateFilter(filter);
    if (!validation.valid) {
      console.warn('[MEMORY] Invalid filter:', validation.errors);
    }

    let results = Array.from(this.memories.values());

    // Apply filters
    if (filter.entityId) {
      results = results.filter(m => m.entityId === filter.entityId);
    }

    if (filter.type) {
      results = results.filter(m => m.type === filter.type);
    }

    if (filter.types && filter.types.length > 0) {
      results = results.filter(m => filter.types!.includes(m.type));
    }

    if (filter.status) {
      results = results.filter(m => m.status === filter.status);
    }

    if (filter.statuses && filter.statuses.length > 0) {
      results = results.filter(m => filter.statuses!.includes(m.status));
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(m => filter.tags!.some(t => m.tags.includes(t)));
    }

    if (filter.excludeTags && filter.excludeTags.length > 0) {
      results = results.filter(m => !filter.excludeTags!.some(t => m.tags.includes(t)));
    }

    if (filter.createdAfter) {
      results = results.filter(m => new Date(m.createdAt) >= new Date(filter.createdAfter!));
    }

    if (filter.createdBefore) {
      results = results.filter(m => new Date(m.createdAt) <= new Date(filter.createdBefore!));
    }

    if (filter.accessedAfter) {
      results = results.filter(m => new Date(m.lastAccessed) >= new Date(filter.accessedAfter!));
    }

    if (filter.accessedBefore) {
      results = results.filter(m => new Date(m.lastAccessed) <= new Date(filter.accessedBefore!));
    }

    if (filter.minAccessCount !== undefined) {
      results = results.filter(m => m.accessCount >= filter.minAccessCount!);
    }

    if (filter.maxAccessCount !== undefined) {
      results = results.filter(m => m.accessCount <= filter.maxAccessCount!);
    }

    if (filter.hasEmbedding !== undefined) {
      results = results.filter(m => (m.embedding && m.embedding.length > 0) === filter.hasEmbedding);
    }

    if (filter.hasTTL !== undefined) {
      results = results.filter(m => (m.ttl !== undefined) === filter.hasTTL);
    }

    if (filter.expired !== undefined) {
      results = results.filter(m => MemoryFactory.isExpired(m) === filter.expired);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(m => m.content.toLowerCase().includes(query));
    }

    // Apply sorting
    if (sort) {
      results.sort((a, b) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.order === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.order === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    } else {
      // Default sort by createdAt descending
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    return results.slice(offset, offset + Math.min(limit, MAX_SEARCH_LIMIT));
  }

  /**
   * Get memories for an entity
   */
  getByEntity(entityId: string, limit: number = DEFAULT_SEARCH_LIMIT, offset: number = 0): Memory[] {
    return this.find({ entityId, status: 'active' }, undefined, limit, offset);
  }

  /**
   * Get memories by type
   */
  getByType(type: MemoryType, limit: number = DEFAULT_SEARCH_LIMIT, offset: number = 0): Memory[] {
    return this.find({ type, status: 'active' }, undefined, limit, offset);
  }

  /**
   * Get memories by tag
   */
  getByTag(tag: string, limit: number = DEFAULT_SEARCH_LIMIT, offset: number = 0): Memory[] {
    return this.find({ tags: [tag], status: 'active' }, undefined, limit, offset);
  }

  /**
   * Get total count of memories
   */
  count(filter: MemoryFilter = {}): number {
    return this.find(filter, undefined, Number.MAX_SAFE_INTEGER, 0).length;
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const memories = Array.from(this.memories.values());

    const stats: MemoryStats = {
      totalCount: memories.length,
      activeCount: 0,
      archivedCount: 0,
      deletedCount: 0,
      expiredCount: 0,
      byType: { context: 0, fact: 0, preference: 0, history: 0, session: 0 },
      byEntity: {},
      avgAccessCount: 0,
      medianAccessCount: 0,
      maxAccessCount: 0,
      totalSize: 0,
    };

    const accessCounts: number[] = [];

    for (const memory of memories) {
      // Count by status
      switch (memory.status) {
        case 'active':
          stats.activeCount++;
          break;
        case 'archived':
          stats.archivedCount++;
          break;
        case 'deleted':
          stats.deletedCount++;
          break;
        case 'expired':
          stats.expiredCount++;
          break;
      }

      // Count by type
      stats.byType[memory.type]++;

      // Count by entity
      stats.byEntity[memory.entityId] = (stats.byEntity[memory.entityId] || 0) + 1;

      // Access count stats
      accessCounts.push(memory.accessCount);
      stats.maxAccessCount = Math.max(stats.maxAccessCount, memory.accessCount);

      // Storage size
      stats.totalSize += MemoryFactory.getSize(memory);
    }

    // Calculate average access count
    if (accessCounts.length > 0) {
      const totalAccess = accessCounts.reduce((a, b) => a + b, 0);
      stats.avgAccessCount = totalAccess / accessCounts.length;
    }

    // Calculate median access count
    if (accessCounts.length > 0) {
      const sorted = [...accessCounts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.medianAccessCount = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return stats;
  }

  /**
   * Set TTL for a memory
   */
  setTTL(id: string, ttlSeconds: number, autoRenew: boolean = false, maxRenewals: number = 0): { success: boolean; memory?: Memory; errors?: string[] } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false, errors: ['Memory not found'] };
    }

    if (ttlSeconds < 1 || ttlSeconds > 365 * 24 * 60 * 60) {
      return { success: false, errors: ['TTL must be between 1 second and 1 year'] };
    }

    const ttl: MemoryTTL = {
      ttlSeconds,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      autoRenew,
      renewalCount: 0,
      maxRenewals,
    };

    memory.ttl = ttl;
    memory.expiresAt = ttl.expiresAt;
    memory.updatedAt = new Date().toISOString();

    this.memories.set(id, memory);

    console.log(`[MEMORY] Set TTL for ${id}: ${ttlSeconds}s, expires at ${ttl.expiresAt}`);

    return { success: true, memory };
  }

  /**
   * Remove TTL from a memory
   */
  removeTTL(id: string): { success: boolean; memory?: Memory } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false };
    }

    memory.ttl = undefined;
    memory.expiresAt = null;
    memory.updatedAt = new Date().toISOString();

    this.memories.set(id, memory);

    console.log(`[MEMORY] Removed TTL from ${id}`);

    return { success: true, memory };
  }

  /**
   * Archive a memory
   */
  archive(id: string): { success: boolean; memory?: Memory } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false };
    }

    memory.status = 'archived';
    memory.updatedAt = new Date().toISOString();

    this.memories.set(id, memory);

    console.log(`[MEMORY] Archived: ${id}`);

    return { success: true, memory };
  }

  /**
   * Restore a memory
   */
  restore(id: string): { success: boolean; memory?: Memory } {
    const memory = this.memories.get(id);
    if (!memory) {
      return { success: false };
    }

    if (memory.status === 'deleted') {
      memory.status = 'active';
      memory.updatedAt = new Date().toISOString();
      this.memories.set(id, memory);
      this.indexMemory(memory);
    }

    console.log(`[MEMORY] Restored: ${id}`);

    return { success: true, memory };
  }

  /**
   * Batch create memories
   */
  async batchCreate(options: CreateMemoryOptions[]): Promise<{ success: boolean; memories: Memory[]; errors: string[] }> {
    const memories: Memory[] = [];
    const errors: string[] = [];

    for (const option of options) {
      const result = await this.create(option);
      if (result.success && result.memory) {
        memories.push(result.memory);
      } else {
        errors.push(`Failed to create memory: ${result.errors?.join(', ')}`);
      }
    }

    return { success: errors.length === 0, memories, errors };
  }

  /**
   * Batch delete memories
   */
  batchDelete(ids: string[]): { success: boolean; deletedCount: number; failedIds: string[] } {
    let deletedCount = 0;
    const failedIds: string[] = [];

    for (const id of ids) {
      const result = this.delete(id);
      if (result.success) {
        deletedCount++;
      } else {
        failedIds.push(id);
      }
    }

    return { success: failedIds.length === 0, deletedCount, failedIds };
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.memories.clear();
    this.entityIndex.clear();
    this.tagIndex.clear();
    vectorService.clear();
    semanticSearchService.clear();
    console.log('[MEMORY] All memories cleared');
  }

  /**
   * Get all memories (for internal use)
   */
  getAll(): Map<string, Memory> {
    return this.memories;
  }

  // Private helper methods

  private indexMemory(memory: Memory): void {
    // Index by entity
    if (!this.entityIndex.has(memory.entityId)) {
      this.entityIndex.set(memory.entityId, new Set());
    }
    this.entityIndex.get(memory.entityId)!.add(memory.id);

    // Index by tags
    for (const tag of memory.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(memory.id);
    }
  }

  private removeFromIndexes(id: string): void {
    const memory = this.memories.get(id);
    if (!memory) return;

    // Remove from entity index
    const entityIds = this.entityIndex.get(memory.entityId);
    if (entityIds) {
      entityIds.delete(id);
      if (entityIds.size === 0) {
        this.entityIndex.delete(memory.entityId);
      }
    }

    // Remove from tag index
    for (const tag of memory.tags) {
      const tagIds = this.tagIndex.get(tag);
      if (tagIds) {
        tagIds.delete(id);
        if (tagIds.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
export { MemoryService };
