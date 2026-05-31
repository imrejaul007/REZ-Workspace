/**
 * HOJAI Embedding Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: OpenAI embeddings integration for HOJAI Vector
 */
// ============================================================================
// Validation Schemas (Zod)
// ============================================================================
export const EMBED_MODEL_IDS = ['text-embedding-3-small', 'text-embedding-3-large'];
/**
 * Validation schema for single embed request
 */
export const embedRequestSchema = {
    text: {
        type: 'string',
        minLength: 1,
        maxLength: 8192,
        description: 'Text to embed (max 8192 characters)',
    },
    model: {
        type: 'string',
        enum: EMBED_MODEL_IDS,
        default: 'text-embedding-3-small',
        description: 'Embedding model to use',
    },
};
/**
 * Validation schema for batch embed request
 */
export const batchEmbedRequestSchema = {
    texts: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        description: 'Array of texts to embed (max 100 items)',
    },
    model: {
        type: 'string',
        enum: EMBED_MODEL_IDS,
        default: 'text-embedding-3-small',
        description: 'Embedding model to use',
    },
};
//# sourceMappingURL=index.js.map