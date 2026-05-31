"use strict";
/**
 * HOJAI AI Recommendation Engine - Embedding Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
exports.generateRandomEmbedding = generateRandomEmbedding;
exports.textToEmbedding = textToEmbedding;
exports.findMostSimilar = findMostSimilar;
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same dimension');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
        return 0;
    }
    return dotProduct / denominator;
}
/**
 * Generate a random embedding vector of given dimension
 * In production, this would come from an embedding model
 */
function generateRandomEmbedding(dimension = 128) {
    const embedding = [];
    let sum = 0;
    for (let i = 0; i < dimension; i++) {
        // Generate random value between -1 and 1
        const value = (Math.random() * 2) - 1;
        embedding.push(value);
        sum += value * value;
    }
    // Normalize the vector
    const magnitude = Math.sqrt(sum);
    return embedding.map(v => v / magnitude);
}
/**
 * Generate embedding from text (simplified hash-based)
 * In production, use actual embedding model
 */
function textToEmbedding(text, dimension = 128) {
    const embedding = new Array(dimension).fill(0);
    // Simple hash-based embedding
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const bucket = charCode % dimension;
        embedding[bucket] += (charCode / 255) * 0.1;
    }
    // Normalize
    let sum = 0;
    for (const v of embedding) {
        sum += v * v;
    }
    const magnitude = Math.sqrt(sum);
    if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] /= magnitude;
        }
    }
    return embedding;
}
/**
 * Find top N most similar items to a given embedding
 */
function findMostSimilar(targetEmbedding, embeddings, limit = 10) {
    const similarities = embeddings.map(item => ({
        id: item.id,
        name: item.name,
        similarity: cosineSimilarity(targetEmbedding, item.embedding),
    }));
    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
}
//# sourceMappingURL=embedding.js.map