interface HealthCheck {
    name: string;
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
}
export declare function healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    timestamp: string;
}>;
export {};
//# sourceMappingURL=health.d.ts.map