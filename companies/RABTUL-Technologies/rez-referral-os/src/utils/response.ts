import { Response } from 'express';

export const ErrorCodes = {
  // Auth errors
  AUTH_MISSING_TOKEN: { code: 'AUTH_001', message: 'Missing authentication token' },
  AUTH_INVALID_TOKEN: { code: 'AUTH_002', message: 'Invalid or expired token' },
  AUTH_UNAUTHORIZED: { code: 'AUTH_003', message: 'Unauthorized access' },
  AUTH_FORBIDDEN: { code: 'AUTH_004', message: 'Access forbidden' },

  // Referral errors
  REFERRAL_NOT_FOUND: { code: 'REF_001', message: 'Referral not found' },
  REFERRAL_CODE_NOT_FOUND: { code: 'REF_002', message: 'Referral code not found' },
  REFERRAL_CODE_EXISTS: { code: 'REF_003', message: 'Referral code already exists' },
  REFERRAL_INVALID: { code: 'REF_004', message: 'Invalid referral code' },
  REFERRAL_SELF_REFFERAL: { code: 'REF_005', message: 'Cannot refer yourself' },
  REFERRAL_ALREADY_EXISTS: { code: 'REF_006', message: 'Referral already exists for this user' },
  REFERRAL_CAMPAIGN_NOT_FOUND: { code: 'REF_007', message: 'Campaign not found' },
  REFERRAL_CAMPAIGN_EXPIRED: { code: 'REF_008', message: 'Campaign has expired' },
  REFERRAL_CAMPAIGN_BUDGET_EXHAUSTED: { code: 'REF_009', message: 'Campaign budget exhausted' },
  REFERRAL_MAX_REWARDS_EXCEEDED: { code: 'REF_010', message: 'Maximum referral rewards exceeded' },

  // Creator errors
  CREATOR_NOT_FOUND: { code: 'CRT_001', message: 'Creator profile not found' },
  CREATOR_HANDLE_EXISTS: { code: 'CRT_002', message: 'Creator handle already taken' },
  CREATOR_COLLECTION_NOT_FOUND: { code: 'CRT_003', message: 'Collection not found' },

  // Fraud errors
  FRAUD_SUSPECTED: { code: 'FRD_001', message: 'Suspicious referral activity detected' },
  FRAUD_BLOCKED: { code: 'FRD_002', message: 'Referral blocked due to fraud detection' },

  // Validation errors
  VALIDATION_ERROR: { code: 'VAL_001', message: 'Validation failed' },
  INVALID_INPUT: { code: 'VAL_002', message: 'Invalid input provided' },

  // Server errors
  INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { code: 'SRV_002', message: 'Service temporarily unavailable' },

  // Not found
  NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
} as const;

export type ErrorCodeKey = keyof typeof ErrorCodes;

export function success(data: unknown, message?: string) {
  return { success: true, data, message };
}

export function err(code: ErrorCodeKey, details?: unknown) {
  const def = ErrorCodes[code];
  const errorObj: Record<string, unknown> = { code: def.code, message: def.message };
  if (details) errorObj.details = details;
  return { success: false, error: errorObj };
}

export function sendSuccess(res: Response, data: unknown, statusCode = 200, message?: string) {
  return res.status(statusCode).json(success(data, message));
}

export function sendError(res: Response, code: ErrorCodeKey, statusCode = 400, details?: unknown) {
  return res.status(statusCode).json(err(code, details));
}

export function sendServerError(res: Response, message = 'Internal server error') {
  return res.status(500).json(err('INTERNAL_ERROR', message));
}
