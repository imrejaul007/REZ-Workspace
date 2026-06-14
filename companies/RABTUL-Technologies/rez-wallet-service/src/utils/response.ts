export const ErrorCodes = {
  BIZ_INSUFFICIENT_BALANCE: { code: 'BIZ_001', message: 'Insufficient balance' },
  BIZ_LIMIT_EXCEEDED: { code: 'BIZ_002', message: 'Limit exceeded' },
  SRV_INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  RES_NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
} as const;

export function success(data: unknown) {
  return { success: true, data };
}

export function err(code: string, details?: unknown) {
  const def = ErrorCodes[code as keyof typeof ErrorCodes] || { code, message: 'An error occurred' };
  const errorObj: Record<string, unknown> = { code: def.code, message: def.message };
  if (details) errorObj.details = details;
  return { success: false, error: errorObj };
}
