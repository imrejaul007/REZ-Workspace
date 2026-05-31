/**
 * HOJAI AI Support Agent - Ticket Manager Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Manage support tickets with CRUD operations, SLA tracking, and resolution workflow
 */
import type { SupportTicket, CreateTicketInput, TicketPriority, TicketStatus, TicketCategory, TicketMessage, TicketQueryInputType } from '../types.js';
/**
 * Create a new support ticket
 */
export declare function createTicket(input: CreateTicketInput, tenantId: string): Promise<SupportTicket>;
/**
 * Get ticket by ID
 */
export declare function getTicketById(ticketId: string): Promise<SupportTicket | null>;
/**
 * Get ticket by ticket number
 */
export declare function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null>;
/**
 * List tickets with filtering and pagination
 */
export declare function listTickets(filters: TicketQueryInputType, tenantId: string): Promise<{
    tickets: SupportTicket[];
    total: number;
}>;
/**
 * Update ticket status
 */
export declare function updateTicketStatus(ticketId: string, status: TicketStatus, updatedBy: string): Promise<SupportTicket | null>;
/**
 * Add message to ticket
 */
export declare function addMessage(ticketId: string, authorId: string, authorType: 'customer' | 'agent', content: string, attachments?: TicketMessage['attachments']): Promise<TicketMessage | null>;
/**
 * Resolve ticket
 */
export declare function resolveTicket(ticketId: string, resolution: {
    summary: string;
    resolvedBy: string;
    rating?: number;
    feedback?: string;
}): Promise<SupportTicket | null>;
/**
 * Assign ticket to agent
 */
export declare function assignTicket(ticketId: string, agentId: string, agentName: string, team?: string): Promise<SupportTicket | null>;
/**
 * Update ticket priority
 */
export declare function updateTicketPriority(ticketId: string, priority: TicketPriority, updatedBy: string): Promise<SupportTicket | null>;
/**
 * Get tickets by customer ID
 */
export declare function getTicketsByCustomerId(customerId: string): Promise<SupportTicket[]>;
/**
 * Get ticket statistics
 */
export declare function getTicketStats(_tenantId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: Record<TicketPriority, number>;
    byCategory: Record<TicketCategory, number>;
    avgResolutionTime: number;
    slaBreachRate: number;
}>;
//# sourceMappingURL=ticketService.d.ts.map