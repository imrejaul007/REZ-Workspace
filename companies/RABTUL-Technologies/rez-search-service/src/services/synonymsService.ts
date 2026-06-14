/**
 * Synonyms Service for Search
 * Day 5-7: Search Improvements
 */

import { redis } from '../config/redis';

const SYNONYMS_KEY = 'search:synonyms:';
const SYNONYMS_INDEX = 'search:synonyms:index';
const SYNONYM_TTL = 86400 * 30; // 30 days

interface SynonymRule {
  id: string;
  terms: string[];
  category?: string;
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add synonym rule
 */
export async function addSynonym(terms: string[]): Promise<SynonymRule> {
  const id = crypto.randomUUID();
  const rule: SynonymRule = {
    id,
    terms: terms.map(t => t.toLowerCase().trim()),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await redis.hset(`${SYNONYMS_KEY}${id}`, rule as unknown);
  await redis.expire(`${SYNONYMS_KEY}${id}`, SYNONYM_TTL);

  // Add to index
  await redis.sadd(SYNONYMS_INDEX, id);

  // Index terms for reverse lookup
  for (const term of rule.terms) {
    await redis.sadd(`search:term:${term}`, id);
  }

  return rule;
}

/**
 * Get all synonyms
 */
export async function getSynonyms(): Promise<SynonymRule[]> {
  const ids = await redis.smembers(SYNONYMS_INDEX);
  const rules: SynonymRule[] = [];

  for (const id of ids) {
    const rule = await redis.hgetall(`${SYNONYMS_KEY}${id}`);
    if (rule) rules.push(rule as SynonymRule);
  }

  return rules;
}

/**
 * Expand query with synonyms
 */
export function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set(words);

  // Sync expansion (optimized with background job)
  for (const word of words) {
    const synonymIds = redis.smembers(`search:term:${word}`);
    for (const id of synonymIds) {
      const rule = redis.hgetall(`${SYNONYMS_KEY}${id}`);
      if (rule) {
        rule.terms.forEach(t => expanded.add(t));
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Bulk import synonyms
 */
export async function importSynonyms(rules: string[][]): Promise<{ imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;

  for (const terms of rules) {
    try {
      await addSynonym(terms);
      imported++;
    } catch (e) {
      errors.push(`Failed: ${terms.join(', ')}`);
    }
  }

  return { imported, errors };
}
