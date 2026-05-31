/**
 * Hojai Analytics Platform
 *
 * PORT: 4610
 *
 * Purpose:
 * - Business Intelligence dashboards
 * - What-if analytics
 * - ML model monitoring
 * - Report generation
 * - Real-time metrics
 */
/**
 * Dashboard types
 */
export interface Dashboard {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: DashboardType;
    config: DashboardConfig;
    widgets: Widget[];
    filters: DashboardFilter[];
    refresh_interval_seconds: number;
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export type DashboardType = 'revenue' | 'customers' | 'operations' | 'custom' | 'executive';
export interface DashboardConfig {
    layout: 'grid' | 'freeform';
    theme?: 'light' | 'dark';
    date_range_default: string;
}
export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    position: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    config: WidgetConfig;
}
export type WidgetType = 'metric' | 'chart' | 'table' | 'funnel' | 'heatmap' | 'map' | 'gauge';
export interface WidgetConfig {
    metric_id?: string;
    chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'donut';
    data_source?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    group_by?: string;
    time_range?: string;
    filters?: Record<string, any>;
}
export interface DashboardFilter {
    field: string;
    type: 'select' | 'date_range' | 'search';
    label: string;
    options?: {
        value: string;
        label: string;
    }[];
}
/**
 * Report types
 */
export interface Report {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: ReportType;
    config: ReportConfig;
    schedule?: ReportSchedule;
    last_run_at?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export type ReportType = 'pdf' | 'csv' | 'excel' | 'scheduled';
export interface ReportConfig {
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    sort_by?: string;
    limit?: number;
}
export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
    format: 'pdf' | 'csv';
}
export interface ReportRun {
    id: string;
    report_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
    download_url?: string;
    error?: string;
}
/**
 * Metric types
 */
export interface Metric {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: MetricType;
    unit?: string;
    format: 'number' | 'currency' | 'percentage' | 'duration';
    value: number;
    previous_value?: number;
    change_percent?: number;
    period: string;
    updated_at: string;
}
export type MetricType = 'revenue' | 'orders' | 'customers' | 'conversion' | 'engagement' | 'custom';
/**
 * ML Observability types
 */
export interface ModelMonitor {
    id: string;
    tenant_id: string;
    model_name: string;
    model_type: string;
    status: ModelStatus;
    metrics: ModelMetrics;
    alerts: ModelAlert[];
    last_check: string;
}
export type ModelStatus = 'healthy' | 'degraded' | 'drifting' | 'failing';
export interface ModelMetrics {
    accuracy?: number;
    latency_p99_ms?: number;
    error_rate?: number;
    prediction_count: number;
    data_drift_score?: number;
    concept_drift_score?: number;
}
export interface ModelAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    triggered_at: string;
    resolved_at?: string;
}
/**
 * Cohort types
 */
export interface Cohort {
    id: string;
    tenant_id: string;
    name: string;
    definition: CohortDefinition;
    size: number;
    created_at: string;
}
export interface CohortDefinition {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | 'between';
    value: number;
    time_range: string;
}
export declare class HojaiAnalyticsPlatform {
    private dashboardEngine;
    private reportEngine;
    private metricsEngine;
    private mlEngine;
    constructor();
    createDashboard(tenantId: string, createdBy: string, data: any): Promise<Dashboard>;
    getDashboard(tenantId: string, dashboardId: string): Promise<Dashboard | null>;
    listDashboards(tenantId: string): Promise<Dashboard[]>;
    refreshDashboard(tenantId: string, dashboardId: string): Promise<Record<string, any>>;
    createReport(tenantId: string, createdBy: string, data: any): Promise<Report>;
    runReport(tenantId: string, reportId: string): Promise<ReportRun>;
    getReportRun(tenantId: string, runId: string): Promise<ReportRun | null>;
    recordMetric(tenantId: string, name: string, value: number, type: MetricType): Promise<Metric>;
    getMetrics(tenantId: string): Promise<Metric[]>;
    getMetricTimeseries(tenantId: string, metricName: string, timeRange?: string): Promise<{
        labels: string[];
        data: number[];
    }>;
    registerModel(tenantId: string, modelName: string, modelType: string): Promise<ModelMonitor>;
    getModelHealth(tenantId: string, modelId: string): Promise<ModelMonitor | null>;
    listModels(tenantId: string): Promise<ModelMonitor[]>;
}
export declare function createAnalyticsRoutes(platform: HojaiAnalyticsPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiAnalyticsPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiAnalyticsPlatform: typeof HojaiAnalyticsPlatform;
    createAnalyticsRoutes: typeof createAnalyticsRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map