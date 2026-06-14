// ============================================================================
// SUTAR Memory Bridge - Type Definitions
// ============================================================================

export type MemoryStatus = 'active' | 'archived' | 'deleted';
export type MemoryType = 'context' | 'fact' | 'preference' | 'history' | 'session';

export interface Memory {
  id: string;
  entityId: string;
  type: MemoryType;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  status: MemoryStatus;
  accessCount: number;
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryOptions {
  entityId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateMemoryOptions {
  content?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  status?: MemoryStatus;
}

export interface MemoryFilter {
  entityId?: string;
  type?: MemoryType;
  tags?: string[];
  status?: MemoryStatus;
}

export interface MemorySort {
  field: 'createdAt' | 'updatedAt' | 'accessCount';
  order: 'asc' | 'desc';
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  byStatus: Record<MemoryStatus, number>;
  avgAccessCount: number;
}
