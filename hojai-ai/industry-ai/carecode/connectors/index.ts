/**
 * CareCode Connectors Index
 * Healthcare Practice Management System
 */

export { default as MerchantOSConnector } from './merchant-os';
export { default as HOJAIConnector } from './hojai-core';

export type {
  MerchantOSConfig,
  PatientProfile,
  AppointmentRequest,
  PrescriptionRecord,
  BillingRecord
} from './merchant-os';

export type {
  HOJAIConfig,
  IntentResult,
  MedicalContext,
  SymptomAnalysis,
  HealthRiskScore
} from './hojai-core';