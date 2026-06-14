// CorpPerks Intelligence - Type Definitions

export interface DecisionCard {
  id: string;
  type: DecisionCardType;
  title: string;
  description: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'attrition' | 'attendance' | 'productivity' | 'finance' | 'engagement' | 'compliance';
  data: Record<string, any>;
  actions: DecisionAction[];
  createdAt: Date;
  expiresAt?: Date;
  tenantId: string;
}

export type DecisionCardType =
  | 'attrition_risk'
  | 'attendance_anomaly'
  | 'productivity_decline'
  | 'overtime_surge'
  | 'hiring_needed'
  | 'engagement_drop'
  | 'budget_alert'
  | 'compliance_warning'
  | 'succession_needed'
  | 'team_health';

export interface DecisionAction {
  label: string;
  action: 'navigate' | 'api_call' | 'dismiss' | 'snooze';
  params?: Record<string, any>;
  apiEndpoint?: string;
}

export interface CopilotQuery {
  query: string;
  context?: string;
  tenantId: string;
  userId: string;
  department?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CopilotResponse {
  answer: string;
  data?: Record<string, any>;
  sources: string[];
  confidence: number;
  suggestions: string[];
  visualizations?: Visualization[];
  actionItems?: ActionItem[];
}

export interface Visualization {
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  data: Record<string, any>;
}

export interface ActionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface WorkforceHealthScore {
  overall: number;
  components: {
    engagement: number;
    attendance: number;
    productivity: number;
    sentiment: number;
  };
  trends: {
    weekly: number;
    monthly: number;
  };
  riskIndicators: RiskIndicator[];
  healthiestDept: string;
  atRiskDept: string;
  tenantId: string;
  generatedAt: Date;
}

export interface RiskIndicator {
  indicator: string;
  severity: 'low' | 'medium' | 'high';
  department?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number; // percentage
  department?: string;
  employeeId?: string;
  actions: DecisionAction[];
  acknowledged: boolean;
  tenantId: string;
}

export type AnomalyType =
  | 'attendance_spike'
  | 'attrition_spike'
  | 'overtime_surge'
  | 'productivity_drop'
  | 'engagement_drop'
  | 'leave_spike'
  | 'late_arrivals'
  | 'cost_overrun';

export interface Forecast {
  id: string;
  type: ForecastType;
  metric: string;
  period: {
    start: Date;
    end: Date;
  };
  predictions: ForecastPrediction[];
  confidence: number;
  generatedAt: Date;
  tenantId: string;
}

export type ForecastType =
  | 'attrition'
  | 'headcount'
  | 'payroll'
  | 'productivity'
  | 'hiring_need'
  | 'cost';

export interface ForecastPrediction {
  date: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
}

export interface WorkforceForecast {
  attritionForecast: Forecast;
  headcountForecast: Forecast;
  payrollForecast: PayrollForecast;
  hiringBudget: HiringBudgetForecast;
  productivityTrend: ProductivityForecast;
  tenantId: string;
  generatedAt: Date;
}

export interface PayrollForecast {
  next30Days: number;
  next60Days: number;
  next90Days: number;
  confidence: number;
  breakdown: {
    salaries: number;
    overtime: number;
    benefits: number;
  };
}

export interface HiringBudgetForecast {
  planned: number;
  recommended: number;
  justification: string;
  rolesNeeded: RoleForecast[];
}

export interface RoleForecast {
  role: string;
  department: string;
  count: number;
  estimatedCost: number;
}

export interface ProductivityForecast {
  currentIndex: number;
  projected30Days: number;
  projected90Days: number;
  factors: {
    positive: string[];
    negative: string[];
  };
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}
