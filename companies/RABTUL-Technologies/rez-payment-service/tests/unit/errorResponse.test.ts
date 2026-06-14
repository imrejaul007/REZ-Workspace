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
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
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

describe('Payment Error Response Utilities', () => {
  describe('errorResponse', () => {
    it('should create error response with all fields', () => {
      const response = errorResponse(400, 'Bad Request', 'VALIDATION_ERROR', { field: 'amount' });
      expect(response).toEqual({
        success: false,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        details: { field: 'amount' },
      });
    });

    it('should create error response without optional fields', () => {
      const response = errorResponse(500, 'Server Error');
      expect(response).toEqual({
        success: false,
        error: 'Server Error',
      });
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError(400, 'Bad Request', 'VALIDATION_ERROR', { field: 'amount' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'amount' });
      expect(error.name).toBe('ApiError');
    });

    it('should be instanceof Error', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('successResponse', () => {
    it('should create success response', () => {
      const response = successResponse({ transactionId: 'txn_123' });
      expect(response).toEqual({
        success: true,
        data: { transactionId: 'txn_123' },
      });
    });

    it('should include requestId when provided', () => {
      const response = successResponse({ transactionId: 'txn_123' }, 'req_456');
      expect(response.requestId).toBe('req_456');
    });
  });
});

describe('Payment Status Transitions', () => {
  const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'] as const;
  type PaymentStatus = typeof PAYMENT_STATUSES[number];

  const VALID_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
    pending: ['processing', 'failed'],
    processing: ['completed', 'failed'],
    completed: ['refunded', 'partially_refunded'],
    failed: [],
    refunded: [],
    partially_refunded: ['refunded'],
  };

  it('should allow valid status transitions', () => {
    expect(VALID_TRANSITIONS.pending).toContain('processing');
    expect(VALID_TRANSITIONS.processing).toContain('completed');
    expect(VALID_TRANSITIONS.completed).toContain('refunded');
  });

  it('should reject invalid transitions', () => {
    expect(VALID_TRANSITIONS.pending).not.toContain('completed');
    expect(VALID_TRANSITIONS.completed).not.toContain('processing');
    expect(VALID_TRANSITIONS.refunded).not.toContain('completed');
  });

  it('should have terminal states with no transitions', () => {
    expect(VALID_TRANSITIONS.failed).toHaveLength(0);
    expect(VALID_TRANSITIONS.refunded).toHaveLength(0);
  });
});
