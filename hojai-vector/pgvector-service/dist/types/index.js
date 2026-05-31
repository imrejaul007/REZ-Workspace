/**
 * HOJAI pgvector Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Vector storage and similarity search types
 */
// Validation constants
export const EMBEDDING_DIMENSIONS = {
    OPENAI_ADA_002: 1536,
    OPENAI_TEXT_EMBEDDING_3_LARGE: 3072,
    COHERE_EMBED_EN: 1024,
    DEFAULT: 1536,
};
export const VECTOR_LIMITS = {
    MAX_DIMENSIONS: 16384,
    MIN_DIMENSIONS: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 1000,
};
export const SIMILARITY_METRICS = {
    COSINE: 'cosine',
    EUCLIDEAN: 'euclidean',
    DOT_PRODUCT: 'dot_product',
};
//# sourceMappingURL=index.js.map