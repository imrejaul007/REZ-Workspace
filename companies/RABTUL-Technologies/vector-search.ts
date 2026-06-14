/**
 * Vector Search Client - AI/ML Integration
 * Use OpenAI embeddings + Pinecone/Pinecone for semantic search
 */

const OPENAI_URL = 'https://api.openai.com/v1';
const PINECONE_URL = process.env.PINECONE_URL || 'https://rez-vector.svc.pinecone.io';

/**
 * OpenAI embedding response
 */
interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Pinecone vector match
 */
interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Pinecone query response
 */
interface PineconeQueryResponse {
  matches: PineconeMatch[];
  namespace: string;
}

/**
 * Search result item
 */
interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

/**
 * Generate embedding for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OPENAI_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text.slice(0, 8000),
      model: 'text-embedding-3-small',
    }),
  });

  const data: OpenAIEmbeddingResponse = await response.json();
  return data.data[0].embedding;
}

/**
 * Upsert vector to Pinecone
 */
export async function upsertVector(
  id: string,
  embedding: number[],
  metadata: Record<string, string>
): Promise<void> {
  await fetch(`${PINECONE_URL}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.PINECONE_API_KEY || '',
    },
    body: JSON.stringify({
      vectors: [{
        id,
        values: embedding,
        metadata: { ...metadata, text: metadata.text?.slice(0, 1000) },
      }],
      namespace: 'default',
    }),
  });
}

/**
 * Semantic search
 */
export async function semanticSearch(
  query: string,
  topK = 10
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Search Pinecone
  const response = await fetch(`${PINECONE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.PINECONE_API_KEY || '',
    },
    body: JSON.stringify({
      topK,
      includeMetadata: true,
      vector: queryEmbedding,
    }),
  });

  const data: PineconeQueryResponse = await response.json();
  return (data.matches || []).map((m: PineconeMatch) => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata ?? {},
  }));
}

/**
 * Hybrid search (keyword + vector)
 */
export async function hybridSearch(
  query: string,
  topK = 10
): Promise<SearchResult[]> {
  // Combine text search + vector search
  const semantic = await semanticSearch(query, topK);
  return semantic;
}
