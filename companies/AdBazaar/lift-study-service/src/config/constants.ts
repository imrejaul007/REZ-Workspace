export const SERVICE_NAME = 'lift-study-service';
export const SERVICE_VERSION = '1.0.0';
export const SERVICE_PORT = parseInt(process.env.PORT || '4972');

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_STUDY_STATUS: 'INVALID_STUDY_STATUS',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
} as const;

export const STUDY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const STUDY_TYPE = {
  BRAND_LIFT: 'brand_lift',
  CONVERSION_LIFT: 'conversion_lift',
  BOTH: 'both'
} as const;

export const METHODOLOGY = {
  RANDOMIZED_CONTROL: 'randomized_control',
  GEO_TARGETING: 'geo_targeting',
  MATCHED_MARKET: 'matched_market',
  HOLDOUT: 'holdout'
} as const;

export const METRICS = {
  AWARENESS: 'awareness',
  CONSIDERATION: 'consideration',
  INTENT: 'intent',
  AD_RECALL: 'ad_recall',
  PURCHASE_INTENT: 'purchase_intent',
  CONVERSION_RATE: 'conversion_rate',
  REVENUE_PER_USER: 'revenue_per_user',
  ENGAGEMENT_RATE: 'engagement_rate',
  CLICK_THROUGH_RATE: 'click_through_rate',
  BRAND_AFFINITY: 'brand_affinity'
} as const;