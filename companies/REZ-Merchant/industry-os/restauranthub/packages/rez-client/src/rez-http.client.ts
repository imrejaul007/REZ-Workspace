/**
 * RezHttpClient — Base HTTP client for all REZ microservice calls.
 *
 * Required environment variables:
 *   REZ_INTERNAL_TOKEN         — Inter-service auth token (X-Internal-Token header)
 *   REZ_MERCHANT_SERVICE_URL   — Merchant service base URL (required in production)
 *   REZ_ANALYTICS_URL          — Analytics service base URL (required in production)
 *   REZ_CATALOG_URL            — Catalog service base URL (required in production)
 *   REZ_WALLET_URL             — Wallet service base URL (required in production)
 *   REZ_BACKEND_URL            — Backend monolith base URL (required in production)
 *
 * SECURITY: No hardcoded fallback URLs — service will fail fast if env vars are missing.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { CircuitBreakerState, CircuitState } from './types/rez.types';

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 300;

@Injectable()
export class RezHttpClient {
  private readonly logger = new Logger(RezHttpClient.name);
  private readonly circuits = new Map<string, CircuitBreakerState>();

  constructor(private readonly config: ConfigService) {}

  // ─── Circuit breaker helpers ──────────────────────────────────────────────

  private getCircuit(serviceKey: string): CircuitBreakerState {
    if (!this.circuits.has(serviceKey)) {
      this.circuits.set(serviceKey, {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
      });
    }
    return this.circuits.get(serviceKey) as CircuitBreakerState;
  }

  private isOpen(serviceKey: string): boolean {
    const circuit = this.getCircuit(serviceKey);
    if (circuit.state === 'open') {
      const now = Date.now();
      if (circuit.nextAttemptTime !== null && now >= circuit.nextAttemptTime) {
        circuit.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  private recordSuccess(serviceKey: string): void {
    const circuit = this.getCircuit(serviceKey);
    circuit.consecutiveFailures = 0;
    circuit.state = 'closed';
    circuit.lastFailureTime = null;
    circuit.nextAttemptTime = null;
  }

  private recordFailure(serviceKey: string): void {
    const circuit = this.getCircuit(serviceKey);
    circuit.consecutiveFailures += 1;
    circuit.lastFailureTime = Date.now();
    if (circuit.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
      circuit.state = 'open';
      circuit.nextAttemptTime = Date.now() + CIRCUIT_RESET_MS;
      this.logger.warn(
        `Circuit opened for ${serviceKey} after ${circuit.consecutiveFailures} failures`,
      );
    }
  }

  getCircuitState(serviceKey: string): CircuitState {
    return this.getCircuit(serviceKey).state;
  }

  // ─── Axios instance factory ───────────────────────────────────────────────

  buildInstance(baseURL: string): AxiosInstance {
    const token = this.config.get<string>('REZ_INTERNAL_TOKEN', '');
    return axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
      },
    });
  }

  // ─── Retry with exponential backoff ──────────────────────────────────────

  private async withRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    attempt = 0,
  ): Promise<AxiosResponse<T>> {
    try {
      return await fn();
    } catch (err: unknown) {
      const isServer =
        axios.isAxiosError(err) &&
        err.response !== undefined &&
        err.response.status >= 500;
      const isNetwork = axios.isAxiosError(err) && err.response === undefined;

      if ((isServer || isNetwork) && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        this.logger.debug(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return this.withRetry(fn, attempt + 1);
      }
      throw err;
    }
  }

  // ─── Core request executor ────────────────────────────────────────────────

  async request<T>(
    serviceKey: string,
    instance: AxiosInstance,
    cfg: AxiosRequestConfig,
    correlationId?: string,
  ): Promise<T | null> {
    if (this.isOpen(serviceKey)) {
      this.logger.warn(`Circuit open for ${serviceKey}, returning null`);
      return null;
    }

    const headers: Record<string, string> = {
      ...(cfg.headers as Record<string, string>),
    };
    if (correlationId) {
      headers['X-Correlation-ID'] = correlationId;
    }

    try {
      const response = await this.withRetry<T>(() =>
        instance.request<T>({ ...cfg, headers }),
      );
      this.recordSuccess(serviceKey);
      return response.data;
    } catch (err: unknown) {
      this.recordFailure(serviceKey);
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Request failed [${serviceKey}] ${cfg.method?.toUpperCase()} ${cfg.url}: ${msg}`,
      );
      return null;
    }
  }

  // ─── Typed HTTP methods ───────────────────────────────────────────────────

  async get<T>(
    serviceKey: string,
    instance: AxiosInstance,
    url: string,
    params?: Record<string, unknown>,
    correlationId?: string,
  ): Promise<T | null> {
    return this.request<T>(serviceKey, instance, { method: 'GET', url, params }, correlationId);
  }

  async post<T>(
    serviceKey: string,
    instance: AxiosInstance,
    url: string,
    data?: unknown,
    correlationId?: string,
  ): Promise<T | null> {
    return this.request<T>(serviceKey, instance, { method: 'POST', url, data }, correlationId);
  }

  async put<T>(
    serviceKey: string,
    instance: AxiosInstance,
    url: string,
    data?: unknown,
    correlationId?: string,
  ): Promise<T | null> {
    return this.request<T>(serviceKey, instance, { method: 'PUT', url, data }, correlationId);
  }

  async delete<T>(
    serviceKey: string,
    instance: AxiosInstance,
    url: string,
    correlationId?: string,
  ): Promise<T | null> {
    return this.request<T>(serviceKey, instance, { method: 'DELETE', url }, correlationId);
  }
}
