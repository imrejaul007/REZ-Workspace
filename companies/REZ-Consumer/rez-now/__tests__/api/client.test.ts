/**
 * Tests for rez-now/lib/api/client.ts
 *
 * Strategy:
 * - jest.mock('axios') is hoisted before any imports.
 * - The mock factory records each axios instance created (publicClient first,
 *   authClient second) along with the interceptors registered on each.
 * - The client module is imported once at the top-level; interceptors are
 *   extracted synchronously from the captured instances.
 * - Token helper functions are exercised via localStorage.
 */

// ── 1. Declare capture arrays BEFORE the mock factory runs ───────────────────

interface ReqRegistration {
  onFulfilled: (cfg: import('axios').InternalAxiosRequestConfig) => import('axios').InternalAxiosRequestConfig;
}
interface ResRegistration {
  onFulfilled: (res: unknown) => unknown;
  onRejected: (err: unknown) => Promise<unknown>;
}
interface CapturedInstance {
  reqRegistrations: ReqRegistration[];
  resRegistrations: ResRegistration[];
  post: jest.Mock;
  // the instance is also callable (authClient(config))
  callFn: jest.Mock;
}

const capturedInstances: CapturedInstance[] = [];

// ── 2. Mock axios BEFORE importing client.ts ─────────────────────────────────

jest.mock('axios', () => {
  const actual = jest.requireActual<typeof import('axios')>('axios');

  function buildInstance(): CapturedInstance & import('axios').AxiosInstance {
    const reqReg: ReqRegistration[] = [];
    const resReg: ResRegistration[] = [];
    const callFn = jest.fn() as jest.Mock;
    const postFn = jest.fn() as jest.Mock;

    const inst = Object.assign(callFn, {
      interceptors: {
        request: {
          use: jest.fn((onFulfilled: ReqRegistration['onFulfilled']) => {
            reqReg.push({ onFulfilled });
          }),
        },
        response: {
          use: jest.fn((onFulfilled: ResRegistration['onFulfilled'], onRejected: ResRegistration['onRejected']) => {
            resReg.push({ onFulfilled, onRejected });
          }),
        },
      },
      post: postFn,
      // Expose capture metadata on the same object for easy retrieval
      reqRegistrations: reqReg,
      resRegistrations: resReg,
      callFn,
    }) as unknown as CapturedInstance & import('axios').AxiosInstance;

    capturedInstances.push(inst as unknown as CapturedInstance);
    return inst;
  }

  return {
    ...actual,
    create: jest.fn(() => buildInstance()),
  };
});

// ── 3. Import client (runs module-level code, registers interceptors) ─────────

import {
  getAccessToken,
  getRefreshToken,
  getAccessTokenSync,
  setTokens,
  clearTokens,
} from '@/lib/api/client';

import { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

// After import: capturedInstances[0] = publicClient, capturedInstances[1] = authClient
function getPublicInstance(): CapturedInstance {
  return capturedInstances[0];
}
function getAuthInstance(): CapturedInstance {
  return capturedInstances[1];
}

function makeRequestConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

// ── Token helpers ─────────────────────────────────────────────────────────────
//
// NW-CRIT-014: token helpers are now async (decryption required).
// In tests, crypto.subtle is not available so setTokens falls back to plaintext
// storage. The plaintext fallback key is the same as the legacy key, so existing
// test assertions on localStorage are preserved.

describe('Token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getAccessToken returns null when nothing is stored', async () => {
    await expect(getAccessToken()).resolves.toBeNull();
  });

  it('getAccessToken returns the stored token (plaintext fallback)', async () => {
    // plaintext fallback path (crypto.subtle unavailable in test environment)
    localStorage.setItem('rez_access_token', 'tok_abc');
    await expect(getAccessToken()).resolves.toBe('tok_abc');
  });

  it('getRefreshToken returns null when nothing is stored', async () => {
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('getRefreshToken returns the stored token', async () => {
    localStorage.setItem('rez_refresh_token', 'refresh_xyz');
    await expect(getRefreshToken()).resolves.toBe('refresh_xyz');
  });

  it('setTokens stores both tokens (plaintext fallback in test env)', async () => {
    await setTokens('access_123', 'refresh_456');
    // In test env without crypto.subtle: plaintext fallback
    expect(localStorage.getItem('rez_access_token')).toBe('access_123');
    expect(localStorage.getItem('rez_refresh_token')).toBe('refresh_456');
  });

  it('clearTokens removes both encrypted and plaintext keys', () => {
    localStorage.setItem('rez_access_token', 'tok_abc');
    localStorage.setItem('rez_refresh_token', 'refresh_xyz');
    localStorage.setItem('rez_access_token_enc', 'encrypted');
    localStorage.setItem('rez_refresh_token_enc', 'encrypted');
    clearTokens();
    expect(localStorage.getItem('rez_access_token')).toBeNull();
    expect(localStorage.getItem('rez_refresh_token')).toBeNull();
    expect(localStorage.getItem('rez_access_token_enc')).toBeNull();
    expect(localStorage.getItem('rez_refresh_token_enc')).toBeNull();
  });
});

// ── Request interceptor ───────────────────────────────────────────────────────
//
// NW-CRIT-014: the request interceptor now uses getAccessTokenSync().
// It returns null when encrypted tokens exist (cannot decrypt synchronously),
// which causes the first request to 401 — the response interceptor handles
// the retry by decrypting the refresh token and re-encrypting new tokens.

describe('authClient request interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('publicClient and authClient are distinct instances', () => {
    expect(getPublicInstance()).not.toBe(getAuthInstance());
  });

  it('attaches Authorization header when plaintext token is present (sync path)', () => {
    localStorage.setItem('rez_access_token', 'tok_123');
    const { onFulfilled } = getAuthInstance().reqRegistrations[0];

    const config = makeRequestConfig();
    const result = onFulfilled(config);

    expect(result.headers['Authorization']).toBe('Bearer tok_123');
  });

  it('does NOT add Authorization header when encrypted token exists (sync returns null)', () => {
    // Encrypted token present — sync getter cannot decrypt, returns null
    localStorage.setItem('rez_access_token_enc', 'some_encrypted_value');
    const { onFulfilled } = getAuthInstance().reqRegistrations[0];

    const config = makeRequestConfig();
    const result = onFulfilled(config);

    // getAccessTokenSync() returns null for encrypted storage; request goes out
    // without Authorization header, will 401, and the refresh interceptor handles it.
    expect(getAccessTokenSync()).toBeNull();
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('returns the config object unchanged when no token is stored', () => {
    const { onFulfilled } = getAuthInstance().reqRegistrations[0];
    const config = makeRequestConfig();
    expect(onFulfilled(config)).toBe(config);
  });
});

// ── Response interceptor — 401 handling ───────────────────────────────────────

describe('authClient response interceptor — 401 refresh logic', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset call history without clearing implementations
    jest.clearAllMocks();
  });

  function getOnRejected() {
    return getAuthInstance().resRegistrations[0].onRejected;
  }

  function make401Error(retried = false) {
    return {
      response: { status: 401 },
      config: {
        _retried: retried,
        headers: {},
        url: '/protected',
      },
    };
  }

  it('passes non-401 errors straight through', async () => {
    const error = { response: { status: 500 }, config: {} };
    await expect(getOnRejected()(error)).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('does not retry a request already marked _retried=true', async () => {
    await expect(getOnRejected()(make401Error(true))).rejects.toBeDefined();
  });

  it('dispatches rez:session-expired when no refresh token is stored', async () => {
    const spy = jest.spyOn(window, 'dispatchEvent');

    await expect(getOnRejected()(make401Error())).rejects.toBeDefined();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rez:session-expired' }),
    );
  });

  it('clears the access token when no refresh token is stored', async () => {
    localStorage.setItem('rez_access_token', 'old_token');
    jest.spyOn(window, 'dispatchEvent').mockReturnValue(true);

    await expect(getOnRejected()(make401Error())).rejects.toBeDefined();

    expect(localStorage.getItem('rez_access_token')).toBeNull();
  });

  it('stores new tokens and retries the original request after a successful refresh', async () => {
    localStorage.setItem('rez_access_token', 'old_token');
    localStorage.setItem('rez_refresh_token', 'refresh_token');

    // publicClient.post resolves with the refresh payload (snake_case — actual backend format)
    getPublicInstance().post.mockResolvedValueOnce({
      data: {
        success: true,
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      },
    });

    // authClient(originalRequest) resolves with the retried response
    getAuthInstance().callFn.mockResolvedValueOnce({ data: { id: 1 } });

    const result = await getOnRejected()(make401Error());

    expect(result).toEqual({ data: { id: 1 } });
    // In test env (no crypto.subtle): plaintext fallback is written
    expect(localStorage.getItem('rez_access_token')).toBe('new_access_token');
    expect(localStorage.getItem('rez_refresh_token')).toBe('new_refresh_token');
  });

  it('dispatches session-expired when the refresh API call throws a network error', async () => {
    localStorage.setItem('rez_access_token', 'old_token');
    localStorage.setItem('rez_refresh_token', 'refresh_token');

    getPublicInstance().post.mockRejectedValueOnce(new Error('Network error'));

    const spy = jest.spyOn(window, 'dispatchEvent');

    await expect(getOnRejected()(make401Error())).rejects.toBeDefined();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rez:session-expired' }),
    );
  });

  it('dispatches session-expired when refresh response has success=false', async () => {
    localStorage.setItem('rez_access_token', 'old_token');
    localStorage.setItem('rez_refresh_token', 'refresh_token');

    getPublicInstance().post.mockResolvedValueOnce({
      data: { success: false },
    });

    const spy = jest.spyOn(window, 'dispatchEvent');

    await expect(getOnRejected()(make401Error())).rejects.toBeDefined();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rez:session-expired' }),
    );
  });
});
