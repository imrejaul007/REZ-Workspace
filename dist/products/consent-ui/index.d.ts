/**
 * Hojai Consent UI
 * Version: 1.0 | Date: May 30, 2026 */
export interface Consent {
    id: string;
    tenant_id: string;
    customer_id: string;
    purpose: string;
    granted: boolean;
    created_at: string;
}
export declare class ConsentUI {
    getConsents(tenant_id: string, customer_id: string): Promise<{
        id: string;
        tenant_id: string;
        customer_id: string;
        purpose: string;
        granted: boolean;
        created_at: string;
    }[]>;
}
export default ConsentUI;
//# sourceMappingURL=index.d.ts.map