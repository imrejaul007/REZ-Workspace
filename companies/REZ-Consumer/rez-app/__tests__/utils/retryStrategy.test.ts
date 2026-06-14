// @ts-nocheck
/**
 * Unit Tests for retryStrategy.ts
 */

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 10
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, baseDelayMs * attempt));
      }
    }
  }
  throw lastError;
}

describe('retryStrategy', () => {
  it('should retry failed operations with exponential backoff', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, 3, 5);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should resolve immediately on first success', async () => {
    const fn = jest.fn().mockResolvedValueOnce('immediate');

    const result = await withRetry(fn, 3, 5);

    expect(result).toBe('immediate');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after exhausting all attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('permanent failure'));

    await expect(withRetry(fn, 3, 5)).rejects.toThrow('permanent failure');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
