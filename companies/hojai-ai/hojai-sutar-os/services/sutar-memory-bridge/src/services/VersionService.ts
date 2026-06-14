// ============================================================================
// SUTAR Memory Bridge - Version Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import { MemoryVersion, Memory } from '../types/index';
import { memoryService } from './MemoryService';

interface VersionCreateOptions {
  memoryId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  changes: string[];
  createdBy: string;
}

class VersionService {
  private versions: Map<string, MemoryVersion[]> = new Map(); // memoryId -> versions

  /**
   * Create a new version of a memory
   */
  create(options: VersionCreateOptions): { success: boolean; version?: MemoryVersion; error?: string } {
    const memory = memoryService.getWithoutAccess(options.memoryId);
    if (!memory) {
      return { success: false, error: 'Memory not found' };
    }

    const versions = this.versions.get(options.memoryId) || [];
    const versionNumber = memory.version || (versions.length + 1);

    const version: MemoryVersion = {
      id: `ver-${uuidv4()}`,
      memoryId: options.memoryId,
      version: versionNumber,
      content: options.content,
      embedding: options.embedding,
      metadata: { ...options.metadata },
      changes: options.changes,
      createdBy: options.createdBy,
      createdAt: new Date().toISOString(),
    };

    versions.push(version);
    this.versions.set(options.memoryId, versions);

    console.log(`[VERSION] Created version ${versionNumber} for memory ${options.memoryId}`);

    return { success: true, version };
  }

  /**
   * Get a specific version of a memory
   */
  get(memoryId: string, version: number): MemoryVersion | null {
    const versions = this.versions.get(memoryId);
    if (!versions) return null;

    return versions.find(v => v.version === version) || null;
  }

  /**
   * Get all versions of a memory
   */
  getAll(memoryId: string): MemoryVersion[] {
    return this.versions.get(memoryId) || [];
  }

  /**
   * Get the latest version of a memory
   */
  getLatest(memoryId: string): MemoryVersion | null {
    const versions = this.versions.get(memoryId);
    if (!versions || versions.length === 0) return null;

    return versions[versions.length - 1];
  }

  /**
   * Get version count for a memory
   */
  getVersionCount(memoryId: string): number {
    return this.versions.get(memoryId)?.length || 0;
  }

  /**
   * Restore a memory to a specific version
   */
  restoreToVersion(memoryId: string, versionNumber: number): { success: boolean; memory?: Memory; error?: string } {
    const version = this.get(memoryId, versionNumber);
    if (!version) {
      return { success: false, error: `Version ${versionNumber} not found` };
    }

    // Update the memory with the version content
    const result = memoryService.update(memoryId, {
      content: version.content,
      embedding: version.embedding,
      metadata: version.metadata,
    });

    if (result.success && result.memory) {
      // Create a new version marking the restore
      this.create({
        memoryId,
        content: version.content,
        embedding: version.embedding,
        metadata: version.metadata,
        changes: [`Restored from version ${versionNumber}`],
        createdBy: 'system',
      });
    }

    return result;
  }

  /**
   * Compare two versions
   */
  compare(memoryId: string, versionA: number, versionB: number): { success: boolean; comparison?: VersionComparison; error?: string } {
    const vA = this.get(memoryId, versionA);
    const vB = this.get(memoryId, versionB);

    if (!vA || !vB) {
      return { success: false, error: 'One or both versions not found' };
    }

    const comparison: VersionComparison = {
      memoryId,
      versionA,
      versionB,
      contentChanged: vA.content !== vB.content,
      embeddingChanged: JSON.stringify(vA.embedding) !== JSON.stringify(vB.embedding),
      metadataChanged: JSON.stringify(vA.metadata) !== JSON.stringify(vB.metadata),
      changesA: vA.changes,
      changesB: vB.changes,
      createdAtA: vA.createdAt,
      createdAtB: vB.createdAt,
      createdByA: vA.createdBy,
      createdByB: vB.createdBy,
    };

    return { success: true, comparison };
  }

  /**
   * Get version history for a memory
   */
  getHistory(memoryId: string, limit: number = 10, offset: number = 0): MemoryVersion[] {
    const versions = this.versions.get(memoryId) || [];
    return versions
      .sort((a, b) => b.version - a.version)
      .slice(offset, offset + limit);
  }

  /**
   * Delete old versions (keeping the most recent N)
   */
  pruneVersions(memoryId: string, keepCount: number): { success: boolean; deletedCount: number } {
    const versions = this.versions.get(memoryId);
    if (!versions || versions.length <= keepCount) {
      return { success: true, deletedCount: 0 };
    }

    const sortedVersions = versions.sort((a, b) => b.version - a.version);
    const toDelete = sortedVersions.slice(keepCount);

    const updatedVersions = sortedVersions.slice(0, keepCount);
    this.versions.set(memoryId, updatedVersions);

    console.log(`[VERSION] Pruned ${toDelete.length} old versions for memory ${memoryId}`);

    return { success: true, deletedCount: toDelete.length };
  }

  /**
   * Delete all versions for a memory
   */
  deleteAll(memoryId: string): boolean {
    const deleted = this.versions.delete(memoryId);
    if (deleted) {
      console.log(`[VERSION] Deleted all versions for memory ${memoryId}`);
    }
    return deleted;
  }

  /**
   * Get total version count across all memories
   */
  getTotalVersionCount(): number {
    let total = 0;
    for (const versions of this.versions.values()) {
      total += versions.length;
    }
    return total;
  }

  /**
   * Get all versions (for backup purposes)
   */
  getAll(): Map<string, MemoryVersion[]> {
    return this.versions;
  }

  /**
   * Load versions from backup
   */
  loadFromBackup(versions: Map<string, MemoryVersion[]>): void {
    this.versions = new Map();
    for (const [memoryId, memoryVersions] of versions) {
      this.versions.set(memoryId, [...memoryVersions]);
    }
    console.log(`[VERSION] Loaded ${this.getTotalVersionCount()} versions from backup`);
  }

  /**
   * Clear all versions
   */
  clear(): void {
    this.versions.clear();
    console.log('[VERSION] All versions cleared');
  }
}

interface VersionComparison {
  memoryId: string;
  versionA: number;
  versionB: number;
  contentChanged: boolean;
  embeddingChanged: boolean;
  metadataChanged: boolean;
  changesA: string[];
  changesB: string[];
  createdAtA: string;
  createdAtB: string;
  createdByA: string;
  createdByB: string;
}

// Export singleton instance
export const versionService = new VersionService();
export { VersionService, VersionComparison };