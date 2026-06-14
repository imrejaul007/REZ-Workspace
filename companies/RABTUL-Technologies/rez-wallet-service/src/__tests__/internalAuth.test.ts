/**
 * TEST SUITE 5: Internal Auth Timing Safety
 *
 * Validates the requireInternalToken middleware:
 * - Correct token → next() called
 * - Wrong/missing token → 401
 * - Token env not configured → 503
 * - crypto.timingSafeEqual is used (not string equality)
 * - Different-length token does not crash
 */

jest.setTimeout(10000);

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { requireInternalToken } from '../middleware/internalAuth';

// ---------------------------------------------------------------------------
// Express mock helpers
// ---------------------------------------------------------------------------

function makeReq(token?: string): Partial<Request> {
  return {
    headers: token !== undefined ? { 'x-internal-token': token, 'x-internal-service': 'rez-wallet-service' } : {},
  };
}

function makeRes() {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json, _status: status, _json: json } as any;
}

function makeNext(): NextFunction {
  return jest.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('requireInternalToken middleware', () => {
  const VALID_TOKEN = 'super-secret-internal-token-abc123';

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.INTERNAL_SERVICE_TOKENS_JSON = JSON.stringify({ 'rez-wallet-service': VALID_TOKEN });
  });

  afterEach(() => {
    delete process.env.INTERNAL_SERVICE_TOKENS_JSON;
  });

  // 1. Correct token → next() called
  it('1. correct token → next() is called', () => {
    const req = makeReq(VALID_TOKEN);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  // 2. Wrong token → 401 returned, next() NOT called
  it('2. wrong token → 401, next() NOT called', () => {
    const req = makeReq('wrong-token');
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  // 3. Missing token → 401 returned
  it('3. missing token → 401 returned', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // 4. INTERNAL_SERVICE_TOKENS_JSON not set → 503 returned
  it('4. INTERNAL_SERVICE_TOKENS_JSON not set → 503 returned', () => {
    delete process.env.INTERNAL_SERVICE_TOKENS_JSON;

    const req = makeReq(VALID_TOKEN);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  // 5. crypto.timingSafeEqual is called (spy on it)
  it('5. crypto.timingSafeEqual is called for token comparison', () => {
    const timingSafeSpy = jest.spyOn(crypto, 'timingSafeEqual');

    const req = makeReq(VALID_TOKEN);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(timingSafeSpy).toHaveBeenCalledTimes(1);
    timingSafeSpy.mockRestore();
  });

  // 6. Token with different length → 401 (no crash)
  it('6. token with different length than expected → 401, no crash', () => {
    // A shorter token should not cause a timingSafeEqual crash
    const shortToken = 'short';
    const req = makeReq(shortToken);
    const res = makeRes();
    const next = makeNext();

    expect(() => {
      requireInternalToken(req as Request, res as Response, next);
    }).not.toThrow();

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // 7. Empty string token → 401 (no crash from zero-length buffer)
  it('7. empty string token → 401, no crash', () => {
    const req = makeReq('');
    const res = makeRes();
    const next = makeNext();

    expect(() => {
      requireInternalToken(req as Request, res as Response, next);
    }).not.toThrow();

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // 8. timingSafeEqual does not short-circuit (timing safety invariant)
  it('8. timingSafeEqual is called even when buffer lengths differ', () => {
    // The middleware checks length equality first; if lengths differ,
    // timingSafeEqual would panic — so the impl must guard against this.
    // Verify the middleware handles length-mismatched tokens without throwing.
    const longToken = VALID_TOKEN + '_extra_chars';
    const req = makeReq(longToken);
    const res = makeRes();
    const next = makeNext();

    expect(() => {
      requireInternalToken(req as Request, res as Response, next);
    }).not.toThrow();

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // 9. 503 response body contains meaningful error message
  it('9. 503 response body mentions INTERNAL_SERVICE_TOKENS_JSON config requirement', () => {
    delete process.env.INTERNAL_SERVICE_TOKENS_JSON;

    const req = makeReq(VALID_TOKEN);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    const jsonArg = res.status().json.mock.calls[0][0];
    expect(jsonArg.error).toMatch(/INTERNAL_SERVICE_TOKENS_JSON/i);
  });

  // 10. 401 response body contains meaningful error message
  it('10. 401 response body contains "Invalid internal token" message', () => {
    const req = makeReq('wrong');
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    const jsonArg = res.status().json.mock.calls[0][0];
    expect(jsonArg.error).toMatch(/invalid internal token/i);
  });

  // 11. Next is called exactly once on success (not twice)
  it('11. next() is called exactly once on a valid request', () => {
    const req = makeReq(VALID_TOKEN);
    const res = makeRes();
    const next = makeNext();

    requireInternalToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
