// ============================================================================
// SUTAR Memory Bridge - Type Definitions
// ============================================================================

// Memory Types
export type MemoryType = 'context' | 'fact' | 'preference' | 'history' | 'session';
export type MemoryStatus = 'active' | 'archived' | 'deleted' | 'expired';
export type SharePermission = 'read' | 'write' | 'admin';

// Memory TTL Configuration
export interface MemoryTTL {
  ttlSeconds: number | null;
  expiresAt: string | null;
  autoRenew: boolean;
  renewalCount: number;
  maxRenewals: number;
}

// Memory Versioning
export interface MemoryVersion {
  id: string;
  memoryId: string;
  version: number;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  changes: string[];
  createdBy: string;
  createdAt: string;
}

// Memory Sharing
export interface MemoryShare {
  id: string;
  memoryId: string;
  fromEntityId: string;
  toEntityId: string;
  permission: SharePermission;
  sharedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
}

// Memory Analytics
export interface MemoryAnalytics {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byStatus: Record<MemoryStatus, number>;
  totalAccessCount: number;
  avgAccessCount: number;
  memoriesWithTTL: number;
  expiredMemories: number;
  sharedMemories: number;
  totalVersions: number;
  topAccessed: MemoryAccessStat[];
  storageSize: number;
  last24h: MemoryAccessStat[];
  last7d: MemoryAccessStat[];
  byTag: Record<string, number>;
  entityStats: EntityStat[];
}

export interface MemoryAccessStat {
  memoryId: string;
  entityId: string;
  type: MemoryType;
  accessCount: number;
  lastAccessed: string;
}

export interface EntityStat {
  entityId: string;
  memoryCount: number;
  avgAccessCount: number;
  lastActivity: string;
}

// Backup Data Structure
export interface BackupMetadata {
  id: string;
  createdAt: string;
  size: number;
  memoryCount: number;
  versionCount: number;
  shareCount: number;
  entityIds: string[];
  checksum: string;
}

export interface BackupData {
  version: string;
  metadata: BackupMetadata;
  memories: Memory[];
  versions: MemoryVersion[];
  shares: MemoryShare[];
  analytics?: MemoryAnalytics;
}

// Embedding Vector
export interface EmbeddingVector {
  id: string;
  memoryId: string;
  vector: number[];
  model: string;
  dimensions: number;
  createdAt: string;
}

// Search Result
export interface SemanticSearchResult {
  memory: Memory;
  similarity: number;
  score: number;
}

// API Request/Response Types
export interface StoreMemoryRequest {
  entityId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  generateEmbedding?: boolean;
  ttlSeconds?: number;
}

export interface SearchMemoriesRequest {
  query: string;
  entityId?: string;
  type?: MemoryType;
  tags?: string[];
  limit?: number;
  offset?: number;
  minSimilarity?: number;
}

export interface ShareMemoryRequest {
  toEntityId: string;
  permission: SharePermission;
  expiresIn?: number;
}

export interface SetTTLRequest {
  ttlSeconds: number;
  autoRenew?: boolean;
  maxRenewals?: number;
}

export interface VersionMemoryRequest {
  content: string;
  changes: string[];
  createdBy: string;
}

export interface BackupRequest {
  entityIds?: string[];
  includeExpired?: boolean;
  compression?: boolean;
}

export interface RestoreRequest {
  backupData: BackupData;
  overwrite?: boolean;
  merge?: boolean;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  lastRun?: string;
}

// Twin OS Integration
export interface TwinOSConfig {
  host: string;
  port: number;
  apiKey?: string;
  timeout: number;
  retries: number;
}

export interface TwinOSMessage {
  action: string;
  payload: unknown;
  timestamp: string;
}

// Event Types
export interface MemoryEvent {
  type: 'created' | 'updated' | 'deleted' | 'shared' | 'expired' | 'versioned';
  memoryId: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Constants
export const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
export const MAX_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year
export const MIN_TTL_SECONDS = 60; // 1 minute
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 100;
export const DEFAULT_BACKUP_VERSION = '1.0.0';
