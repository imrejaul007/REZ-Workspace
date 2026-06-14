export const ErrorCodes = {
  SRV_INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  RES_NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
  BIZ_INVALID_STATUS: { code: 'BIZ_003', message: 'Invalid status transition' },
  BIZ_NOT_ELIGIBLE: { code: 'BIZ_004', message: 'Not eligible for this operation' },
  PAY_FAILED: { code: 'PAY_001', message: 'Payment failed' },
} as const;

export function success(data: unknown) {
  return { success: true, data };
}

export function err(code: string, details?: unknown) {
  const def = ErrorCodes[code as keyof typeof ErrorCodes] || { code, message: 'An error occurred' };
  const errorObj: { code: string; message: string; details?: unknown } = { code: def.code, message: def.message };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return { success: false, error: errorObj };
}
