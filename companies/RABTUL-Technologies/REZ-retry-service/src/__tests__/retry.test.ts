/**
 * Retry Service Tests
 * Tests for exponential backoff and retry logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

interface RetryAttempt {
  attemptNumber: number;
  delayMs: number;
  timestamp: Date;
}

// Exponential backoff calculator
function calculateDelay(
  attemptNumber: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (config.jitter) {
    // Add random jitter (±25%)
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  return Math.round(cappedDelay);
}

function shouldRetry(
  attemptNumber: number,
  error: Error,
  config: RetryConfig
): boolean {
  if (attemptNumber >= config.maxRetries) {
    return false;
  }

  // Only retry transient errors
  const transientErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ENETUNREACH'];
  return transientErrors.some(code => error.message.includes(code));
}

function createRetrySchedule(config: RetryConfig): RetryAttempt[] {
  const attempts: RetryAttempt[] = [];

  for (let i = 0; i < config.maxRetries; i++) {
    attempts.push({
      attemptNumber: i + 1,
      delayMs: calculateDelay(i, config),
      timestamp: new Date(),
    });
  }

  return attempts;
}

describe('Exponential Backoff', () => {
  const defaultConfig: RetryConfig = {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: false,
  };

  it('should calculate delay for first attempt', () => {
    const delay = calculateDelay(0, defaultConfig);
    expect(delay).toBe(100); // initialDelayMs
  });

  it('should double delay for each attempt (without jitter)', () => {
    const delay0 = calculateDelay(0, { ...defaultConfig, jitter: false });
    const delay1 = calculateDelay(1, { ...defaultConfig, jitter: false });
    const delay2 = calculateDelay(2, { ...defaultConfig, jitter: false });

    expect(delay1).toBe(200); // 100 * 2^1
    expect(delay2).toBe(400); // 100 * 2^2
  });

  it('should cap delay at maxDelayMs', () => {
    const delay = calculateDelay(10, defaultConfig); // Would be 102400ms without cap
    expect(delay).toBe(30000); // Capped at maxDelayMs
  });

  it('should include jitter when enabled', () => {
    const delays: number[] = [];
    for (let i = 0; i < 100; i++) {
      delays.push(calculateDelay(5, { ...defaultConfig, jitter: true }));
    }

    // With jitter, delays should vary
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe('Retry Decision', () => {
  const config: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    jitter: false,
  };

  it('should retry on transient errors', () => {
    const error = new Error('ECONNRESET connection reset');
    expect(shouldRetry(0, error, config)).toBe(true);
  });

  it('should retry on timeout', () => {
    const error = new Error('ETIMEDOUT operation timed out');
    expect(shouldRetry(0, error, config)).toBe(true);
  });

  it('should not exceed max retries', () => {
    const error = new Error('ECONNRESET');
    expect(shouldRetry(3, error, config)).toBe(false);
  });

  it('should not retry on first attempt of max retries', () => {
    const error = new Error('ECONNRESET');
    expect(shouldRetry(1, error, config)).toBe(true);
  });
});

describe('Retry Schedule', () => {
  it('should create schedule with correct number of attempts', () => {
    const config: RetryConfig = {
      maxRetries: 5,
      initialDelayMs: 100,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitter: false,
    };

    const schedule = createRetrySchedule(config);
    expect(schedule).toHaveLength(5);
  });

  it('should have incrementing attempt numbers', () => {
    const config: RetryConfig = {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitter: false,
    };

    const schedule = createRetrySchedule(config);

    expect(schedule[0].attemptNumber).toBe(1);
    expect(schedule[1].attemptNumber).toBe(2);
    expect(schedule[2].attemptNumber).toBe(3);
  });

  it('should have increasing delays', () => {
    const config: RetryConfig = {
      maxRetries: 5,
      initialDelayMs: 100,
      maxDelayMs: 100000,
      backoffMultiplier: 2,
      jitter: false,
    };

    const schedule = createRetrySchedule(config);

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].delayMs).toBeGreaterThanOrEqual(schedule[i - 1].delayMs);
    }
  });

  it('should handle different backoff multipliers', () => {
    const baseConfig: RetryConfig = {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 100000,
      backoffMultiplier: 2,
      jitter: false,
    };

    const tripleConfig = { ...baseConfig, backoffMultiplier: 3 };

    const schedule2x = createRetrySchedule(baseConfig);
    const schedule3x = createRetrySchedule(tripleConfig);

    // 3x multiplier should have larger delays
    expect(schedule3x[1].delayMs).toBeGreaterThan(schedule2x[1].delayMs);
  });
});

describe('Retry with Circuit Breaker', () => {
  interface RetryState {
    attempts: number;
    lastAttempt: Date;
    state: 'closed' | 'open' | 'half_open';
  }

  function retryWithCircuitBreaker(
    state: RetryState,
    fn: () => Promise<unknown>,
    config: RetryConfig
  ): Promise<{ success: boolean; state: RetryState }> {
    return new Promise((resolve) => {
      if (state.state === 'open') {
        // Circuit is open, don't retry
        resolve({ success: false, state });
        return;
      }

      fn()
        .then(() => {
          resolve({
            success: true,
            state: { ...state, attempts: 0, state: 'closed' as const }
          });
        })
        .catch((error) => {
          const newAttempts = state.attempts + 1;
          if (shouldRetry(newAttempts, error as Error, config)) {
            resolve({
              success: false,
              state: { ...state, attempts: newAttempts, lastAttempt: new Date() }
            });
          } else {
            resolve({
              success: false,
              state: { ...state, attempts: newAttempts, state: 'open' as const }
            });
          }
        });
    });
  }

  it('should reset on success', async () => {
    const state: RetryState = {
      attempts: 2,
      lastAttempt: new Date(),
      state: 'closed',
    };

    const result = await retryWithCircuitBreaker(
      state,
      () => Promise.resolve('success'),
      { maxRetries: 3, initialDelayMs: 100, maxDelayMs: 1000, backoffMultiplier: 2, jitter: false }
    );

    expect(result.success).toBe(true);
    expect(result.state.attempts).toBe(0);
  });

  it('should increment attempts on failure', async () => {
    const state: RetryState = {
      attempts: 0,
      lastAttempt: new Date(),
      state: 'closed',
    };

    const result = await retryWithCircuitBreaker(
      state,
      () => Promise.reject(new Error('ECONNRESET')),
      { maxRetries: 3, initialDelayMs: 100, maxDelayMs: 1000, backoffMultiplier: 2, jitter: false }
    );

    expect(result.success).toBe(false);
    expect(result.state.attempts).toBe(1);
  });

  it('should open circuit after max retries', async () => {
    const state: RetryState = {
      attempts: 2, // Already tried twice
      lastAttempt: new Date(),
      state: 'closed',
    };

    const result = await retryWithCircuitBreaker(
      state,
      () => Promise.reject(new Error('ECONNRESET')),
      { maxRetries: 3, initialDelayMs: 100, maxDelayMs: 1000, backoffMultiplier: 2, jitter: false }
    );

    expect(result.success).toBe(false);
    expect(result.state.state).toBe('open');
  });
});

describe('Real-World Scenarios', () => {
  it('should handle API rate limiting', () => {
    const config: RetryConfig = {
      maxRetries: 5,
      initialDelayMs: 1000, // Start with 1 second
      maxDelayMs: 60000,    // Max 1 minute
      backoffMultiplier: 2,
      jitter: true,
    };

    const schedule = createRetrySchedule(config);

    // Should have delays: ~1s, ~2s, ~4s, ~8s, ~16s
    expect(schedule[0].delayMs).toBeGreaterThanOrEqual(750);
    expect(schedule[0].delayMs).toBeLessThanOrEqual(1250);
  });

  it('should handle database connection issues', () => {
    const config: RetryConfig = {
      maxRetries: 10,
      initialDelayMs: 50,
      maxDelayMs: 5000,
      backoffMultiplier: 1.5,
      jitter: false,
    };

    const schedule = createRetrySchedule(config);

    // Should reach steady state quickly
    expect(schedule[4].delayMs).toBeGreaterThanOrEqual(200);
    expect(schedule[4].delayMs).toBeLessThanOrEqual(300);
  });
});
