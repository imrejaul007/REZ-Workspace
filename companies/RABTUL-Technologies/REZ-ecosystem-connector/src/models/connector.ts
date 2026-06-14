export interface ServiceEndpoint {
  id: string;
  serviceName: string;
  serviceType: string;
  url: string;
  port: number;
  healthCheckUrl?: string;
  authToken?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'unhealthy';
  lastHeartbeat?: string;
  metadata?: Record<string, unknown>;
  registeredAt: string;
}

export interface ServiceRegistry {
  id: string;
  name: string;
  version: string;
  description: string;
  endpoints: ServiceEndpoint[];
  dependencies: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  type: 'request' | 'response' | 'event' | 'broadcast';
  sourceService: string;
  targetService?: string;
  action: string;
  payload: unknown;
  correlationId?: string;
  timestamp: string;
  ttl?: number;
}

export interface EventSubscription {
  id: string;
  subscriberId: string;
  eventType: string;
  filter?: Record<string, unknown>;
  endpoint: string;
  active: boolean;
  createdAt: string;
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  lastChecked: string;
}

export interface CrossServiceTransaction {
  id: string;
  transactionId: string;
  services: string[];
  totalSteps: number;
  completedSteps: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  startedAt: string;
  completedAt?: string;
  rollbackData?: Record<string, unknown>;
}
