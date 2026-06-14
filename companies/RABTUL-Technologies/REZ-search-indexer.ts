/**
 * Search Indexer - Event-Driven Product Indexing
 * RABTUL - Real-time search updates via Kafka/Pulsar
 */

import { redis } from './config/redis';

const INDEX_PREFIX = 'search:index:';
const PRODUCT_EVENTS = ['product.created', 'product.updated', 'product.deleted'];

/**
 * Handle product event
 */
export async function handleProductEvent(event: {
  type: string;
  productId: string;
  data: { name?: string; description?: string; category?: string };
}): Promise<void> {
  if (!PRODUCT_EVENTS.includes(event.type)) return;

  switch (event.type) {
    case 'product.created':
    case 'product.updated':
      await indexProduct(event.productId, event.data);
      break;
    case 'product.deleted':
      await deleteProduct(event.productId);
      break;
  }
}

/**
 * Index product with embedding
 */
async function indexProduct(id: string, data: Record<string, string>): Promise<void> {
  const text = [data.name, data.description, data.category].filter(Boolean).join(' ');
  const embedding = await generateEmbedding(text);

  await redis.set(`${INDEX_PREFIX}product:${id}`, JSON.stringify({
    id,
    text,
    embedding,
    data,
    indexedAt: Date.now(),
  }));

  await redis.zadd('search:products', Date.now(), id);
}

/**
 * Delete product
 */
async function deleteProduct(id: string): Promise<void> {
  await redis.del(`${INDEX_PREFIX}product:${id}`);
  await redis.zrem('search:products', id);
}

/**
 * Generate embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${process.env.OPENAI_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text, model: 'text-embedding-3-small' }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`[SearchIndexer] OpenAI API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('[SearchIndexer] Failed to generate embedding:', error);
    return [];
  }
}

/**
 * Semantic search
 */
export async function searchProducts(query: string, limit = 20): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(query);
  const productIds = await redis.zrange('search:products', 0, -1);

  const scored: Array<{ id: string; score: number }> = [];

  for (const id of productIds.slice(0, 100)) {
    const stored = await redis.get(`${INDEX_PREFIX}product:${id}`);
    if (!stored) continue;

    const { embedding } = JSON.parse(stored);
    const score = cosineSimilarity(queryEmbedding, embedding);
    scored.push({ id, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.id);
}

/**
 * Cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}
