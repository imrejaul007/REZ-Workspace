/**
 * HOJAI AI SDK - TypeScript Client
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Usage:
 * ```typescript
 * import { HojaiClient } from '@hojai/sdk';
 *
 * const client = new HojaiClient({
 *   baseUrl: 'http://localhost:4500',
 *   tenantId: 'merchant_123'
 * });
 *
 * await client.health();
 * await client.predict('customer_456');
 * ```
 */
export class HojaiClient {
    baseUrl;
    tenantId;
    apiKey;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.tenantId = config.tenantId;
        this.apiKey = config.apiKey;
    }
    headers() {
        return {
            'Content-Type': 'application/json',
            'X-Tenant-Id': this.tenantId,
            ...(this.apiKey && { 'X-API-Key': this.apiKey })
        };
    }
    async get(path) {
        const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
        return res.json();
    }
    async post(path, body) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body)
        });
        return res.json();
    }
    async health() { return this.get('/health'); }
    async predict(customerId) { return this.post('/api/intelligence/predict', { customerId }); }
    async createTenant(data) { return this.post('/api/governance/tenants', data); }
    async publishEvent(type, data) { return this.post('/api/events/publish', { type, data }); }
}
export default HojaiClient;
//# sourceMappingURL=index.js.map