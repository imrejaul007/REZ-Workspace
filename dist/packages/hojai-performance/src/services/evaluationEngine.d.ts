/**
 * HOJAI Performance Dashboard - Evaluation Engine Service
 *
 * Evaluates AI employee performance based on KPIs and generates evaluation scores.
 */
import { EvaluationPeriod } from '../types/index.js';
export declare class EvaluationEngine {
    /**
     * Generate evaluation for an employee
     */
    evaluateEmployee(employeeId: string, tenantId: string, periodType?: EvaluationPeriod, evaluatorId?: string, customWeights?: any): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IEvaluation, {}, {}> & import("../models/performanceModel.js").IEvaluation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get evaluation for an employee
     */
    getEvaluation(employeeId: string, tenantId: string, period?: string, periodType?: EvaluationPeriod): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IEvaluation, {}, {}> & import("../models/performanceModel.js").IEvaluation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get evaluation history
     */
    getEvaluationHistory(employeeId: string, tenantId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IEvaluation, {}, {}> & import("../models/performanceModel.js").IEvaluation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Calculate quality score from KPI
     */
    private calculateQualityScore;
    /**
     * Calculate productivity score from KPI
     */
    private calculateProductivityScore;
    /**
     * Calculate reliability score from KPI
     */
    private calculateReliabilityScore;
    /**
     * Calculate collaboration score from KPI
     */
    private calculateCollaborationScore;
    /**
     * Calculate growth score (improvement over time)
     */
    private calculateGrowthScore;
    /**
     * Calculate overall score using weights
     */
    private calculateOverallScore;
    /**
     * Calculate percentile rankings
     */
    private calculatePercentileRanks;
    /**
     * Generate strengths feedback
     */
    private generateStrengths;
    /**
     * Generate improvement suggestions
     */
    private generateImprovements;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get evaluation configuration
     */
    getOrCreateConfig(tenantId: string, customWeights?: any): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IEvaluationConfig, {}, {}> & import("../models/performanceModel.js").IEvaluationConfig & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Update evaluation configuration
     */
    updateConfig(tenantId: string, updates: {
        weights?: any;
        thresholds?: any;
        autoEvaluation?: boolean;
        evaluationFrequency?: EvaluationPeriod;
    }): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IEvaluationConfig, {}, {}> & import("../models/performanceModel.js").IEvaluationConfig & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get evaluation grade
     */
    getEvaluationGrade(overallScore: number): {
        grade: string;
        label: string;
        color: string;
    };
    /**
     * Batch evaluate employees
     */
    batchEvaluate(tenantId: string, employeeIds?: string[], periodType?: EvaluationPeriod): Promise<{
        total: number;
        successful: number;
        failed: number;
    }>;
    /**
     * Get evaluation statistics for tenant
     */
    getEvaluationStats(tenantId: string, period?: string): Promise<any>;
}
export declare const evaluationEngine: EvaluationEngine;
export default evaluationEngine;
//# sourceMappingURL=evaluationEngine.d.ts.map