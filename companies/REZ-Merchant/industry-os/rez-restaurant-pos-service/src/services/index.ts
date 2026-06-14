// Existing services
export * from './BillingService';
export * from './PaymentService';
export * from './SplitBillService';
export * from './GstInvoiceService';

// KDS Integration
export {
  KDSIntegration,
  createKDSIntegration,
  type KDSOrder,
  type KDSOrderItem,
  type KDSStation,
  type KDSStats,
} from './KDSIntegration';

// Printer Service
export {
  PrinterService,
  printerService,
  type PrinterConfig,
  type PrintJob,
  type ReceiptData,
  type KOTData,
} from './PrinterService';

// Printer Config Manager
export {
  PrinterConfigManager,
  printerConfigManager,
  type PrinterNetworkConfig,
  type PrinterGroup,
  type PrinterType,
  type PrinterModel,
} from './PrinterConfigManager';

// Logger
export { default as logger } from './utils/logger';
