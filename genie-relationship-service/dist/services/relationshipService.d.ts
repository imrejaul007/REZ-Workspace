/**
 * GENIE Relationship Service - Relationship Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Business logic for relationship management
 */
import { CreateRelationshipInput, UpdateRelationshipInput, CreateInteractionInput, ListRelationshipsQuery, ListInteractionsQuery, Relationship, Interaction } from '../types.js';
export declare class RelationshipService {
    /**
     * Create a new relationship
     */
    create(tenantId: string, userId: string, input: CreateRelationshipInput): Promise<Relationship>;
    /**
     * List relationships with pagination and filtering
     */
    list(tenantId: string, userId: string, query: ListRelationshipsQuery): Promise<{
        relationships: Relationship[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    /**
     * Get a single relationship by ID
     */
    get(tenantId: string, userId: string, relationshipId: string): Promise<Relationship | null>;
    /**
     * Update a relationship
     */
    update(tenantId: string, userId: string, relationshipId: string, input: UpdateRelationshipInput): Promise<Relationship | null>;
    /**
     * Delete a relationship and its interactions
     */
    delete(tenantId: string, userId: string, relationshipId: string): Promise<boolean>;
    /**
     * Get relationship statistics
     */
    getStats(tenantId: string, userId: string): Promise<{
        total: number;
        byType: Record<string, number>;
        upcomingFollowups: number;
        upcomingBirthdays: number;
    }>;
}
export declare class InteractionService {
    /**
     * Log a new interaction
     */
    create(tenantId: string, userId: string, relationshipId: string, input: CreateInteractionInput): Promise<Interaction | null>;
    /**
     * List interactions for a relationship
     */
    list(tenantId: string, userId: string, relationshipId: string, query: ListInteractionsQuery): Promise<{
        interactions: Interaction[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    /**
     * Get interaction by ID
     */
    get(tenantId: string, userId: string, interactionId: string): Promise<Interaction | null>;
    /**
     * Delete an interaction
     */
    delete(tenantId: string, userId: string, interactionId: string): Promise<boolean>;
    /**
     * Get interaction statistics
     */
    getStats(tenantId: string, userId: string, relationshipId?: string): Promise<{
        total: number;
        byType: Record<string, number>;
        thisWeek: number;
        thisMonth: number;
    }>;
}
export declare const relationshipService: RelationshipService;
export declare const interactionService: InteractionService;
//# sourceMappingURL=relationshipService.d.ts.map