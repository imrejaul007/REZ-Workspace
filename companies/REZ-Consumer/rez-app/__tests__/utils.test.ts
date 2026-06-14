// @ts-nocheck
/**
 * Utilities Test Suite
 * Tests for error handling, retry, and offline queue utilities
 */

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Error Handling Utils', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('handleError', () => {
    it('should normalize error to AppError', async () => {
      const { handleError, normalizeError } = await import('../utils/errorHandling');

      const error = new Error('Test error');
      const appError = normalizeError(error);

      expect(appError.name).toBe('AppError');
      expect(appError.message).toBe('Test error');
    });

    it('should handle network errors', async () => {
      const { normalizeError } = await import('../utils/errorHandling');

      const error = new Error('Network request failed');
      const appError = normalizeError(error);

      expect(appError.name).toBe('NetworkError');
    });

    it('should handle auth errors', async () => {
      const { normalizeError } = await import('../utils/errorHandling');

      const error = new Error('Unauthorized - 401');
      const appError = normalizeError(error);

      expect(appError.name).toBe('AuthError');
    });
  });

  describe('safeExecute', () => {
    it('should return result on success', async () => {
      const { safeExecute } = await import('../utils/errorHandling');

      const result = await safeExecute(() => Promise.resolve('success'), 'fallback');

      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const { safeExecute } = await import('../utils/errorHandling');

      const result = await safeExecute(
        () => Promise.reject(new Error('fail')),
        'fallback'
      );

      expect(result).toBe('fallback');
    });
  });
});

describe('Retry Utils', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const { withRetry } = await import('../utils/retryWithBackoff');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' }),
      });

      const result = await withRetry(
        () => fetch('/api/test').then(r => r.json()),
        { maxRetries: 3 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'success' });
    });

    it('should retry on failure', async () => {
      const { withRetry } = await import('../utils/retryWithBackoff');

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
        });

      const result = await withRetry(
        () => fetch('/api/test').then(r => r.json()),
        { maxRetries: 3, initialDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const { withRetry } = await import('../utils/retryWithBackoff');

      mockFetch.mockRejectedValue(new Error('Always fails'));

      const result = await withRetry(
        () => fetch('/api/test').then(r => r.json()),
        { maxRetries: 2, initialDelay: 10 }
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Initial + 2 retries
    });
  });

  describe('CircuitBreaker', () => {
    it('should open after threshold failures', async () => {
      const { CircuitBreaker } = await import('../utils/retryWithBackoff');

      const cb = new CircuitBreaker(3, 1000);
      mockFetch.mockRejectedValue(new Error('Fail'));

      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(() => fetch('/api/test').then(r => r.json()));
        } catch {}
      }

      expect(cb.getState()).toBe('open');
    });
  });
});
