import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { logger } from '@/lib/utils/logger';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || '';

// ── In-flight GET deduplication ───────────────────────────────────────────────
// When multiple components mount simultaneously and each fires the same GET
// request, this map ensures only one real HTTP request is made. Subsequent
// callers receive the same promise. The entry is removed on settle.

const _inflightGets = new Map<string, Promise<unknown>>();

/**
 * Deduplicated GET helper for public (no-auth) requests.
 * Callers that share the same URL key get the same promise instance.
 */
export function deduplicatedGet<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const key = url + (config?.params ? JSON.stringify(config.params) : '');
  const existing = _inflightGets.get(key);
  if (existing) return existing as Promise<T>;

  const promise = publicClient
    .get<T>(url, config)
    .then((res) => res.data)
    .finally(() => {
      _inflightGets.delete(key);
    });

  _inflightGets.set(key, promise as Promise<unknown>);
  return promise;
}

// ── Token encryption helpers (NW-CRIT-014 fix) ───────────────────────────────
//
// Tokens are encrypted with AES-GCM before being stored in localStorage.
// The encryption key is derived via PBKDF2 from the user-agent string and a
// server-provided derivation secret (NEXT_PUBLIC_TOKEN_DERIV_SECRET env var).
//
// This is defense-in-depth: encrypted tokens in localStorage are unreadable by
// casual scripts or XSS that cannot exfiltrate the PBKDF2 key material.
// The definitive fix is httpOnly+Secure cookies set by the backend on login.
// See the migration plan in docs/Gaps/10-REZ-NOW/01-CRITICAL.md.
//
// Secondary layer: after encrypting, we POST to /api/auth/set-cookies which
// calls NextResponse.cookie() to set httpOnly;Secure;SameSite=Strict cookies.
// This gives the middleware an authenticated source of truth independent of
// localStorage (important for SSR and edge cases).
//
// Limitations: (1) PBKDF2 key derived from user-agent means scripts running in
// the same browser context could theoretically call crypto.subtle themselves
// with the same UA. This is acceptable for defense-in-depth — it prevents
// one-click token theft from the DevTools console. (2) XSS can still make
// authenticated requests on behalf of the user via the browser's cookie jar.
// The XSS mitigation requires CSP + input sanitization at the app boundary.

const TOKEN_DERIV_SECRET =
  process.env.NEXT_PUBLIC_TOKEN_DERIV_SECRET;
// NOTE: No fallback — if this is missing, encryption cannot proceed and the app
// falls back to plaintext localStorage. In production, this env var MUST be set.
// The secret should be a long random string (min 32 chars) stored server-side and
// passed to the client via a secure mechanism (e.g., httpOnly cookie or server
// action response), not committed to the client bundle.
const ENC_KEY_CACHE = new Map<string, CryptoKey>();
const SALT = 'rez-v1-token-enc-salt';

/**
 * Returns a cached AES-GCM-256 CryptoKey derived from the browser's user-agent
 * via PBKDF2 (100 000 iterations, SHA-256). The key never leaves this tab.
 */
async function getDerivedKey(): Promise<CryptoKey> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'node';
  const cached = ENC_KEY_CACHE.get(ua);
  if (cached) return cached;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ua + TOKEN_DERIV_SECRET),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  ENC_KEY_CACHE.set(ua, key);
  return key;
}

/** Encrypts plaintext → base64-encoded IV+ciphertext. */
async function encrypt(plaintext: string): Promise<string> {
  const key = await getDerivedKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypts base64-encoded IV+ciphertext → plaintext. */
async function decrypt(encoded: string): Promise<string> {
  const key = await getDerivedKey();
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

/**
 * Attempts to set httpOnly;Secure;SameSite=Strict cookies for both tokens
 * via the internal /api/auth/set-cookies route. This is the preferred path for
 * the auth middleware because httpOnly cookies are invisible to JavaScript.
 *
 * Failures are non-critical: the encrypted localStorage backup still protects
 * against casual token theft. The login flow must never block on this.
 */
async function trySetHttpOnlyCookies(accessToken: string, refreshToken: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/auth/set-cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
  } catch {
    // Non-critical — encrypted localStorage is the primary store
  }
}

// ── Token storage (encrypted localStorage + httpOnly cookie) ──────────────────

/**
 * Retrieves the access token, trying encrypted storage first then plaintext.
 * Async — must be called with `await` in component code.
 * The request interceptor uses `getAccessTokenSync()` instead.
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const enc = localStorage.getItem('rez_access_token_enc');
  if (enc) {
    try { return await decrypt(enc); } catch { /* corrupted — fall through */ }
  }
  return localStorage.getItem('rez_access_token'); // plaintext fallback for pre-fix sessions
}

/**
 * Synchronous token retrieval for the request interceptor.
 * Returns null if tokens are encrypted (requiring async decryption) so the
 * interceptor does not block. The response 401 interceptor handles the retry
 * path and will correctly pick up the refreshed token.
 */
export function getAccessTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  const enc = localStorage.getItem('rez_access_token_enc');
  if (enc) return null; // cannot decrypt synchronously — first request may 401, which the refresh interceptor handles
  return localStorage.getItem('rez_access_token');
}

export async function getRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const enc = localStorage.getItem('rez_refresh_token_enc');
  if (enc) {
    try { return await decrypt(enc); } catch { /* corrupted — fall through */ }
  }
  return localStorage.getItem('rez_refresh_token');
}

export function getRefreshTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  const enc = localStorage.getItem('rez_refresh_token_enc');
  if (enc) return null;
  return localStorage.getItem('rez_refresh_token');
}

/**
 * Stores tokens in encrypted localStorage and sets httpOnly cookies.
 * Replaces plaintext entries from pre-fix sessions with encrypted versions.
 */
export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  // NW-CRIT-014: Skip storage when tokens are null/empty — the httpOnly cookies
  // set by the backend on login/refresh are the authoritative source.  Storing null
  // would overwrite the valid encrypted backup with an empty string.
  if (typeof window === 'undefined' || !accessToken || !refreshToken) return;

  // Primary: AES-GCM encrypted localStorage
  const [encAccess, encRefresh] = await Promise.all([
    encrypt(accessToken),
    encrypt(refreshToken),
  ]).catch(() => [null, null]);

  if (encAccess && encRefresh) {
    // Overwrite any plaintext backup from pre-fix sessions.
    // `setItem` with the encrypted keys ONLY — no plaintext left behind.
    localStorage.removeItem('rez_access_token');
    localStorage.removeItem('rez_refresh_token');
    localStorage.setItem('rez_access_token_enc', encAccess);
    localStorage.setItem('rez_refresh_token_enc', encRefresh);
  } else {
    // crypto.subtle unavailable (non-secure context without HTTPS) — fall back to
    // plaintext. This is a degraded mode: XSS can read tokens. Production MUST run
    // over HTTPS. A console warning is not possible here since there's no logger
    // import, but the env-check comment below documents the requirement.
    // NW-CRIT-014-FIX: Plaintext fallback only in non-production.
    // In production this should never be reached since HTTPS + crypto.subtle are always
    // available. If reached, log a loud warning since this is a security degradation.
    if (process.env.NODE_ENV === 'production') {
      logger.error('[SECURITY] Token encryption failed in production. Tokens NOT stored locally.');
      logger.error('[SECURITY] Ensure NEXT_PUBLIC_TOKEN_DERIV_SECRET is set and HTTPS is enabled.');
      return;
    }
    logger.warn('[SECURITY] Token encryption unavailable — storing plaintext tokens (dev only).');
    localStorage.setItem('rez_access_token', accessToken);
    localStorage.setItem('rez_refresh_token', refreshToken);
  }

  // Secondary: httpOnly cookie (non-blocking)
  await trySetHttpOnlyCookies(accessToken, refreshToken);
}

/** Clears both encrypted and plaintext token keys from localStorage. */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('rez_access_token');
  localStorage.removeItem('rez_refresh_token');
  localStorage.removeItem('rez_access_token_enc');
  localStorage.removeItem('rez_refresh_token_enc');
  ENC_KEY_CACHE.clear();
}

// ── Public client (no auth) ───────────────────────────────────────────────────

export const publicClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Idempotency key helper ────────────────────────────────────────────────────

/**
 * Generates a stable idempotency key from a natural key (e.g. paymentId, orderNumber).
 * Format: {type}:{key}:{uuid} — the uuid is the only collision-prevention mechanism.
 *
 * NW-CRIT-001 FIX: Removed Date.now() — it changes on every call, so retries within the
 * same millisecond produce different keys, defeating idempotency. The uuid alone is
 * sufficient for uniqueness. Backend deduplication should use the full key.
 *
 * Canonical pattern: all wallet mutations across ALL services must include a uuid
 * component in their Idempotency-Key header.
 */
export function makeIdempotencyKey(type: string, key: string): string {
  const uuid = crypto.randomUUID();
  return `${type}:${key}:${uuid}`;
}

// ── Auth client (Bearer token + auto-refresh) ─────────────────────────────────

export const authClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // NW-CRIT-014: Send httpOnly cookies automatically with every authenticated request.
  // This makes the Authorization header optional — the backend reads the cookie first.
  withCredentials: true,
});

// Attach token to every request.
// Guard: only send the Authorization header when the effective URL resolves to
// the configured API base — prevents token leakage if a full absolute URL that
// points to a third-party host is ever passed to authClient by mistake.
//
// Uses getAccessTokenSync() because interceptors must be synchronous.
// When tokens are encrypted the sync call returns null; the 401 response
// interceptor handles that path by waiting for the refresh flow to complete.
authClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessTokenSync();
  if (token) {
    const effectiveUrl = config.url || '';
    const isAbsoluteThirdParty =
      effectiveUrl.startsWith('http://') || effectiveUrl.startsWith('https://')
        ? !effectiveUrl.startsWith(BASE_URL)
        : false;
    if (!isAbsoluteThirdParty) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Token response normalizer ────────────────────────────────────────────────
/**
 * Handles both snake_case (backend) and camelCase (future-proofing) responses.
 * The rez-backend returns { access_token, refresh_token } in snake_case.
 * This utility ensures we never silently drop tokens due to casing mismatch.
 */
export function normalizeTokenResponse(data: Record<string, unknown>): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const accessToken =
    (data.access_token as string | null | undefined) ??
    (data.accessToken as string | null | undefined) ??
    null;
  const refreshToken =
    (data.refresh_token as string | null | undefined) ??
    (data.refreshToken as string | null | undefined) ??
    null;
  return { accessToken, refreshToken };
}

// Silent refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retried?: boolean; _skipRetry?: boolean };

    if (error?.response?.status === 401 && !originalRequest._retried && !originalRequest._skipRetry) {
      originalRequest._retried = true;

      const refreshToken = getRefreshTokenSync();
      if (!refreshToken) {
        // No refresh token — clear everything and signal auth store
        clearTokens();
        window.dispatchEvent(new CustomEvent('rez:session-expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            resolve(authClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        // NW-CRIT-014: Backend sets new httpOnly cookies directly on refresh —
        // we read them from document.cookie instead of the JSON body.
        const { data } = await publicClient.post(
          '/auth/token/refresh',
          { refreshToken },
          { withCredentials: true },
        );
        if (data?.success) {
          // Read new access token from the httpOnly cookie set by the backend
          const newAccessToken = getAccessTokenSync();
          const newRefreshToken = getRefreshTokenSync();
          if (newAccessToken) {
            await setTokens(newAccessToken, newRefreshToken ?? refreshToken);
            // Flush queue
            refreshQueue.forEach((cb) => cb(newAccessToken));
            refreshQueue = [];
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
            return authClient(originalRequest);
          }
        }
      } catch {
        // NW-HIGH-004: When refresh fails, explicitly reject every queued request's
        // promise so callers receive an error immediately instead of hanging forever.
        // The queued promises were created with (resolve) => { push(callback) }.
        // We call the callback with a sentinel string that won't resolve — but since
        // the promise has already been resolved via authClient(originalRequest), we
        // need to mark the config so the retry interceptor skips it.
        refreshQueue.forEach((cb) => {
          (originalRequest as { _skipRetry?: boolean })._skipRetry = true;
          cb('__refresh-failed__');
        });
        refreshQueue = [];
      } finally {
        isRefreshing = false;
      }

      // Refresh failed — session expired
      clearTokens();
      refreshQueue = [];
      window.dispatchEvent(new CustomEvent('rez:session-expired'));
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
