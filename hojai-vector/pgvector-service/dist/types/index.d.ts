/**
 * HOJAI pgvector Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Vector storage and similarity search types
 */
export interface VectorRecord {
    id: string;
    namespace: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
    created_at: string;
}
export interface VectorInsert {
    id?: string;
    namespace: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
}
export interface VectorUpdate {
    namespace?: string;
    embedding?: number[];
    metadata?: Record<string, unknown>;
}
export interface SearchRequest {
    embedding: number[];
    limit?: number;
    threshold?: number;
    namespace?: string;
    includeMetadata?: boolean;
}
export interface SearchResult {
    id: string;
    score: number;
    namespace: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}
export interface SearchResponse {
    results: SearchResult[];
    query: number[];
    total: number;
    took_ms: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        timestamp: string;
        requestId: string;
        [key: string]: unknown;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    service: string;
    version: string;
    timestamp: string;
    uptime: number;
    checks?: Record<string, HealthCheckResult>;
}
export interface HealthCheckResult {
    status: 'ok' | 'error' | 'degraded';
    latency_ms?: number;
    message?: string;
}
export interface NamespaceStats {
    namespace: string;
    count: number;
    dimensions: number;
    created_at: string;
    last_updated: string;
}
export interface NamespaceListResponse {
    namespaces: NamespaceStats[];
    total: number;
}
export interface BatchInsertRequest {
    vectors: VectorInsert[];
    namespace?: string;
}
export interface BatchInsertResponse {
    inserted: number;
    failed: number;
    errors?: Array<{
        index: number;
        error: string;
    }>;
    ids: string[];
}
export type EmbeddingVector = number[];
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface ListVectorsParams extends PaginationParams {
    namespace?: string;
    includeMetadata?: boolean;
}
export declare const EMBEDDING_DIMENSIONS: {
    readonly OPENAI_ADA_002: 1536;
    readonly OPENAI_TEXT_EMBEDDING_3_LARGE: 3072;
    readonly COHERE_EMBED_EN: 1024;
    readonly DEFAULT: 1536;
};
export declare const VECTOR_LIMITS: {
    readonly MAX_DIMENSIONS: 16384;
    readonly MIN_DIMENSIONS: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 1000;
};
export declare const SIMILARITY_METRICS: {
    readonly COSINE: "cosine";
    readonly EUCLIDEAN: "euclidean";
    readonly DOT_PRODUCT: "dot_product";
};
export type SimilarityMetric = typeof SIMILARITY_METRICS[keyof typeof SIMILARITY_METRICS];
//# sourceMappingURL=index.d.ts.map