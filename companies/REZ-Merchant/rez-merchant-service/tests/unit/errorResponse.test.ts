// Standardized error response utilities
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean = true;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
): ErrorResponse {
  return { success: false, error: message, code, details };
}

function successResponse<T>(data: T, requestId?: string): SuccessResponse<T> {
  return { success: true, data, requestId };
}

describe('Merchant Error Response Utilities', () => {
  describe('errorResponse', () => {
    it('should create error response with code', () => {
      const response = errorResponse(403, 'Forbidden', 'ACCESS_DENIED');
      expect(response).toEqual({
        success: false,
        error: 'Forbidden',
        code: 'ACCESS_DENIED',
      });
    });

    it('should handle error without code', () => {
      const response = errorResponse(500, 'Server Error');
      expect(response).toEqual({
        success: false,
        error: 'Server Error',
      });
    });
  });

  describe('ApiError', () => {
    it('should create error with isOperational flag', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error.isOperational).toBe(true);
    });

    it('should have correct stack trace', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('successResponse', () => {
    it('should create success with merchant data', () => {
      const merchant = { id: '123', name: 'Test Merchant' };
      const response = successResponse(merchant);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(merchant);
    });
  });
});

describe('Health Check Response', () => {
  interface HealthCheckResponse {
    ready: boolean;
    service: string;
    db: string;
    redis: string;
    uptime: number;
  }

  function buildHealthResponse(
    dbState: number,
    redisConnected: boolean
  ): HealthCheckResponse {
    const dbReady = dbState === 1;
    const redisReady = redisConnected;
    const ready = dbReady && redisReady;

    return {
      ready,
      service: 'rez-merchant-service',
      db: dbState === 1 ? 'connected' : 'disconnected',
      redis: redisReady ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    };
  }

  it('should report ready when all dependencies are connected', () => {
    const response = buildHealthResponse(1, true);
    expect(response.ready).toBe(true);
    expect(response.db).toBe('connected');
    expect(response.redis).toBe('connected');
  });

  it('should report not ready when database is disconnected', () => {
    const response = buildHealthResponse(0, true);
    expect(response.ready).toBe(false);
    expect(response.db).toBe('disconnected');
  });

  it('should report not ready when redis is disconnected', () => {
    const response = buildHealthResponse(1, false);
    expect(response.ready).toBe(false);
    expect(response.redis).toBe('disconnected');
  });
});
