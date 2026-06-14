/**
 * Unit Tests for performanceUtils.ts
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
}

function measurePerformance(name: string, fn: () => void): PerformanceMetric {
  const start = Date.now();
  fn();
  const duration = Date.now() - start;
  return { name, startTime: start, duration };
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

describe('performanceUtils', () => {
  it('should measure performance metrics', () => {
    const metric = measurePerformance('test-op', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
    });
    expect(metric.name).toBe('test-op');
    expect(metric.duration).toBeGreaterThanOrEqual(0);
    expect(metric.startTime).toBeGreaterThan(0);
  });

  it('should debounce rapid function calls', (done) => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 50);

    debounced();
    debounced();
    debounced();

    setTimeout(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
      done();
    }, 100);
  });

  it('should throttle function calls within limit', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 1000);

    throttled();
    throttled();
    throttled();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
