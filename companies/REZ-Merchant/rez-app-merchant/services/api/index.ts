/**
 * API Services Barrel Export
 *
 * Re-exports apiClient from client.ts and all service modules.
 * Services import apiClient from './client' directly to avoid circular imports.
 */

// Core client + types
export { apiClient, default } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

// All API services
export * from './auth';
export * from './products';
export * from './orders';
export * from './cashback';
export * from './uploads';
export * from './onboarding';
export * from './dashboard';
export * from './analytics';
export * from './audit';
export * from './notifications';
export * from './documents';
export * from './sync';
export * from './profile';
export * from './reviews';
export * from './stores';
export * from './offers';
export * from './discounts';
export * from './storeVouchers';
export * from './outlets';
export * from './promotionalVideos';
export * from './socialMedia';
export * from './events';
// socialImpact has conflicting exports (CreateEventData, UpdateEventData, Pagination) with events.ts
export { socialImpactAdminService } from './socialImpact';
export type {
  Sponsor,
  SocialImpactEvent,
  Participant,
  EventFilters as SocialImpactEventFilters,
} from './socialImpact';
// services.ts has conflicting exports (Pagination, PaymentStatus, CashbackStatus) with other modules
export { serviceManagementService } from './services';
export * from './coinDrops';
export * from './brandedCoins';
export * from './earningAnalytics';
export * from './bonusCampaigns';
export * from './pos';
export * from './payments';
export * from './wallet';
export * from './settlements';
export * from './team';
// tableBookings has conflicting Pagination export
export { tableBookingService } from './tableBookings';
export * from './appointments';
export * from './priveCampaigns';
export * from './hotelOta';
export * from './hubSync';
export * from './qrHub';
export * from './copilotInsights';
export * from './copilotOrderIntegration';
export * from './tallyExport';
export * from './channels';
// Catalog service - real backend integration with retry logic
export { catalogService, default } from './catalogService';
export type {
  CatalogProduct,
  CatalogCategory,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  CategoryListResponse,
  InventoryUpdate,
  UploadedImage,
} from './catalogService';
