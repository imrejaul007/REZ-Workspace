import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { KnowledgeDocument, SearchResult, SearchQuery, IndexStats } from '../models/knowledge';
import logger from '../utils/logger';

// In-memory storage
const documents: Map<string, KnowledgeDocument> = new Map();
const indexName = 'default';

// OpenAI API for real embeddings
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
const EMBEDDING_DIMENSION = 1536;

// OpenAI API key (set in environment)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Cache for embeddings to reduce API calls
const embeddingCache: Map<string, number[]> = new Map();

/**
 * Generate embedding using OpenAI API (real production embeddings)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  // If no API key, fall back to deterministic hash-based embedding
  if (!OPENAI_API_KEY) {
    logger.warn('OpenAI API key not set, using deterministic fallback embeddings');
    return generateFallbackEmbedding(text);
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSION
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const embedding = response.data.data[0].embedding;

    // Cache the result
    embeddingCache.set(text, embedding);

    // Limit cache size to prevent memory issues
    if (embeddingCache.size > 10000) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }

    return embedding;
  } catch (error) {
    logger.error('OpenAI embedding failed, using fallback', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding using deterministic hash
 * Not as good as OpenAI but consistent for development
 */
function generateFallbackEmbedding(text: string): number[] {
  const dimension = EMBEDDING_DIMENSION;
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding: number[] = [];

  for (let i = 0; i < dimension; i++) {
    embedding.push(Math.sin(seed * (i + 1) * 0.1) * 0.5 + 0.5);
  }

  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const indexDocument = async (content: string, metadata: Partial<KnowledgeDocument['metadata']>): Promise<KnowledgeDocument> => {
  const id = `doc_${uuid()}`;
  const now = new Date().toISOString();
  const embedding = await generateEmbedding(content);

  const doc: KnowledgeDocument = {
    id,
    content,
    metadata: {
      source: metadata.source || 'unknown',
      title: metadata.title,
      type: metadata.type || 'text',
      tags: metadata.tags || [],
      category: metadata.category,
      author: metadata.author,
      language: metadata.language || 'en',
      url: metadata.url,
      userId: metadata.userId,
      companyId: metadata.companyId,
    },
    embedding,
    createdAt: now,
    updatedAt: now,
  };

  documents.set(id, doc);
  logger.info(`Document indexed: ${id}`);

  return doc;
};

export const getDocument = (id: string): KnowledgeDocument | undefined => {
  return documents.get(id);
};

export const deleteDocument = (id: string): boolean => {
  return documents.delete(id);
};

export const updateDocument = async (id: string, updates: { content?: string; metadata?: Partial<KnowledgeDocument['metadata']> }): Promise<KnowledgeDocument | undefined> => {
  const doc = documents.get(id);
  if (!doc) return undefined;

  if (updates.content) {
    doc.content = updates.content;
    doc.embedding = await generateEmbedding(updates.content);
  }
  if (updates.metadata) {
    doc.metadata = { ...doc.metadata, ...updates.metadata };
  }
  doc.updatedAt = new Date().toISOString();

  return doc;
};

export const search = async (query: SearchQuery): Promise<SearchResult[]> => {
  const { query: queryText, filters, limit = 10, hybrid = true } = query;

  logger.info(`Searching for: "${queryText}"`);

  // Generate query embedding
  const queryEmbedding = generateEmbedding(queryText);

  // Text search fallback
  const textMatches = hybrid ? textSearch(queryText, documents) : [];

  // Vector search
  const results: SearchResult[] = [];

  for (const doc of documents.values()) {
    // Apply filters
    if (filters) {
      if (filters.source && doc.metadata.source !== filters.source) continue;
      if (filters.type && doc.metadata.type !== filters.type) continue;
      if (filters.category && doc.metadata.category !== filters.category) continue;
      if (filters.userId && doc.metadata.userId !== filters.userId) continue;
      if (filters.companyId && doc.metadata.companyId !== filters.companyId) continue;
      if (filters.tags && !filters.tags.some(tag => doc.metadata.tags.includes(tag))) continue;
      if (filters.dateFrom && doc.createdAt < filters.dateFrom) continue;
      if (filters.dateTo && doc.createdAt > filters.dateTo) continue;
    }

    // Calculate vector similarity
    const vectorScore = cosineSimilarity(queryEmbedding, doc.embedding || []);

    // Text match score
    const textScore = textMatches.find(m => m.id === doc.id)?.score || 0;

    // Hybrid score (RRF - Reciprocal Rank Fusion)
    const rankVector = 1 / (1 + 0); // Vector rank
    const rankText = textScore > 0 ? 1 / (1 + 0) : 0; // Text rank
    const hybridScore = 0.5 * rankVector + 0.5 * rankText;

    const finalScore = hybrid ? hybridScore : vectorScore;

    results.push({
      id: doc.id,
      content: doc.content,
      score: hybrid ? hybridScore : vectorScore,
      metadata: doc.metadata,
      highlights: highlightMatches(doc.content, queryText),
    });
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
};

function textSearch(query: string, docs: Map<string, KnowledgeDocument>): { id: string; score: number }[] {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const matches: { id: string; score: number }[] = [];

  for (const doc of docs.values()) {
    const content = doc.content.toLowerCase();
    let matchCount = 0;

    for (const term of queryTerms) {
      if (content.includes(term)) {
        matchCount++;
        // Bonus for exact phrase match
        if (content.includes(query.toLowerCase())) {
          matchCount += 2;
        }
      }
    }

    if (matchCount > 0) {
      matches.push({
        id: doc.id,
        score: matchCount / queryTerms.length,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function highlightMatches(content: string, query: string, maxLength = 200): string[] {
  const highlights: string[] = [];
  const lowerContent = content.toLowerCase();
  const queryTerms = query.toLowerCase().split(/\s+/);

  for (const term of queryTerms) {
    const idx = lowerContent.indexOf(term);
    if (idx !== -1) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(content.length, idx + term.length + 50);
      highlights.push('...' + content.substring(start, end) + '...');
    }
  }

  return highlights.slice(0, 3);
}

export const getStats = (): IndexStats => {
  return {
    totalDocuments: documents.size,
    totalChunks: documents.size,
    indexSize: Array.from(documents.values()).reduce((sum, doc) => sum + doc.content.length, 0),
    lastUpdated: new Date().toISOString(),
  };
};

export const getDocumentsBySource = (source: string): KnowledgeDocument[] => {
  return Array.from(documents.values()).filter(doc => doc.metadata.source === source);
};

export const getDocumentsByUser = (userId: string): KnowledgeDocument[] => {
  return Array.from(documents.values()).filter(doc => doc.metadata.userId === userId);
};

export const bulkIndex = (items: { content: string; metadata?: Partial<KnowledgeDocument['metadata']> }[]): KnowledgeDocument[] => {
  return items.map(item => indexDocument(item.content, item.metadata || {}));
};
