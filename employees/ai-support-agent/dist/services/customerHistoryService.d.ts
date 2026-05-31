/**
 * HOJAI AI Support Agent - Customer History Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Customer profile, interaction history, and support analytics
 */
import type { CustomerProfile, CustomerHistory, CustomerInteraction } from '../types.js';
/**
 * Get customer profile
 */
export declare function getCustomerProfile(customerId: string): Promise<CustomerProfile | null>;
/**
 * Update customer profile
 */
export declare function updateCustomerProfile(customerId: string, updates: Partial<Pick<CustomerProfile, 'name' | 'phone' | 'tier' | 'preferences'>>): Promise<CustomerProfile | null>;
/**
 * Record customer interaction
 */
export declare function recordInteraction(customerId: string, interaction: Omit<CustomerInteraction, 'id' | 'createdAt'>): Promise<CustomerInteraction>;
/**
 * Get complete customer history
 */
export declare function getCustomerHistory(customerId: string, includeRelatedTickets?: boolean): Promise<CustomerHistory | null>;
/**
 * Get customer sentiment score
 */
export declare function getCustomerSentiment(customerId: string): Promise<{
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
}>;
/**
 * Get at-risk customers
 */
export declare function getAtRiskCustomers(threshold?: number): Promise<{
    customerId: string;
    name: string;
    email: string;
    sentimentScore: number;
    riskFactors: string[];
}[]>;
/**
 * Search customers
 */
export declare function searchCustomers(query: string): Promise<CustomerProfile[]>;
/**
 * Get all customers
 */
export declare function getAllCustomers(page?: number, pageSize?: number): Promise<{
    customers: CustomerProfile[];
    total: number;
}>;
/**
 * Add customer note
 */
export declare function addCustomerNote(customerId: string, note: string): Promise<{
    notes: string[];
}>;
/**
 * Get customer notes
 */
export declare function getCustomerNotes(customerId: string): Promise<string[]>;
//# sourceMappingURL=customerHistoryService.d.ts.map