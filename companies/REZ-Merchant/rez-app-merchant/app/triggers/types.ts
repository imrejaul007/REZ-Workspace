/**
 * Trigger Engine Types
 *
 * Types for the trigger rule engine system.
 * Defines conditions, actions, and rule management types.
 */

// Trigger Rule Types
export type TriggerType = 'inactivity' | 'location' | 'birthday' | 'first_visit' | 'loyalty_milestone' | 'custom';

export type TriggerStatus = 'active' | 'inactive' | 'draft';

export type ActionType = 'push' | 'sms' | 'email' | 'in_app';

export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';

// Condition Types
export interface BaseCondition {
  id: string;
  type: string;
  operator: ConditionOperator;
  value: string | number | boolean;
  valueEnd?: string | number; // For 'between' operator
}

export interface InactivityCondition extends BaseCondition {
  type: 'inactivity';
  days: number;
}

export interface LocationCondition extends BaseCondition {
  type: 'location';
  locationType: 'enter' | 'exit' | 'nearby';
  latitude: number;
  longitude: number;
  radius: number; // in meters
  storeId?: string;
}

export interface BirthdayCondition extends BaseCondition {
  type: 'birthday';
  daysBefore: number;
  daysAfter: number;
}

export interface LoyaltyCondition extends BaseCondition {
  type: 'loyalty';
  milestoneType: 'points' | 'visits' | 'spending';
  milestoneValue: number;
}

export interface FirstVisitCondition extends BaseCondition {
  type: 'first_visit';
  withinDays: number;
}

export interface CustomCondition extends BaseCondition {
  type: 'custom';
  eventName: string;
  propertyName?: string;
}

export type TriggerCondition =
  | InactivityCondition
  | LocationCondition
  | BirthdayCondition
  | LoyaltyCondition
  | FirstVisitCondition
  | CustomCondition;

// Action Types
export interface PushAction {
  id: string;
  type: 'push';
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  deepLink?: string;
}

export interface SmsAction {
  id: string;
  type: 'sms';
  templateId?: string;
  message: string;
  senderId?: string;
}

export interface EmailAction {
  id: string;
  type: 'email';
  templateId?: string;
  subject: string;
  body: string;
  fromName?: string;
}

export interface InAppAction {
  id: string;
  type: 'in_app';
  title: string;
  message: string;
  actionUrl?: string;
  dismissible: boolean;
  duration?: number; // in seconds
}

export type TriggerAction = PushAction | SmsAction | EmailAction | InAppAction;

// Rule Configuration
export interface TriggerRule {
  id: string;
  name: string;
  description?: string;
  type: TriggerType;
  status: TriggerStatus;
  conditions: TriggerCondition[];
  conditionLogic: 'and' | 'or';
  actions: TriggerAction[];
  priority: number;
  startDate?: string;
  endDate?: string;
  maxExecutions?: number;
  executionCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
  storeId?: string;
  tags?: string[];
  analytics?: TriggerAnalytics;
}

export interface TriggerAnalytics {
  totalTriggers: number;
  successfulExecutions: number;
  failedExecutions: number;
  last30Days: number;
  conversionRate?: number;
}

// Trigger Event Log
export interface TriggeredEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleType: TriggerType;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  conditionsMatched: string[];
  actionsExecuted: ActionType[];
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  triggeredAt: string;
  executionDuration?: number; // in milliseconds
}

// API Response Types
export interface TriggerRulesResponse {
  rules: TriggerRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TriggeredEventsResponse {
  events: TriggeredEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types for Creating/Editing Rules
export interface CreateRuleData {
  name: string;
  description?: string;
  type: TriggerType;
  status: TriggerStatus;
  conditions: TriggerCondition[];
  conditionLogic: 'and' | 'or';
  actions: TriggerAction[];
  priority: number;
  startDate?: string;
  endDate?: string;
  maxExecutions?: number;
  tags?: string[];
  storeId?: string;
}

export interface UpdateRuleData extends Partial<CreateRuleData> {
  id: string;
}

// Filter Types
export interface TriggerFilters {
  type?: TriggerType;
  status?: TriggerStatus;
  search?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Stats Types
export interface TriggerStats {
  totalRules: number;
  activeRules: number;
  totalTriggers: number;
  triggersLast30Days: number;
  topPerformingRule?: TriggerRule;
  averageConversionRate: number;
}
