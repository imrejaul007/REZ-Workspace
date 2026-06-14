// ============================================================================
// SUTAR Gateway - Circuit Breaker
// Failure handling with configurable thresholds and state transitions
// ============================================================================

import type {
  CircuitBreakerConfig,
  CircuitState,
  CircuitBreakerState,
  ApiResponse,
} from '../types/index.js';

export class CircuitBreaker {
  private serviceId: string;
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private halfOpenAttempts: number = 0;
  private listeners: Set<(event: CircuitBreakerEvent) => void> = new Set();

  constructor(serviceId: string, config?: Partial<CircuitBreakerConfig>) {
    this.serviceId = serviceId;
    this.config = {
      enabled: config?.enabled ?? true,
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 3,
      timeout: config?.timeout ?? 60000,
      halfOpenRequests: config?.halfOpenRequests ?? 3,
      resetInterval: config?.resetInterval ?? 30000,
    };
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  isOpen(): boolean {
    if (!this.config.enabled) return false;

    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
        this.transitionTo('half_open');
        return false;
      }
      return true;
    }

    return false;
  }

  isClosed(): boolean {
    return this.state === 'closed';
  }

  isHalfOpen(): boolean {
    return this.state === 'half_open';
  }

  canExecute(): boolean {
    if (!this.config.enabled) return true;
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
        this.transitionTo('half_open');
        return true;
      }
      return false;
    }
    return true;
  }

  getState(): CircuitBreakerState {
    return {
      serviceId: this.serviceId,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : undefined,
      nextAttempt: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : undefined,
      halfOpenAttempts: this.halfOpenAttempts,
    };
  }

  // ---------------------------------------------------------------------------
  // Execution with Circuit Breaker
  // ---------------------------------------------------------------------------

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    if (!this.canExecute()) {
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerOpenError(
        `Circuit breaker is open for service: ${this.serviceId}`
      );
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (fallback) {
        try {
          return await fallback();
        } catch {
          throw error;
        }
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Recording Success/Failure
  // ---------------------------------------------------------------------------

  recordSuccess(): void {
    if (this.state === 'half_open') {
      this.successes++;
      this.halfOpenAttempts++;

      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failures = Math.max(0, this.failures - 1);
    }

    this.emit({
      type: 'success',
      serviceId: this.serviceId,
      state: this.state,
      timestamp: new Date().toISOString(),
    });
  }

  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failures++;

    if (this.state === 'half_open') {
      // Any failure in half-open state opens the circuit again
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }

    this.emit({
      type: 'failure',
      serviceId: this.serviceId,
      state: this.state,
      failures: this.failures,
      timestamp: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // State Transitions
  // ---------------------------------------------------------------------------

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    switch (newState) {
      case 'open':
        this.nextAttemptTime = Date.now() + this.config.timeout;
        this.halfOpenAttempts = 0;
        break;

      case 'half_open':
        this.nextAttemptTime = undefined;
        this.successes = 0;
        this.failures = 0;
        this.halfOpenAttempts = 0;
        break;

      case 'closed':
        this.failures = 0;
        this.successes = 0;
        this.nextAttemptTime = undefined;
        this.halfOpenAttempts = 0;
        break;
    }

    this.emit({
      type: 'state_change',
      serviceId: this.serviceId,
      previousState,
      newState,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[CircuitBreaker] ${this.serviceId}: ${previousState} -> ${newState}`
    );
  }

  // ---------------------------------------------------------------------------
  // Manual Control
  // ---------------------------------------------------------------------------

  forceOpen(): void {
    this.transitionTo('open');
  }

  forceClose(): void {
    this.transitionTo('closed');
  }

  forceHalfOpen(): void {
    this.transitionTo('half_open');
  }

  reset(): void {
    this.transitionTo('closed');
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  onEvent(listener: (event: CircuitBreakerEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: CircuitBreakerEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: CircuitBreakerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[CircuitBreaker] Event listener error:', error);
      }
    }
  }
}

// ============================================================================
// Circuit Breaker Manager
// ============================================================================

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;
  private listeners: Set<(event: CircuitBreakerEvent) => void> = new Set();

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      enabled: config?.enabled ?? true,
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 3,
      timeout: config?.timeout ?? 60000,
      halfOpenRequests: config?.halfOpenRequests ?? 3,
      resetInterval: config?.resetInterval ?? 30000,
    };
  }

  getBreaker(serviceId: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(serviceId);
    if (!breaker) {
      breaker = new CircuitBreaker(serviceId, {
        ...this.defaultConfig,
        ...config,
      });

      // Forward events from the breaker
      breaker.onEvent(event => {
        this.emit(event);
      });

      this.breakers.set(serviceId, breaker);
    }
    return breaker;
  }

  getState(serviceId: string): CircuitBreakerState | null {
    const breaker = this.breakers.get(serviceId);
    return breaker ? breaker.getState() : null;
  }

  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.breakers.values()).map(b => b.getState());
  }

  removeBreaker(serviceId: string): void {
    this.breakers.delete(serviceId);
  }

  clearAll(): void {
    this.breakers.clear();
  }

  async executeWithCircuitBreaker<T>(
    serviceId: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T | null> {
    const breaker = this.getBreaker(serviceId, config);
    return breaker.execute(operation, fallback);
  }

  forceOpen(serviceId: string): void {
    const breaker = this.breakers.get(serviceId);
    if (breaker) {
      breaker.forceOpen();
    }
  }

  forceClose(serviceId: string): void {
    const breaker = this.breakers.get(serviceId);
    if (breaker) {
      breaker.forceClose();
    }
  }

  forceHalfOpen(serviceId: string): void {
    const breaker = this.breakers.get(serviceId);
    if (breaker) {
      breaker.forceHalfOpen();
    }
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  updateDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  getStats(): {
    total: number;
    open: number;
    closed: number;
    halfOpen: number;
    byService: Record<string, CircuitState>;
  } {
    const stats = {
      total: this.breakers.size,
      open: 0,
      closed: 0,
      halfOpen: 0,
      byService: {} as Record<string, CircuitState>,
    };

    for (const [serviceId, breaker] of this.breakers) {
      const state = breaker.getState().state;
      stats[state]++;
      stats.byService[serviceId] = state;
    }

    return stats;
  }

  onEvent(listener: (event: CircuitBreakerEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: CircuitBreakerEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: CircuitBreakerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[CircuitBreakerManager] Event listener error:', error);
      }
    }
  }
}

// ============================================================================
// Types and Error Classes
// ============================================================================

export interface CircuitBreakerEvent {
  type: 'success' | 'failure' | 'state_change';
  serviceId: string;
  state: CircuitState;
  previousState?: CircuitState;
  newState?: CircuitState;
  failures?: number;
  timestamp: string;
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Helper function for quick circuit breaker protection
export async function withCircuitBreaker<T>(
  serviceId: string,
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T | null> {
  return circuitBreakerManager.executeWithCircuitBreaker(
    serviceId,
    operation,
    fallback
  );
}

// Helper to get circuit breaker status for API response
export function getCircuitBreakerStatus(serviceId: string): ApiResponse<CircuitBreakerState | null> {
  const state = circuitBreakerManager.getState(serviceId);
  return {
    success: true,
    data: state,
    timestamp: new Date().toISOString(),
  };
}