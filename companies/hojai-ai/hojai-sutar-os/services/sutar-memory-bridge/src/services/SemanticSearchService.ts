// ============================================================================
// SUTAR Memory Bridge - Semantic Search Service
// ============================================================================

import { Memory, SemanticSearchResult, MemoryType, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT } from '../types/index';
import { vectorService } from './VectorService';

interface SearchIndex {
  memoryId: string;
  content: string;
  type: MemoryType;
  entityId: string;
  tags: string[];
  embedding?: number[];
}

class SemanticSearchService {
  private searchIndex: Map<string, SearchIndex> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  /**
   * Index a memory for semantic search
   */
  indexMemory(memory: Memory): void {
    const index: SearchIndex = {
      memoryId: memory.id,
      content: memory.content,
      type: memory.type,
      entityId: memory.entityId,
      tags: memory.tags,
      embedding: memory.embedding,
    };

    this.searchIndex.set(memory.id, index);

    if (memory.embedding) {
      this.embeddings.set(memory.id, memory.embedding);
    }
  }

  /**
   * Remove a memory from the search index
   */
  removeFromIndex(memoryId: string): void {
    this.searchIndex.delete(memoryId);
    this.embeddings.delete(memoryId);
  }

  /**
   * Update a memory in the search index
   */
  updateIndex(memory: Memory): void {
    this.indexMemory(memory);
  }

  /**
   * Perform semantic search across all indexed memories
   */
  async search(
    query: string,
    options: {
      entityId?: string;
      type?: MemoryType;
      tags?: string[];
      limit?: number;
      offset?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      entityId,
      type,
      tags,
      limit = DEFAULT_SEARCH_LIMIT,
      offset = 0,
      minSimilarity = 0,
    } = options;

    // Generate query embedding
    const queryEmbedding = await vectorService.generateEmbedding(query);

    // Get all indexed memories
    const memories = Array.from(this.searchIndex.values());

    // Filter memories based on criteria
    let filteredMemories = memories.filter(m => {
      if (entityId && m.entityId !== entityId) return false;
      if (type && m.type !== type) return false;
      if (tags && tags.length > 0) {
        const hasTag = tags.some(tag => m.tags.includes(tag));
        if (!hasTag) return false;
      }
      return true;
    });

    // Calculate similarity scores
    const results: SemanticSearchResult[] = [];

    for (const memoryIndex of filteredMemories) {
      const embedding = this.embeddings.get(memoryIndex.memoryId);

      if (embedding) {
        const similarity = vectorService.cosineSimilarity(queryEmbedding, embedding);

        if (similarity >= minSimilarity) {
          // Get the full memory object (this would normally come from the memory store)
          const result: SemanticSearchResult = {
            memory: {
              id: memoryIndex.memoryId,
              entityId: memoryIndex.entityId,
              type: memoryIndex.type,
              content: memoryIndex.content,
              tags: memoryIndex.tags,
              embedding: memoryIndex.embedding,
              metadata: {},
              status: 'active',
              accessCount: 0,
              lastAccessed: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            similarity,
            score: similarity,
          };

          results.push(result);
        }
      } else {
        // Fallback to text-based matching
        const textScore = this.calculateTextSimilarity(query, memoryIndex.content);
        if (textScore >= minSimilarity) {
          const result: SemanticSearchResult = {
            memory: {
              id: memoryIndex.memoryId,
              entityId: memoryIndex.entityId,
              type: memoryIndex.type,
              content: memoryIndex.content,
              tags: memoryIndex.tags,
              metadata: {},
              status: 'active',
              accessCount: 0,
              lastAccessed: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            similarity: textScore,
            score: textScore,
          };

          results.push(result);
        }
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + Math.min(limit, MAX_SEARCH_LIMIT));

    return paginatedResults;
  }

  /**
   * Perform hybrid search combining semantic and keyword matching
   */
  async hybridSearch(
    query: string,
    options: {
      entityId?: string;
      type?: MemoryType;
      tags?: string[];
      limit?: number;
      offset?: number;
      semanticWeight?: number;
      keywordWeight?: number;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      entityId,
      type,
      tags,
      limit = DEFAULT_SEARCH_LIMIT,
      offset = 0,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
    } = options;

    // Get semantic search results
    const semanticResults = await this.search(query, { entityId, type, tags, limit: MAX_SEARCH_LIMIT });

    // Get keyword search results
    const keywordResults = this.keywordSearch(query, { entityId, type, tags, limit: MAX_SEARCH_LIMIT });

    // Combine results with weighted scores
    const combinedScores = new Map<string, SemanticSearchResult>();

    for (const result of semanticResults) {
      result.score = result.similarity * semanticWeight;
      combinedScores.set(result.memory.id, result);
    }

    for (const result of keywordResults) {
      const existing = combinedScores.get(result.memory.id);
      if (existing) {
        existing.score += result.similarity * keywordWeight;
      } else {
        result.score = result.similarity * keywordWeight;
        combinedScores.set(result.memory.id, result);
      }
    }

    // Sort by combined score
    const combinedResults = Array.from(combinedScores.values());
    combinedResults.sort((a, b) => b.score - a.score);

    return combinedResults.slice(offset, offset + Math.min(limit, MAX_SEARCH_LIMIT));
  }

  /**
   * Perform keyword-based search
   */
  keywordSearch(
    query: string,
    options: {
      entityId?: string;
      type?: MemoryType;
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): SemanticSearchResult[] {
    const { entityId, type, tags, limit = DEFAULT_SEARCH_LIMIT, offset = 0 } = options;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const memories = Array.from(this.searchIndex.values());

    const results: SemanticSearchResult[] = [];

    for (const memoryIndex of memories) {
      // Apply filters
      if (entityId && memoryIndex.entityId !== entityId) continue;
      if (type && memoryIndex.type !== type) continue;
      if (tags && tags.length > 0) {
        const hasTag = tags.some(tag => memoryIndex.tags.includes(tag));
        if (!hasTag) continue;
      }

      // Calculate keyword match score
      const contentLower = memoryIndex.content.toLowerCase();
      let matchCount = 0;

      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = matchCount / queryWords.length;

        results.push({
          memory: {
            id: memoryIndex.memoryId,
            entityId: memoryIndex.entityId,
            type: memoryIndex.type,
            content: memoryIndex.content,
            tags: memoryIndex.tags,
            metadata: {},
            status: 'active',
            accessCount: 0,
            lastAccessed: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          similarity: score,
          score,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(offset, offset + Math.min(limit, MAX_SEARCH_LIMIT));
  }

  /**
   * Find related memories based on content similarity
   */
  async findRelated(memoryId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    const memoryIndex = this.searchIndex.get(memoryId);
    if (!memoryIndex || !memoryIndex.embedding) {
      return [];
    }

    const relatedResults = vectorService.findSimilar(
      memoryIndex.embedding,
      this.embeddings,
      limit + 1,
      0.1
    );

    const results: SemanticSearchResult[] = [];

    for (const { memoryId: relatedId, similarity } of relatedResults) {
      if (relatedId === memoryId) continue;

      const relatedIndex = this.searchIndex.get(relatedId);
      if (!relatedIndex) continue;

      results.push({
        memory: {
          id: relatedIndex.memoryId,
          entityId: relatedIndex.entityId,
          type: relatedIndex.type,
          content: relatedIndex.content,
          tags: relatedIndex.tags,
          metadata: {},
          status: 'active',
          accessCount: 0,
          lastAccessed: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        similarity,
        score: similarity,
      });
    }

    return results.slice(0, limit);
  }

  /**
   * Calculate text similarity using Jaccard index
   */
  private calculateTextSimilarity(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get search index statistics
   */
  getStats(): { indexedCount: number; withEmbeddings: number; withoutEmbeddings: number } {
    let withEmbeddings = 0;
    let withoutEmbeddings = 0;

    for (const [memoryId] of this.searchIndex) {
      if (this.embeddings.has(memoryId)) {
        withEmbeddings++;
      } else {
        withoutEmbeddings++;
      }
    }

    return {
      indexedCount: this.searchIndex.size,
      withEmbeddings,
      withoutEmbeddings,
    };
  }

  /**
   * Clear the search index
   */
  clear(): void {
    this.searchIndex.clear();
    this.embeddings.clear();
  }
}

// Export singleton instance
export const semanticSearchService = new SemanticSearchService();
export { SemanticSearchService };
