/**
 * Hojai Memory Service
 * Version: 1.0 | Port: 4520
 * Vector store, customer memory, and timeline
 */
export interface Memory {
    id: string;
    tenantId: string;
    userId?: string;
    type: 'fact' | 'preference' | 'context' | 'interaction' | 'learning';
    content: string;
    embedding?: number[];
    importance: number;
    tags?: string[];
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}
export interface VectorIndex {
    id: string;
    tenantId: string;
    name: string;
    dimension: number;
    metric: 'cosine' | 'euclidean' | 'dotproduct';
    createdAt: string;
}
export interface TimelineEntry {
    id: string;
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    description?: string;
    timestamp: string;
    duration?: number;
    metadata?: Record<string, unknown>;
}
export declare const memoryStore: Map<string, Memory[]>;
export declare const vectorIndexStore: VectorIndex[];
export declare const timelineStore: Map<string, TimelineEntry[]>;
interface TenantContext {
    tenant_id: string;
    user_id?: string;
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
declare function cosineSimilarity(a: number[], b: number[]): number;
declare function textToEmbedding(text: string): number[];
declare class HojaiMemory {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private groupByType;
    start(): void;
}
declare const memory: HojaiMemory;
export { HojaiMemory, cosineSimilarity, textToEmbedding };
export default memory;
//# sourceMappingURL=index.d.ts.map