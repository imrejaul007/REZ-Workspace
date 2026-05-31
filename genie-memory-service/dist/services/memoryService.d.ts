/**
 * GENIE Memory Service - Memory Service
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Business logic for memory operations
 */
import { Memory, MemorySearchOptions, CreateMemoryInput, UpdateMemoryInput, ListMemoriesQuery } from '../types.js';
/**
 * Create a new memory
 */
export declare function createMemory(userId: string, input: CreateMemoryInput): Promise<Memory>;
/**
 * Get a memory by ID
 */
export declare function getMemoryById(memoryId: string, userId: string): Promise<Memory | null>;
/**
 * List memories with pagination
 */
export declare function listMemories(userId: string, query: ListMemoriesQuery): Promise<{
    memories: Memory[];
    total: number;
    page: number;
    pageSize: number;
}>;
/**
 * Update a memory
 */
export declare function updateMemory(memoryId: string, userId: string, input: UpdateMemoryInput): Promise<Memory | null>;
/**
 * Delete a memory
 */
export declare function deleteMemory(memoryId: string, userId: string): Promise<boolean>;
/**
 * Search memories
 */
export declare function searchMemories(userId: string, options: MemorySearchOptions): Promise<Memory[]>;
/**
 * Recall memories (increment recall count)
 */
export declare function recallMemories(memoryIds: string[], userId: string): Promise<Memory[]>;
/**
 * Add tags to a memory
 */
export declare function addTags(memoryId: string, userId: string, tags: string[]): Promise<Memory | null>;
/**
 * Remove tags from a memory
 */
export declare function removeTags(memoryId: string, userId: string, tags: string[]): Promise<Memory | null>;
/**
 * Link memories together
 */
export declare function linkMemories(memoryId: string, userId: string, relatedMemoryIds: string[]): Promise<Memory | null>;
/**
 * Get memory statistics for a user
 */
export declare function getMemoryStats(userId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    recentCount: number;
}>;
/**
 * Get timeline of memories (chronological view)
 */
export declare function getMemoryTimeline(userId: string, limit?: number): Promise<{
    date: string;
    memories: Memory[];
}[]>;
/**
 * Delete expired memories
 */
export declare function deleteExpiredMemories(): Promise<number>;
//# sourceMappingURL=memoryService.d.ts.map