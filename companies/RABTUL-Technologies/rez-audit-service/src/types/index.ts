export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  actor: AuditActor;
  resource: AuditResource;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface AuditActor {
  id: string;
  type: 'user' | 'system' | 'service';
  name?: string;
  email?: string;
  role?: string;
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  parentId?: string;
  parentType?: string;
}

export interface AuditAction {
  operation: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export enum AuditEventType {
  // Authentication
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_LOGIN_FAILED = 'auth.login_failed',
  AUTH_TOKEN_REFRESH = 'auth.token_refresh',
  AUTH_PASSWORD_CHANGE = 'auth.password_change',

  // Authorization
  AUTHZ_ACCESS_GRANTED = 'authz.access_granted',
  AUTHZ_ACCESS_DENIED = 'authz.access_denied',
  AUTHZ_PERMISSION_CHANGE = 'authz.permission_change',

  // Data Operations
  DATA_CREATE = 'data.create',
  DATA_READ = 'data.read',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',

  // User Management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_ROLE_CHANGE = 'user.role_change',

  // Configuration
  CONFIG_CHANGE = 'config.change',
  CONFIG_CREATE = 'config.create',
  CONFIG_DELETE = 'config.delete',

  // System
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_ERROR = 'system.error',

  // Business Events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  PAYMENT_PROCESSED = 'payment.processed',
  PAYMENT_FAILED = 'payment.failed',

  // Compliance
  COMPLIANCE_EXPORT = 'compliance.export',
  COMPLIANCE_ACCESS = 'compliance.access',
  GDPR_REQUEST = 'gdpr.request',
  CONSENT_CHANGE = 'consent.change'
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  actorId?: string;
  actorType?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status?: 'success' | 'failure';
  correlationId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  successCount: number;
  failureCount: number;
  eventsByType: Record<string, number>;
  eventsByActor: Record<string, number>;
  eventsByResource: Record<string, number>;
  timeline: Array<{ timestamp: Date; count: number }>;
}

export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  framework: 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'ISO27001';
  summary: {
    totalEvents: number;
    policyViolations: number;
    accessDenials: number;
    dataExports: number;
  };
  findings: ComplianceFinding[];
}

export interface ComplianceFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  affectedEvents: string[];
  recommendation: string;
}

export interface AuditLogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
