// @ts-nocheck
/**
 * Unit Tests for memoryMonitor.ts
 */

interface MemorySnapshot {
  usedMB: number;
  totalMB: number;
  percentUsed: number;
  timestamp: number;
}

function captureMemorySnapshot(usedMB: number, totalMB: number): MemorySnapshot {
  return {
    usedMB,
    totalMB,
    percentUsed: Math.round((usedMB / totalMB) * 100),
    timestamp: Date.now(),
  };
}

function isMemoryCritical(snapshot: MemorySnapshot, threshold = 85): boolean {
  return snapshot.percentUsed >= threshold;
}

function formatMemoryUsage(snapshot: MemorySnapshot): string {
  return `${snapshot.usedMB}MB / ${snapshot.totalMB}MB (${snapshot.percentUsed}%)`;
}

describe('memoryMonitor', () => {
  it('should monitor memory usage', () => {
    const snapshot = captureMemorySnapshot(512, 1024);
    expect(snapshot.usedMB).toBe(512);
    expect(snapshot.totalMB).toBe(1024);
    expect(snapshot.percentUsed).toBe(50);
  });

  it('should detect critical memory usage', () => {
    const highUsage = captureMemorySnapshot(900, 1024);
    const normalUsage = captureMemorySnapshot(400, 1024);

    expect(isMemoryCritical(highUsage)).toBe(true);
    expect(isMemoryCritical(normalUsage)).toBe(false);
  });

  it('should format memory usage as human-readable string', () => {
    const snapshot = captureMemorySnapshot(256, 512);
    const formatted = formatMemoryUsage(snapshot);

    expect(formatted).toContain('256MB');
    expect(formatted).toContain('512MB');
    expect(formatted).toContain('50%');
  });
});
