/**
 * Hojai Monitoring Dashboard
 * Version: 1.0 | Date: May 30, 2026 */
export interface Metric {
    name: string;
    value: number;
    change: number;
}
export declare class MonitoringDashboard {
    getMetrics(): Promise<{
        name: string;
        value: number;
        change: number;
    }[]>;
}
export default MonitoringDashboard;
//# sourceMappingURL=index.d.ts.map