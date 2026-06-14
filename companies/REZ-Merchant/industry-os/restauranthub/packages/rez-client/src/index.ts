// Public API surface for @restopapa/rez-client

export { RezClientModule } from './rez-client.module';
export { RezHttpClient } from './rez-http.client';

// Service clients
export { RezMerchantClient } from './clients/merchant.client';
export { RezAnalyticsClient } from './clients/analytics.client';
export { RezCatalogClient } from './clients/catalog.client';
export { RezWalletClient } from './clients/wallet.client';

// All TypeScript types
export type {
  // Merchant
  RezMerchant,
  RezMerchantStats,
  RezStore,
  // Purchase orders
  RezPurchaseOrder,
  RezPurchaseOrderItem,
  RezPurchaseOrderSummary,
  // Staff
  RezStaffShift,
  RezShiftGap,
  // Analytics
  RezAnalytics,
  RezTopProduct,
  RezDailyRevenue,
  RezRevenueMetrics,
  RezWeeklyRevenue,
  RezFoodCostMetrics,
  RezCostCategory,
  // Catalog
  RezProduct,
  RezCategory,
  RezSupplier,
  // Wallet
  RezWalletBalance,
  RezTransaction,
  RezCreditScore,
  // Circuit breaker
  CircuitBreakerState,
  CircuitState,
} from './types/rez.types';
