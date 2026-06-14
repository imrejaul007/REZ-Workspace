/**
 * RABTUL MIGRATION STATUS: COMPLETE
 *
 * This module uses RABTUL Auth Service for all external auth operations.
 * All calls authenticated via INTERNAL_SERVICE_TOKEN.
 *
 * RABTUL Service: rez-auth-service (Port 4002)
 */

/**
 * Internal HTTP client for RABTUL auth service.
 * Replaces direct DB access to the users collection (auth-service-owned).
 *
 * All calls are authenticated via INTERNAL_SERVICE_TOKEN scoped to this service.
 */
import { env } from '../config/env';

// RABTUL: Auth service URL with fallback
const BASE = process.env.AUTH_SERVICE_URL || env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const SERVICE = 'rez-merchant-service';
const INTERNAL_SERVICE_TIMEOUT_MS = 10000;

function internalHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
    'x-internal-service': SERVICE,
  };
}

export interface UserSummary {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
}

/**
 * Bulk lookup users by IDs. Returns name, email, phone for each.
 * Used by exports.ts for customer CSV generation.
 */
export async function bulkGetUsers(ids: string[]): Promise<Map<string, UserSummary>> {
  if (ids.length === 0) return new Map();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/internal/users/bulk`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Auth service bulk lookup timeout');
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Auth service bulk lookup failed: ${res.status}`);
  }

  const data = await res.json() as unknown as { success: boolean; data?: UserSummary[] };
  if (data.success === false) {
    throw new Error('Auth service bulk lookup returned failure');
  }
  return new Map((data.data ?? []).map((u) => [String(u._id), u]));
}

/**
 * Register a push token for a user.
 * Used by notifications.ts for merchant push notifications.
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: string,
  deviceName?: string,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/internal/users/${userId}/push-token`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ token, platform, deviceName, action: 'register' }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Auth service register push token timeout');
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Auth service register push token failed: ${res.status}`);
  }

  const data = await res.json() as unknown as { success?: boolean; message?: string };
  if (data.success === false) {
    throw new Error(data.message || 'Auth service register push token returned failure');
  }
}

/**
 * Unregister a push token for a user.
 * Used by notifications.ts for merchant push notifications.
 */
export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/internal/users/${userId}/push-token`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ token, action: 'unregister' }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Auth service unregister push token timeout');
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Auth service unregister push token failed: ${res.status}`);
  }

  const data = await res.json() as unknown as { success?: boolean; message?: string };
  if (data.success === false) {
    throw new Error(data.message || 'Auth service unregister push token returned failure');
  }
}
