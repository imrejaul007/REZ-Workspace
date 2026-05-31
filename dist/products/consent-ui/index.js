/**
 * Hojai Consent UI
 * Version: 1.0 | Date: May 30, 2026 */
export class ConsentUI {
    async getConsents(tenant_id, customer_id) {
        return [
            { id: '1', tenant_id, customer_id, purpose: 'marketing', granted: false, created_at: new Date().toISOString() }
        ];
    }
}
export default ConsentUI;
//# sourceMappingURL=index.js.map