// ============================================================================
// SUTAR Memory Bridge - Share Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import { MemoryShare, SharePermission, Memory } from '../types/index';
import { memoryService } from './MemoryService';

interface ShareCreateOptions {
  memoryId: string;
  fromEntityId: string;
  toEntityId: string;
  permission: SharePermission;
  expiresIn?: number; // seconds
}

class ShareService {
  private shares: Map<string, MemoryShare> = new Map();
  private memoryShares: Map<string, Set<string>> = new Map(); // memoryId -> shareIds
  private entityShares: Map<string, Set<string>> = new Map(); // entityId -> shareIds

  /**
   * Share a memory with another entity
   */
  create(options: ShareCreateOptions): { success: boolean; share?: MemoryShare; error?: string } {
    // Validate memory exists
    const memory = memoryService.getWithoutAccess(options.memoryId);
    if (!memory) {
      return { success: false, error: 'Memory not found' };
    }

    // Check if already shared with this entity
    const existingShare = this.findShare(options.memoryId, options.toEntityId);
    if (existingShare) {
      return { success: false, error: 'Memory already shared with this entity' };
    }

    // Prevent sharing with self
    if (options.fromEntityId === options.toEntityId) {
      return { success: false, error: 'Cannot share memory with self' };
    }

    const share: MemoryShare = {
      id: `share-${uuidv4()}`,
      memoryId: options.memoryId,
      fromEntityId: options.fromEntityId,
      toEntityId: options.toEntityId,
      permission: options.permission,
      sharedAt: new Date().toISOString(),
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn * 1000).toISOString()
        : null,
      revokedAt: null,
      revokedBy: null,
    };

    this.shares.set(share.id, share);
    this.indexShare(share);

    console.log(`[SHARE] Created share ${share.id}: ${options.memoryId} from ${options.fromEntityId} to ${options.toEntityId}`);

    return { success: true, share };
  }

  /**
   * Get a share by ID
   */
  get(shareId: string): MemoryShare | null {
    return this.shares.get(shareId) || null;
  }

  /**
   * Get all shares for a memory
   */
  getForMemory(memoryId: string): MemoryShare[] {
    const shareIds = this.memoryShares.get(memoryId);
    if (!shareIds) return [];

    return Array.from(shareIds)
      .map(id => this.shares.get(id))
      .filter((s): s is MemoryShare => s !== undefined && !this.isRevoked(s));
  }

  /**
   * Get all shares shared with an entity
   */
  getForEntity(entityId: string): MemoryShare[] {
    const shareIds = this.entityShares.get(entityId);
    if (!shareIds) return [];

    return Array.from(shareIds)
      .map(id => this.shares.get(id))
      .filter((s): s is MemoryShare => s !== undefined && !this.isRevoked(s) && !this.isExpired(s));
  }

  /**
   * Get shared memories for an entity
   */
  getSharedMemories(entityId: string): Memory[] {
    const shares = this.getForEntity(entityId);
    const memories: Memory[] = [];

    for (const share of shares) {
      const memory = memoryService.getWithoutAccess(share.memoryId);
      if (memory && memory.status === 'active') {
        memories.push(memory);
      }
    }

    return memories;
  }

  /**
   * Revoke a share
   */
  revoke(shareId: string, revokedBy: string): { success: boolean; error?: string } {
    const share = this.shares.get(shareId);
    if (!share) {
      return { success: false, error: 'Share not found' };
    }

    if (share.revokedAt) {
      return { success: false, error: 'Share already revoked' };
    }

    share.revokedAt = new Date().toISOString();
    share.revokedBy = revokedBy;
    this.shares.set(shareId, share);

    console.log(`[SHARE] Revoked share ${shareId} by ${revokedBy}`);

    return { success: true };
  }

  /**
   * Revoke all shares for a memory
   */
  revokeAllForMemory(memoryId: string, revokedBy: string): { success: boolean; revokedCount: number } {
    const shares = this.getForMemory(memoryId);
    let revokedCount = 0;

    for (const share of shares) {
      if (!share.revokedAt) {
        share.revokedAt = new Date().toISOString();
        share.revokedBy = revokedBy;
        this.shares.set(share.id, share);
        revokedCount++;
      }
    }

    console.log(`[SHARE] Revoked ${revokedCount} shares for memory ${memoryId}`);

    return { success: true, revokedCount };
  }

  /**
   * Check if an entity has access to a memory
   */
  hasAccess(memoryId: string, entityId: string, requiredPermission: SharePermission = 'read'): boolean {
    const share = this.findShare(memoryId, entityId);
    if (!share) return false;
    if (this.isRevoked(share)) return false;
    if (this.isExpired(share)) return false;

    // Check permission hierarchy
    const permissionLevels: Record<SharePermission, number> = {
      read: 1,
      write: 2,
      admin: 3,
    };

    return permissionLevels[share.permission] >= permissionLevels[requiredPermission];
  }

  /**
   * Get all shares (for backup)
   */
  getAll(): MemoryShare[] {
    return Array.from(this.shares.values());
  }

  /**
   * Get share statistics
   */
  getStats(): { totalShares: number; activeShares: number; revokedShares: number; expiredShares: number; byPermission: Record<SharePermission, number> } {
    const stats = {
      totalShares: this.shares.size,
      activeShares: 0,
      revokedShares: 0,
      expiredShares: 0,
      byPermission: { read: 0, write: 0, admin: 0 } as Record<SharePermission, number>,
    };

    for (const share of this.shares.values()) {
      if (share.revokedAt) {
        stats.revokedShares++;
      } else if (this.isExpired(share)) {
        stats.expiredShares++;
      } else {
        stats.activeShares++;
      }

      stats.byPermission[share.permission]++;
    }

    return stats;
  }

  /**
   * Delete all shares for a memory
   */
  deleteAllForMemory(memoryId: string): boolean {
    const shareIds = this.memoryShares.get(memoryId);
    if (!shareIds) return false;

    for (const shareId of shareIds) {
      this.shares.delete(shareId);
    }

    this.memoryShares.delete(memoryId);

    console.log(`[SHARE] Deleted all shares for memory ${memoryId}`);

    return true;
  }

  /**
   * Load shares from backup
   */
  loadFromBackup(shares: MemoryShare[]): void {
    this.shares.clear();
    this.memoryShares.clear();
    this.entityShares.clear();

    for (const share of shares) {
      this.shares.set(share.id, share);
      this.indexShare(share);
    }

    console.log(`[SHARE] Loaded ${shares.length} shares from backup`);
  }

  /**
   * Clear all shares
   */
  clear(): void {
    this.shares.clear();
    this.memoryShares.clear();
    this.entityShares.clear();
    console.log('[SHARE] All shares cleared');
  }

  // Private helper methods

  private findShare(memoryId: string, entityId: string): MemoryShare | null {
    const shareIds = this.memoryShares.get(memoryId);
    if (!shareIds) return null;

    for (const shareId of shareIds) {
      const share = this.shares.get(shareId);
      if (share && share.toEntityId === entityId) {
        return share;
      }
    }

    return null;
  }

  private indexShare(share: MemoryShare): void {
    // Index by memory
    if (!this.memoryShares.has(share.memoryId)) {
      this.memoryShares.set(share.memoryId, new Set());
    }
    this.memoryShares.get(share.memoryId)!.add(share.id);

    // Index by receiving entity
    if (!this.entityShares.has(share.toEntityId)) {
      this.entityShares.set(share.toEntityId, new Set());
    }
    this.entityShares.get(share.toEntityId)!.add(share.id);
  }

  private isRevoked(share: MemoryShare): boolean {
    return share.revokedAt !== null;
  }

  private isExpired(share: MemoryShare): boolean {
    if (!share.expiresAt) return false;
    return new Date(share.expiresAt) < new Date();
  }
}

// Export singleton instance
export const shareService = new ShareService();
export { ShareService };
