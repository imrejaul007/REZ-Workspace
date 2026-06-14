/**
 * REZ Observability Client - Use existing service (port 4025)
 * Metrics + logs for all services
 */

const OBSERVABILITY_URL = process.env.OBSERVABILITY_URL || 'http://localhost:4025';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

/**
 * Counter metric
 */
export function incrementCounter(name: string, labels?: Record<string, string>): void {
  fetch(`${OBSERVABILITY_URL}/api/metrics/counter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, labels, service: SERVICE_NAME }),
  }).catch((err) => console.error(`[Observability] Failed to increment counter "${name}":`, err));
}

/**
 * Gauge metric
 */
export function setGauge(name: string, value: number, labels?: Record<string, string>): void {
  fetch(`${OBSERVABILITY_URL}/api/metrics/gauge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, value, labels, service: SERVICE_NAME }),
  }).catch((err) => console.error(`[Observability] Failed to set gauge "${name}":`, err));
}

/**
 * Histogram metric
 */
export function recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
  fetch(`${OBSERVABILITY_URL}/api/metrics/histogram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, value, labels, service: SERVICE_NAME }),
  }).catch((err) => console.error(`[Observability] Failed to record histogram "${name}":`, err));
}

/**
 * Log entry
 */
export function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
  fetch(`${OBSERVABILITY_URL}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, service: SERVICE_NAME, ...meta, timestamp: new Date().toISOString() }),
  }).catch((err) => console.error(`[Observability] Failed to log "${level}" message:`, err));
}

/**
 * Trace span
 */
export function trace<T>(
  name: string,
  fn: () => T,
  labels?: Record<string, string>
): T {
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    recordHistogram(`${name}.duration`, duration, labels);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    recordHistogram(`${name}.error`, duration, { ...labels, error: String(error) });
    log('error', `${name} failed`, { duration, error: String(error) });
    throw error;
  }
}

/**
 * Async trace span
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    recordHistogram(`${name}.duration`, duration, labels);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    recordHistogram(`${name}.error`, duration, { ...labels, error: String(error) });
    log('error', `${name} failed`, { duration, error: String(error) });
    throw error;
  }
}
