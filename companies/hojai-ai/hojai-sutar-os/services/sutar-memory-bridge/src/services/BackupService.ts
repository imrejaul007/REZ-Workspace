// ============================================================================
// SUTAR Memory Bridge - Backup Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  BackupData,
  BackupMetadata,
  Memory,
  MemoryVersion,
  MemoryShare,
  DEFAULT_BACKUP_VERSION,
} from '../types/index';
import { memoryService } from './MemoryService';
import { versionService } from './VersionService';
import { shareService } from './ShareService';
import { analyticsService } from './AnalyticsService';
import { createHash } from 'crypto';

interface BackupOptions {
  entityIds?: string[];
  includeExpired?: boolean;
  includeDeleted?: boolean;
  compression?: boolean;
}

interface RestoreOptions {
  overwrite?: boolean;
  merge?: boolean;
  validate?: boolean;
}

class BackupService {
  private backupHistory: BackupMetadata[] = [];
  private readonly MAX_BACKUP_HISTORY = 10;

  /**
   * Create a backup of all memories
   */
  createBackup(options: BackupOptions = {}): { success: boolean; backup?: BackupData; error?: string } {
    try {
      const { entityIds, includeExpired = false, includeDeleted = false } = options;

      // Get memories based on filters
      let memories = Array.from(memoryService.getAll().values());

      // Filter by entity IDs
      if (entityIds && entityIds.length > 0) {
        memories = memories.filter(m => entityIds.includes(m.entityId));
      }

      // Filter by status
      if (!includeDeleted) {
        memories = memories.filter(m => m.status !== 'deleted');
      }

      if (!includeExpired) {
        memories = memories.filter(m => m.status !== 'expired');
      }

      // Get all versions
      const versionsMap = versionService.getAll();
      const versions: MemoryVersion[] = [];

      for (const [, memoryVersions] of versionsMap) {
        // Only include versions for memories in the backup
        const memoryIds = new Set(memories.map(m => m.id));
        for (const version of memoryVersions) {
          if (memoryIds.has(version.memoryId)) {
            versions.push(version);
          }
        }
      }

      // Get all shares
      const shares = shareService.getAll().filter(s => {
        // Only include shares for memories in the backup
        const memoryIds = new Set(memories.map(m => m.id));
        return memoryIds.has(s.memoryId);
      });

      // Calculate checksum
      const checksum = this.calculateChecksum(memories, versions, shares);

      // Create metadata
      const metadata: BackupMetadata = {
        id: `backup-${uuidv4()}`,
        createdAt: new Date().toISOString(),
        size: this.calculateSize(memories, versions, shares),
        memoryCount: memories.length,
        versionCount: versions.length,
        shareCount: shares.length,
        entityIds: [...new Set(memories.map(m => m.entityId))],
        checksum,
      };

      // Create backup data
      const backup: BackupData = {
        version: DEFAULT_BACKUP_VERSION,
        metadata,
        memories,
        versions,
        shares,
        analytics: analyticsService.getAnalytics(),
      };

      // Store backup metadata in history
      this.backupHistory.push(metadata);
      if (this.backupHistory.length > this.MAX_BACKUP_HISTORY) {
        this.backupHistory = this.backupHistory.slice(-this.MAX_BACKUP_HISTORY);
      }

      console.log(`[BACKUP] Created backup ${metadata.id}: ${memories.length} memories, ${versions.length} versions, ${shares.length} shares`);

      return { success: true, backup };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BACKUP] Failed to create backup: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Restore from a backup
   */
  restoreBackup(backup: BackupData, options: RestoreOptions = {}): { success: boolean; restored: number; errors: string[] } {
    const { overwrite = false, validate = true } = options;

    const errors: string[] = [];
    let restored = 0;

    try {
      // Validate backup
      if (validate) {
        const validation = this.validateBackup(backup);
        if (!validation.valid) {
          return { success: false, restored: 0, errors: validation.errors };
        }
      }

      // Restore memories
      for (const memory of backup.memories) {
        const existing = memoryService.getWithoutAccess(memory.id);

        if (existing && !overwrite) {
          errors.push(`Memory ${memory.id} already exists, skipping`);
          continue;
        }

        if (existing && overwrite) {
          // Update existing memory
          memoryService.update(memory.id, {
            content: memory.content,
            metadata: memory.metadata,
            tags: memory.tags,
            embedding: memory.embedding,
          });
        } else {
          // Create new memory
          memoryService.create({
            entityId: memory.entityId,
            type: memory.type,
            content: memory.content,
            metadata: memory.metadata,
            tags: memory.tags,
            embedding: memory.embedding,
          });
        }

        restored++;
      }

      // Restore versions
      const versionsMap = new Map<string, MemoryVersion[]>();
      for (const version of backup.versions) {
        if (!versionsMap.has(version.memoryId)) {
          versionsMap.set(version.memoryId, []);
        }
        versionsMap.get(version.memoryId)!.push(version);
      }
      versionService.loadFromBackup(versionsMap);

      // Restore shares
      shareService.loadFromBackup(backup.shares);

      console.log(`[BACKUP] Restored ${restored} memories from backup ${backup.metadata.id}`);

      return { success: errors.length === 0, restored, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BACKUP] Failed to restore backup: ${errorMessage}`);
      return { success: false, restored, errors: [errorMessage] };
    }
  }

  /**
   * Validate a backup
   */
  validateBackup(backup: BackupData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!backup.version) {
      errors.push('Missing backup version');
    }

    if (!backup.metadata) {
      errors.push('Missing backup metadata');
    }

    if (!Array.isArray(backup.memories)) {
      errors.push('Invalid memories array');
    }

    if (!Array.isArray(backup.versions)) {
      errors.push('Invalid versions array');
    }

    if (!Array.isArray(backup.shares)) {
      errors.push('Invalid shares array');
    }

    // Validate memory structure
    for (const memory of backup.memories) {
      if (!memory.id) errors.push('Memory missing id');
      if (!memory.entityId) errors.push('Memory missing entityId');
      if (!memory.content) errors.push('Memory missing content');
    }

    // Validate checksum
    const calculatedChecksum = this.calculateChecksum(
      backup.memories,
      backup.versions,
      backup.shares
    );

    if (backup.metadata && backup.metadata.checksum !== calculatedChecksum) {
      errors.push('Checksum mismatch - backup may be corrupted');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get backup history
   */
  getBackupHistory(): BackupMetadata[] {
    return [...this.backupHistory].reverse();
  }

  /**
   * Export backup to JSON string
   */
  exportBackup(backup: BackupData): string {
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import backup from JSON string
   */
  importBackup(json: string): { success: boolean; backup?: BackupData; error?: string } {
    try {
      const backup = JSON.parse(json) as BackupData;
      const validation = this.validateBackup(backup);

      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      return { success: true, backup };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get incremental backup (changes since last backup)
   */
  getIncrementalBackup(lastBackupTime: string): { success: boolean; backup?: BackupData; error?: string } {
    const memories = Array.from(memoryService.getAll().values())
      .filter(m => new Date(m.updatedAt) > new Date(lastBackupTime));

    if (memories.length === 0) {
      return { success: true, backup: undefined };
    }

    // Get versions and shares for these memories
    const versions: MemoryVersion[] = [];
    const shares: MemoryShare[] = [];

    const versionsMap = versionService.getAll();
    for (const [, memoryVersions] of versionsMap) {
      for (const version of memoryVersions) {
        if (new Date(version.createdAt) > new Date(lastBackupTime)) {
          versions.push(version);
        }
      }
    }

    for (const share of shareService.getAll()) {
      if (new Date(share.sharedAt) > new Date(lastBackupTime)) {
        shares.push(share);
      }
    }

    const metadata: BackupMetadata = {
      id: `backup-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      size: this.calculateSize(memories, versions, shares),
      memoryCount: memories.length,
      versionCount: versions.length,
      shareCount: shares.length,
      entityIds: [...new Set(memories.map(m => m.entityId))],
      checksum: this.calculateChecksum(memories, versions, shares),
    };

    return {
      success: true,
      backup: {
        version: DEFAULT_BACKUP_VERSION,
        metadata,
        memories,
        versions,
        shares,
      },
    };
  }

  /**
   * Clear all data (use with caution)
   */
  clearAll(): void {
    memoryService.clear();
    versionService.clear();
    shareService.clear();
    analyticsService.clear();
    this.backupHistory = [];
    console.log('[BACKUP] All data cleared');
  }

  // Private helper methods

  private calculateChecksum(memories: Memory[], versions: MemoryVersion[], shares: MemoryShare[]): string {
    const data = JSON.stringify({ memories, versions, shares });
    return createHash('sha256').update(data).digest('hex');
  }

  private calculateSize(memories: Memory[], versions: MemoryVersion[], shares: MemoryShare[]): number {
    const memoriesSize = Buffer.byteLength(JSON.stringify(memories), 'utf8');
    const versionsSize = Buffer.byteLength(JSON.stringify(versions), 'utf8');
    const sharesSize = Buffer.byteLength(JSON.stringify(shares), 'utf8');
    return memoriesSize + versionsSize + sharesSize;
  }
}

// Export singleton instance
export const backupService = new BackupService();
export { BackupService };