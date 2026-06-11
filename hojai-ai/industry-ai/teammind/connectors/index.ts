/**
 * TeamMind Connectors Index
 * HR and Team Management Platform
 */

export { default as MerchantOSConnector } from './merchant-os';
export { default as HOJAIConnector } from './hojai-core';

export type {
  MerchantOSConfig,
  EmployeeProfile,
  LeaveRequest,
  AttendanceRecord,
  PayrollRecord
} from './merchant-os';

export type {
  HOJAIConfig,
  IntentResult,
  HRContext,
  SentimentAnalysis,
  TeamHealthMetrics,
  PerformanceInsight
} from './hojai-core';