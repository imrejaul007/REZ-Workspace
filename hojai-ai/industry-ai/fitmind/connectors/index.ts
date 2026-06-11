/**
 * FitMind Connectors Index
 * Fitness and Wellness Platform
 */

export { default as MerchantOSConnector } from './merchant-os';
export { default as HOJAIConnector } from './hojai-core';

export type {
  MerchantOSConfig,
  MemberProfile,
  WorkoutPlan,
  AttendanceRecord,
  BillingRecord
} from './merchant-os';

export type {
  HOJAIConfig,
  IntentResult,
  FitnessContext,
  WorkoutRecommendation,
  NutritionRecommendation,
  ProgressAnalysis
} from './hojai-core';