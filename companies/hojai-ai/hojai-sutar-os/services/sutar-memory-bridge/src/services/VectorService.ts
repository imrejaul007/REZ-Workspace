// ============================================================================
// SUTAR Memory Bridge - Vector Storage Service
// ============================================================================

import { EmbeddingVector, EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_MODEL } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

// Simple hash-based embedding generator for demo purposes
// In production, this would call an external embedding API
class VectorService {
  private vectors: Map<string, EmbeddingVector> = new Map();
  private index: Map<string, string> = new Map(); // memoryId -> vectorId

  /**
   * Generate embedding vector for text content
   * Uses a deterministic hash-based approach for consistent results
   */
  async generateEmbedding(text: string, model: string = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);

    // Generate a deterministic but varied embedding based on text content
    const words = normalizedText.split(/\s+/);
    const wordCount = words.length;

    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      // Use multiple hash computations for better distribution
      const hash1 = this.hashCode(normalizedText + i.toString());
      const hash2 = this.hashCode(normalizedText + words[i % wordCount] + i);
      const hash3 = this.hashCode(normalizedText + (i * 7).toString());

      // Combine hashes with trigonometric functions for smooth distribution
      const combined = (hash1 ^ (hash2 << 1) ^ (hash3 << 2)) & 0xFFFFFFFF;
      vector[i] = this.sigmoid(combined) * 2 - 1; // Normalize to [-1, 1]
    }

    // Normalize the vector
    return this.normalizeVector(vector);
  }

  /**
   * Store embedding vector for a memory
   */
  storeEmbedding(memoryId: string, vector: number[], model: string = DEFAULT_EMBEDDING_MODEL): EmbeddingVector {
    const existingId = this.index.get(memoryId);
    if (existingId) {
      this.vectors.delete(existingId);
    }

    const embedding: EmbeddingVector = {
      id: `emb-${uuidv4()}`,
      memoryId,
      vector,
      model,
      dimensions: EMBEDDING_DIMENSIONS,
      createdAt: new Date().toISOString(),
    };

    this.vectors.set(embedding.id, embedding);
    this.index.set(memoryId, embedding.id);

    return embedding;
  }

  /**
   * Get embedding for a memory
   */
  getEmbedding(memoryId: string): EmbeddingVector | null {
    const vectorId = this.index.get(memoryId);
    if (!vectorId) return null;
    return this.vectors.get(vectorId) || null;
  }

  /**
   * Delete embedding for a memory
   */
  deleteEmbedding(memoryId: string): boolean {
    const vectorId = this.index.get(memoryId);
    if (!vectorId) return false;

    this.index.delete(memoryId);
    return this.vectors.delete(vectorId);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Find similar memories by comparing embeddings
   */
  findSimilar(
    queryVector: number[],
    memoryVectors: Map<string, number[]>,
    limit: number = 10,
    minSimilarity: number = 0
  ): Array<{ memoryId: string; similarity: number }> {
    const results: Array<{ memoryId: string; similarity: number }> = [];

    for (const [memoryId, vector] of memoryVectors) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      if (similarity >= minSimilarity) {
        results.push({ memoryId, similarity });
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  /**
   * Batch generate embeddings for multiple texts
   */
  async batchGenerateEmbeddings(texts: string[], model: string = DEFAULT_EMBEDDING_MODEL): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text, model));
    }
    return embeddings;
  }

  /**
   * Get storage statistics
   */
  getStats(): { totalVectors: number; totalDimensions: number; memoryIds: string[] } {
    return {
      totalVectors: this.vectors.size,
      totalDimensions: this.vectors.size * EMBEDDING_DIMENSIONS,
      memoryIds: Array.from(this.index.keys()),
    };
  }

  /**
   * Clear all vectors
   */
  clear(): void {
    this.vectors.clear();
    this.index.clear();
  }

  // Helper: Hash function for deterministic generation
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Helper: Sigmoid function for smooth value distribution
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x / 10000000));
  }

  // Helper: Normalize vector to unit length
  private normalizeVector(vector: number[]): number[] {
    let magnitude = 0;
    for (const val of vector) {
      magnitude += val * val;
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude === 0) {
      // Return a unit vector if all zeros
      const unitVector = new Array<number>(vector.length).fill(0);
      unitVector[0] = 1;
      return unitVector;
    }

    return vector.map(val => val / magnitude);
  }
}

// Export singleton instance
export const vectorService = new VectorService();
export { VectorService };
