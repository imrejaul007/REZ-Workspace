export interface Service {
  id: string;
  name: string;
  port: number;
  description: string;
  status: 'online' | 'offline' | 'checking';
  lastChecked: Date | null;
  responseTime?: number;
  error?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  timestamp: string;
  version?: string;
}

export interface DashboardStats {
  totalServices: number;
  onlineCount: number;
  offlineCount: number;
  avgResponseTime: number;
}

export type ServiceStatus = 'online' | 'offline' | 'checking';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
