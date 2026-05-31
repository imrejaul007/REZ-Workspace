/**
 * Hojai Admin Panel
 * Version: 1.0 | Date: May 30, 2026
 */
export interface AdminDashboard {
    tenants_count: number;
    active_users: number;
    api_calls: number;
    revenue: number;
}
export declare class AdminPanel {
    getDashboard(): Promise<{
        tenants_count: number;
        active_users: number;
        api_calls: number;
        revenue: number;
    }>;
}
export default AdminPanel;
//# sourceMappingURL=index.d.ts.map