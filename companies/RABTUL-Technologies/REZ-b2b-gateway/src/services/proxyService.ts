import axios, { AxiosInstance, AxiosError } from 'axios';
import { B2B_SERVICES, ServiceName } from '../config/services';

export class ProxyService {
  private clients: Map<ServiceName, AxiosInstance> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [name, config] of Object.entries(B2B_SERVICES)) {
      const serviceName = name as ServiceName;
      this.clients.set(serviceName, axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }));
    }
  }

  getClient(serviceName: ServiceName): AxiosInstance {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return client;
  }

  async proxyRequest<T = unknown>(
    serviceName: ServiceName,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const client = this.getClient(serviceName);

    try {
      const response = await client.request<T>({
        method,
        url: path,
        data,
        headers: {
          ...this.getAuthHeaders(headers),
          ...headers
        },
        validateStatus: () => true
      });

      if (response.status >= 400) {
        throw new ProxyError(
          response.status,
          response.data?.error || `Request failed with status ${response.status}`,
          serviceName
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof ProxyError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new ProxyError(
          error.response?.status || 500,
          error.response?.data?.error || error.message,
          serviceName
        );
      }

      throw new ProxyError(500, 'Internal proxy error', serviceName);
    }
  }

  private getAuthHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      'x-tenant-id': headers?.['x-tenant-id'] || 'default',
      'x-user-id': headers?.['x-user-id'] || 'system',
      'x-request-id': headers?.['x-request-id'] || this.generateRequestId()
    };
  }

  private generateRequestId(): string {
    return `b2b-gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async healthCheck(serviceName: ServiceName): Promise<{
    service: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    error?: string;
  }> {
    const config = B2B_SERVICES[serviceName];
    const start = Date.now();

    try {
      const client = this.getClient(serviceName);
      await client.get('/health', { timeout: 5000 });
      const latency = Date.now() - start;

      return {
        service: config.name,
        status: latency < 1000 ? 'up' : 'degraded',
        latency
      };
    } catch (error) {
      return {
        service: config.name,
        status: 'down',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async healthCheckAll(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      service: string;
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      error?: string;
    }>;
  }> {
    const results = await Promise.all(
      (Object.keys(B2B_SERVICES) as ServiceName[]).map(name => this.healthCheck(name))
    );

    const downCount = results.filter(r => r.status === 'down').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (downCount > 0) overall = 'unhealthy';
    else if (degradedCount > 0) overall = 'degraded';

    return {
      overall,
      services: results
    };
  }
}

export class ProxyError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public service: string
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}

export const proxyService = new ProxyService();
