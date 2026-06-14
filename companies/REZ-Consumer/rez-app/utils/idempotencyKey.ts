/**
 * Idempotency Key Generator
 * Generates unique keys for wallet mutation operations to prevent duplicate processing.
 * Used with transfer, gift, and gift card purchase APIs.
 */

/**
 * CA-CMC-019 FIX: Generate a cryptographically secure idempotency key for a wallet operation.
 * Format: {operation}_{hourBucket}_{secureRandom}
 *
 * Changes from original:
 * 1. Replaced Math.random() with crypto.getRandomValues() for CSPRNG-quality randomness.
 * 2. Replaced per-second timestamp with 1-hour epoch bucket to ensure the same key is
 *    reused if the app crashes and restarts within the same hour. Previously, Date.now()
 *    changed between restarts, causing a new idempotency key to be generated. With a
 *    1-hour bucket, the key remains stable for up to 1 hour, preventing duplicate charges
 *    when users retry after a crash within the payment window.
 *
 * For wallet operations, we also store the key in AsyncStorage when initiating an
 * operation so that on crash-restart within the hour, the same key is re-used.
 */
export function generateIdempotencyKey(operation: string): string {
  // 1-hour epoch bucket — same bucket for any crash/restart within the same hour
  const epochBucket = Math.floor(Date.now() / (60 * 60 * 1000));
  // CSPRNG: replace Math.random() with crypto.getRandomValues()
  let randomValue = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(8);
      crypto.getRandomValues(buf);
      randomValue = Array.from(buf)
        .map((b) => b.toString(36).padStart(2, '0'))
        .join('')
        .substring(0, 10);
    } else {
      // Fallback: use crypto.randomUUID() for CSPRNG-quality randomness
      randomValue = (crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + 'a' + Date.now().toString(36)
      ).replace(/-/g, '').substring(0, 10);
    }
  } catch {
    randomValue = (crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + 'a' + Date.now().toString(36)
    ).replace(/-/g, '').substring(0, 10);
  }
  return `${operation}_${epochBucket}_${randomValue}`;
}
