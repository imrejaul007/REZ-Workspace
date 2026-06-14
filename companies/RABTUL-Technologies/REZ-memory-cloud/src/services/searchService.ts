/**
 * REZ Memory Cloud - Search Service (Hybrid Vector + Keyword)
 */

import OpenAI from 'openai';
import { Memory, RecallMemoryInput, IMemory } from '../models/Memory.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface InternalSearchResult {
  memory: IMemory;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
  semanticScore?: number;
  keywordScore?: number;
}

export interface SearchResult {
  memory: IMemory;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

export class SearchService {
  private openai: OpenAI | null = null;

  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    }
  }

  /**
   * Hybrid search combining semantic (vector) and keyword search
   */
  async search(input: RecallMemoryInput): Promise<SearchResult[]> {
    const { userId, query, limit, categories, tags, importance, since, before } = input;

    // Build MongoDB query
    const mongoQuery: Record<string, unknown> = { userId };

    if (categories && categories.length > 0) {
      mongoQuery.category = { $in: categories };
    }

    if (tags && tags.length > 0) {
      mongoQuery.tags = { $all: tags };
    }

    if (importance) {
      mongoQuery.importance = importance;
    }

    if (since || before) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (since) dateFilter.$gte = new Date(since);
      if (before) dateFilter.$lte = new Date(before);
      mongoQuery.createdAt = dateFilter;
    }

    // Get candidate memories
    const candidates = await Memory.find(mongoQuery)
      .sort({ importance: -1, createdAt: -1 })
      .limit(100);

    if (candidates.length === 0) {
      return [];
    }

    // Perform hybrid search
    if (this.openai && config.openai.apiKey) {
      return this.hybridSearch(candidates, query, limit || 10);
    } else {
      // Fallback to keyword-only search
      return this.keywordSearch(candidates, query, limit || 10);
    }
  }

  /**
   * Hybrid search with semantic + keyword
   */
  private async hybridSearch(
    candidates: IMemory[],
    query: string,
    limit: number
  ): Promise<InternalSearchResult[]> {
    try {
      // Get query embedding
      const queryEmbedding = await this.getEmbedding(query);

      // Score each candidate
      const scored = await Promise.all(
        candidates.map(async (memory) => {
          const semanticScore = await this.cosineSimilarity(
            queryEmbedding,
            memory.metadata?.embedding as number[] || []
          );

          const keywordScore = this.keywordMatchScore(query, memory.content, memory.summary);

          // RRF fusion with weights
          const semanticRank = this.getRank(semanticScore, candidates.length);
          const keywordRank = this.getRank(keywordScore, candidates.length);
          const hybridScore = 0.6 * (1 / (60 + semanticRank)) + 0.4 * (1 / (60 + keywordRank));

          let matchType: 'semantic' | 'keyword' | 'hybrid' = 'hybrid';
          if (semanticScore > 0.7) {
            matchType = 'semantic';
          } else if (keywordScore > 0.5) {
            matchType = 'keyword';
          }

          return {
            memory,
            semanticScore,
            keywordScore,
            hybridScore,
            matchType,
          };
        })
      );

      // Sort by hybrid score and return top results
      const sortedResults = scored
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit)
        .map((result): SearchResult => ({
          memory: result.memory,
          score: Math.round(result.hybridScore * 100) / 100,
          matchType: result.matchType,
        }));
      return sortedResults;
    } catch (error) {
      logger.error({ msg: 'Hybrid search failed, falling back to keyword', error });
      return this.keywordSearch(candidates, query, limit);
    }
  }

  /**
   * Keyword-only search using MongoDB text score
   */
  private async keywordSearch(
    candidates: IMemory[],
    query: string,
    limit: number
  ): Promise<SearchResult[]> {
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scored = candidates.map((memory) => {
      const content = memory.content.toLowerCase();
      const summary = (memory.summary || '').toLowerCase();

      let score = 0;

      // Exact phrase match
      if (content.includes(query.toLowerCase())) {
        score += 10;
      }

      // Term frequency
      for (const term of queryTerms) {
        const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
        const summaryMatches = (summary.match(new RegExp(term, 'g')) || []).length;
        score += contentMatches * 2 + summaryMatches * 3;
      }

      // Importance bonus
      const importanceBonus = { critical: 5, high: 3, medium: 1, low: 0 };
      score += importanceBonus[memory.importance as keyof typeof importanceBonus] || 0;

      // Recency bonus
      const ageInDays = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) score += 3;
      else if (ageInDays < 30) score += 1;

      return {
        memory,
        score: score / 10,
        matchType: 'keyword' as const,
      };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get OpenAI embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.openai.embeddings.create({
      model: config.openai.model,
      input: text.slice(0, 8000), // Token limit safety
    });

    return response.data[0].embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private async cosineSimilarity(a: number[], b: number[]): Promise<number> {
    if (a.length !== b.length || a.length === 0) {
      return 0;
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
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Get rank score for RRF
   */
  private getRank(score: number, total: number): number {
    // Normalize score and invert for ranking
    return total - Math.floor(score * total);
  }

  /**
   * Calculate keyword match score
   */
  private keywordMatchScore(query: string, content: string, summary?: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    const summaryLower = (summary || '').toLowerCase();

    let score = 0;

    for (const term of queryTerms) {
      // Check for exact term match using word boundaries
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      const contentMatches = (contentLower.match(wordBoundaryRegex) || []).length;
      const summaryMatches = (summaryLower.match(wordBoundaryRegex) || []).length;

      score += contentMatches * 1 + summaryMatches * 2;
    }

    // Normalize by query length
    return Math.min(score / queryTerms.length, 1);
  }

  /**
   * Generate embedding for a memory
   */
  async embedContent(content: string): Promise<number[]> {
    return this.getEmbedding(content);
  }
}

export const searchService = new SearchService();
