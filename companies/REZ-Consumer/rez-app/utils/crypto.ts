/**
 * Crypto utilities for React Native compatibility
 */

/**
 * Generate crypto-backed jitter in ms, up to `cap` (default 250ms).
 * Uses crypto.getRandomValues for arch-fitness compliance (no Math.random).
 * Falls back to 0 jitter if crypto.getRandomValues is unavailable.
 */
export function cryptoJitterMs(cap: number = 250): number {
  try {
    const g = (globalThis as unknown as { crypto?: Crypto }).crypto;
    if (g && typeof g.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      g.getRandomValues(buf);
      const first = buf[0] ?? 0;
      return (first / 0xffffffff) * cap;
    }
  } catch {
    // crypto unavailable - fall through to deterministic zero jitter
  }
  return 0;
}
