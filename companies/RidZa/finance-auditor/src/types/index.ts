/**
 * Type definitions for Finance Auditor
 */

export interface Transaction {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  type: 'payment' | 'transfer' | 'refund';
  metadata?: Record<string, unknown>;
}

export interface FraudDetectionResult {
  alertId: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  matchedInvoiceId?: string;
  matchReasons: string[];
}

export interface RiskAssessment {
  tenantId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessment: Date;
}

export interface RiskFactor {
  category: string;
  score: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AuditAlert {
  alertId: string;
  tenantId: string;
  type: 'fraud' | 'duplicate' | 'anomaly' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  amount?: number;
  transactionId?: string;
  createdAt: Date;
  acknowledged: boolean;
}

export interface AuditReport {
  reportId: string;
  tenantId: string;
  type: 'internal' | 'external' | 'compliance' | 'fraud-investigation';
  findings: string[];
  risk: 'low' | 'medium' | 'high' | 'critical';
  date: Date;
  transactionsAnalyzed: number;
  alertsGenerated: number;
}

export interface Invoice {
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  vendorId: string;
  date: Date;
  lineItems: LineItem[];
  hash: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AuthenticatedRequest {
  tenantId: string;
  userId: string;
  roles: string[];
}