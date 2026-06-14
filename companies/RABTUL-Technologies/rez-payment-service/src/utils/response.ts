export const ErrorCodes = {
  PAY_FAILED: { code: 'PAY_001', message: 'Payment failed' },
  PAY_REFUND_NOT_ALLOWED: { code: 'PAY_002', message: 'Refund not allowed' },
  PAY_GATEWAY_ERROR: { code: 'PAY_003', message: 'Payment gateway error' },
  SRV_INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  RES_NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
} as const;

export function success(data: unknown) {
  return { success: true, data };
}

export function err(code: string, details?: unknown) {
  const def = ErrorCodes[code as keyof typeof ErrorCodes] || { code, message: 'An error occurred' };
  const errorObj: Record<string, unknown> = { code: def.code, message: def.message };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return { success: false, error: errorObj };
}
