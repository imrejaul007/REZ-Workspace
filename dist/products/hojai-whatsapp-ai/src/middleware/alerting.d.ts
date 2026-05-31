export declare enum AlertLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface Alert {
    level: AlertLevel;
    message: string;
    context?: Record<string, unknown>;
    timestamp: Date;
    resolved?: boolean;
}
export declare function alert(level: AlertLevel, message: string, context?: Record<string, unknown>): Promise<void>;
export declare function getAlerts(limit?: number): Alert[];
export declare function clearAlerts(): void;
//# sourceMappingURL=alerting.d.ts.map