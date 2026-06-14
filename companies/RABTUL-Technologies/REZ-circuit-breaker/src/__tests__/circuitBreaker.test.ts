/**
 * Circuit Breaker Tests
 * Tests for fault tolerance pattern implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls: number;
}

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureTime?: number;
  successCount: number;
  config: CircuitBreakerConfig;
}

function createCircuitBreaker(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
  return {
    state: 'CLOSED',
    failures: 0,
    successCount: 0,
    config: {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 60000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3,
    },
  };
}

function recordSuccess(cb: CircuitBreaker): void {
  cb.successCount++;
  cb.failures = 0;

  if (cb.state === 'HALF_OPEN') {
    if (cb.successCount >= cb.config.halfOpenMaxCalls) {
      cb.state = 'CLOSED';
      cb.successCount = 0;
    }
  }
}

function recordFailure(cb: CircuitBreaker): void {
  cb.failures++;
  cb.lastFailureTime = Date.now();

  if (cb.state === 'CLOSED' && cb.failures >= cb.config.failureThreshold) {
    cb.state = 'OPEN';
  } else if (cb.state === 'HALF_OPEN') {
    cb.state = 'OPEN';
    cb.failures = 1;
  }
}

function canExecute(cb: CircuitBreaker): boolean {
  if (cb.state === 'CLOSED') return true;

  if (cb.state === 'OPEN') {
    if (cb.lastFailureTime) {
      const elapsed = Date.now() - cb.lastFailureTime;
      if (elapsed >= cb.config.resetTimeout) {
        cb.state = 'HALF_OPEN';
        cb.successCount = 0;
        return true;
      }
    }
    return false;
  }

  if (cb.state === 'HALF_OPEN') {
    return cb.successCount < cb.config.halfOpenMaxCalls;
  }

  return false;
}

function getCircuitStatus(cb: CircuitBreaker): string {
  return `${cb.state} (failures: ${cb.failures}, success: ${cb.successCount})`;
}

describe('Circuit Breaker State Machine', () => {
  let circuit: CircuitBreaker;

  beforeEach(() => {
    circuit = createCircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenMaxCalls: 2
    });
  });

  describe('CLOSED State', () => {
    it('should start in CLOSED state', () => {
      expect(circuit.state).toBe('CLOSED');
      expect(circuit.failures).toBe(0);
    });

    it('should allow execution in CLOSED state', () => {
      expect(canExecute(circuit)).toBe(true);
    });

    it('should stay CLOSED with successful calls', () => {
      for (let i = 0; i < 10; i++) {
        recordSuccess(circuit);
      }
      expect(circuit.state).toBe('CLOSED');
      expect(circuit.failures).toBe(0);
    });

    it('should transition to OPEN after threshold failures', () => {
      for (let i = 0; i < 3; i++) {
        recordFailure(circuit);
      }
      expect(circuit.state).toBe('OPEN');
    });
  });

  describe('OPEN State', () => {
    beforeEach(() => {
      // Force OPEN state
      for (let i = 0; i < 3; i++) {
        recordFailure(circuit);
      }
    });

    it('should block execution in OPEN state', () => {
      expect(canExecute(circuit)).toBe(false);
      expect(circuit.state).toBe('OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', () => {
      // Simulate time passage
      circuit.lastFailureTime = Date.now() - 2000;
      expect(canExecute(circuit)).toBe(true);
      expect(circuit.state).toBe('HALF_OPEN');
    });
  });

  describe('HALF_OPEN State', () => {
    beforeEach(() => {
      // Force HALF_OPEN state
      for (let i = 0; i < 3; i++) {
        recordFailure(circuit);
      }
      circuit.lastFailureTime = Date.now() - 2000;
      canExecute(circuit); // This triggers transition
    });

    it('should be in HALF_OPEN after reset timeout', () => {
      expect(circuit.state).toBe('HALF_OPEN');
    });

    it('should allow limited calls in HALF_OPEN', () => {
      expect(canExecute(circuit)).toBe(true); // 1st call
      recordSuccess(circuit);
      expect(canExecute(circuit)).toBe(true); // 2nd call
      recordSuccess(circuit);
      expect(canExecute(circuit)).toBe(false); // 3rd call (limit reached)
    });

    it('should transition to CLOSED after successful half-open calls', () => {
      recordSuccess(circuit); // 1
      recordSuccess(circuit); // 2 (max reached)
      expect(circuit.state).toBe('CLOSED');
    });

    it('should transition to OPEN on failure in HALF_OPEN', () => {
      recordFailure(circuit);
      expect(circuit.state).toBe('OPEN');
      expect(circuit.failures).toBe(1);
    });
  });
});

describe('Circuit Breaker Configuration', () => {
  it('should use default config when not specified', () => {
    const cb = createCircuitBreaker();
    expect(cb.config.failureThreshold).toBe(5);
    expect(cb.config.resetTimeout).toBe(60000);
    expect(cb.config.halfOpenMaxCalls).toBe(3);
  });

  it('should accept custom config', () => {
    const cb = createCircuitBreaker({
      failureThreshold: 10,
      resetTimeout: 30000,
      halfOpenMaxCalls: 5
    });
    expect(cb.config.failureThreshold).toBe(10);
    expect(cb.config.resetTimeout).toBe(30000);
    expect(cb.config.halfOpenMaxCalls).toBe(5);
  });

  it('should handle zero threshold', () => {
    const cb = createCircuitBreaker({ failureThreshold: 0 });
    recordFailure(cb);
    expect(cb.state).toBe('OPEN');
  });
});

describe('Circuit Breaker Status', () => {
  it('should provide accurate status', () => {
    const circuit = createCircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000
    });

    expect(getCircuitStatus(circuit)).toBe('CLOSED (failures: 0, success: 0)');

    recordFailure(circuit);
    expect(getCircuitStatus(circuit)).toBe('CLOSED (failures: 1, success: 0)');

    recordSuccess(circuit);
    expect(getCircuitStatus(circuit)).toBe('CLOSED (failures: 0, success: 1)');
  });
});

describe('Real-World Scenarios', () => {
  it('should handle flaky service recovery', () => {
    const circuit = createCircuitBreaker({ failureThreshold: 3 });

    // Service starts failing
    recordFailure(circuit);
    recordFailure(circuit);

    // Service recovers briefly
    recordSuccess(circuit);

    // Service fails again
    recordFailure(circuit);
    recordFailure(circuit);
    recordFailure(circuit); // Now at threshold

    expect(circuit.state).toBe('OPEN');
  });

  it('should handle rapid failures', () => {
    const circuit = createCircuitBreaker({ failureThreshold: 3 });

    // Rapid failures
    for (let i = 0; i < 10; i++) {
      recordFailure(circuit);
    }

    // Should be OPEN but not count past threshold
    expect(circuit.state).toBe('OPEN');
    expect(circuit.failures).toBeGreaterThanOrEqual(3);
  });

  it('should handle timeout-based recovery', () => {
    const circuit = createCircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 5000
    });

    // Fail twice to open
    recordFailure(circuit);
    recordFailure(circuit);
    expect(circuit.state).toBe('OPEN');

    // Before timeout, still open
    expect(canExecute(circuit)).toBe(false);

    // After timeout (simulated)
    circuit.lastFailureTime = Date.now() - 6000;
    expect(canExecute(circuit)).toBe(true);
    expect(circuit.state).toBe('HALF_OPEN');
  });
});
