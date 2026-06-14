// Service Types
export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  status: HealthStatus;
  port: number;
  url: string;
  endpoints: ServiceEndpoint[];
  lastChecked: string;
  uptime: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  owner: string;
  version: string;
  documentation?: string;
}

export type ServiceCategory =
  | 'infrastructure'
  | 'payments'
  | 'identity'
  | 'analytics'
  | 'commerce'
  | 'marketing'
  | 'media'
  | 'intelligence'
  | 'support';

export interface ServiceEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  authenticated: boolean;
}

// Metrics Types
export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  requests: MetricDataPoint[];
  responseTime: MetricDataPoint[];
  errorRate: MetricDataPoint[];
  cpuUsage: MetricDataPoint[];
  memoryUsage: MetricDataPoint[];
}

// Health Types
export interface HealthCheck {
  serviceId: string;
  serviceName: string;
  status: HealthStatus;
  latency: number;
  lastChecked: string;
  responseCode: number;
  message?: string;
}

export interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  lastUpdated: string;
}

// API Documentation Types
export interface ApiDoc {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required: boolean;
  type: string;
  description: string;
}

export interface ApiRequestBody {
  contentType: string;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  example?: unknown;
}

// Dashboard Types
export interface DashboardStats {
  totalServices: number;
  healthyServices: number;
  totalRequests: number;
  avgResponseTime: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
