/**
 * RABTUL SDK - Metrics/Observability
 */

const BASE = process.env.OBS_URL || 'http://localhost:4025';
const SERVICE = process.env.SERVICE_NAME || 'unknown';

export function counter(name: string, labels?: Record<string, string>): void {
  fetch(`${BASE}/api/counter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, labels, service: SERVICE }),
  }).catch(() => {});
}

export function histogram(name: string, value: number, labels?: Record<string, string>): void {
  fetch(`${BASE}/api/histogram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, value, labels, service: SERVICE }),
  }).catch(() => {});
}

export function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
  fetch(`${BASE}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, ...meta, service: SERVICE }),
  }).catch(() => {});
}
