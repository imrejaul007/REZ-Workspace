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
export interface HojaiConfig {
    baseUrl: string;
    tenantId: string;
    apiKey?: string;
}
export declare class HojaiClient {
    private baseUrl;
    private tenantId;
    private apiKey?;
    constructor(config: HojaiConfig);
    private headers;
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: unknown): Promise<T>;
    health(): Promise<unknown>;
    predict(customerId: string): Promise<unknown>;
    createTenant(data: unknown): Promise<unknown>;
    publishEvent(type: string, data: unknown): Promise<unknown>;
}
export default HojaiClient;
//# sourceMappingURL=index.d.ts.map