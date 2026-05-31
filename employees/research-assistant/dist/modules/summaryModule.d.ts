/**
 * HOJAI Research Assistant - Summary Module
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Content summarization functionality
 */
import { SummarizeInput, SummaryResult } from '../types.js';
/**
 * Summarize content
 */
export declare function summarize(input: SummarizeInput): Promise<SummaryResult>;
/**
 * Summarize multiple pieces of content
 */
export declare function summarizeBatch(contents: string[], style?: 'brief' | 'standard' | 'detailed'): Promise<SummaryResult[]>;
/**
 * Extract entities from content
 */
export declare function extractEntities(content: string): Promise<{
    organizations: string[];
    people: string[];
    locations: string[];
    dates: string[];
}>;
/**
 * Compare multiple summaries
 */
export declare function compareSummaries(summaries: string[]): Promise<{
    commonThemes: string[];
    uniqueInsights: Array<{
        index: number;
        unique: string[];
    }>;
    consensus: string;
}>;
//# sourceMappingURL=summaryModule.d.ts.map