/**
 * HOJAI AI Support Agent - Escalation Router Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Intelligent escalation routing based on rules, sentiment, and complexity
 */
import type { Escalation, EscalationLevel, EscalationReason, EscalateInput, SupportTicket } from '../types.js';
/**
 * Escalation rules engine
 */
interface EscalationRule {
    id: string;
    name: string;
    conditions: EscalationCondition[];
    action: EscalationAction;
    priority: number;
    enabled: boolean;
}
interface EscalationCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: string | number | string[] | boolean;
}
interface EscalationAction {
    targetLevel: EscalationLevel;
    targetTeam?: string;
    addTags?: string[];
    notify?: string[];
    priorityOverride?: 'low' | 'medium' | 'high' | 'urgent';
}
/**
 * Determine appropriate escalation level based on ticket analysis
 */
export declare function determineEscalationLevel(ticket: SupportTicket): Promise<{
    level: EscalationLevel;
    reason: EscalationReason;
    notes?: string;
}>;
/**
 * Create escalation record
 */
export declare function createEscalation(input: EscalateInput, escalatedBy: string): Promise<Escalation>;
/**
 * Get escalation by ID
 */
export declare function getEscalationById(escalationId: string): Promise<Escalation | null>;
/**
 * Get escalations for ticket
 */
export declare function getEscalationsForTicket(ticketId: string): Promise<Escalation[]>;
/**
 * Accept escalation
 */
export declare function acceptEscalation(escalationId: string, agentId: string): Promise<Escalation | null>;
/**
 * Resolve escalation
 */
export declare function resolveEscalation(escalationId: string): Promise<Escalation | null>;
/**
 * Reject escalation
 */
export declare function rejectEscalation(escalationId: string, reason: string): Promise<Escalation | null>;
/**
 * Get team statistics
 */
export declare function getTeamStats(): Promise<{
    teams: Record<EscalationLevel, {
        name: string;
        currentLoad: number;
        capacity: number;
        avgHandleTime: number;
    }>;
    totalActiveEscalations: number;
    pendingEscalations: number;
}>;
/**
 * Get escalation rules
 */
export declare function getEscalationRules(): Promise<EscalationRule[]>;
/**
 * Update escalation rule
 */
export declare function updateEscalationRule(ruleId: string, updates: Partial<EscalationRule>): Promise<EscalationRule | null>;
/**
 * Enable/disable escalation rule
 */
export declare function toggleEscalationRule(ruleId: string, enabled: boolean): Promise<EscalationRule | null>;
export {};
//# sourceMappingURL=escalationService.d.ts.map