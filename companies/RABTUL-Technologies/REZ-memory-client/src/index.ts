/**
 * REZ Memory Cloud SDK
 * Easy integration for AI memory infrastructure
 */

export interface MemoryData {
  userId: string;
  content: string;
  title?: string;
  url?: string;
  tags?: string[];
  type?: 'page' | 'note' | 'chat' | 'highlight' | 'link';
  metadata?: Record<string, unknown>;
  ttl?: number; // Time to live in days
}

export interface MemoryResponse {
  id: string;
  userId: string;
  content: string;
  title?: string;
  url?: string;
  tags: string[];
  type: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface SearchOptions {
  query: string;
  userId: string;
  limit?: number;
  type?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface SearchResponse {
  results: Array<{
    memory: MemoryResponse;
    score: number;
    highlights: string[];
  }>;
  total: number;
  query: string;
  took: number;
}

export interface ProfileData {
  userId: string;
  name?: string;
  email?: string;
  preferences?: {
    defaultTtl?: number;
    autoTag?: boolean;
    summarization?: boolean;
  };
}

export interface GraphNode {
  id: string;
  type: 'person' | 'concept' | 'topic' | 'entity';
  name: string;
  properties: Record<string, unknown>;
  memoryCount: number;
  createdAt: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  createdAt: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExtractedContent {
  url: string;
  content: string;
  title: string;
  description?: string;
  author?: string;
  siteName?: string;
  favicon?: string;
  links: Array<{ url: string; text: string }>;
  images: Array<{ url: string; alt: string }>;
  timestamp: number;
}

export class REZMemoryClient {
  private apiBaseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(options: {
    apiUrl?: string;
    apiKey?: string;
    timeout?: number;
  } = {}) {
    this.apiBaseUrl = options.apiUrl || 'http://localhost:4210';
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const url = `${this.apiBaseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`REZ Memory API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // ==================== MEMORY OPERATIONS ====================

  /**
   * Remember (save) new content to memory
   */
  async remember(data: MemoryData): Promise<MemoryResponse> {
    return this.request<MemoryResponse>('POST', '/api/memories', data);
  }

  /**
   * Recall (get) a specific memory by ID
   */
  async recall(memoryId: string, userId: string): Promise<MemoryResponse> {
    return this.request<MemoryResponse>(
      'GET',
      `/api/memories/${memoryId}?userId=${encodeURIComponent(userId)}`
    );
  }

  /**
   * List all memories for a user
   */
  async listMemories(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      type?: string;
      tags?: string[];
    } = {}
  ): Promise<{ memories: MemoryResponse[]; total: number }> {
    const params = new URLSearchParams({
      userId,
      ...(options.limit && { limit: String(options.limit) }),
      ...(options.skip && { skip: String(options.skip) }),
      ...(options.type && { type: options.type }),
      ...(options.tags && { tags: options.tags.join(',') }),
    });

    return this.request('GET', `/api/memories?${params}`);
  }

  /**
   * Update a memory
   */
  async updateMemory(
    memoryId: string,
    userId: string,
    updates: Partial<MemoryData>
  ): Promise<MemoryResponse> {
    return this.request<MemoryResponse>(
      'PATCH',
      `/api/memories/${memoryId}?userId=${encodeURIComponent(userId)}`,
      updates
    );
  }

  /**
   * Delete a memory
   */
  async forget(memoryId: string, userId: string): Promise<{ success: boolean }> {
    return this.request(
      'DELETE',
      `/api/memories/${memoryId}?userId=${encodeURIComponent(userId)}`
    );
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Search memories using hybrid search (vector + keyword)
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: options.query,
      userId: options.userId,
      ...(options.limit && { limit: String(options.limit) }),
      ...(options.type && { type: options.type }),
      ...(options.tags && { tags: options.tags.join(',') }),
      ...(options.fromDate && { fromDate: options.fromDate }),
      ...(options.toDate && { toDate: options.toDate }),
    });

    return this.request<SearchResponse>('GET', `/api/search?${params}`);
  }

  /**
   * Semantic search - find similar memories
   */
  async findSimilar(
    userId: string,
    content: string,
    limit: number = 5
  ): Promise<SearchResponse> {
    return this.search({ query: content, userId, limit });
  }

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<ProfileData> {
    return this.request<ProfileData>('GET', `/api/profiles/${userId}`);
  }

  /**
   * Create or update user profile
   */
  async saveProfile(data: ProfileData): Promise<ProfileData> {
    return this.request<ProfileData>('POST', '/api/profiles', data);
  }

  /**
   * Update profile preferences
   */
  async updatePreferences(
    userId: string,
    preferences: ProfileData['preferences']
  ): Promise<ProfileData> {
    return this.request<ProfileData>(
      'PATCH',
      `/api/profiles/${userId}/preferences`,
      preferences
    );
  }

  // ==================== KNOWLEDGE GRAPH ====================

  /**
   * Get knowledge graph for a user
   */
  async getGraph(userId: string): Promise<GraphResponse> {
    return this.request<GraphResponse>('GET', `/api/graph/${userId}`);
  }

  /**
   * Get specific entity from graph
   */
  async getEntity(
    userId: string,
    entityId: string
  ): Promise<GraphNode | null> {
    try {
      return await this.request<GraphNode>(
        'GET',
        `/api/graph/${userId}/entities/${entityId}`
      );
    } catch {
      return null;
    }
  }

  /**
   * Get memories related to an entity
   */
  async getEntityMemories(
    userId: string,
    entityId: string
  ): Promise<MemoryResponse[]> {
    return this.request<MemoryResponse[]>(
      'GET',
      `/api/graph/${userId}/entities/${entityId}/memories`
    );
  }

  // ==================== CONTENT EXTRACTION ====================

  /**
   * Extract content from URL
   */
  async extractFromUrl(url: string): Promise<ExtractedContent> {
    return this.request<ExtractedContent>('POST', '/api/extract/url', { url });
  }

  /**
   * Extract content from text
   */
  async extractFromText(text: string): Promise<{
    content: string;
    title?: string;
    tags: string[];
    entities: string[];
  }> {
    return this.request('POST', '/api/extract/text', { text });
  }

  // ==================== UTILITY ====================

  /**
   * Check if the service is healthy
   */
  async health(): Promise<{ status: string; uptime: number }> {
    return this.request('GET', '/api/health');
  }

  /**
   * Get memory statistics for a user
   */
  async getStats(userId: string): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    byTag: Record<string, number>;
    avgContentLength: number;
  }> {
    return this.request('GET', `/api/memories/${userId}/stats`);
  }
}



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-memory-client',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
