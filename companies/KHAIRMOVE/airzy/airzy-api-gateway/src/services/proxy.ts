import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import { ServiceUnavailableError, CircuitBreakerError } from '../utils/errors';
import { circuitBreaker } from './circuitBreaker';
import { cacheService } from './cache';

interface ProxyRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}

interface ProxyResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class ProxyService {
  private clients: Map<string, AxiosInstance> = new Map();
  private requestCounts: Map<string, number> = new Map();

  constructor() {
    this.initClients();
    this.startMetricsCollection();
  }

  private initClients(): void {
    Object.entries(config.routes).forEach(([name, routeConfig]) => {
      const client = axios.create({
        baseURL: routeConfig.baseUrl,
        timeout: routeConfig.timeout,
        headers: {
          'User-Agent': 'Airzy-API-Gateway/1.0',
          'X-Gateway-Version': config.version
        }
      });

      // Request interceptor
      client.interceptors.request.use(
        (config) => {
          config.headers['X-Request-ID'] = `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return config;
        },
        (error) => {
          logger.error('Proxy request error', { error: error.message });
          return Promise.reject(error);
        }
      );

      // Response interceptor
      client.interceptors.response.use(
        (response) => {
          this.requestCounts.set(name, (this.requestCounts.get(name) || 0) + 1);
          return response;
        },
        async (error) => {
          const originalRequest = error.config;

          // Retry logic
          if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
          }

          if (originalRequest._retryCount < (config.routes[name]?.retryAttempts || 3)) {
            originalRequest._retryCount++;
            const delay = Math.pow(2, originalRequest._retryCount) * 1000;

            logger.info(`Retrying request to ${name}`, {
              attempt: originalRequest._retryCount,
              delay
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            return client(originalRequest);
          }

          throw error;
        }
      );

      this.clients.set(name, client);
    });

    logger.info('Proxy clients initialized', {
      services: Array.from(this.clients.keys())
    });
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const metrics: Record<string, number> = {};
      this.requestCounts.forEach((count, name) => {
        metrics[name] = count;
      });
      logger.debug('Proxy request metrics', metrics);
    }, 60000);
  }

  private getClient(serviceName: string): AxiosInstance {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new ServiceUnavailableError(serviceName);
    }
    return client;
  }

  private getCacheKey(serviceName: string, path: string, query?: Record<string, string>): string {
    const queryStr = query ? JSON.stringify(query) : '';
    return `proxy:${serviceName}:${path}:${queryStr}`;
  }

  async proxy<T = unknown>(serviceName: string, request: ProxyRequest): Promise<ProxyResponse<T>> {
    // Check circuit breaker
    if (!circuitBreaker.isAvailable(serviceName)) {
      throw new CircuitBreakerError(serviceName);
    }

    const startTime = Date.now();
    const client = this.getClient(serviceName);

    // Check cache for GET requests
    const routeConfig = config.routes[serviceName as keyof typeof config.routes];
    if (request.method === 'GET' && routeConfig?.timeout) {
      const cacheKey = this.getCacheKey(serviceName, request.path, request.query);
      const cached = await cacheService.getJson<T>(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { serviceName, path: request.path });
        return {
          data: cached,
          status: 200,
          headers: { 'X-Cache': 'HIT' }
        };
      }
    }

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: request.method.toLowerCase(),
        url: request.path,
        headers: {
          ...request.headers,
          'X-Forwarded-For': request.headers?.['x-real-ip'] || 'unknown',
          'X-Forwarded-Proto': 'https'
        },
        params: request.query,
        data: request.body
      };

      const response: AxiosResponse<T> = await client.request<T>(axiosConfig);

      // Record success in circuit breaker
      circuitBreaker.recordSuccess(serviceName);

      // Cache response for GET requests
      if (request.method === 'GET' && routeConfig?.timeout) {
        const cacheKey = this.getCacheKey(serviceName, request.path, request.query);
        await cacheService.setJson(cacheKey, response.data, routeConfig.timeout / 1000);
      }

      const duration = Date.now() - startTime;
      logger.info('Proxy request completed', {
        serviceName,
        path: request.path,
        method: request.method,
        status: response.status,
        duration
      });

      return {
        data: response.data,
        status: response.status,
        headers: this.flattenHeaders(response.headers)
      };
    } catch (error) {
      // Record failure in circuit breaker
      circuitBreaker.recordFailure(serviceName);

      const duration = Date.now() - startTime;
      logger.error('Proxy request failed', {
        serviceName,
        path: request.path,
        method: request.method,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new ServiceUnavailableError(serviceName);
        }
        if (error.response) {
          throw error;
        }
      }

      throw error;
    }
  }

  private flattenHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value.join(', ');
      }
    });
    return result;
  }

  async healthCheck(serviceName: string): Promise<{
    healthy: boolean;
    latency: number;
    status: string;
  }> {
    const startTime = Date.now();

    try {
      const client = this.getClient(serviceName);
      await client.get('/health', { timeout: 5000 });

      return {
        healthy: true,
        latency: Date.now() - startTime,
        status: 'healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        status: 'unhealthy'
      };
    }
  }

  async checkAllServices(): Promise<Record<string, { healthy: boolean; latency: number }>> {
    const results: Record<string, { healthy: boolean; latency: number }> = {};

    const checks = Array.from(this.clients.keys()).map(async (name) => {
      results[name] = await this.healthCheck(name);
    });

    await Promise.all(checks);
    return results;
  }

  getRequestCounts(): Record<string, number> {
    return Object.fromEntries(this.requestCounts);
  }
}

export const proxyService = new ProxyService();
export default proxyService;