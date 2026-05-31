"use strict";
/**
 * HOJAI RAG Service - Document Service
 *
 * Simple in-memory document store with optional vector embedding.
 * For production, replace with actual vector database (Pinecone, Weaviate, etc.)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocument = createDocument;
exports.getDocument = getDocument;
exports.deleteDocument = deleteDocument;
exports.searchDocuments = searchDocuments;
exports.getSearchResultsWithContent = getSearchResultsWithContent;
exports.getAllDocuments = getAllDocuments;
exports.getStorageStats = getStorageStats;
exports.clearAllDocuments = clearAllDocuments;
const uuid_1 = require("uuid");
// In-memory document store
const documents = new Map();
// Namespace index for filtering
const namespaceIndex = new Map();
// Stats
let totalDocuments = 0;
let totalNamespaces = new Set();
/**
 * Generate a simple embedding for text (TF-IDF style cosine similarity).
 * In production, use OpenAI embeddings or similar service.
 */
function generateSimpleEmbedding(text, dimension = 1536) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const wordFreq = new Map();
    words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    // Normalize and create sparse embedding
    const embedding = new Array(dimension).fill(0);
    const uniqueWords = Array.from(wordFreq.keys());
    uniqueWords.slice(0, Math.min(100, uniqueWords.length)).forEach((word, i) => {
        const hash = simpleHash(word);
        const index = hash % dimension;
        embedding[index] = (wordFreq.get(word) || 0) / Math.max(words.length, 1);
    });
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] /= magnitude;
        }
    }
    return embedding;
}
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}
/**
 * Create a new document
 */
function createDocument(title, content, metadata, namespace, dimension = 1536) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    // Generate embedding
    const fullText = `${title} ${content}`;
    const embedding = generateSimpleEmbedding(fullText, dimension);
    const document = {
        id,
        title,
        content,
        metadata,
        embedding,
        created_at: now,
        updated_at: now,
    };
    // Store document
    documents.set(id, document);
    totalDocuments++;
    // Update namespace index
    if (namespace) {
        if (!namespaceIndex.has(namespace)) {
            namespaceIndex.set(namespace, new Set());
            totalNamespaces.add(namespace);
        }
        namespaceIndex.get(namespace).add(id);
    }
    return document;
}
/**
 * Get document by ID
 */
function getDocument(id) {
    return documents.get(id);
}
/**
 * Delete document by ID
 */
function deleteDocument(id) {
    const doc = documents.get(id);
    if (!doc)
        return false;
    const namespace = doc.metadata?.namespace;
    if (namespace) {
        const nsSet = namespaceIndex.get(namespace);
        if (nsSet) {
            nsSet.delete(id);
            if (nsSet.size === 0) {
                namespaceIndex.delete(namespace);
                totalNamespaces.delete(namespace);
            }
        }
    }
    documents.delete(id);
    totalDocuments--;
    return true;
}
/**
 * Search documents by query (simple embedding similarity)
 */
function searchDocuments(query, limit = 10, namespace, minScore = 0, dimension = 1536) {
    const queryEmbedding = generateSimpleEmbedding(query, dimension);
    // Get candidate IDs
    let candidateIds;
    if (namespace) {
        candidateIds = Array.from(namespaceIndex.get(namespace) || []);
    }
    else {
        candidateIds = Array.from(documents.keys());
    }
    // Calculate similarity scores
    const results = [];
    for (const id of candidateIds) {
        const doc = documents.get(id);
        if (!doc || !doc.embedding)
            continue;
        const score = cosineSimilarity(queryEmbedding, doc.embedding);
        if (score >= minScore) {
            results.push({
                id: doc.id,
                score,
                metadata: doc.metadata,
            });
        }
    }
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
}
/**
 * Get document with full content for search results
 */
function getSearchResultsWithContent(query, limit = 10, namespace, minScore = 0, dimension = 1536) {
    const results = searchDocuments(query, limit, namespace, minScore, dimension);
    return results.map(result => {
        const doc = documents.get(result.id);
        return {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            score: result.score,
            metadata: doc.metadata,
        };
    });
}
/**
 * Get all documents (optionally filtered by namespace)
 */
function getAllDocuments(namespace) {
    let ids;
    if (namespace) {
        ids = Array.from(namespaceIndex.get(namespace) || []);
    }
    else {
        ids = Array.from(documents.keys());
    }
    return ids.map(id => documents.get(id)).filter(Boolean);
}
/**
 * Get storage statistics
 */
function getStorageStats() {
    return {
        total_documents: totalDocuments,
        total_namespaces: totalNamespaces.size,
        namespaces: Array.from(totalNamespaces),
    };
}
/**
 * Clear all documents (for testing)
 */
function clearAllDocuments() {
    documents.clear();
    namespaceIndex.clear();
    totalDocuments = 0;
    totalNamespaces.clear();
}
//# sourceMappingURL=documentService.js.map