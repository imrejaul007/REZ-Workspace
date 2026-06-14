/**
 * CorpID Shared Zod Schemas
 * Validation schemas for all CorpID services
 */

import { z } from 'zod';

// Entity Types Schema
export const entityTypeSchema = z.enum(['INDIVIDUAL', 'BUSINESS', 'SUPPLIER', 'MERCHANT', 'DRIVER', 'FRANCHISE', 'AGENT']);

export const verificationStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED']);

export const ciScoreTierSchema = z.enum(['ELITE', 'PREMIUM', 'VERIFIED', 'BASIC', 'UNVERIFIED']);

export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const alertSeveritySchema = z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']);

export const notificationTypeSchema = z.enum(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK']);

// CorpID Patterns
const CORP_ID_PATTERNS = {
  INDIVIDUAL: /^CI-IND-[A-Z0-9]{5}$/,
  BUSINESS: /^CI-BIZ-[A-Z0-9]{5}$/,
  SUPPLIER: /^CI-SUP-[A-Z0-9]{5}$/,
  MERCHANT: /^CI-MER-[A-Z0-9]{5}$/,
  DRIVER: /^CI-DRV-[A-Z0-9]{5}$/,
  FRANCHISE: /^CI-FRN-[A-Z0-9]{5}$/,
  AGENT: /^CI-AGT-[A-Z0-9]{5}$/,           // CorpID v2.0: AI Agent entities
} as const;

export const corpIdSchema = z.string().regex(
  /^(CI-(IND|BIZ|SUP|MER|DRV|FRN|AGT)-[A-Z0-9]{5})$/,
  'Invalid CorpID format'
);

// Address Schema
export const addressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100).default('India'),
  postalCode: z.string().min(4).max(10),
});

// Identity Schemas
export const createIndividualIdentitySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: addressSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createBusinessIdentitySchema = z.object({
  businessName: z.string().min(1).max(200),
  businessType: z.string().min(1).max(100),
  registrationNumber: z.string().min(1).max(50),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  address: addressSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const updateIdentitySchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: addressSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const searchIdentitySchema = z.object({
  query: z.string().optional(),
  entityType: entityTypeSchema.optional(),
  status: verificationStatusSchema.optional(),
  verificationLevelMin: z.number().int().min(0).max(5).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'corpId']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Verification Schemas
export const startIdentityVerificationSchema = z.object({
  corpId: corpIdSchema,
  documents: z.array(z.object({
    type: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE']),
    documentNumber: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    dob: z.string().optional(),
  })).min(1),
  selfieData: z.string().optional(),
  addressData: addressSchema.optional(),
});

export const startBusinessVerificationSchema = z.object({
  corpId: corpIdSchema,
  documents: z.array(z.object({
    type: z.enum(['COMPANY_REGISTRATION', 'GST_CERTIFICATE', 'TRADE_LICENSE', 'PAN', 'BANK_STATEMENT']),
    documentNumber: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
  })).min(1),
  authorizedPerson: z.object({
    name: z.string().min(1).max(200),
    designation: z.string().min(1).max(100),
    phone: z.string().min(10).max(15),
    email: z.string().email(),
  }).optional(),
});

export const startEmploymentVerificationSchema = z.object({
  corpId: corpIdSchema,
  employerName: z.string().min(1).max(200),
  employeeId: z.string().min(1).max(50),
  designation: z.string().min(1).max(100),
  department: z.string().optional(),
  joiningDate: z.string(),
  verificationContact: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().min(10).max(15),
    designation: z.string().min(1).max(100),
  }),
});

export const startEducationVerificationSchema = z.object({
  corpId: corpIdSchema,
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().min(1).max(200),
  enrollmentNumber: z.string().min(1).max(50).optional(),
  passingYear: z.number().int().min(1950).max(new Date().getFullYear()),
  verificationContact: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().min(10).max(15),
    designation: z.string().min(1).max(100),
  }).optional(),
});

export const processVerificationSchema = z.object({
  status: verificationStatusSchema,
  notes: z.string().max(1000).optional(),
  verifiedDocuments: z.array(z.string()).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// CI Score Schemas
export const calculateCIScoreSchema = z.object({
  corpId: corpIdSchema,
});

// Relationship Schemas
export const createRelationshipSchema = z.object({
  fromCorpId: corpIdSchema,
  toCorpId: corpIdSchema,
  type: z.enum([
    'WORKED_AT', 'MANAGED_BY', 'SUPPLIED_TO', 'PARTNERED_WITH',
    'VERIFIED_BY', 'REFERENCED_BY', 'EMPLOYED_BY', 'OWNED_BY', 'LICENSED_TO'
  ]),
  metadata: z.record(z.unknown()).optional(),
  verified: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const getRelationshipsSchema = z.object({
  corpId: corpIdSchema,
  type: z.enum([
    'WORKED_AT', 'MANAGED_BY', 'SUPPLIED_TO', 'PARTNERED_WITH',
    'VERIFIED_BY', 'REFERENCED_BY', 'EMPLOYED_BY', 'OWNED_BY', 'LICENSED_TO'
  ]).optional(),
  direction: z.enum(['OUTGOING', 'INCOMING', 'BOTH']).default('BOTH'),
  depth: z.number().int().min(1).max(3).default(1),
});

// Passport Schemas
export const addEmploymentRecordSchema = z.object({
  corpId: corpIdSchema,
  companyName: z.string().min(1).max(200),
  companyCorpId: corpIdSchema.optional(),
  title: z.string().min(1).max(100),
  department: z.string().max(100).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().max(500).optional(),
});

export const addEducationRecordSchema = z.object({
  corpId: corpIdSchema,
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().min(1).max(200),
  startYear: z.number().int().min(1950).max(new Date().getFullYear()),
  endYear: z.number().int().min(1950).max(new Date().getFullYear() + 5).optional(),
});

export const addSkillSchema = z.object({
  corpId: corpIdSchema,
  name: z.string().min(1).max(100),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
});

export const addCertificationSchema = z.object({
  corpId: corpIdSchema,
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  issuedAt: z.string(),
  expiresAt: z.string().optional(),
  credentialId: z.string().max(100).optional(),
  credentialUrl: z.string().url().optional(),
});

export const addBadgeSchema = z.object({
  corpId: corpIdSchema,
  type: z.enum([
    'VERIFIED_IDENTITY', 'VERIFIED_EMPLOYMENT', 'VERIFIED_EDUCATION',
    'SKILL_CERTIFIED', 'BACKGROUND_CHECKED', 'REFERENCE_VERIFIED',
    'COMPLIANCE_MASTER', 'TOP_PERFORMER', 'TRUSTED_PARTNER', 'ELITE_MEMBER'
  ]),
  issuer: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const addEndorsementSchema = z.object({
  corpId: corpIdSchema,
  skill: z.string().min(1).max(100),
  comment: z.string().max(500).optional(),
  rating: z.number().min(1).max(5),
});

// Document Schemas
export const uploadDocumentSchema = z.object({
  corpId: corpIdSchema,
  type: z.enum([
    'AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE',
    'COMPANY_REGISTRATION', 'GST_CERTIFICATE', 'TRADE_LICENSE',
    'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'EDUCATION_CERTIFICATE', 'SKILL_CERTIFICATION'
  ]),
  name: z.string().min(1).max(200),
  expiryDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyDocumentSchema = z.object({
  status: verificationStatusSchema,
  notes: z.string().max(500).optional(),
});

// Risk Schemas
export const assessRiskSchema = z.object({
  corpId: corpIdSchema,
  assessmentType: z.enum(['FULL', 'QUICK', 'CONTINUOUS']).default('FULL'),
});

export const getRiskReportSchema = z.object({
  corpId: corpIdSchema,
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// Alert Schemas
export const createAlertSchema = z.object({
  corpId: corpIdSchema,
  type: z.string().min(1).max(50),
  severity: alertSeveritySchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
});

export const acknowledgeAlertSchema = z.object({
  alertId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

// Monitoring Schemas
export const subscribeMonitoringSchema = z.object({
  corpId: corpIdSchema,
  entityCorpId: corpIdSchema,
  alertTypes: z.array(z.string()).min(1),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
  notifyWebhook: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
});

export const unsubscribeMonitoringSchema = z.object({
  subscriptionId: z.string().uuid(),
});

// Partner Schemas
export const createPartnerSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric'),
  type: z.enum(['INTERNAL', 'EXTERNAL']).default('EXTERNAL'),
  permissions: z.array(z.string()).min(1),
  usageLimit: z.number().int().min(1000).default(10000),
});

export const createIntegrationSchema = z.object({
  partnerId: z.string().uuid(),
  service: z.string().min(1).max(100),
  endpoint: z.string().min(1).max(200),
  authType: z.enum(['API_KEY', 'OAUTH', 'JWT']).default('API_KEY'),
});

export const createWebhookSchema = z.object({
  corpId: corpIdSchema,
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(32).optional(),
});

// Notification Schemas
export const sendNotificationSchema = z.object({
  corpId: corpIdSchema,
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
});

// Admin Schemas
export const getAuditLogsSchema = z.object({
  actorCorpId: corpIdSchema.optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const getAdminStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

// CorpID v2.0: Agent Entity Schemas
export const createAgentIdentitySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  version: z.string().max(50).optional(),
  agentType: z.enum(['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR']).default('SPECIALIZED'),
  capabilities: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(200).optional(),
    inputTypes: z.array(z.string()).optional(),
    outputTypes: z.array(z.string()).optional(),
  })).optional(),
  tools: z.array(z.object({
    name: z.string().min(1).max(100),
    enabled: z.boolean().default(true),
    config: z.record(z.unknown()).optional(),
  })).optional(),
  permissions: z.object({
    dataAccess: z.array(z.string()).optional(),
    actionAccess: z.array(z.string()).optional(),
    escalationRules: z.array(z.string()).optional(),
  }).optional(),
  costProfile: z.object({
    perInvocation: z.number().optional(),
    perTokenInput: z.number().optional(),
    perTokenOutput: z.number().optional(),
    monthlyBudget: z.number().optional(),
  }).optional(),
  ownerId: corpIdSchema.optional(),  // Human or Organization CorpID
  metadata: z.record(z.unknown()).optional(),
});

export const updateAgentIdentitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  version: z.string().max(50).optional(),
  agentType: z.enum(['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED']).optional(),
  capabilities: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(200).optional(),
    inputTypes: z.array(z.string()).optional(),
    outputTypes: z.array(z.string()).optional(),
  })).optional(),
  tools: z.array(z.object({
    name: z.string().min(1).max(100),
    enabled: z.boolean().optional(),
    config: z.record(z.unknown()).optional(),
  })).optional(),
  permissions: z.object({
    dataAccess: z.array(z.string()).optional(),
    actionAccess: z.array(z.string()).optional(),
    escalationRules: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const findAgentsSchema = z.object({
  capability: z.string().optional(),
  agentType: z.enum(['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// CorpID v2.0: Employee Integration Schemas
export const linkEmployeeSchema = z.object({
  employeeId: z.string().min(1).max(50),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  department: z.string().optional(),
  designation: z.string().optional(),
  managerCorpId: corpIdSchema.optional(),  // Manager's CorpID for REPORTS_TO relationship
  metadata: z.record(z.unknown()).optional(),
});

export const getEmployeeLinkSchema = z.object({
  identifierType: z.enum(['employeeId', 'corpId', 'email']).default('employeeId'),
  identifier: z.string().min(1),
});

// CorpID v2.0: Assertion Schemas
export const createAssertionSchema = z.object({
  corpId: corpIdSchema,
  predicate: z.string().min(1).max(100),
  value: z.unknown(),
  source: z.enum(['SELF_DECLARED', 'PEER_VERIFIED', 'SYSTEM_OBSERVED', 'CREDENTIAL', 'MANUAL_REVIEW', 'AGENT_COMPUTED']),
  confidence: z.number().min(0).max(1).optional(),
  evidenceRefs: z.array(z.string()).optional(),
  validUntil: z.string().datetime().optional(),
  createdBy: corpIdSchema,
});

export const getAssertionsSchema = z.object({
  corpId: corpIdSchema,
  predicate: z.string().optional(),
  source: z.enum(['SELF_DECLARED', 'PEER_VERIFIED', 'SYSTEM_OBSERVED', 'CREDENTIAL', 'MANUAL_REVIEW', 'AGENT_COMPUTED']).optional(),
  includeExpired: z.boolean().default(false),
});

// CorpID v2.0: Extended Relationship Schemas
export const createRelationshipV2Schema = z.object({
  fromCorpId: corpIdSchema,
  toCorpId: corpIdSchema,
  type: z.enum([
    'REPORTS_TO', 'MANAGES', 'WORKS_WITH', 'COLLABORATES_WITH',
    'MENTORS', 'MENTORED_BY', 'PEER_OF',
    'EMPLOYED_BY', 'CONTRACTED_BY', 'OWNED_BY',
    'CREATED_BY', 'SUPERVISES', 'USES',
    'CALLS', 'DELEGATES_TO', 'COORDINATES_WITH',
    'DEPLOYED_IN', 'SUBSIDIARY_OF', 'PARTNERED_WITH',
    'SUPPLIES_TO', 'CLIENT_OF',
  ]),
  weight: z.number().min(0).max(1).optional(),
  verified: z.boolean().default(false),
  source: z.enum(['SELF_DECLARED', 'SYSTEM_INFERRED', 'MANUAL_APPROVED']).default('SELF_DECLARED'),
  expiresAt: z.string().datetime().optional(),
});

export const getGraphSchema = z.object({
  corpId: corpIdSchema,
  depth: z.number().int().min(1).max(3).default(1),
  types: z.array(z.string()).optional(),
  includeIncoming: z.boolean().default(true),
  includeOutgoing: z.boolean().default(true),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type CreateIndividualIdentity = z.infer<typeof createIndividualIdentitySchema>;
export type CreateBusinessIdentity = z.infer<typeof createBusinessIdentitySchema>;
export type UpdateIdentity = z.infer<typeof updateIdentitySchema>;
export type SearchIdentity = z.infer<typeof searchIdentitySchema>;
export type StartIdentityVerification = z.infer<typeof startIdentityVerificationSchema>;
export type StartBusinessVerification = z.infer<typeof startBusinessVerificationSchema>;
export type StartEmploymentVerification = z.infer<typeof startEmploymentVerificationSchema>;
export type StartEducationVerification = z.infer<typeof startEducationVerificationSchema>;
export type ProcessVerification = z.infer<typeof processVerificationSchema>;
export type CreateRelationship = z.infer<typeof createRelationshipSchema>;
export type GetRelationships = z.infer<typeof getRelationshipsSchema>;
export type AddEmploymentRecord = z.infer<typeof addEmploymentRecordSchema>;
export type AddEducationRecord = z.infer<typeof addEducationRecordSchema>;
export type AddSkill = z.infer<typeof addSkillSchema>;
export type AddCertification = z.infer<typeof addCertificationSchema>;
export type AddBadge = z.infer<typeof addBadgeSchema>;
export type AddEndorsement = z.infer<typeof addEndorsementSchema>;
export type UploadDocument = z.infer<typeof uploadDocumentSchema>;
export type VerifyDocument = z.infer<typeof verifyDocumentSchema>;
export type AssessRisk = z.infer<typeof assessRiskSchema>;
export type CreateAlert = z.infer<typeof createAlertSchema>;
export type AcknowledgeAlert = z.infer<typeof acknowledgeAlertSchema>;
export type SubscribeMonitoring = z.infer<typeof subscribeMonitoringSchema>;
export type CreatePartner = z.infer<typeof createPartnerSchema>;
export type CreateIntegration = z.infer<typeof createIntegrationSchema>;
export type CreateWebhook = z.infer<typeof createWebhookSchema>;
export type SendNotification = z.infer<typeof sendNotificationSchema>;
export type GetAuditLogs = z.infer<typeof getAuditLogsSchema>;
export type GetAdminStats = z.infer<typeof getAdminStatsSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

// CorpID v2.0 Type exports
export type CreateAgentIdentity = z.infer<typeof createAgentIdentitySchema>;
export type UpdateAgentIdentity = z.infer<typeof updateAgentIdentitySchema>;
export type FindAgents = z.infer<typeof findAgentsSchema>;
export type LinkEmployee = z.infer<typeof linkEmployeeSchema>;
export type GetEmployeeLink = z.infer<typeof getEmployeeLinkSchema>;
export type CreateAssertion = z.infer<typeof createAssertionSchema>;
export type GetAssertions = z.infer<typeof getAssertionsSchema>;
export type CreateRelationshipV2 = z.infer<typeof createRelationshipV2Schema>;
export type GetGraph = z.infer<typeof getGraphSchema>;
