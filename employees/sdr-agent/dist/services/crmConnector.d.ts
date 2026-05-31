import { CRMConfig, CRMSyncResult, LeadStage } from '../types';
export type CRMProvider = 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'custom';
export interface CRMContact {
    id: string;
    email?: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    title?: string;
    company?: string;
    companySize?: string;
    industry?: string;
    city?: string;
    state?: string;
    country?: string;
    linkedinUrl?: string;
    customFields?: Record<string, unknown>;
}
export interface CRMActivity {
    id: string;
    type: string;
    subject?: string;
    body?: string;
    createdAt: Date;
    userId?: string;
    leadId?: string;
    contactId?: string;
}
export interface CRMDeal {
    id: string;
    name: string;
    stage: string;
    amount?: number;
    currency?: string;
    contactId?: string;
    companyId?: string;
    ownerId?: string;
    closeDate?: Date;
    customFields?: Record<string, unknown>;
}
export declare class CRMConnector {
    private provider;
    private client;
    private config;
    private syncEnabled;
    private webhookSecret?;
    constructor();
    /**
     * Initialize CRM connection
     */
    initialize(config: CRMConfig): Promise<boolean>;
    /**
     * Sync a lead to CRM
     */
    syncLeadToCRM(tenantId: string, leadId: string): Promise<CRMSyncResult>;
    /**
     * Sync contact to CRM
     */
    private syncContact;
    /**
     * Sync deal/opportunity to CRM
     */
    private syncDeal;
    /**
     * Update lead stage in CRM
     */
    updateDealStage(crmDealId: string, stage: LeadStage): Promise<boolean>;
    /**
     * Sync activity to CRM
     */
    syncActivity(tenantId: string, activityId: string): Promise<boolean>;
    /**
     * Import contacts from CRM
     */
    importContacts(tenantId: string, options?: {
        since?: Date;
        limit?: number;
    }): Promise<{
        success: boolean;
        imported: number;
        errors: string[];
    }>;
    /**
     * Handle incoming webhooks from CRM
     */
    handleWebhook(payload: Record<string, unknown>): Promise<{
        type: string;
        data: Record<string, unknown>;
    } | null>;
    /**
     * Map lead stage to CRM stage name
     */
    private mapLeadStageToCRM;
    /**
     * Get connection status
     */
    isConnected(): boolean;
    /**
     * Get current provider
     */
    getProvider(): CRMProvider;
}
export declare const crmConnector: CRMConnector;
//# sourceMappingURL=crmConnector.d.ts.map