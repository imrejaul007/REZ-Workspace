/**
 * Services barrel export
 */

// Event Analytics Service
export {
  EventAnalyticsService,
  getEventAnalyticsService,
  eventAnalyticsService,
  type EventReport,
} from './eventAnalyticsService';

// Smart Inventory Service
export {
  SmartInventoryService,
  createSmartInventoryService,
} from './smartInventory';

export type {
  InventoryItem,
  ReorderSuggestion,
  ExpiryAlert,
  WasteEntry,
  WasteAnalytics,
  InventoryForecast,
  StockMovement,
  InventorySummary,
} from './smartInventory';

// Delivery Tracking Service
export {
  DeliveryTrackingService,
  getDeliveryTrackingService,
} from './deliveryTrackingService';
export type { DeliveryInput, Location } from './deliveryTrackingService';

// Menu Cache Optimizer (existing service)
export {
  getMenuFast,
  fetchMenuData,
  invalidateMenuCache,
  preloadPopularMenus,
  getMenuCacheStats,
  type MenuCacheData,
  type MenuCategory,
  type MenuProduct,
} from './menuCacheOptimizer';

// Waitlist Service
export {
  WaitlistService,
  createWaitlistService,
  type WaitlistInput,
} from './waitlistService';

// Split Bill Service
export {
  SplitBillService,
  createSplitBillService,
  type SplitInput,
  type FairSplitResult,
  type ValidationResult,
} from './splitBillService';

// Prescription Service
export {
  PrescriptionService,
  prescriptionService,
  type PrescriptionInput,
  type MedicineInput,
} from './prescriptionService';

// Commission Tracking Service
export {
  CommissionService,
  default as commissionService,
  type CommissionReport,
} from './commissionService';

// Housekeeping Service
export {
  HousekeepingService,
  createHousekeepingService,
  type TaskInput,
  type HousekeepingReport,
} from './housekeepingService';

// Client History Service
export {
  ClientHistoryService,
  createClientHistoryService,
  type VisitInput,
  type PreferencesInput,
} from './clientHistoryService';

// Nutrition Service
export {
  NutritionService,
  nutritionService,
  type NutritionInput,
  type MealInput,
} from './nutritionService';

// Salon Inventory Service
export {
  SalonInventoryService,
  getSalonInventoryService,
  createSalonInventoryService,
} from './salonInventoryService';
export type { ProductInput, UsageRecord } from './salonInventoryService';

// Telemedicine Service
export {
  TelemedicineService,
  telemedicineService,
  type SessionInput,
  type TelemedicineSessionLean,
} from './telemedicineService';

// Concierge Service
export {
  ConciergeService,
  createConciergeService,
  conciergeService,
  type ConciergeInput,
} from './conciergeService';

// Lab Service
export {
  LabService,
  labService,
  type TestInput,
  type ResultInput,
  type LabOrderInput,
  type LabOrderLean,
  type LabPartner,
} from './labService';

// Credit Line Service
export {
  creditLineService,
  CreditLineService,
  type CreateCreditLineInput,
  type CreditAvailabilityResult,
  type PaymentAllocation,
  type PaymentAllocationResult,
  type InterestCalculationResult,
  type AgingReportEntry,
  type AgingReport,
  type SupplierStatement,
} from './creditLineService';

// CheckInOut Service
export {
  CheckInOutService,
  createCheckInOutService,
} from './checkInOutService';

// Export Service
export {
  ExportService,
  exportService,
  type ExportOptions,
  type ExportResult,
  type ExportType,
  type ExportFormat,
  type TransactionRecord,
  type InventoryRecord,
  type LedgerRecord,
  type GSTR1Data,
  type GSTR1Summary,
  type B2BInvoice,
  type B2CLInvoice,
  type B2CSData,
} from './exportService';

// ── Salon Services ──────────────────────────────────────────────────────────────

// Salon Customer 360 Service
export {
  SalonCustomer360Service,
  salonCustomer360Service,
  type StylistPreference,
  type ServiceHistory,
  type TreatmentReaction,
  type HairSkinProfile,
  type ProductRecommendation,
  type SalonCustomer360,
} from './salonCustomer360';

// Salon AI Service
export {
  SalonAIService,
  salonAIService,
  type StylistMatch,
  type ServiceRecommendation,
  type AppointmentSlot,
  type ServiceDurationPrediction,
} from './salonAIService';

// Salon Export Service
export {
  SalonExportService,
  salonExportService,
  type SalonServiceRecord,
  type StylistCommissionRecord,
  type SalonInventoryExport,
  type BeautyServiceGSTCategory,
} from './salonExport';

// ── Healthcare Services ───────────────────────────────────────────────────────────

// Healthcare Inventory Service
export {
  HealthcareInventoryService,
  createHealthcareInventoryService,
  type MedicineBatch,
  type MedicineTracking,
  type EquipmentTracking,
  type HealthcareReorderSuggestion,
  type HealthcareExpiryAlert,
} from './healthcareInventory';

// Healthcare Customer 360 Service
export {
  HealthcareCustomerService,
  healthcareCustomerService,
  type Allergy,
  type ChronicCondition,
  type MedicationHistory,
  type AppointmentRecord,
  type VitalRecord,
  type MedicalProfile,
  type PatientHistory,
  type HealthcareCustomer360,
} from './healthcareCustomer360';

// Healthcare AI Service
export {
  HealthcareAIService,
  healthcareAIService,
  type SymptomInput,
  type DiagnosisSuggestion,
  type RiskAssessment,
  type AppointmentSlot,
  type AppointmentOptimization,
} from './healthcareAI';

// Healthcare Export Service
export {
  HealthcareExportService,
  createHealthcareExportService,
  type PatientReport,
  type InventoryAuditRecord,
  type InventoryAudit,
  type ComplianceReport,
  type InsuranceClaim,
  type InsuranceExport,
} from './healthcareExport';
