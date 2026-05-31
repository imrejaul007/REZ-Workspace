/**
 * Hojai Monitoring Dashboard
 * Version: 1.0 | Date: May 30, 2026 */
export class MonitoringDashboard {
    async getMetrics() {
        return [
            { name: 'API Latency', value: 45, change: -5 },
            { name: 'Error Rate', value: 0.5, change: -2 },
            { name: 'Uptime', value: 99.9, change: 0 }
        ];
    }
}
export default MonitoringDashboard;
//# sourceMappingURL=index.js.map