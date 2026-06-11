/**
 * CARECODE - Compliance Worker
 * HIPAA and DPDP compliance monitoring and enforcement
 *
 * Features:
 * - Data access auditing
 * - Consent management
 * - Data retention policies
 * - PHI protection
 * - Breach detection
 * - Compliance reporting
 * - Privacy impact assessments
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';
import cron from 'node-cron';

const PORT = process.env.PORT || 4858;

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app = express();
app.use(express.json());

// ============================================
// TYPES
// ============================================

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  dataType: 'PHI' | 'PHI_SENSITIVE' | 'DEMOGRAPHIC' | 'FINANCIAL' | 'OPERATIONAL';
  accessType: 'read' | 'create' | 'update' | 'delete' | 'export';
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'denied' | 'warning';
  reason?: string;
  metadata: Record<string, any>;
}

interface ConsentRecord {
  id: string;
  patientId: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  expiryDate?: Date;
  method: 'electronic' | 'verbal' | 'written' | 'implied';
  version: string;
  signature?: string;
  ipAddress?: string;
  metadata: Record<string, any>;
}

type ConsentType =
  | 'treatment'
  | 'billing'
  | 'research'
  | 'marketing'
  | 'data_sharing'
  | 'third_party'
  | 'telehealth'
  | 'ai_processing';

interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  legalHold: boolean;
  reason: string;
}

interface BreachRecord {
  id: string;
  detectedAt: Date;
  reportedAt?: Date;
  type: 'unauthorized_access' | 'data_loss' | 'data_theft' | 'accidental_disclosure' | 'insider_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRecords: number;
  affectedPatients: string[];
  description: string;
  source: string;
  status: 'detected' | 'investigating' | 'contained' | 'reported' | 'resolved';
  containmentActions: string[];
  notifiedPatients: number;
  reportedToAuthority: boolean;
  authorityName?: string;
  resolution?: string;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  department: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dataTypes: string[];
  dataSubjects: string[];
  processingPurpose: string;
  necessity: string;
  risks: RiskAssessment[];
  safeguards: Safeguard[];
  stakeholderApproval: { name: string; role: string; approvedAt?: Date }[];
  createdAt: Date;
  completedAt?: Date;
  reviewNotes?: string;
}

interface RiskAssessment {
  id: string;
  risk: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  residualRisk: 'low' | 'medium' | 'high';
}

interface Safeguard {
  id: string;
  type: 'technical' | 'administrative' | 'physical';
  description: string;
  implemented: boolean;
  validatedAt?: Date;
}

interface ComplianceViolation {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  automatedDetection: boolean;
  status: 'open' | 'investigating' | 'resolved' | 'accepted_risk';
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface DataSubjectRequest {
  id: string;
  patientId: string;
  requestType: 'access' | 'correction' | 'deletion' | 'portability' | 'restriction' | 'objection';
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'denied' | 'expired';
  submittedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  responseFormat: 'digital' | 'paper' | 'electronic';
  verificationMethod: 'id_verify' | 'security_questions' | 'in_person';
  notes?: string;
  attachments?: string[];
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const auditLogs: Map<string, AuditLog> = new Map();
const consentRecords: Map<string, ConsentRecord> = new Map();
const dataRetentionPolicies: Map<string, DataRetentionPolicy> = new Map();
const breaches: Map<string, BreachRecord> = new Map();
const privacyImpactAssessments: Map<string, PrivacyImpactAssessment> = new Map();
const violations: Map<string, ComplianceViolation> = new Map();
const dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();

// ============================================
// RETENTION POLICIES (Default)
// ============================================

const defaultRetentionPolicies: DataRetentionPolicy[] = [
  { id: 'phi_treatment', dataType: 'treatment_records', retentionDays: 2555, archiveAfterDays: 1825, deleteAfterDays: 3650, legalHold: false, reason: 'Minimum 7 years per HIPAA' },
  { id: 'phi_billing', dataType: 'billing_records', retentionDays: 2555, archiveAfterDays: 1825, deleteAfterDays: 3650, legalHold: false, reason: 'Minimum 7 years per HIPAA' },
  { id: 'phi_consent', dataType: 'consent_records', retentionDays: 2555, archiveAfterDays: 1825, deleteAfterDays: 3650, legalHold: true, reason: 'Consent must be retained as long as valid' },
  { id: 'phi_diagnostic', dataType: 'diagnostic_images', retentionDays: 3650, archiveAfterDays: 2190, deleteAfterDays: 7300, legalHold: false, reason: '10 years for imaging' },
  { id: 'phi_lab', dataType: 'lab_results', retentionDays: 1095, archiveAfterDays: 730, deleteAfterDays: 1825, legalHold: false, reason: '3 years standard' },
  { id: 'phi_mental', dataType: 'mental_health_records', retentionDays: 3650, archiveAfterDays: 2555, deleteAfterDays: 7300, legalHold: true, reason: '10 years for mental health' },
  { id: 'phi_minors', dataType: 'minor_records', retentionDays: 1825, archiveAfterDays: 1095, deleteAfterDays: 3650, legalHold: false, reason: 'Until 7 years after age of majority' },
  { id: 'phi_emergency', dataType: 'emergency_records', retentionDays: 1095, archiveAfterDays: 730, deleteAfterDays: 1825, legalHold: false, reason: '3 years standard' },
  { id: 'audit_logs', dataType: 'audit_trails', retentionDays: 2190, archiveAfterDays: 0, deleteAfterDays: 2190, legalHold: true, reason: '6 years per HIPAA' },
  { id: 'access_logs', dataType: 'access_logs', retentionDays: 1825, archiveAfterDays: 0, deleteAfterDays: 1825, legalHold: false, reason: '5 years per security requirements' }
];

defaultRetentionPolicies.forEach(p => dataRetentionPolicies.set(p.id, p));

// ============================================
// ZOD SCHEMAS
// ============================================

const createAuditLogSchema = z.object({
  userId: z.string(),
  userRole: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  dataType: z.enum(['PHI', 'PHI_SENSITIVE', 'DEMOGRAPHIC', 'FINANCIAL', 'OPERATIONAL']),
  accessType: z.enum(['read', 'create', 'update', 'delete', 'export']),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  outcome: z.enum(['success', 'denied', 'warning']),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const createConsentSchema = z.object({
  patientId: z.string(),
  consentType: z.enum(['treatment', 'billing', 'research', 'marketing', 'data_sharing', 'third_party', 'telehealth', 'ai_processing']),
  purpose: z.string(),
  granted: z.boolean(),
  expiryDate: z.string().optional(),
  method: z.enum(['electronic', 'verbal', 'written', 'implied']).default('electronic'),
  version: z.string(),
  signature: z.string().optional(),
  ipAddress: z.string().optional()
});

const createBreachSchema = z.object({
  type: z.enum(['unauthorized_access', 'data_loss', 'data_theft', 'accidental_disclosure', 'insider_threat']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedRecords: z.number(),
  affectedPatients: z.array(z.string()),
  description: z.string(),
  source: z.string()
});

const createPIASchema = z.object({
  projectName: z.string(),
  department: z.string(),
  dataTypes: z.array(z.string()),
  dataSubjects: z.array(z.string()),
  processingPurpose: z.string(),
  necessity: z.string()
});

// ============================================
// CORE COMPLIANCE FUNCTIONS
// ============================================

function logAccess(data: z.infer<typeof createAuditLogSchema>): AuditLog {
  const log: AuditLog = {
    id: uuidv4(),
    timestamp: new Date(),
    ...data,
    metadata: data.metadata || {}
  };
  auditLogs.set(log.id, log);

  // Check for suspicious patterns
  checkForSuspiciousAccess(log);

  logger.info('Access logged', { logId: log.id, userId: data.userId, action: data.action, dataType: data.dataType });
  return log;
}

function checkForSuspiciousAccess(log: AuditLog): void {
  // Check for bulk access
  const recentAccess = Array.from(auditLogs.values())
    .filter(l => l.userId === log.userId && l.timestamp > new Date(Date.now() - 60000));

  if (recentAccess.length > 100) {
    createViolation({
      type: 'bulk_access',
      severity: 'high',
      description: `User ${log.userId} accessed ${recentAccess.length} records in the last minute`,
      userId: log.userId,
      automatedDetection: true
    });
  }

  // Check for off-hours access
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    const sensitiveDataTypes = ['PHI_SENSITIVE', 'MENTAL_HEALTH', 'HIV', 'SUBSTANCE_ABUSE'];
    if (sensitiveDataTypes.some(t => log.dataType === 'PHI' && log.metadata.sensitive)) {
      createViolation({
        type: 'off_hours_sensitive_access',
        severity: 'medium',
        description: `Off-hours access to sensitive data by ${log.userId}`,
        userId: log.userId,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        automatedDetection: true
      });
    }
  }
}

function createViolation(data: {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  automatedDetection: boolean;
}): ComplianceViolation {
  const violation: ComplianceViolation = {
    id: uuidv4(),
    timestamp: new Date(),
    ...data,
    status: 'open'
  };
  violations.set(violation.id, violation);
  logger.warn('Compliance violation detected', { violationId: violation.id, ...data });
  return violation;
}

function createConsent(data: z.infer<typeof createConsentSchema>): ConsentRecord {
  const consent: ConsentRecord = {
    id: uuidv4(),
    patientId: data.patientId,
    consentType: data.consentType,
    purpose: data.purpose,
    granted: data.granted,
    grantedAt: data.granted ? new Date() : undefined,
    revokedAt: data.granted ? undefined : new Date(),
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    method: data.method,
    version: data.version,
    signature: data.signature,
    ipAddress: data.ipAddress,
    metadata: {}
  };
  consentRecords.set(consent.id, consent);
  logger.info('Consent recorded', { consentId: consent.id, patientId: data.patientId, type: data.consentType, granted: data.granted });
  return consent;
}

function checkConsent(patientId: string, consentType: ConsentType): boolean {
  const consents = Array.from(consentRecords.values())
    .filter(c => c.patientId === patientId && c.consentType === consentType);

  if (consents.length === 0) {
    // Default to false if no consent record exists (opt-in)
    return false;
  }

  const latestConsent = consents.sort((a, b) => {
    const aDate = a.grantedAt?.getTime() || 0;
    const bDate = b.grantedAt?.getTime() || 0;
    return bDate - aDate;
  })[0];

  if (!latestConsent.granted) return false;
  if (latestConsent.expiryDate && latestConsent.expiryDate < new Date()) return false;

  return true;
}

function createBreach(data: z.infer<typeof createBreachSchema>): BreachRecord {
  const breach: BreachRecord = {
    id: uuidv4(),
    detectedAt: new Date(),
    ...data,
    status: 'detected',
    containmentActions: [],
    notifiedPatients: 0,
    reportedToAuthority: false
  };
  breaches.set(breach.id, breach);
  logger.error('BREACH DETECTED', { breachId: breach.id, type: data.type, severity: data.severity });

  // Auto-create violation for breach
  createViolation({
    type: `breach_${data.type}`,
    severity: data.severity === 'critical' ? 'critical' : 'high',
    description: `Security breach detected: ${data.description}`,
    automatedDetection: true
  });

  return breach;
}

function createPrivacyImpactAssessment(data: z.infer<typeof createPIASchema>): PrivacyImpactAssessment {
  const pia: PrivacyImpactAssessment = {
    id: uuidv4(),
    ...data,
    status: 'draft',
    riskLevel: 'low',
    risks: [],
    safeguards: [],
    stakeholderApproval: [],
    createdAt: new Date()
  };
  privacyImpactAssessments.set(pia.id, pia);
  logger.info('Privacy impact assessment created', { piaId: pia.id, projectName: data.projectName });
  return pia;
}

function createDataSubjectRequest(
  patientId: string,
  requestType: DataSubjectRequest['requestType']
): DataSubjectRequest {
  const request: DataSubjectRequest = {
    id: uuidv4(),
    patientId,
    requestType,
    status: 'submitted',
    submittedAt: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    responseFormat: 'digital',
    verificationMethod: 'id_verify'
  };
  dataSubjectRequests.set(request.id, request);
  logger.info('Data subject request created', { requestId: request.id, patientId, type: requestType });
  return request;
}

// ============================================
// SCHEDULED COMPLIANCE CHECKS
// ============================================

// Run daily at midnight
cron.schedule('0 0 * * *', () => {
  logger.info('Running daily compliance checks');

  // Check for expired consents
  const expiredConsents = Array.from(consentRecords.values())
    .filter(c => c.granted && c.expiryDate && c.expiryDate < new Date());

  expiredConsents.forEach(consent => {
    consent.revokedAt = new Date();
    consentRecords.set(consent.id, consent);
    logger.info('Consent expired', { consentId: consent.id, patientId: consent.patientId });
  });

  // Check for overdue data subject requests
  const overdueRequests = Array.from(dataSubjectRequests.values())
    .filter(r => r.status !== 'completed' && r.dueDate < new Date());

  overdueRequests.forEach(request => {
    createViolation({
      type: 'dsar_overdue',
      severity: 'medium',
      description: `Data subject request ${request.id} is overdue`,
      automatedDetection: true
    });
  });

  // Generate daily compliance summary
  const summary = {
    date: new Date().toISOString(),
    auditLogsCount: auditLogs.size,
    activeConsents: Array.from(consentRecords.values()).filter(c => c.granted && (!c.expiryDate || c.expiryDate > new Date())).length,
    openViolations: Array.from(violations.values()).filter(v => v.status === 'open').length,
    pendingBreaches: Array.from(breaches.values()).filter(b => b.status !== 'resolved').length,
    pendingDSARs: Array.from(dataSubjectRequests.values()).filter(r => r.status !== 'completed').length
  };

  logger.info('Daily compliance summary', summary);
});

// Run every hour to check for suspicious patterns
cron.schedule('0 * * * *', () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Check for unusual access patterns
  const accessByUser = new Map<string, number>();
  Array.from(auditLogs.values())
    .filter(l => l.timestamp > oneHourAgo)
    .forEach(l => {
      accessByUser.set(l.userId, (accessByUser.get(l.userId) || 0) + 1);
    });

  accessByUser.forEach((count, userId) => {
    if (count > 500) {
      createViolation({
        type: 'unusual_access_volume',
        severity: 'high',
        description: `User ${userId} accessed ${count} records in the last hour`,
        userId,
        automatedDetection: true
      });
    }
  });
});

// ============================================
// REST API ENDPOINTS
// ============================================

/**
 * Log data access
 */
app.post('/api/audit', (req: Request, res: Response) => {
  try {
    const validated = createAuditLogSchema.parse(req.body);
    const log = logAccess(validated);
    res.status(201).json({ success: true, log });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to log access' });
    }
  }
});

/**
 * Get audit logs
 */
app.get('/api/audit', (req: Request, res: Response) => {
  const { userId, resourceType, dataType, startDate, endDate, limit = '100' } = req.query;
  let result = Array.from(auditLogs.values());

  if (userId) result = result.filter(l => l.userId === userId);
  if (resourceType) result = result.filter(l => l.resourceType === resourceType);
  if (dataType) result = result.filter(l => l.dataType === dataType);
  if (startDate) result = result.filter(l => l.timestamp >= new Date(startDate as string));
  if (endDate) result = result.filter(l => l.timestamp <= new Date(endDate as string));

  result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  result = result.slice(0, parseInt(limit as string));

  res.json({ success: true, logs: result, total: result.length });
});

/**
 * Create consent
 */
app.post('/api/consents', (req: Request, res: Response) => {
  try {
    const validated = createConsentSchema.parse(req.body);
    const consent = createConsent(validated);
    res.status(201).json({ success: true, consent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create consent' });
    }
  }
});

/**
 * Get consents
 */
app.get('/api/consents', (req: Request, res: Response) => {
  const { patientId, consentType, granted } = req.query;
  let result = Array.from(consentRecords.values());

  if (patientId) result = result.filter(c => c.patientId === patientId);
  if (consentType) result = result.filter(c => c.consentType === consentType);
  if (granted !== undefined) result = result.filter(c => c.granted === (granted === 'true'));

  res.json({ success: true, consents: result, total: result.length });
});

/**
 * Check consent
 */
app.get('/api/consents/check/:patientId/:consentType', (req: Request, res: Response) => {
  const { patientId, consentType } = req.params;
  const hasConsent = checkConsent(patientId, consentType as ConsentType);
  res.json({ success: true, hasConsent });
});

/**
 * Revoke consent
 */
app.post('/api/consents/:id/revoke', (req: Request, res: Response) => {
  const consent = consentRecords.get(req.params.id);
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }

  consent.revokedAt = new Date();
  consent.granted = false;
  consentRecords.set(consent.id, consent);

  res.json({ success: true, consent });
});

/**
 * Create breach record
 */
app.post('/api/breaches', (req: Request, res: Response) => {
  try {
    const validated = createBreachSchema.parse(req.body);
    const breach = createBreach(validated);
    res.status(201).json({ success: true, breach });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create breach record' });
    }
  }
});

/**
 * Get breaches
 */
app.get('/api/breaches', (req: Request, res: Response) => {
  const { status, severity } = req.query;
  let result = Array.from(breaches.values());

  if (status) result = result.filter(b => b.status === status);
  if (severity) result = result.filter(b => b.severity === severity);

  result.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

  res.json({ success: true, breaches: result, total: result.length });
});

/**
 * Update breach
 */
app.put('/api/breaches/:id', (req: Request, res: Response) => {
  const breach = breaches.get(req.params.id);
  if (!breach) {
    return res.status(404).json({ error: 'Breach not found' });
  }

  const { status, containmentActions, resolution } = req.body;
  if (status) breach.status = status;
  if (containmentActions) breach.containmentActions.push(...containmentActions);
  if (resolution) {
    breach.resolution = resolution;
    breach.resolvedAt = new Date();
  }
  if (status === 'reported' && !breach.reportedToAuthority) {
    breach.reportedToAuthority = true;
    breach.reportedAt = new Date();
  }

  breaches.set(breach.id, breach);
  res.json({ success: true, breach });
});

/**
 * Create Privacy Impact Assessment
 */
app.post('/api/pia', (req: Request, res: Response) => {
  try {
    const validated = createPIASchema.parse(req.body);
    const pia = createPrivacyImpactAssessment(validated);
    res.status(201).json({ success: true, pia });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create PIA' });
    }
  }
});

/**
 * Get PIAs
 */
app.get('/api/pia', (req: Request, res: Response) => {
  const { status, riskLevel } = req.query;
  let result = Array.from(privacyImpactAssessments.values());

  if (status) result = result.filter(p => p.status === status);
  if (riskLevel) result = result.filter(p => p.riskLevel === riskLevel);

  res.json({ success: true, pias: result, total: result.length });
});

/**
 * Get retention policies
 */
app.get('/api/retention-policies', (req: Request, res: Response) => {
  const policies = Array.from(dataRetentionPolicies.values());
  res.json({ success: true, policies });
});

/**
 * Create/update retention policy
 */
app.post('/api/retention-policies', (req: Request, res: Response) => {
  const policy = req.body as DataRetentionPolicy;
  if (!policy.id) {
    policy.id = uuidv4();
  }
  dataRetentionPolicies.set(policy.id, policy);
  res.status(201).json({ success: true, policy });
});

/**
 * Get violations
 */
app.get('/api/violations', (req: Request, res: Response) => {
  const { status, severity } = req.query;
  let result = Array.from(violations.values());

  if (status) result = result.filter(v => v.status === status);
  if (severity) result = result.filter(v => v.severity === severity);

  result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json({ success: true, violations: result, total: result.length });
});

/**
 * Resolve violation
 */
app.put('/api/violations/:id/resolve', (req: Request, res: Response) => {
  const violation = violations.get(req.params.id);
  if (!violation) {
    return res.status(404).json({ error: 'Violation not found' });
  }

  violation.status = 'resolved';
  violation.resolution = req.body.resolution;
  violation.resolvedAt = new Date();
  violation.resolvedBy = req.body.resolvedBy;
  violations.set(violation.id, violation);

  res.json({ success: true, violation });
});

/**
 * Create data subject request
 */
app.post('/api/dsar', (req: Request, res: Response) => {
  const { patientId, requestType } = req.body;

  if (!patientId || !requestType) {
    return res.status(400).json({ error: 'patientId and requestType are required' });
  }

  const request = createDataSubjectRequest(patientId, requestType);
  res.status(201).json({ success: true, request });
});

/**
 * Get data subject requests
 */
app.get('/api/dsar', (req: Request, res: Response) => {
  const { patientId, status } = req.query;
  let result = Array.from(dataSubjectRequests.values());

  if (patientId) result = result.filter(r => r.patientId === patientId);
  if (status) result = result.filter(r => r.status === status);

  result.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  res.json({ success: true, requests: result, total: result.length });
});

/**
 * Get compliance dashboard stats
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeConsents = Array.from(consentRecords.values())
    .filter(c => c.granted && (!c.expiryDate || c.expiryDate > now));

  const stats = {
    auditLogs: {
      total: auditLogs.size,
      last24h: Array.from(auditLogs.values()).filter(l => l.timestamp > oneDayAgo).length,
      lastWeek: Array.from(auditLogs.values()).filter(l => l.timestamp > oneWeekAgo).length,
      byDataType: Object.fromEntries(
        ['PHI', 'PHI_SENSITIVE', 'DEMOGRAPHIC', 'FINANCIAL', 'OPERATIONAL']
          .map(type => [type, Array.from(auditLogs.values()).filter(l => l.dataType === type).length])
      )
    },
    consents: {
      total: consentRecords.size,
      active: activeConsents.length,
      byType: Object.fromEntries(
        ['treatment', 'billing', 'research', 'marketing', 'data_sharing', 'third_party', 'telehealth', 'ai_processing']
          .map(type => [type, activeConsents.filter(c => c.consentType === type).length])
      )
    },
    breaches: {
      total: breaches.size,
      open: Array.from(breaches.values()).filter(b => !['resolved', 'contained'].includes(b.status)).length,
      bySeverity: Object.fromEntries(
        ['low', 'medium', 'high', 'critical']
          .map(severity => [severity, Array.from(breaches.values()).filter(b => b.severity === severity).length])
      )
    },
    violations: {
      total: violations.size,
      open: Array.from(violations.values()).filter(v => v.status === 'open').length,
      critical: Array.from(violations.values()).filter(v => v.severity === 'critical' && v.status === 'open').length,
      byType: Object.fromEntries(
        [...new Set(Array.from(violations.values()).map(v => v.type))]
          .map(type => [type, Array.from(violations.values()).filter(v => v.type === type).length])
      )
    },
    dataSubjectRequests: {
      total: dataSubjectRequests.size,
      pending: Array.from(dataSubjectRequests.values()).filter(r => !['completed', 'denied'].includes(r.status)).length,
      overdue: Array.from(dataSubjectRequests.values()).filter(r => r.dueDate < now && r.status !== 'completed').length
    },
    pia: {
      total: privacyImpactAssessments.size,
      inReview: Array.from(privacyImpactAssessments.values()).filter(p => p.status === 'in_review').length,
      highRisk: Array.from(privacyImpactAssessments.values()).filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length
    }
  };

  res.json({ success: true, stats });
});

/**
 * Generate compliance report
 */
app.get('/api/reports/compliance', (req: Request, res: Response) => {
  const { startDate, endDate, format = 'json' } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const periodLogs = Array.from(auditLogs.values())
    .filter(l => l.timestamp >= start && l.timestamp <= end);

  const report = {
    period: { start: start.toISOString(), end: end.toISOString() },
    generatedAt: new Date().toISOString(),
    summary: {
      totalAccessEvents: periodLogs.length,
      uniqueUsers: new Set(periodLogs.map(l => l.userId)).size,
      uniquePatients: new Set(periodLogs.map(l => l.resourceId)).size,
      violationsDetected: Array.from(violations.values()).filter(v => v.timestamp >= start && v.timestamp <= end).length,
      breachesDetected: Array.from(breaches.values()).filter(b => b.detectedAt >= start && b.detectedAt <= end).length
    },
    accessByType: Object.fromEntries(
      ['read', 'create', 'update', 'delete', 'export']
        .map(type => [type, periodLogs.filter(l => l.accessType === type).length])
    ),
    accessByDataType: Object.fromEntries(
      ['PHI', 'PHI_SENSITIVE', 'DEMOGRAPHIC', 'FINANCIAL', 'OPERATIONAL']
        .map(type => [type, periodLogs.filter(l => l.dataType === type).length])
    ),
    accessDenied: periodLogs.filter(l => l.outcome === 'denied').length,
    topUsersByAccess: Object.fromEntries(
      [...new Map(periodLogs.map(l => [l.userId, periodLogs.filter(pl => pl.userId === l.userId).length])).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    )
  };

  res.json({ success: true, report });
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'carecode-compliance-worker',
    version: '1.0.0',
    uptime: process.uptime(),
    compliance: {
      auditLogs: auditLogs.size,
      consents: consentRecords.size,
      breaches: breaches.size,
      violations: violations.size,
      retentionPolicies: dataRetentionPolicies.size
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`CARECODE Compliance Worker started on port ${PORT}`);
  logger.info(`Retention policies loaded: ${dataRetentionPolicies.size}`);
});

export default app;
