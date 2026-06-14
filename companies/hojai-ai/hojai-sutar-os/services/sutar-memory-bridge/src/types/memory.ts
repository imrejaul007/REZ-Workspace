// ============================================================================
// SUTAR Memory Bridge - Memory Interface
// ============================================================================

import { MemoryType, MemoryStatus, MemoryTTL } from './index';

// Core Memory Interface
export interface Memory {
  id: string;
  entityId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  tags: string[];
  status: MemoryStatus;
  accessCount: number;
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
  ttl?: MemoryTTL;
  version?: number;
  parentId?: string;
  source?: string;
  priority?: number;
  confidence?: number;
  expiresAt?: string | null;
}

// Memory Creation Options
export interface CreateMemoryOptions {
  entityId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  embedding?: number[];
  ttlSeconds?: number;
  source?: string;
  priority?: number;
  confidence?: number;
}

// Memory Update Options
export interface UpdateMemoryOptions {
  content?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  embedding?: number[];
  status?: MemoryStatus;
  priority?: number;
  confidence?: number;
}

// Memory Filter Options
export interface MemoryFilter {
  entityId?: string;
  type?: MemoryType;
  types?: MemoryType[];
  status?: MemoryStatus;
  statuses?: MemoryStatus[];
  tags?: string[];
  excludeTags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  accessedAfter?: string;
  accessedBefore?: string;
  minAccessCount?: number;
  maxAccessCount?: number;
  hasEmbedding?: boolean;
  hasTTL?: boolean;
  expired?: boolean;
  sharedWith?: string;
  searchQuery?: string;
}

// Memory Sort Options
export interface MemorySort {
  field: 'createdAt' | 'updatedAt' | 'lastAccessed' | 'accessCount' | 'priority' | 'confidence';
  order: 'asc' | 'desc';
}

// Memory Statistics
export interface MemoryStats {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  deletedCount: number;
  expiredCount: number;
  byType: Record<MemoryType, number>;
  byEntity: Record<string, number>;
  avgAccessCount: number;
  medianAccessCount: number;
  maxAccessCount: number;
  totalSize: number;
}

// Memory Factory
export class MemoryFactory {
  static createId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  static create(options: CreateMemoryOptions): Memory {
    const now = new Date().toISOString();
    const ttl: MemoryTTL | undefined = options.ttlSeconds
      ? {
          ttlSeconds: options.ttlSeconds,
          expiresAt: new Date(Date.now() + options.ttlSeconds * 1000).toISOString(),
          autoRenew: false,
          renewalCount: 0,
          maxRenewals: 0,
        }
      : undefined;

    return {
      id: MemoryFactory.createId(),
      entityId: options.entityId,
      type: options.type,
      content: options.content,
      metadata: options.metadata || {},
      tags: options.tags || [],
      embedding: options.embedding,
      status: 'active',
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
      updatedAt: now,
      ttl,
      version: 1,
      source: options.source,
      priority: options.priority || 0,
      confidence: options.confidence || 1.0,
      expiresAt: ttl?.expiresAt || null,
    };
  }

  static update(memory: Memory, options: UpdateMemoryOptions): Memory {
    const updated: Memory = {
      ...memory,
      content: options.content ?? memory.content,
      metadata: options.metadata ?? memory.metadata,
      tags: options.tags ?? memory.tags,
      embedding: options.embedding ?? memory.embedding,
      status: options.status ?? memory.status,
      priority: options.priority ?? memory.priority,
      confidence: options.confidence ?? memory.confidence,
      updatedAt: new Date().toISOString(),
    };

    if (options.content !== undefined && options.content !== memory.content) {
      updated.version = (memory.version || 1) + 1;
    }

    return updated;
  }

  static isExpired(memory: Memory): boolean {
    if (!memory.expiresAt) return false;
    return new Date(memory.expiresAt) < new Date();
  }

  static isAccessible(memory: Memory): boolean {
    return memory.status === 'active' && !MemoryFactory.isExpired(memory);
  }

  static getSize(memory: Memory): number {
    const contentSize = Buffer.byteLength(memory.content, 'utf8');
    const metadataSize = Buffer.byteLength(JSON.stringify(memory.metadata), 'utf8');
    const embeddingSize = memory.embedding ? memory.embedding.length * 8 : 0;
    const tagsSize = memory.tags.reduce((acc, tag) => acc + Buffer.byteLength(tag, 'utf8'), 0);
    return contentSize + metadataSize + embeddingSize + tagsSize + 500; // Base overhead
  }
}

// Memory Validator
export class MemoryValidator {
  static validateCreate(options: CreateMemoryOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.entityId || options.entityId.trim() === '') {
      errors.push('entityId is required');
    }

    if (!options.content || options.content.trim() === '') {
      errors.push('content is required');
    }

    if (options.content && options.content.length > 1000000) {
      errors.push('content exceeds maximum length of 1,000,000 characters');
    }

    const validTypes: MemoryType[] = ['context', 'fact', 'preference', 'history', 'session'];
    if (!validTypes.includes(options.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }

    if (options.ttlSeconds !== undefined) {
      if (options.ttlSeconds < 1) {
        errors.push('ttlSeconds must be at least 1');
      }
      if (options.ttlSeconds > 365 * 24 * 60 * 60) {
        errors.push('ttlSeconds cannot exceed 1 year');
      }
    }

    if (options.tags && options.tags.length > 50) {
      errors.push('maximum 50 tags allowed');
    }

    if (options.embedding && options.embedding.length !== 1536) {
      errors.push('embedding must have exactly 1536 dimensions');
    }

    return { valid: errors.length === 0, errors };
  }

  static validateUpdate(options: UpdateMemoryOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.content !== undefined && options.content.trim() === '') {
      errors.push('content cannot be empty');
    }

    if (options.content && options.content.length > 1000000) {
      errors.push('content exceeds maximum length of 1,000,000 characters');
    }

    if (options.embedding && options.embedding.length !== 1536) {
      errors.push('embedding must have exactly 1536 dimensions');
    }

    if (options.tags && options.tags.length > 50) {
      errors.push('maximum 50 tags allowed');
    }

    return { valid: errors.length === 0, errors };
  }

  static validateFilter(filter: MemoryFilter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filter.createdAfter && filter.createdBefore) {
      if (new Date(filter.createdAfter) > new Date(filter.createdBefore)) {
        errors.push('createdAfter must be before createdBefore');
      }
    }

    if (filter.accessedAfter && filter.accessedBefore) {
      if (new Date(filter.accessedAfter) > new Date(filter.accessedBefore)) {
        errors.push('accessedAfter must be before accessedBefore');
      }
    }

    if (filter.minAccessCount !== undefined && filter.maxAccessCount !== undefined) {
      if (filter.minAccessCount > filter.maxAccessCount) {
        errors.push('minAccessCount cannot be greater than maxAccessCount');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
