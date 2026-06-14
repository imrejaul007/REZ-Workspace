import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { merchantAuth } from '../middleware/auth';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
}

// Returns ctx as a live reference so mutations inside the middleware are visible.
// The old approach (return { res, ...ctx }) spread a snapshot, hiding status updates.
function mockRes(): { res: Response; ctx: { statusCode: number; body: any } } {
  const ctx = { statusCode: 200, body: null as any };
  const res = {
    status(code: number) {
      ctx.statusCode = code;
      return res;
    },
    json(data: any) {
      ctx.body = data;
      return res;
    },
  } as unknown as Response;
  return { res, ctx };
}

describe('merchantAuth middleware', () => {
  const secret = 'test-secret';

  beforeEach(() => {
    process.env.JWT_MERCHANT_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.JWT_MERCHANT_SECRET;
    jest.restoreAllMocks();
  });

  it('returns 401 when no Authorization header and no cookie', () => {
    const req = mockReq();
    const { res, ctx } = mockRes();
    const next = jest.fn() as NextFunction;

    merchantAuth(req, res, next);

    expect(ctx.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header has invalid token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
    const { res, ctx } = mockRes();
    const next = jest.fn() as NextFunction;

    merchantAuth(req, res, next);

    expect(ctx.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when a valid JWT Bearer token is provided', () => {
    const payload = { merchantId: 'merchant-123', merchantUserId: 'user-456', role: 'owner', permissions: ['read'] };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const { res } = mockRes();
    const next = jest.fn() as NextFunction;

    merchantAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when JWT_MERCHANT_SECRET is not configured', () => {
    delete process.env.JWT_MERCHANT_SECRET;
    const req = mockReq({ headers: { authorization: 'Bearer sometoken' } });
    const { res, ctx } = mockRes();
    const next = jest.fn() as NextFunction;

    merchantAuth(req, res, next);

    expect(ctx.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const token = jwt.sign({ merchantId: 'x' }, secret, { expiresIn: -1 });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const { res, ctx } = mockRes();
    const next = jest.fn() as NextFunction;

    merchantAuth(req, res, next);

    expect(ctx.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
