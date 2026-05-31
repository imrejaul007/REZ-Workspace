/**
 * HOJAI Research Assistant - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Market research, competitor analysis, report generation
 *
 * Tagline: "AI-powered research that delivers insights, not just data."
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
// Search Schema
export const SearchQuerySchema = z.object({
    query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
    filters: z.object({
        dateRange: z.object({
            from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
            to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
        }).optional(),
        sources: z.array(z.string()).optional(),
        language: z.string().optional(),
        region: z.string().optional(),
    }).optional(),
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
});
// Competitor Analysis Schema
export const CompetitorAnalysisSchema = z.object({
    company: z.string().min(1, 'Company name is required').max(200),
    competitors: z.array(z.string()).optional(),
    includeProducts: z.boolean().default(true),
    includePricing: z.boolean().default(false),
    includeMarketShare: z.boolean().default(true),
});
// Report Generation Schema
export const ReportGenerationSchema = z.object({
    topic: z.string().min(1, 'Topic is required').max(500),
    format: z.enum(['summary', 'detailed', 'comprehensive']).default('detailed'),
    includeCharts: z.boolean().default(false),
    includeRecommendations: z.boolean().default(true),
    sections: z.array(z.object({
        title: z.string(),
        content: z.string(),
        order: z.number(),
    })).optional(),
    audience: z.string().max(100).optional(),
    timeframe: z.string().max(100).optional(),
});
// Trends Query Schema
export const TrendsQuerySchema = z.object({
    category: z.enum(['technology', 'market', 'consumer', 'industry', 'competitive']).optional(),
    limit: z.number().min(1).max(50).default(20),
    timeframe: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
});
// Summarize Schema
export const SummarizeSchema = z.object({
    content: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
    contentType: z.enum(['article', 'document', 'webpage', 'text']).default('text'),
    maxLength: z.number().min(50).max(5000).default(500),
    style: z.enum(['brief', 'standard', 'detailed']).default('standard'),
    includeKeyPoints: z.boolean().default(true),
});
//# sourceMappingURL=types.js.map