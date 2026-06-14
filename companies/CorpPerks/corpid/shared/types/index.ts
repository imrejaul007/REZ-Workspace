/**
 * CorpID Shared Types
 * Universal types for all CorpID services
 */

// Entity Types
export type EntityType = 'INDIVIDUAL' | 'BUSINESS' | 'SUPPLIER' | 'MERCHANT' | 'DRIVER' | 'FRANCHISE' | 'AGENT';

export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type CIScoreTier = 'ELITE' | 'PREMIUM' | 'VERIFIED' | 'BASIC' | 'UNVERIFIED';

export type AgentType = 'SPECIALIZED' | 'GENERALIST' | 'ORCHESTRATOR';

export type AssertionSource =
  | 'SELF_DECLARED'
  | 'PEER_VERIFIED'
  | 'SYSTEM_OBSERVED'
  | 'CREDENTIAL'
  | 'MANUAL_REVIEW'
  | 'AGENT_COMPUTED';

export type RelationshipType =
  // Human → Human
  | 'REPORTS_TO'
  | 'MANAGES'
  | 'WORKS_WITH'
  | 'COLLABORATES_WITH'
  | 'MENTORS'
  | 'MENTORED_BY'
  | 'PEER_OF'
  // Human → Organization
  | 'EMPLOYED_BY'
  | 'CONTRACTED_BY'
  | 'OWNED_BY'
  // Human → Agent
  | 'CREATED_BY'
  | 'SUPERVISES'
  | 'USES'
  // Agent → Agent
  | 'CALLS'
  | 'DELEGATES_TO'
  | 'COORDINATES_WITH'
  // Agent → Organization
  | 'DEPLOYED_IN'
  // Organization → Organization
  | 'SUBSIDIARY_OF'
  | 'PARTNERED_WITH'
  | 'SUPPLIES_TO'
  | 'CLIENT_OF'
  // Legacy (for backward compatibility)
  | 'WORKED_AT'
  | 'MANAGED_BY'
  | 'SUPPLIED_TO'
  | 'VERIFIED_BY'
  | 'REFERENCED_BY'
  | 'LICENSED_TO';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT'
  | 'VOTER_ID'
  | 'DRIVING_LICENSE'
  | 'COMPANY_REGISTRATION'
  | 'GST_CERTIFICATE'
  | 'TRADE_LICENSE'
  | 'BANK_STATEMENT'
  | 'EMPLOYMENT_LETTER'
  | 'EDUCATION_CERTIFICATE'
  | 'SKILL_CERTIFICATION';

export type BadgeType =
  | 'VERIFIED_IDENTITY'
  | 'VERIFIED_EMPLOYMENT'
  | 'VERIFIED_EDUCATION'
  | 'SKILL_CERTIFIED'
  | 'BACKGROUND_CHECKED'
  | 'REFERENCE_VERIFIED'
  | 'COMPLIANCE_MASTER'
  | 'TOP_PERFORMER'
  | 'TRUSTED_PARTNER'
  | 'ELITE_MEMBER';

// CorpID Format: CI-{TYPE}-{5_ALPHANUMERIC}
export interface CorpId {
  type: EntityType;
  sequence: string;
  checksum: string;
}

export interface Identity {
  id: string;
  corpId: string;
  entityType: EntityType;
  status: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;

  // Individual fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  email?: string;
  phone?: string;
  address?: Address;

  // Business fields
  businessName?: string;
  businessType?: string;
  registrationNumber?: string;
  gstin?: string;
  pan?: string;
  address?: Address;

  // Verification
  verificationLevel: number; // 0-5
  lastVerifiedAt?: Date;
  verifiedBy?: string;

  // Metadata
  metadata: Record<string, unknown>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

// CI Score
export interface CIScore {
  id: string;
  corpId: string;
  score: number; // 0-1000
  tier: CIScoreTier;
  breakdown: CIScoreBreakdown;
  factors: CIScoreFactor[];
  calculatedAt: Date;
  validUntil: Date;
}

export interface CIScoreBreakdown {
  identity: number;      // 0-150
  employment: number;     // 0-200
  skills: number;         // 0-150
  reputation: number;     // 0-250
  compliance: number;    // 0-100
  references: number;    // 0-150
  total: number;          // 0-1000
}

export interface CIScoreFactor {
  name: string;
  category: keyof CIScoreBreakdown;
  weight: number;
  baseScore: number;
  modifiers: CIScoreModifier[];
  finalScore: number;
}

export interface CIScoreModifier {
  type: string;
  value: number;
  reason: string;
}

export interface CIScoreHistory {
  id: string;
  corpId: string;
  score: number;
  tier: CIScoreTier;
  breakdown: CIScoreBreakdown;
  changedAt: Date;
  reason: string;
}

// Verification
export interface VerificationRequest {
  id: string;
  corpId: string;
  type: 'IDENTITY' | 'BUSINESS' | 'EMPLOYMENT' | 'EDUCATION' | 'LICENSE' | 'REFERENCE';
  status: VerificationStatus;
  documents: DocumentReference[];
  references?: Reference[];
  verificationSteps: VerificationStep[];
  initiatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface VerificationStep {
  step: string;
  status: VerificationStatus;
  completedAt?: Date;
  result?: string;
  error?: string;
}

export interface DocumentReference {
  documentId: string;
  type: DocumentType;
  status: VerificationStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface Reference {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  company?: string;
  verified: boolean;
  rating?: number;
  comment?: string;
  verifiedAt?: Date;
}

// Passport
export interface CareerPassport {
  id: string;
  corpId: string;
  ownerName: string;
  summary: string;

  employment: EmploymentRecord[];
  education: EducationRecord[];
  skills: Skill[];
  certifications: Certification[];
  achievements: Achievement[];
  projects: Project[];

  createdAt: Date;
  updatedAt: Date;
  lastSharedAt?: Date;
}

export interface EmploymentRecord {
  id: string;
  companyName: string;
  companyCorpId?: string;
  title: string;
  department?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  verified: boolean;
  verifiedBy?: string;
}

export interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  verified: boolean;
  verifiedBy?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  endorsements: number;
  verified: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verified: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  awardedAt: Date;
  awardedBy?: string;
  verified: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  url?: string;
  verified: boolean;
}

export interface BusinessPassport {
  id: string;
  corpId: string;
  businessName: string;
  tagline?: string;
  summary: string;

  registration: BusinessRegistration;
  operations: BusinessOperation[];
  financials: FinancialRecord[];
  certifications: BusinessCertification[];
  clients: ClientReference[];
  awards: Award[];

  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessRegistration {
  registrationNumber: string;
  registrationType: string;
  dateOfIncorporation: Date;
  registeredAddress: Address;
  pan: string;
  gstin?: string;
 cin?: string;
}

export interface BusinessOperation {
  id: string;
  businessType: string;
  description: string;
  locations: string[];
  employeeCount?: number;
  verified: boolean;
}

export interface FinancialRecord {
  id: string;
  year: number;
  revenue?: number;
  profit?: number;
  verified: boolean;
}

export interface BusinessCertification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  verified: boolean;
}

export interface ClientReference {
  id: string;
  clientName: string;
  clientCorpId?: string;
  contactName?: string;
  contactEmail?: string;
  relationship: string;
  verified: boolean;
  rating?: number;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  year: number;
  verified: boolean;
}

export interface TrustWallet {
  id: string;
  corpId: string;
  badges: Badge[];
  endorsements: Endorsement[];
  stamps: TrustStamp[];
  certificates: TrustCertificate[];

  updatedAt: Date;
}

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  issuedAt: Date;
  issuer?: string;
  expiresAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

export interface Endorsement {
  id: string;
  fromCorpId: string;
  fromName: string;
  skill: string;
  comment?: string;
  rating: number;
  issuedAt: Date;
  revoked: boolean;
}

export interface TrustStamp {
  id: string;
  type: string;
  description: string;
  issuedAt: Date;
  validUntil?: Date;
  issuedBy: string;
}

export interface TrustCertificate {
  id: string;
  title: string;
  description: string;
  issuedAt: Date;
  validUntil?: Date;
  issuedBy: string;
  documentId?: string;
}

// Trust Graph
export interface TrustRelationship {
  id: string;
  fromCorpId: string;
  toCorpId: string;
  type: RelationshipType;
  metadata: Record<string, unknown>;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

// CorpID v2.0: Agent Identity
export interface AgentIdentity {
  id: string;
  corpId: string;                    // CI-AGT-XXXXX
  entityType: 'AGENT';
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  createdAt: Date;
  updatedAt: Date;

  // Agent Info
  name: string;
  description?: string;
  version?: string;

  // Classification
  agentType: AgentType;

  // Capabilities
  capabilities: AgentCapability[];

  // Tools
  tools: AgentTool[];

  // Permissions
  permissions?: {
    dataAccess?: string[];
    actionAccess?: string[];
    escalationRules?: string[];
  };

  // Costs
  costProfile?: {
    perInvocation?: number;
    perTokenInput?: number;
    perTokenOutput?: number;
    monthlyBudget?: number;
  };

  // Performance
  performance?: {
    accuracyRate?: number;
    avgResponseTime?: number;
    uptimePercent?: number;
    errorRate?: number;
    totalInvocations?: number;
    lastInvokedAt?: Date;
  };

  // Owner
  ownerId?: string;

  // Trust
  trustScore?: number;
  humanRatings?: {
    count: number;
    average: number;
  };

  // Metadata
  metadata: Record<string, unknown>;
}

export interface AgentCapability {
  name: string;
  description?: string;
  inputTypes?: string[];
  outputTypes?: string[];
}

export interface AgentTool {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// CorpID v2.0: Assertion
export interface Assertion {
  id: string;
  corpId: string;
  predicate: string;
  value: unknown;
  source: AssertionSource;
  confidence: number;
  evidenceRefs?: string[];
  validFrom: Date;
  validUntil?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface EvidenceRef {
  id: string;
  assertionId: string;
  memoryEventId: string;
  weight: number;
  createdAt: Date;
}

// CorpID v2.0: Extended Relationship
export interface RelationshipV2 {
  id: string;
  fromCorpId: string;
  toCorpId: string;
  type: RelationshipType;
  properties?: {
    weight?: number;
    verified?: boolean;
    since?: Date;
    until?: Date;
    authority?: string;
  };
  source?: 'SELF_DECLARED' | 'SYSTEM_INFERRED' | 'MANUAL_APPROVED';
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
}

// CorpID v2.0: Employee Link
export interface EmployeeLink {
  employeeId: string;
  corpId: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  designation?: string;
  managerCorpId?: string;
  linkedAt: Date;
  metadata: Record<string, unknown>;
}

export interface GraphQuery {
  corpId: string;
  depth?: number;
  types?: RelationshipType[];
  direction?: 'OUTGOING' | 'INCOMING' | 'BOTH';
}

// Risk & Monitoring
export interface RiskAssessment {
  id: string;
  corpId: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
  assessedAt: Date;
  validUntil: Date;
}

export interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  indicators: RiskIndicator[];
}

export interface RiskIndicator {
  name: string;
  value: string | number;
  risk: RiskLevel;
  description: string;
}

export interface MonitoringAlert {
  id: string;
  corpId: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface MonitoringSubscription {
  id: string;
  corpId: string;
  entityCorpId: string;
  alertTypes: string[];
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWebhook: boolean;
  webhookUrl?: string;
  active: boolean;
  createdAt: Date;
}

// Document
export interface SecureDocument {
  id: string;
  corpId: string;
  type: DocumentType;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  encryptedKey?: string;
  storageUrl?: string;
  hash: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: VerificationStatus;
  expiryDate?: Date;
  metadata: Record<string, unknown>;
}

// Partner & Integration
export interface Partner {
  id: string;
  name: string;
  code: string;
  type: 'INTERNAL' | 'EXTERNAL';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  apiKey?: string;
  permissions: string[];
  integrations: Integration[];
  usage: PartnerUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  partnerId: string;
  service: string;
  endpoint: string;
  authType: 'API_KEY' | 'OAUTH' | 'JWT';
  status: 'ACTIVE' | 'INACTIVE';
  lastUsedAt?: Date;
  usageCount: number;
  errorCount: number;
}

export interface PartnerUsage {
  requestsThisMonth: number;
  requestsLimit: number;
  errorsThisMonth: number;
  resetsAt: Date;
}

// Webhook
export interface Webhook {
  id: string;
  corpId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  attemptedAt: Date;
  deliveredAt?: Date;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  responseCode?: number;
  error?: string;
}

// Notification
export interface Notification {
  id: string;
  corpId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
}

// Admin & Audit
export interface AuditLog {
  id: string;
  actorCorpId: string;
  actorType: 'USER' | 'SERVICE' | 'SYSTEM';
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AdminStats {
  totalIdentities: number;
  totalVerified: number;
  pendingVerifications: number;
  averageCIScore: number;
  topScore: number;
  riskAlerts: number;
  documentsProcessed: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, string | string[]>;
}
