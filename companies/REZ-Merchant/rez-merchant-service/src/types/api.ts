/**
 * Common API Types for ReZ Merchant Platform
 * Shared types for pagination, API responses, and validation
 */

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  /** Page number (1-indexed), default 1 */
  page?: number;
  /** Items per page, default 20, max 100 */
  limit?: number;
  /** Field name to sort by */
  sort?: string;
  /** Sort order: 'asc' or 'desc', default 'asc' */
  order?: 'asc' | 'desc';
}

/**
 * Pagination metadata for response headers and body
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Human-readable message */
  message?: string;
  /** Validation errors (present on failure) */
  errors?: ValidationError[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  /** Whether the operation completed */
  success: boolean;
  /** Number of items successfully processed */
  processed: number;
  /** Number of items that failed */
  failed: number;
  /** Details of each failed item */
  errors: Array<{ id: string; error: string }>;
}

/**
 * Generic query filters for list endpoints
 */
export interface QueryFilters {
  /** Search text across multiple fields */
  search?: string;
  /** Filter by status (comma-separated for multiple) */
  status?: string;
  /** Filter by date range start */
  dateFrom?: string;
  /** Filter by date range end */
  dateTo?: string;
  /** Filter by store ID */
  storeId?: string;
}

/**
 * Request options for internal service calls
 */
export interface InternalRequestOptions {
  /** Service name for logging */
  serviceName: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry count for transient failures */
  retries?: number;
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  /** Validation failed */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Resource not found */
  NOT_FOUND = 'NOT_FOUND',
  /** Duplicate entry */
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  /** Unauthorized access */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Forbidden operation */
  FORBIDDEN = 'FORBIDDEN',
  /** Internal server error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** Service unavailable */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  /** Invalid state transition */
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  /** Insufficient credit limit */
  INSUFFICIENT_CREDIT = 'INSUFFICIENT_CREDIT',
  /** Payment failed */
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

/**
 * HTTP status codes used in API responses
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Base type for all timestamps
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete interface for documents
 */
export interface SoftDelete {
  /** Whether the document is deleted */
  isDeleted: boolean;
  /** Timestamp of deletion */
  deletedAt?: Date;
  /** ID of user who deleted */
  deletedBy?: string;
}

/**
 * Audit log entry for tracking changes
 */
export interface AuditLogEntry {
  /** Action performed */
  action: string;
  /** User ID who performed action */
  userId: string;
  /** Timestamp of action */
  timestamp: Date;
  /** Previous state (for updates) */
  previousState?: Record<string, unknown>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** IP address of request */
  ipAddress?: string;
}

/**
 * Request context passed through middleware
 */
export interface RequestContext {
  /** Authenticated merchant ID */
  merchantId: string;
  /** Authenticated store ID (optional) */
  storeId?: string;
  /** User ID of authenticated user */
  userId?: string;
  /** User role */
  role?: string;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Upload metadata for file attachments
 */
export interface UploadMetadata {
  /** Original filename */
  originalName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Cloud storage URL */
  url: string;
  /** Public ID for cloud storage */
  publicId?: string;
}

/**
 * Generic ID reference with type safety
 */
export interface IdReference {
  /** MongoDB ObjectId as string */
  id: string;
  /** Human-readable label */
  label?: string;
}

/**
 * Sort options for list queries
 */
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRange {
  /** Start date (inclusive) */
  from: Date;
  /** End date (inclusive) */
  to: Date;
}

/**
 * Aggregation pipeline stage helper
 */
export interface AggregationStage {
  /** Stage name */
  stage: string;
  /** Stage configuration */
  config: Record<string, unknown>;
}
