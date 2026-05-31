/**
 * HOJAI Performance Dashboard - Leaderboard Service
 *
 * Rankings and competitive metrics between AI employees.
 */
import { ILeaderboardEntry } from '../models/performanceModel.js';
export type LeaderboardMetric = 'overall' | 'productivity' | 'quality' | 'revenue' | 'efficiency';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';
export declare class LeaderboardService {
    /**
     * Generate leaderboard for a specific metric and period
     */
    generateLeaderboard(tenantId: string, metric?: LeaderboardMetric, period?: LeaderboardPeriod, department?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ILeaderboard, {}, {}> & import("../models/performanceModel.js").ILeaderboard & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get leaderboard
     */
    getLeaderboard(tenantId: string, metric?: LeaderboardMetric, period?: LeaderboardPeriod, limit?: number, offset?: number): Promise<{
        entries: ILeaderboardEntry[];
        leaderboardId: string;
        tenantId: string;
        metric: "overall" | "productivity" | "quality" | "revenue" | "efficiency";
        period: "daily" | "weekly" | "monthly";
        periodLabel: string;
        totalParticipants: number;
        generatedAt: Date;
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    } | null>;
    /**
     * Get employee's rank in leaderboard
     */
    getEmployeeRank(employeeId: string, tenantId: string, metric?: LeaderboardMetric, period?: LeaderboardPeriod): Promise<{
        rank: number;
        total: number;
        entry?: undefined;
    } | {
        rank: number;
        total: number;
        entry: ILeaderboardEntry | undefined;
    }>;
    /**
     * Get top performers
     */
    getTopPerformers(tenantId: string, period?: LeaderboardPeriod, limit?: number): Promise<ILeaderboardEntry[]>;
    /**
     * Get most improved employees
     */
    getMostImproved(tenantId: string, period?: LeaderboardPeriod, limit?: number): Promise<ILeaderboardEntry[]>;
    /**
     * Get leaderboard history for an employee
     */
    getEmployeeLeaderboardHistory(employeeId: string, tenantId: string, metric?: LeaderboardMetric, limit?: number): Promise<{
        period: string;
        rank: number | undefined;
        score: number | undefined;
        rankChange: number | undefined;
        badge: string | undefined;
    }[]>;
    /**
     * Compare two employees
     */
    compareEmployees(employee1Id: string, employee2Id: string, tenantId: string, period?: LeaderboardPeriod): Promise<any>;
    /**
     * Get department leaderboard
     */
    getDepartmentLeaderboard(tenantId: string, period?: LeaderboardPeriod): Promise<any[]>;
    /**
     * Get available leaderboard periods
     */
    getAvailablePeriods(tenantId: string): Promise<{
        period: string;
        periodType: string;
    }[]>;
    private getPeriodLabel;
    private getEmployees;
    private calculateEntries;
    private calculateScore;
    private assignBadge;
    private determineWinner;
    private getPreviousPeriodLabel;
    private aggregateByDepartment;
}
export declare const leaderboardService: LeaderboardService;
export default leaderboardService;
//# sourceMappingURL=leaderboard.d.ts.map