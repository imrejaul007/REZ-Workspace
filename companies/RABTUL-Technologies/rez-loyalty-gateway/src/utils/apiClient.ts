/**
 * API Client with Circuit Breaker Pattern
 * Used for service-to-service communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { serviceConfig, env } from '../config/services.js';
import { logger } from './logger.js';

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class ApiClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private circuitBreakers: Map<string, CircuitState> = new Map();
  private readonly failuresToTrip: number;
  private readonly resetTimeout: number;

  constructor() {
    this.failuresToTrip = 5;
    this.resetTimeout = 30000;
  }

  private getClient(serviceName: string): AxiosInstance {
    if (!this.clients.has(serviceName)) {
      const config = serviceConfig[serviceName as keyof typeof serviceConfig];
      if (!config) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': uuidv4(),
          'X-Internal-Token': env.INTERNAL_SERVICE_TOKEN,
          'X-Calling-Service': 'loyalty-gateway',
        },
      });

      this.clients.set(serviceName, client);
      this.circuitBreakers.set(serviceName, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
      });
    }
    return this.clients.get(serviceName)!;
  }

  private getCircuitState(serviceName: string): CircuitState {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
      });
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  private recordFailure(serviceName: string, error: Error): void {
    const state = this.getCircuitState(serviceName);
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.failuresToTrip) {
      state.state = 'OPEN';
      logger.warn(`[CircuitBreaker] OPEN for ${serviceName}`, { failures: state.failures });
    }
  }

  private recordSuccess(serviceName: string): void {
    const state = this.getCircuitState(serviceName);
    state.failures = 0;
    state.state = 'CLOSED';
  }

  private checkCircuit(serviceName: string): boolean {
    const state = this.getCircuitState(serviceName);

    if (state.state === 'CLOSED') {
      return true;
    }

    if (state.state === 'OPEN') {
      // Check if reset timeout has passed
      if (Date.now() - state.lastFailure > this.resetTimeout) {
        state.state = 'HALF_OPEN';
        logger.info(`[CircuitBreaker] HALF_OPEN for ${serviceName}`);
        return true;
      }
      return false;
    }

    // HALF_OPEN - allow one request
    return true;
  }

  async get<T>(serviceName: string, endpoint: string, params?: Record<string, unknown>): Promise<T | null> {
    if (!this.checkCircuit(serviceName)) {
      logger.warn(`[CircuitBreaker] Circuit OPEN for ${serviceName}, skipping request`);
      return null;
    }

    try {
      const client = this.getClient(serviceName);
      const response = await client.get<T>(endpoint, { params });
      this.recordSuccess(serviceName);
      return response.data;
    } catch (error) {
      this.recordFailure(serviceName, error as Error);
      logger.error(`[ApiClient] GET ${serviceName}${endpoint} failed`, { error });
      throw error;
    }
  }

  async post<T>(serviceName: string, endpoint: string, data?: unknown): Promise<T | null> {
    if (!this.checkCircuit(serviceName)) {
      logger.warn(`[CircuitBreaker] Circuit OPEN for ${serviceName}, skipping request`);
      return null;
    }

    try {
      const client = this.getClient(serviceName);
      const response = await client.post<T>(endpoint, data);
      this.recordSuccess(serviceName);
      return response.data;
    } catch (error) {
      this.recordFailure(serviceName, error as Error);
      logger.error(`[ApiClient] POST ${serviceName}${endpoint} failed`, { error });
      throw error;
    }
  }

  async batchCall<T>(
    calls: Array<{ service: string; endpoint: string; method: 'GET' | 'POST'; data?: unknown }>
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    await Promise.allSettled(
      calls.map(async (call) => {
        try {
          const result = call.method === 'GET'
            ? await this.get<T>(call.service, call.endpoint)
            : await this.post<T>(call.service, call.endpoint, call.data);
          results.set(`${call.service}:${call.endpoint}`, result);
        } catch {
          results.set(`${call.service}:${call.endpoint}`, null);
        }
      })
    );

    return results;
  }

  getCircuitStatus(): Record<string, { state: string; failures: number }> {
    const status: Record<string, { state: string; failures: number }> = {};
    this.circuitBreakers.forEach((state, name) => {
      status[name] = { state: state.state, failures: state.failures };
    });
    return status;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
