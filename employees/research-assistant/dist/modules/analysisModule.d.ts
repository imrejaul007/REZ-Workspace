/**
 * HOJAI Research Assistant - Analysis Module
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Competitor analysis and market analysis
 */
import { CompetitorAnalysisInput, CompetitorInfo, ProductOffering, CompetitorAnalysis } from '../types.js';
/**
 * Perform competitor analysis for a company
 */
export declare function analyzeCompetitors(input: CompetitorAnalysisInput): Promise<CompetitorAnalysis>;
/**
 * Get detailed competitor info
 */
export declare function getCompetitorDetails(competitorName: string): Promise<CompetitorInfo | null>;
/**
 * Get product comparison for a specific competitor
 */
export declare function getProductComparison(company: string, competitor: string): Promise<ProductOffering[]>;
/**
 * Generate competitive insights
 */
export declare function generateCompetitiveInsights(company: string): Promise<string[]>;
//# sourceMappingURL=analysisModule.d.ts.map