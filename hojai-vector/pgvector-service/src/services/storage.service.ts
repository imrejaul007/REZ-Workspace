/**
 * HOJAI pgvector Service - Mock Storage Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Simulates pgvector operations for development/testing
 *
 * NOTE: This is a mock implementation for development.
 * In production, replace with actual PostgreSQL + pgvector operations.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Logger } from '../utils/logger.js';
import type {
  VectorRecord,
  VectorInsert,
  SearchRequest,
  SearchResult,
  NamespaceStats,
} from '../types/index.js';

// ============================================================================
// In-Memory Storage (Simulates PostgreSQL with pgvector)
// ============================================================================

interface StorageEntry extends VectorRecord {
  _embeddingNorm?: number;
}

class InMemoryVectorStore {
  private vectors: Map<string, StorageEntry> = new Map();
  private namespaceIndex: Map<string, Set<string>> = new Map();

  // ============================================================================
  // Cosine Similarity Calculation
  // ============================================================================

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) continue;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) continue;
      const diff = aVal - bVal;
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  async insert(vector: VectorInsert): Promise<VectorRecord> {
    const id = vector.id || uuidv4();
    const created_at = new Date().toISOString();

    const entry: StorageEntry = {
      id,
      namespace: vector.namespace,
      embedding: vector.embedding,
      metadata: vector.metadata,
      created_at,
    };

    // Calculate and store norm for faster cosine similarity
    let norm = 0;
    for (const val of vector.embedding) {
      norm += val * val;
    }
    entry._embeddingNorm = Math.sqrt(norm);

    this.vectors.set(id, entry);

    // Update namespace index
    if (!this.namespaceIndex.has(vector.namespace)) {
      this.namespaceIndex.set(vector.namespace, new Set());
    }
    this.namespaceIndex.get(vector.namespace)?.add(id);

    return {
      id: entry.id,
      namespace: entry.namespace,
      embedding: entry.embedding,
      metadata: entry.metadata,
      created_at: entry.created_at,
    };
  }

  async insertBatch(vectors: VectorInsert[]): Promise<{ ids: string[]; errors: Array<{ index: number; error: string }> }> {
    const ids: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < vectors.length; i++) {
      try {
        const vector = vectors[i];
        if (!vector) {
          throw new Error(`Vector at index ${i} is undefined`);
        }
        const record = await this.insert(vector);
        ids.push(record.id);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { ids, errors };
  }

  async getById(id: string): Promise<VectorRecord | null> {
    const entry = this.vectors.get(id);

    if (!entry) {
      return null;
    }

    return {
      id: entry.id,
      namespace: entry.namespace,
      embedding: entry.embedding,
      metadata: entry.metadata,
      created_at: entry.created_at,
    };
  }

  async delete(id: string): Promise<boolean> {
    const entry = this.vectors.get(id);

    if (!entry) {
      return false;
    }

    // Remove from namespace index
    const namespaceSet = this.namespaceIndex.get(entry.namespace);
    namespaceSet?.delete(id);

    // Delete the vector
    this.vectors.delete(id);

    return true;
  }

  async search(request: SearchRequest): Promise<SearchResult[]> {
    const { embedding, limit = 10, threshold, namespace } = request;

    // Get vectors to search
    let entries: StorageEntry[];

    if (namespace) {
      const ids = this.namespaceIndex.get(namespace) || new Set();
      entries = Array.from(ids)
        .map((id) => this.vectors.get(id))
        .filter((entry): entry is StorageEntry => entry !== undefined);
    } else {
      entries = Array.from(this.vectors.values());
    }

    // Calculate similarities
    const results: SearchResult[] = [];

    for (const entry of entries) {
      try {
        const score = this.cosineSimilarity(embedding, entry.embedding);

        // Apply threshold if specified
        if (threshold !== undefined && score < threshold) {
          continue;
        }

        results.push({
          id: entry.id,
          score,
          namespace: entry.namespace,
          metadata: entry.metadata,
          created_at: entry.created_at,
        });
      } catch {
        // Skip vectors with dimension mismatch
        continue;
      }
    }

    // Sort by score descending (most similar first)
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    return results.slice(0, limit);
  }

  async listByNamespace(namespace: string, limit = 100, offset = 0): Promise<VectorRecord[]> {
    const ids = this.namespaceIndex.get(namespace) || new Set();
    const entries = Array.from(ids)
      .map((id) => this.vectors.get(id))
      .filter((entry): entry is StorageEntry => entry !== undefined);

    // Sort by created_at descending
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return entries.slice(offset, offset + limit).map((entry) => ({
      id: entry.id,
      namespace: entry.namespace,
      embedding: entry.embedding,
      metadata: entry.metadata,
      created_at: entry.created_at,
    }));
  }

  async getNamespaceStats(namespace: string): Promise<NamespaceStats | null> {
    const ids = this.namespaceIndex.get(namespace);

    if (!ids || ids.size === 0) {
      return null;
    }

    const entries = Array.from(ids)
      .map((id) => this.vectors.get(id))
      .filter((entry): entry is StorageEntry => entry !== undefined);

    if (entries.length === 0) {
      return null;
    }

    // Get dimensions from first entry
    const dimensions = entries[0]?.embedding.length || 0;

    // Get oldest and newest entries
    let oldest = entries[0]?.created_at || new Date().toISOString();
    let newest = entries[0]?.created_at || new Date().toISOString();

    for (const entry of entries) {
      if (entry.created_at < oldest) oldest = entry.created_at;
      if (entry.created_at > newest) newest = entry.created_at;
    }

    return {
      namespace,
      count: entries.length,
      dimensions,
      created_at: oldest,
      last_updated: newest,
    };
  }

  async listNamespaces(): Promise<NamespaceStats[]> {
    const stats: NamespaceStats[] = [];

    for (const namespace of this.namespaceIndex.keys()) {
      const nsStats = await this.getNamespaceStats(namespace);
      if (nsStats) {
        stats.push(nsStats);
      }
    }

    return stats;
  }

  async count(namespace?: string): Promise<number> {
    if (namespace) {
      return this.namespaceIndex.get(namespace)?.size || 0;
    }

    return this.vectors.size;
  }

  async clear(namespace?: string): Promise<number> {
    if (namespace) {
      const ids = this.namespaceIndex.get(namespace) || new Set();
      const count = ids.size;

      for (const id of ids) {
        this.vectors.delete(id);
      }

      this.namespaceIndex.delete(namespace);
      return count;
    }

    const count = this.vectors.size;

    this.vectors.clear();
    this.namespaceIndex.clear();

    return count;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageInstance: InMemoryVectorStore | null = null;
let storageLogger: Logger | null = null;

export function initializeStorage(logger: Logger): void {
  storageLogger = logger;
  // Storage instance is lazily initialized by getStorage()
  storageLogger.info('storage_initialized', {
    message: 'Storage logger configured, storage will initialize lazily',
  });
}

export function getStorage(): InMemoryVectorStore {
  if (!storageInstance) {
    // Lazy initialization
    storageInstance = new InMemoryVectorStore();
    storageLogger?.info('storage_lazy_initialized', {
      message: 'Mock pgvector storage lazily initialized',
    });
  }
  return storageInstance;
}

export function getStorageLogger(): Logger {
  if (!storageLogger) {
    throw new Error('Storage logger not initialized');
  }
  return storageLogger;
}

// ============================================================================
// Export for testing
// ============================================================================

export { InMemoryVectorStore };
