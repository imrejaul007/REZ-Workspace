/**
 * Audit Middleware for Comprehensive Admin Action Logging
 *
 * Captures all admin actions with:
 * - Admin identity (id, role, email)
 * - Action details (type, resource, changes)
 * - Request metadata (IP, user agent, timestamp)
 * - Before/after state for modifications
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

// Audit action types
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'ACTIVATE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'BULK_OPERATION'
  | 'SETTINGS_CHANGE';

// Resource types
export type ResourceType =
  | 'USER'
  | 'MERCHANT'
  | 'ORDER'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'CAMPAIGN'
  | 'ADMIN_USER'
  | 'SYSTEM_CONFIG'
  | 'REFUND'
  | 'CASHBACK'
  | 'REPORT';

// Audit entry interface
export interface AuditEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  adminRole: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  changes?: {
    field: string;
    from: any;
    to: any;
  }[];
  ip: string;
  userAgent: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
}

// In-memory audit store (in production, this would be a database)
const auditStore: AuditEntry[] = [];
const MAX_AUDIT_ENTRIES = 10000;

// Safe IP extraction
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Generate unique audit ID
function generateAuditId(): string {
  return `AUD${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Creates an audit log entry
 */
export async function createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
  const auditEntry: AuditEntry = {
    ...entry,
    id: generateAuditId(),
    timestamp: new Date(),
  };

  // Add to store (with max size limit)
  auditStore.push(auditEntry);
  if (auditStore.length > MAX_AUDIT_ENTRIES) {
    auditStore.shift();
  }

  // Log to main logger as well
  logger.info('[AUDIT]', {
    adminId: auditEntry.adminId,
    action: auditEntry.action,
    resourceType: auditEntry.resourceType,
    resourceId: auditEntry.resourceId,
    status: auditEntry.status,
  });

  return auditEntry;
}

/**
 * Compute changes between two objects
 */
export function computeChanges(before: any, after: any): { field: string; from: any; to: any }[] {
  const changes: { field: string; from: any; to: any }[] = [];

  if (!before || !after) return changes;

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const from = before[key];
    const to = after[key];

    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field: key, from, to });
    }
  }

  return changes;
}

/**
 * Audit middleware factory
 * Creates middleware that automatically logs admin actions
 */
export function auditMiddleware(
  action: AuditAction,
  resourceType: ResourceType,
  options: {
    captureRequestBody?: boolean;
    captureResponseBody?: boolean;
    resourceIdExtractor?: (req: Request) => string | undefined;
  } = {}
) {
  const { captureRequestBody = false, captureResponseBody = false, resourceIdExtractor } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string;
    const startTime = Date.now();

    // Capture original response methods
    const originalJson = res.json.bind(res);
    let responseBody: any;

    // Override response methods to capture data
    res.json = function(body: any) {
      responseBody = body;
      return originalJson(body);
    };

    // Execute the route handler
    next();

    // Wait for response to complete, then log
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const adminId = req.adminId || 'anonymous';
      const adminRole = req.adminRole || 'unknown';

      // Determine status based on response code
      const status = res.statusCode >= 400 ? 'failure' : 'success';

      const entry: Omit<AuditEntry, 'id' | 'timestamp'> = {
        adminId,
        adminRole,
        action,
        resourceType,
        resourceId: resourceIdExtractor ? resourceIdExtractor(req) : req.params.id,
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        requestId,
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
          duration,
        },
        status,
      };

      // Capture request body if enabled
      if (captureRequestBody && req.body) {
        entry.newValue = { body: req.body };
      }

      // Capture response body if enabled and successful
      if (captureResponseBody && responseBody && status === 'success') {
        entry.newValue = { ...entry.newValue, response: responseBody };
      }

      // Capture error message for failures
      if (status === 'failure' && responseBody?.message) {
        entry.errorMessage = responseBody.message;
      }

      await createAuditEntry(entry);
    });
  };
}

/**
 * Helper function to manually create an audit entry
 * Use this for complex actions or bulk operations
 */
export async function auditAdminAction(
  req: AuthenticatedRequest,
  action: AuditAction,
  resourceType: ResourceType,
  details: {
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  }
): Promise<AuditEntry> {
  const changes = computeChanges(details.previousValue, details.newValue);

  return createAuditEntry({
    adminId: req.adminId || 'system',
    adminRole: req.adminRole || 'system',
    action,
    resourceType,
    resourceId: details.resourceId,
    previousValue: details.previousValue,
    newValue: details.newValue,
    changes: changes.length > 0 ? changes : undefined,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    requestId: req.headers['x-request-id'] as string,
    metadata: details.metadata,
    status: 'success',
  });
}

/**
 * Query audit logs with filtering
 */
export function queryAuditLogs(filters: {
  adminId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'success' | 'failure';
  page?: number;
  limit?: number;
}): { data: AuditEntry[]; pagination: { total: number; page: number; limit: number; pages: number } } {
  let filtered = [...auditStore];

  // Apply filters
  if (filters.adminId) {
    filtered = filtered.filter(e => e.adminId === filters.adminId);
  }
  if (filters.action) {
    filtered = filtered.filter(e => e.action === filters.action);
  }
  if (filters.resourceType) {
    filtered = filtered.filter(e => e.resourceType === filters.resourceType);
  }
  if (filters.resourceId) {
    filtered = filtered.filter(e => e.resourceId === filters.resourceId);
  }
  if (filters.startDate) {
    filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
  }
  if (filters.endDate) {
    filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
  }
  if (filters.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }

  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export default auditMiddleware;
