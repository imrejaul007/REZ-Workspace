import { IFollowup, OutreachChannel } from '../types';
export interface FollowupSequence {
    id: string;
    name: string;
    steps: FollowupStep[];
    isActive: boolean;
}
export interface FollowupStep {
    order: number;
    channel: OutreachChannel;
    delayDays: number;
    delayHours?: number;
    message: string;
    subject?: string;
    skipIf?: {
        replied?: boolean;
        opened?: boolean;
        clicked?: boolean;
    };
}
export interface FollowupConfig {
    sequences: FollowupSequence[];
    defaultSequence: string;
    maxFollowups: number;
    timezone: string;
    businessHours: {
        start: number;
        end: number;
    };
}
export declare class FollowupManager {
    private config;
    constructor(config?: Partial<FollowupConfig>);
    /**
     * Schedule follow-ups for a lead
     */
    scheduleFollowups(tenantId: string, leadId: string, followups: {
        channel: OutreachChannel;
        scheduledAt: string;
        message?: string;
        reminder?: boolean;
    }[], ownerId?: string): Promise<{
        success: boolean;
        followups: IFollowup[];
        error?: string;
    }>;
    /**
     * Schedule follow-ups using a predefined sequence
     */
    scheduleSequence(tenantId: string, leadId: string, sequenceId?: string, startDate?: string, ownerId?: string): Promise<{
        success: boolean;
        followups: IFollowup[];
        sequence: string;
    }>;
    /**
     * Get pending followups for a tenant
     */
    getPendingFollowups(tenantId: string, options?: {
        channel?: OutreachChannel;
        before?: Date;
        after?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        followups: (IFollowup & {
            contact: {
                firstName: string;
                lastName?: string;
                email?: string;
                phone?: string;
            };
        })[];
        total: number;
    }>;
    /**
     * Mark followup as completed
     */
    completeFollowup(tenantId: string, followupId: string, options?: {
        outreachId?: string;
        skipped?: boolean;
        skipReason?: string;
    }, completedBy?: string): Promise<IFollowup | null>;
    /**
     * Reschedule a followup
     */
    rescheduleFollowup(tenantId: string, followupId: string, newScheduledAt: string, rescheduledBy?: string): Promise<IFollowup | null>;
    /**
     * Cancel all pending followups for a lead
     */
    cancelFollowups(tenantId: string, leadId: string, reason?: string, cancelledBy?: string): Promise<number>;
    /**
     * Get followup statistics
     */
    getFollowupStats(tenantId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalScheduled: number;
        totalCompleted: number;
        totalSkipped: number;
        completionRate: number;
        avgTimeToComplete: number;
        byChannel: Record<OutreachChannel, {
            completed: number;
            skipped: number;
            pending: number;
        }>;
    }>;
    /**
     * Get default followup sequences
     */
    private getDefaultSequences;
    /**
     * Get empty channel stats
     */
    private getEmptyChannelStats;
    /**
     * Map MongoDB document to IFollowup
     */
    private mapToIFollowup;
}
export declare const followupManager: FollowupManager;
//# sourceMappingURL=followupManager.d.ts.map