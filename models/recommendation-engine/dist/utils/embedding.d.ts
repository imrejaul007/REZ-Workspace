/**
 * HOJAI AI Recommendation Engine - Embedding Utilities
 */
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Generate a random embedding vector of given dimension
 * In production, this would come from an embedding model
 */
export declare function generateRandomEmbedding(dimension?: number): number[];
/**
 * Generate embedding from text (simplified hash-based)
 * In production, use actual embedding model
 */
export declare function textToEmbedding(text: string, dimension?: number): number[];
/**
 * Find top N most similar items to a given embedding
 */
export declare function findMostSimilar(targetEmbedding: number[], embeddings: Array<{
    id: string;
    name: string;
    embedding: number[];
}>, limit?: number): Array<{
    id: string;
    name: string;
    similarity: number;
}>;
//# sourceMappingURL=embedding.d.ts.map