import { Request, Response, NextFunction } from 'express';

// Mock Request
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  url: '/',
  path: '/',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

// Mock Response
export const createMockResponse = (): {
  res: Partial<Response>;
  jsonMock: jest.Mock;
  statusMock: jest.Mock;
  sendMock: jest.Mock;
} => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnThis();
  const sendMock = jest.fn();

  return {
    res: {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
      setHeader: jest.fn(),
      on: jest.fn(),
    },
    jsonMock,
    statusMock,
    sendMock,
  };
};

// Mock NextFunction
export const createMockNext = (): NextFunction => jest.fn();

// Mock Express Request/Response
export const mockRequest = (options: {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  auth?: { publisherId: string; email: string };
} = {}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    auth: options.auth,
  } as Partial<Request>;
};

export const mockResponse = (): {
  res: Response;
  jsonMock: jest.Mock;
  statusMock: jest.Mock;
} => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnThis();
  const res = {
    json: jsonMock,
    status: statusMock,
    send: jest.fn(),
    setHeader: jest.fn(),
    on: jest.fn(),
  } as unknown as Response;
  return { res, jsonMock, statusMock };
};

export const mockNext = (): NextFunction => jest.fn();