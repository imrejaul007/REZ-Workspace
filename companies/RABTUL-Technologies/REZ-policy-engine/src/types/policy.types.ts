// Policy Types for REZ Policy Engine

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum PolicyType {
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  DATA_GOVERNANCE = 'DATA_GOVERNANCE',
  COMPLIANCE = 'COMPLIANCE',
  SECURITY = 'SECURITY',
  BUSINESS_RULE = 'BUSINESS_RULE'
}

export enum OverrideLevel {
  NONE = 'NONE',
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  PENDING_AUDIT = 'PENDING_AUDIT',
  EXEMPT = 'EXEMPT'
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | boolean | string[] | number[];
}

export interface PolicyEffect {
  allow: boolean;
  conditions?: PolicyCondition[];
  priority?: number;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  effect: PolicyEffect;
  resource?: string;
  action?: string;
  subject?: string;
  overrides: OverrideLevel;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ValidationRequest {
  resource: string;
  action: string;
  subject: string;
  context?: Record<string, unknown>;
  policyIds?: string[];
}

export interface ValidationResult {
  valid: boolean;
  allowed: boolean;
  policiesEvaluated: string[];
  reason?: string;
  errors?: string[];
  timestamp: Date;
}

export interface OverrideRequest {
  policyId: string;
  level: OverrideLevel;
  reason: string;
  userId: string;
  expiresAt?: Date;
}

export interface OverrideResult {
  success: boolean;
  overrideId: string;
  policyId: string;
  appliedAt: Date;
  expiresAt?: Date;
  reason: string;
}

export interface ComplianceCheck {
  policyId: string;
  status: ComplianceStatus;
  checkedAt: Date;
  findings?: ComplianceFinding[];
  recommendations?: string[];
}

export interface ComplianceFinding {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  regulation?: string;
  remediation?: string;
}

export interface ComplianceReport {
  overallStatus: ComplianceStatus;
  checkedPolicies: number;
  compliantPolicies: number;
  nonCompliantPolicies: number;
  checks: ComplianceCheck[];
  generatedAt: Date;
  summary?: string;
}

export interface PolicyEvaluationContext {
  resource: string;
  action: string;
  subject: string;
  environment?: Record<string, unknown>;
  timeConstraints?: {
    start?: Date;
    end?: Date;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}
