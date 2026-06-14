export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  port: number;
  timestamp: string;
  uptime: number;
  checks: {
    mongodb: 'healthy' | 'unhealthy' | 'unknown';
    redis: 'healthy' | 'unhealthy' | 'unknown';
  };
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}