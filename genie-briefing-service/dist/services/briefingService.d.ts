/**
 * GENIE Briefing Service - Briefing Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Business logic for briefing generation and retrieval
 */
import { Briefing, BriefingItem, BriefingType, SectionType, CreateBriefingInput, UpdateBriefingInput, GenerateBriefingInput, ListBriefingsQuery } from '../types.js';
/**
 * Get briefing for a specific date
 */
export declare function getBriefingByDate(userId: string, date: string, briefingType?: BriefingType): Promise<Briefing | null>;
/**
 * Get today's briefing
 */
export declare function getTodayBriefing(userId: string): Promise<Briefing | null>;
/**
 * Get morning briefing for a date
 */
export declare function getMorningBriefing(userId: string, date?: string): Promise<Briefing | null>;
/**
 * Get evening briefing for a date
 */
export declare function getEveningBriefing(userId: string, date?: string): Promise<Briefing | null>;
/**
 * List briefings with pagination
 */
export declare function listBriefings(userId: string, query: ListBriefingsQuery): Promise<{
    briefings: Briefing[];
    total: number;
    page: number;
    pageSize: number;
}>;
/**
 * Generate a new briefing
 */
export declare function generateBriefing(input: GenerateBriefingInput): Promise<Briefing>;
/**
 * Create a briefing manually
 */
export declare function createBriefing(userId: string, input: CreateBriefingInput): Promise<Briefing>;
/**
 * Update a briefing
 */
export declare function updateBriefing(id: string, userId: string, input: UpdateBriefingInput): Promise<Briefing | null>;
/**
 * Delete a briefing
 */
export declare function deleteBriefing(id: string, userId: string): Promise<boolean>;
/**
 * Update a briefing item (mark as completed, etc.)
 */
export declare function updateBriefingItem(briefingId: string, userId: string, sectionType: SectionType, itemId: string, updates: Partial<BriefingItem>): Promise<Briefing | null>;
//# sourceMappingURL=briefingService.d.ts.map