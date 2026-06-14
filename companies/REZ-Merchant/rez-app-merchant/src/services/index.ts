/**
 * Services Index - Export all services
 * REZ Merchant App
 */

// Core
export * from './unifiedApi';
export * from './errors';

// Business
export * from './merchant.service';
export * from './merchantHealth.service';
export * from './merchantCopilotService';
export * from './orderService';
export * from './customerService';

// Industry
export * from './hotelService';
export * from './dineInService';
export * from './appointmentsService';
export * from './subscriptionService';

// Operations
export * from './inventoryService';
export * from './staffService';
export * from './qrCodeService';

// Marketing
export * from './marketingService';
export * from './adService';
export * from './loyaltyService';

// Infrastructure
export * from './reportService';
export * from './notificationService';
export * from './analyticsService';
export * from './automationService';

// Re-export automation service instance
export { automationService } from './automationService';
export { notificationService } from './notificationService';

// Utilities
export * from './websocketManager';
export * from './offlineService';
export * from './imageUploadService';
