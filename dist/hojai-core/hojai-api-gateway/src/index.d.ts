/**
 * Hojai API Gateway
 * Version: 1.0 | Port: 4500
 * Central entry point with tenant routing
 */
interface ServiceRoute {
    name: string;
    baseUrl: string;
    port: number;
    healthPath?: string;
    enabled: boolean;
}
declare const SERVICES: Record<string, ServiceRoute>;
declare class HojaiAPIGateway {
    private app;
    private serviceHealth;
    constructor();
    /**
     * Setup middleware
     */
    private setupMiddleware;
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Create proxy middleware for a service
     */
    private createProxy;
    /**
     * Create passthrough middleware (no tenant context modification)
     */
    private createPassthrough;
    /**
     * Request logger
     */
    private requestLogger;
    /**
     * Start health checks for all services
     */
    private startHealthChecks;
    /**
     * Start the gateway
     */
    start(): void;
}
declare const gateway: HojaiAPIGateway;
export { HojaiAPIGateway, SERVICES };
export default gateway;
//# sourceMappingURL=index.d.ts.map