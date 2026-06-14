// =============================================================================
// CorpPerks Workforce Intelligence - Type Definitions
// =============================================================================

/**
 * Trust levels for employee risk assessment
 */
export type TrustLevel = 'trusted' | 'monitored' | 'elevated' | 'critical';

/**
 * Categories of risk factors
 */
export type RiskCategory = 'behavioral' | 'technical' | 'organizational' | 'access' | 'compliance';

/**
 * Severity levels for risk factors
 */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of exit monitoring
 */
export type ExitMonitoringStatus = 'inactive' | 'pre_notice' | 'notice_period' | 'enhanced_monitoring' | 'completed';

/**
 * Status of HIB sync operations
 */
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'stale';

/**
 * Risk factor affecting employee trust score
 */
export interface RiskFactor {
  id: string;
  category: RiskCategory;
  name: string;
  description: string;
  severity: RiskSeverity;
  weight: number; // Impact on trust score (0-100)
  detectedAt: string;
  source: string;
  evidence: RiskEvidence[];
  resolved: boolean;
  resolvedAt?: string;
}

/**
 * Evidence supporting a risk factor
 */
export interface RiskEvidence {
  id: string;
  type: 'behavioral' | 'system' | 'document' | 'communication' | 'attendance';
  description: string;
  timestamp: string;
  source: string;
  metadata: Record<string, unknown>;
}

/**
 * Employee trust score and risk profile
 */
export interface EmployeeTrustScore {
  employeeId: string;
  employeeName: string;
  department: string;
  trustLevel: TrustLevel;
  trustScore: number; // 0-100
  riskFactors: RiskFactor[];
  lastAssessment: string;
  nextAssessment: string;
  assessmentHistory: AssessmentRecord[];
  monitoringStatus: ExitMonitoringStatus;
  hibSyncStatus: SyncStatus;
  lastHibSync?: string;
}

/**
 * Record of a trust assessment
 */
export interface AssessmentRecord {
  id: string;
  date: string;
  score: number;
  trustLevel: TrustLevel;
  factors: string[]; // Risk factor IDs
  assessor: string;
  notes: string;
}

/**
 * Insider risk configuration
 */
export interface InsiderRiskConfig {
  enabled: boolean;
  autoMonitorOnNotice: boolean;
  monitoringDays: number; // Days before/after exit
  alertThreshold: number; // Trust score below which to alert
  syncIntervalMinutes: number;
  hibGatewayUrl: string;
  riskWeights: RiskWeights;
}

/**
 * Weights for different risk categories
 */
export interface RiskWeights {
  behavioral: number;
  technical: number;
  organizational: number;
  access: number;
  compliance: number;
}

/**
 * Signal detected from employee activity
 */
export interface RiskSignal {
  id: string;
  employeeId: string;
  category: RiskCategory;
  type: string;
  description: string;
  severity: RiskSeverity;
  detectedAt: string;
  source: string;
  data: Record<string, unknown>;
  processed: boolean;
}

/**
 * Exit monitoring details
 */
export interface ExitMonitoring {
  employeeId: string;
  status: ExitMonitoringStatus;
  noticeDate?: string;
  lastWorkingDate?: string;
  monitoringStartDate: string;
  monitoringEndDate?: string;
  enhancedMonitoring: boolean;
  riskAssessment?: ExitRiskAssessment;
  clearanceChecklist?: ClearanceItem[];
  evidence: ExitEvidence[];
}

/**
 * Exit risk assessment
 */
export interface ExitRiskAssessment {
  id: string;
  employeeId: string;
  assessmentDate: string;
  overallRisk: RiskSeverity;
  riskScore: number;
  factors: ExitRiskFactor[];
  recommendations: string[];
  assessor: string;
}

/**
 * Risk factor specific to exit
 */
export interface ExitRiskFactor {
  category: string;
  description: string;
  risk: RiskSeverity;
  evidence: string;
}

/**
 * Item in the exit clearance checklist
 */
export interface ClearanceItem {
  id: string;
  category: 'asset' | 'access' | 'document' | 'financial' | 'compliance';
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

/**
 * Evidence for exit monitoring
 */
export interface ExitEvidence {
  id: string;
  type: 'access_log' | 'file_activity' | 'email' | 'communication' | 'system_event';
  description: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
}

/**
 * Performance metrics for risk assessment
 */
export interface PerformanceMetrics {
  employeeId: string;
  period: string;
  performanceScore: number; // 0-100
  attendanceRate: number; // 0-100
  policyComplianceScore: number; // 0-100
  projectOutcomes: ProjectOutcome[];
  managerFeedback: ManagerFeedback[];
  incidents: Incident[];
}

/**
 * Project outcome data
 */
export interface ProjectOutcome {
  projectId: string;
  name: string;
  status: 'completed' | 'in_progress' | 'delayed' | 'failed';
  score: number;
  endDate?: string;
}

/**
 * Manager feedback
 */
export interface ManagerFeedback {
  id: string;
  managerId: string;
  managerName: string;
  date: string;
  rating: number; // 1-5
  category: 'performance' | 'behavior' | 'compliance' | 'teamwork';
  comments: string;
  flags: string[];
}

/**
 * Incident record
 */
export interface Incident {
  id: string;
  date: string;
  type: 'policy_violation' | 'security_breach' | 'performance_issue' | 'attendance_violation';
  severity: RiskSeverity;
  description: string;
  resolved: boolean;
  resolvedAt?: string;
}

/**
 * HIB sync payload
 */
export interface HibSyncPayload {
  operation: 'create' | 'update' | 'delete';
  entityType: 'employee' | 'exit' | 'risk';
  employeeId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * HIB workforce intelligence response
 */
export interface HibResponse {
  success: boolean;
  riskScore?: number;
  trustLevel?: TrustLevel;
  recommendations?: string[];
  alerts?: HibAlert[];
  error?: string;
}

/**
 * Alert from HIB
 */
export interface HibAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  action: string;
  timestamp: string;
}

/**
 * API request/response types
 */
export interface CalculateTrustScoreRequest {
  employeeId: string;
  includeHistory?: boolean;
}

export interface CalculateTrustScoreResponse {
  success: boolean;
  trustScore: EmployeeTrustScore;
}

export interface GetRiskProfileResponse {
  success: boolean;
  profile: EmployeeTrustScore;
  signals: RiskSignal[];
  metrics?: PerformanceMetrics;
}

export interface EnhanceMonitoringRequest {
  employeeId: string;
  reason: string;
  duration: number; // days
  level: 'standard' | 'enhanced' | 'critical';
}

export interface HighRiskEmployeesResponse {
  success: boolean;
  employees: EmployeeTrustScore[];
  total: number;
  lastUpdated: string;
}

export interface SyncHibRequest {
  employeeIds?: string[]; // If empty, sync all
  forceResync?: boolean;
}

export interface SyncHibResponse {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}