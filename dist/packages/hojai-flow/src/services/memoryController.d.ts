/**
 * Hojai Flow - Memory Controller Service
 *
 * Memory hierarchy management:
 * - L1 Hot (RAM, 1-10ms)
 * - L2 Warm (SQLite, 10-50ms)
 * - L3 Personal Cloud (100-300ms)
 * - L4 Organizational (API calls)
 * - L5 Global (API calls)
 */
export type MemoryLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export interface MemoryObject {
    id: string;
    level: MemoryLevel;
    type: string;
    data: unknown;
    version: number;
    timestamp: Date;
    owner: string;
    tags: string[];
    dependencies: string[];
    ttl?: number;
    size: number;
}
export interface MemoryQuery {
    owner: string;
    type?: string;
    tags?: string[];
    since?: Date;
    limit?: number;
}
export interface MemoryContext {
    userId: string;
    currentApp?: string;
    currentConversation?: string;
    recentContacts?: string[];
    recentActions?: string[];
    timeOfDay?: string;
    location?: string;
    merchantContext?: Record<string, unknown>;
}
export declare class MemoryController {
    private l1Cache;
    private l2Store;
    private l3Cache;
    private accessLog;
    private prefetchQueue;
    constructor();
    /**
     * Store memory at appropriate level
     */
    store(owner: string, type: string, data: unknown, options?: {
        level?: MemoryLevel;
        tags?: string[];
        ttl?: number;
    }): Promise<MemoryObject>;
    /**
     * Store in L1 (RAM)
     */
    private storeL1;
    /**
     * Store in L2 (Local DB)
     */
    private storeL2;
    /**
     * Store in L3 (Personal Cloud)
     */
    private storeL3;
    /**
     * Store in cloud (L4/L5)
     */
    private storeCloud;
    /**
     * Retrieve memory with auto-level detection
     */
    retrieve(owner: string, query: MemoryQuery, options?: {
        preferLevel?: MemoryLevel;
    }): Promise<MemoryObject | null>;
    /**
     * Retrieve from L1
     */
    private retrieveFromL1;
    /**
     * Retrieve from L2
     */
    private retrieveFromL2;
    /**
     * Retrieve from L3
     */
    private retrieveFromL3;
    /**
     * Retrieve from cloud
     */
    private retrieveFromCloud;
    /**
     * Check if memory matches query
     */
    private matchesQuery;
    /**
     * Promote memory to higher tier
     */
    private promoteToL1;
    /**
     * Demote memory to lower tier
     */
    private demoteMemory;
    /**
     * Find oldest L1 entry
     */
    private findOldestL1;
    /**
     * Get access count for memory
     */
    private getAccessCount;
    /**
     * Get context for a user
     */
    getContext(userId: string): Promise<MemoryContext>;
    /**
     * Prefetch memory based on context
     */
    prefetch(context: MemoryContext): Promise<void>;
    /**
     * Predict user needs based on context
     */
    private predictNeeds;
    /**
     * Clear expired memories
     */
    cleanup(): Promise<void>;
    /**
     * Get memory statistics
     */
    getStats(): {
        l1Count: number;
        l2Count: number;
        l3Count: number;
        l1Size: number;
        accessCount: number;
    };
    /**
     * Invalidate memory
     */
    invalidate(owner: string, memoryId: string): Promise<void>;
    /**
     * Clear all memory for an owner
     */
    clearOwner(owner: string): Promise<void>;
}
export declare const memoryController: MemoryController;
export default memoryController;
//# sourceMappingURL=memoryController.d.ts.map