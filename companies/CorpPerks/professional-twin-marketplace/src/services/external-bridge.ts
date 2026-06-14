/**
 * External Service Bridge
 *
 * Real integrations with:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Fallback mechanisms
 * - Health checks
 */

import fetch, { RequestInit } from 'node-fetch';

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 60000; // 1 minute

function getCircuitBreaker(service: string): CircuitBreakerState {
  if (!circuitBreakers.has(service)) {
    circuitBreakers.set(service, {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED'
    });
  }
  return circuitBreakers.get(service)!;
}

function circuitTrip(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures++;
  cb.lastFailure = new Date();

  if (cb.failures >= CIRCUIT_THRESHOLD) {
    cb.state = 'OPEN';
    logger.info(`⚡ Circuit breaker OPEN for ${service} after ${cb.failures} failures`);
  }
}

function circuitReset(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures = 0;
  cb.state = 'CLOSED';
}

function circuitCheck(service: string): boolean {
  const cb = getCircuitBreaker(service);

  if (cb.state === 'CLOSED') return true;

  if (cb.state === 'OPEN') {
    // Check if timeout has passed
    if (cb.lastFailure && Date.now() - cb.lastFailure.getTime() > CIRCUIT_TIMEOUT) {
      cb.state = 'HALF_OPEN';
      logger.info(`⚡ Circuit breaker HALF_OPEN for ${service}`);
      return true;
    }
    return false;
  }

  // HALF_OPEN - allow one request
  return true;
}

// =============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// =============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000 // 10 second timeout
      } as any);

      const data = await response.json();

      if (response.ok) {
        return { ok: true, status: response.status, data };
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return { ok: false, status: response.status, data, error: 'Client error' };
      }

      // Retry on server errors (5xx)
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < retries) {
      const delay = baseDelay * Math.pow(2, attempt);
      logger.info(`🔄 Retry ${attempt + 1}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { ok: false, status: 0, error: lastError?.message || 'Unknown error' };
}

// =============================================================================
// SERVICE CLIENTS
// =============================================================================

/**
 * CorpID Service Client
 */
export class CorpIDClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getIdentity(corpId: string): Promise<any> {
    if (!circuitCheck('corpid')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/identities/${corpId}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        }
      }
    );

    if (result.ok) {
      circuitReset('corpid');
      return result.data;
    }

    circuitTrip('corpid');
    return { fallback: true, error: result.error };
  }

  async verifyIdentity(corpId: string): Promise<boolean> {
    try {
      const result = await this.getIdentity(corpId);
      return !result.fallback && result.success;
    } catch {
      return false;
    }
  }

  async createIdentity(data: any): Promise<any> {
    if (!circuitCheck('corpid')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/identities/individual`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (result.ok) {
      circuitReset('corpid');
      return result.data;
    }

    circuitTrip('corpid');
    return { fallback: true, error: result.error };
  }

  getHealth(): CircuitBreakerState {
    return getCircuitBreaker('corpid');
  }
}

/**
 * Salar OS Client
 */
export class SalarClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createHumanTwin(data: any): Promise<any> {
    if (!circuitCheck('salar')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/human-twin`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (result.ok) {
      circuitReset('salar');
      return result.data;
    }

    circuitTrip('salar');
    return { fallback: true, error: result.error };
  }

  async createHybridTeam(data: any): Promise<any> {
    if (!circuitCheck('salar')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/hybrid-team`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (result.ok) {
      circuitReset('salar');
      return result.data;
    }

    circuitTrip('salar');
    return { fallback: true, error: result.error };
  }

  async findWorkforce(criteria: any): Promise<any> {
    if (!circuitCheck('salar')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/workforce/find`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(criteria)
      }
    );

    if (result.ok) {
      circuitReset('salar');
      return result.data;
    }

    circuitTrip('salar');
    return { fallback: true, error: result.error };
  }

  getHealth(): CircuitBreakerState {
    return getCircuitBreaker('salar');
  }
}

/**
 * HOJAI Memory Client
 */
export class MemoryClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async storeMemory(data: any): Promise<any> {
    if (!circuitCheck('memory')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/api/memory`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (result.ok) {
      circuitReset('memory');
      return result.data;
    }

    circuitTrip('memory');
    return { fallback: true, error: result.error };
  }

  async getMemories(scopeType: string, scopeId: string): Promise<any> {
    if (!circuitCheck('memory')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/api/memory/${scopeType}/${scopeId}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': this.token
        }
      }
    );

    if (result.ok) {
      circuitReset('memory');
      return result.data;
    }

    circuitTrip('memory');
    return { fallback: true, error: result.error };
  }

  async searchMemories(scopeType: string, scopeId: string, query: string): Promise<any> {
    if (!circuitCheck('memory')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/api/memory/${scopeType}/${scopeId}/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': this.token
        }
      }
    );

    if (result.ok) {
      circuitReset('memory');
      return result.data;
    }

    circuitTrip('memory');
    return { fallback: true, error: result.error };
  }

  getHealth(): CircuitBreakerState {
    return getCircuitBreaker('memory');
  }
}

/**
 * SkillNet Client
 */
export class SkillNetClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async recordSkillEvent(event: any): Promise<any> {
    if (!circuitCheck('skillnet')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/api/events`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (result.ok) {
      circuitReset('skillnet');
      return result.data;
    }

    circuitTrip('skillnet');
    return { fallback: true, error: result.error };
  }

  async findSkills(query: string): Promise<any> {
    if (!circuitCheck('skillnet')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.baseUrl}/api/skills/find?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': this.token
        }
      }
    );

    if (result.ok) {
      circuitReset('skillnet');
      return result.data;
    }

    circuitTrip('skillnet');
    return { fallback: true, error: result.error };
  }

  getHealth(): CircuitBreakerState {
    return getCircuitBreaker('skillnet');
  }
}

/**
 * RABTUL Payment Client
 */
export class RABTULClient {
  private walletUrl: string;
  private paymentUrl: string;
  private subscriptionUrl: string;
  private token: string;

  constructor(config: {
    walletUrl: string;
    paymentUrl: string;
    subscriptionUrl: string;
    token: string;
  }) {
    this.walletUrl = config.walletUrl;
    this.paymentUrl = config.paymentUrl;
    this.subscriptionUrl = config.subscriptionUrl;
    this.token = config.token;
  }

  async createSubscription(data: any): Promise<any> {
    if (!circuitCheck('rabtul')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.subscriptionUrl}/api/v1/subscriptions`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (result.ok) {
      circuitReset('rabtul');
      return result.data;
    }

    circuitTrip('rabtul');
    return { fallback: true, error: result.error };
  }

  async chargeWallet(userId: string, amount: number, description: string): Promise<any> {
    if (!circuitCheck('rabtul')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.walletUrl}/wallet/${userId}/debit`,
      {
        method: 'POST',
        headers: {
          'x-internal-token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, description })
      }
    );

    if (result.ok) {
      circuitReset('rabtul');
      return result.data;
    }

    circuitTrip('rabtul');
    return { fallback: true, error: result.error };
  }

  async getWallet(userId: string): Promise<any> {
    if (!circuitCheck('rabtul')) {
      return { fallback: true, error: 'Circuit open' };
    }

    const result = await fetchWithRetry(
      `${this.walletUrl}/wallet/${userId}`,
      {
        method: 'GET',
        headers: {
          'x-internal-token': this.token
        }
      }
    );

    if (result.ok) {
      circuitReset('rabtul');
      return result.data;
    }

    circuitTrip('rabtul');
    return { fallback: true, error: result.error };
  }

  getHealth(): CircuitBreakerState {
    return getCircuitBreaker('rabtul');
  }
}

/**
 * Health Check for all services
 */
export async function checkAllServicesHealth(): Promise<Record<string, {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  error?: string;
}>> {
  const services = [
    { name: 'corpid', url: process.env.CORPID_URL || 'http://localhost:4702' },
    { name: 'salar', url: process.env.SALAR_URL || 'http://localhost:4710' },
    { name: 'memory', url: process.env.HOJAI_MEMORY_URL || 'http://localhost:4520' },
    { name: 'skillnet', url: process.env.SKILLNET_BRIDGE_URL || 'http://localhost:5130' },
    { name: 'rabtul', url: process.env.RABTUL_WALLET_URL || 'http://localhost:4004' }
  ];

  const results: Record<string, any> = {};

  for (const svc of services) {
    const start = Date.now();
    try {
      const response = await fetch(`${svc.url}/health`, { timeout: 5000 });
      const latency = Date.now() - start;

      results[svc.name] = {
        service: svc.name,
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        circuitBreaker: getCircuitBreaker(svc.name)
      };
    } catch (error) {
      results[svc.name] = {
        service: svc.name,
        status: 'down',
        error: (error as Error).message,
        circuitBreaker: getCircuitBreaker(svc.name)
      };
    }
  }

  return results;
}

export default {
  CorpIDClient,
  SalarClient,
  MemoryClient,
  SkillNetClient,
  RABTULClient,
  checkAllServicesHealth,
  circuitBreakers
};
