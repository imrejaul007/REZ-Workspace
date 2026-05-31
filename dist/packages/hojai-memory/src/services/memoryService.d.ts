import { Memory, MemoryType, TimelineEvent, Context, Profile, ConversationMessage } from '../types/index.js';
import { ConversationDocument } from '../models/memoryModel.js';
export declare class MemoryService {
    private redis;
    private readonly CACHE_TTL;
    constructor();
    /**
     * Store a new memory
     */
    storeMemory(tenantId: string, params: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<Memory>;
    /**
     * Get memories for a user
     */
    getMemories(params: {
        tenantId: string;
        userId: string;
        type?: MemoryType;
        limit?: number;
        offset?: number;
        since?: Date;
    }): Promise<{
        memories: Memory[];
        total: number;
    }>;
    /**
     * Search memories by content
     */
    searchMemories(params: {
        tenantId: string;
        userId: string;
        query: string;
        limit?: number;
    }): Promise<Memory[]>;
    /**
     * Update memory access
     */
    accessMemory(tenantId: string, memoryId: string): Promise<void>;
    /**
     * Delete memory
     */
    deleteMemory(tenantId: string, memoryId: string): Promise<void>;
    /**
     * Add event to timeline
     */
    addToTimeline(tenantId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>): Promise<TimelineEvent>;
    /**
     * Get user timeline
     */
    getTimeline(params: {
        tenantId: string;
        userId: string;
        types?: string[];
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: TimelineEvent[];
        total: number;
    }>;
    /**
     * Get or create session context
     */
    getContext(params: {
        tenantId: string;
        userId: string;
        sessionId?: string;
    }): Promise<Context | null>;
    /**
     * Update session context
     */
    updateContext(params: {
        tenantId: string;
        userId: string;
        sessionId: string;
        updates: Partial<Context>;
    }): Promise<Context>;
    /**
     * Get or create profile
     */
    getProfile(tenantId: string, identifier: {
        userId?: string;
        email?: string;
        phone?: string;
    }): Promise<Profile | null>;
    /**
     * Create profile
     */
    createProfile(params: {
        tenantId: string;
        userId?: string;
        email?: string;
        phone?: string;
        name?: string;
    }): Promise<Profile>;
    /**
     * Update profile
     */
    updateProfile(tenantId: string, identifier: {
        userId?: string;
        email?: string;
        phone?: string;
    }, updates: Partial<Profile>): Promise<Profile | null>;
    /**
     * Create or continue conversation
     */
    getConversation(params: {
        tenantId: string;
        userId: string;
        conversationId?: string;
    }): Promise<ConversationDocument | null>;
    /**
     * Add message to conversation
     */
    addMessage(params: {
        tenantId: string;
        conversationId: string;
        message: Omit<ConversationMessage, 'id' | 'createdAt'>;
    }): Promise<ConversationMessage>;
    private cacheMemory;
    getCachedMemory(tenantId: string, memoryId: string): Promise<Memory | null>;
    /**
     * Store memories from events
     */
    processEventMemories(tenantId: string, event: Record<string, unknown>): Promise<void>;
    /**
     * Get memories by tier - implements local-first priority
     * L1 → L2 → L3 → L4 → L5 (L1 is fastest/most local)
     */
    getMemoriesByTier(params: {
        tenantId: string;
        userId: string;
        entityId?: string;
        tier: MemoryTier;
        limit?: number;
    }): Promise<Memory[]>;
    /**
     * Store memory with automatic tier assignment
     */
    storeMemoryWithTier(params: {
        tenantId: string;
        userId: string;
        entityId: string;
        entityType: 'user' | 'merchant' | 'product' | 'session';
        type: MemoryType;
        content: string;
        data?: Record<string, unknown>;
        tier: MemoryTier;
        importance?: number;
        confidence?: number;
    }): Promise<Memory>;
    /**
     * Get full context from all tiers (L1 → L5 priority)
     * This is the main method for Hojai Flow's "Memory Before Models" principle
     */
    getFullContext(params: {
        tenantId: string;
        userId: string;
        entityId?: string;
        includeTiers?: MemoryTier[];
        maxItemsPerTier?: number;
    }): Promise<{
        memories: Memory[];
        byTier: Record<MemoryTier, Memory[]>;
        context: string;
    }>;
    /**
     * Build context string from memories (for LLM prompts)
     */
    private buildContextString;
    /**
     * Cache memories by tier
     */
    private cacheMemories;
    /**
     * Get cached memories by tier
     */
    private getCachedMemories;
    /**
     * Auto-classify memory to appropriate tier based on content
     */
    classifyToTier(params: {
        type: MemoryType;
        content: string;
        data?: Record<string, unknown>;
        source?: string;
    }): MemoryTier;
    /**
     * Evict old memories based on tier TTL
     */
    evictExpiredMemories(tenantId: string, userId: string): Promise<number>;
}
export declare const memoryService: MemoryService;
//# sourceMappingURL=memoryService.d.ts.map