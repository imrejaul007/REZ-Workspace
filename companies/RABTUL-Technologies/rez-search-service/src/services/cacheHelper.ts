import crypto from 'crypto';
import { redis } from '../config/redis';

export function cacheKey(prefix: string, params: Record<string, unknown>): string {
  const hash = crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 12);
  return `search:${prefix}:${hash}`;
}

export async function cached<T>(key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch { /* miss */ }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSec);
  } catch { /* ignore */ }

  return data;
}
