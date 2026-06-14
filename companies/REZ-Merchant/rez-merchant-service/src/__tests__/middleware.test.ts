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

function mockRes(): Response {
  return {
    status() { return this; },
    json() { return this; },
  } as unknown as Response;
}

describe('merchantAuth — request property assignment', () => {
  const secret = 'middleware-test-secret';

  beforeEach(() => {
    process.env.JWT_MERCHANT_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.JWT_MERCHANT_SECRET;
  });

  it('sets req.merchantId from token payload', () => {
    const payload = { merchantId: 'merchant-abc', role: 'admin', permissions: ['read', 'write'] };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn() as NextFunction;

    merchantAuth(req, mockRes(), next);

    expect(req.merchantId).toBe('merchant-abc');
  });

  it('sets req.merchantRole from token payload', () => {
    const payload = { merchantId: 'merchant-xyz', role: 'manager', permissions: [] };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn() as NextFunction;

    merchantAuth(req, mockRes(), next);

    expect(req.merchantRole).toBe('manager');
  });

  it('sets req.merchantUserId from token payload', () => {
    const payload = { merchantId: 'merchant-1', merchantUserId: 'user-99', role: 'staff' };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn() as NextFunction;

    merchantAuth(req, mockRes(), next);

    expect(req.merchantUserId).toBe('user-99');
  });

  it('sets req.merchantPermissions from token payload', () => {
    const permissions = ['orders:read', 'products:write'];
    const payload = { merchantId: 'merchant-2', role: 'staff', permissions };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn() as NextFunction;

    merchantAuth(req, mockRes(), next);

    expect(req.merchantPermissions).toEqual(permissions);
  });

  it('accepts token from cookie when no Authorization header present', () => {
    const payload = { merchantId: 'merchant-cookie', role: 'owner' };
    const token = jwt.sign(payload, secret);
    const req = mockReq({ cookies: { merchant_access_token: token } });
    const next = jest.fn() as NextFunction;

    merchantAuth(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.merchantId).toBe('merchant-cookie');
  });

  it('does not overwrite req properties when token is invalid', () => {
    const req = mockReq({ headers: { authorization: 'Bearer bad.token' } });
    const next = jest.fn() as NextFunction;
    let statusCode = 200;
    const res = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    } as unknown as Response;

    merchantAuth(req, res, next);

    expect(statusCode).toBe(401);
    expect(req.merchantId).toBeUndefined();
    expect(req.merchantRole).toBeUndefined();
  });
});
