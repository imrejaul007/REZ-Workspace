import { CircuitBreakerState } from '../types';
import { logger } from '../utils/logger';
import config from '../config';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval: number;
}

export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private config: CircuitBreakerConfig;

  constructor() {
    this.config = {
      failureThreshold: config.circuitBreaker.timeout / 1000, // Use timeout as threshold
      resetTimeout: config.circuitBreaker.resetTimeout,
      monitorInterval: 30000 // 30 seconds
    };

    // Start monitoring circuit breaker states
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.checkCircuitStates();
    }, this.config.monitorInterval);
  }

  private checkCircuitStates(): void {
    const now = Date.now();

    this.states.forEach((state, serviceName) => {
      if (state.state === 'open' && state.nextRetry <= now) {
        // Transition to half-open
        state.state = 'half-open';
        logger.info(`Circuit breaker for ${serviceName} transitioned to half-open`);
      }
    });
  }

  getState(serviceName: string): CircuitBreakerState {
    if (!this.states.has(serviceName)) {
      this.states.set(serviceName, {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        nextRetry: 0
      });
    }

    return this.states.get(serviceName)!;
  }

  isOpen(serviceName: string): boolean {
    const state = this.getState(serviceName);
    return state.state === 'open';
  }

  isAvailable(serviceName: string): boolean {
    const state = this.getState(serviceName);
    return state.state !== 'open';
  }

  recordSuccess(serviceName: string): void {
    const state = this.getState(serviceName);

    if (state.state === 'half-open') {
      // Successful call in half-open state - close the circuit
      state.state = 'closed';
      state.failures = 0;
      state.nextRetry = 0;

      logger.info(`Circuit breaker for ${serviceName} closed after successful call`);
    } else if (state.failures > 0) {
      // Reset failure count on success in closed state
      state.failures = Math.max(0, state.failures - 1);
    }
  }

  recordFailure(serviceName: string): void {
    const state = this.getState(serviceName);
    state.failures++;
    state.lastFailure = Date.now();

    logger.warn(`Circuit breaker failure recorded for ${serviceName}`, {
      failures: state.failures,
      threshold: this.config.failureThreshold
    });

    if (state.failures >= this.config.failureThreshold) {
      state.state = 'open';
      state.nextRetry = Date.now() + this.config.resetTimeout;

      logger.error(`Circuit breaker for ${serviceName} opened after ${state.failures} failures`);
    }
  }

  forceOpen(serviceName: string): void {
    const state = this.getState(serviceName);
    state.state = 'open';
    state.nextRetry = Date.now() + this.config.resetTimeout;

    logger.warn(`Circuit breaker for ${serviceName} manually opened`);
  }

  forceClose(serviceName: string): void {
    const state = this.getState(serviceName);
    state.state = 'closed';
    state.failures = 0;
    state.nextRetry = 0;

    logger.info(`Circuit breaker for ${serviceName} manually closed`);
  }

  reset(serviceName: string): void {
    this.states.delete(serviceName);
    logger.info(`Circuit breaker for ${serviceName} reset`);
  }

  getAllStates(): Map<string, CircuitBreakerState> {
    return new Map(this.states);
  }

  getStats(): {
    totalServices: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
  } {
    let open = 0;
    let halfOpen = 0;
    let closed = 0;

    this.states.forEach(state => {
      switch (state.state) {
        case 'open':
          open++;
          break;
        case 'half-open':
          halfOpen++;
          break;
        case 'closed':
          closed++;
          break;
      }
    });

    return {
      totalServices: this.states.size,
      openCircuits: open,
      halfOpenCircuits: halfOpen,
      closedCircuits: closed
    };
  }
}

export const circuitBreaker = new CircuitBreaker();
export default circuitBreaker;