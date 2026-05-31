/**
 * HOJAI Research Assistant - Report Module
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Report generation functionality
 */
import { ReportGenerationInput, GeneratedReport } from '../types.js';
/**
 * Generate a comprehensive report on a topic
 */
export declare function generateReport(input: ReportGenerationInput): Promise<GeneratedReport>;
/**
 * Get a previously generated report by ID
 */
export declare function getReportById(reportId: string): Promise<GeneratedReport | null>;
/**
 * Export a report in different formats
 */
export declare function exportReport(reportId: string, format: 'pdf' | 'docx' | 'html'): Promise<{
    url: string;
    format: string;
}>;
/**
 * Generate report summary
 */
export declare function generateReportSummary(topic: string, length?: 'short' | 'medium' | 'long'): Promise<string>;
//# sourceMappingURL=reportModule.d.ts.map