/**
 * HOJAI Performance Dashboard - KPI Tracker Service
 *
 * Tracks and manages Key Performance Indicators for AI employees.
 */
import { KPIUpdate, KPI_THRESHOLDS } from '../types/index.js';
export declare class KPITracker {
    /**
     * Initialize or get KPI record for an employee
     */
    initializeKPI(employeeId: string, tenantId: string, period?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get KPI for an employee
     */
    getKPI(employeeId: string, tenantId: string, period?: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Update KPI metrics
     */
    updateKPI(employeeId: string, tenantId: string, updates: KPIUpdate, period?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Increment task completion
     */
    incrementTaskCompleted(employeeId: string, tenantId: string, responseTime?: number, customerSatisfaction?: number): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Record error
     */
    recordError(employeeId: string, tenantId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Record escalation
     */
    recordEscalation(employeeId: string, tenantId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Record customer satisfaction
     */
    recordCustomerSatisfaction(employeeId: string, tenantId: string, rating: number): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Record revenue
     */
    recordRevenue(employeeId: string, tenantId: string, amount: number): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Recalculate derived metrics
     */
    private recalculateDerivedMetrics;
    /**
     * Record KPI history
     */
    private recordHistory;
    /**
     * Get KPI history
     */
    getHistory(employeeId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPIHistory, {}, {}> & import("../models/performanceModel.js").IKPIHistory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get KPI trends for an employee
     */
    getKPITrends(employeeId: string, tenantId: string, months?: number): Promise<any[]>;
    /**
     * Get KPIs for multiple employees (team/department view)
     */
    getTeamKPIs(tenantId: string, department?: string, period?: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IKPI, {}, {}> & import("../models/performanceModel.js").IKPI & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get KPI summary statistics for a tenant
     */
    getKPISummary(tenantId: string, period?: string): Promise<any>;
    /**
     * Get performance rating based on KPI
     */
    getPerformanceRating(kpi: any): string;
    /**
     * Check if KPI meets threshold
     */
    checkKPIMetThreshold(kpi: any, metric: keyof typeof KPI_THRESHOLDS): boolean;
}
export declare const kpiTracker: KPITracker;
export default kpiTracker;
//# sourceMappingURL=kpiTracker.d.ts.map