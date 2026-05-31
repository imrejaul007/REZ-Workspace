import { Request, Response, NextFunction } from 'express';
export declare function metricsMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function getMetrics(): {
    requests: {
        [k: string]: number;
    };
    errors: {
        [k: string]: number;
    };
    latency: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    uptime: number;
};
//# sourceMappingURL=metrics.d.ts.map