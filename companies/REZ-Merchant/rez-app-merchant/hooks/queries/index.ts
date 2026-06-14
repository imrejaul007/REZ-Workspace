/**
 * Query Hooks Index
 * Central export point for all React Query hooks
 */

// Query key factory
export * from './queryKeys';

// Dashboard queries
export {
  useDashboard,
  useDashboardMetrics,
  useRecentActivity,
  useTopProducts,
  useSalesData,
  useLowStockAlerts,
  useDashboardData,
  useCustomerPayments,
  useStorePerformance as useDashboardStorePerformance,
  useActionItems,
  useTodayRevenue,
  useTopItemsToday,
  useCampaignPerformance,
  useCustomerRetention,
  useBasketSizeTrend,
} from './useDashboard';

// Product queries
export {
  useProducts,
  useInfiniteProducts,
  useProduct,
  useProductCategories,
  useSearchProducts,
  useProductsByCategory,
  useLowStockProducts,
  useProductStock,
} from './useProducts';

// Order queries
export {
  useOrders,
  useInfiniteOrders,
  useOrder,
  usePendingOrders,
  useCompletedOrders,
  useCancelledOrders,
  useOrdersByStatus,
  useOrderAnalytics,
  useOrdersOverview,
} from './useOrders';

// Cashback queries
export {
  useCashback,
  useCashbackDetail,
  usePendingCashback,
  usePaidCashback,
  useCashbackRequests,
  useCashbackAnalytics,
  useCashbackOverview,
} from './useCashback';

// Notification queries
export {
  useNotifications,
  useInfiniteNotifications,
  useNotification,
  useUnreadCount,
  useNotificationPreferences,
  useNotificationStats,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteNotifications,
  useUpdateNotificationPreferences,
  useClearAllNotifications,
  useNotificationsByType,
  useUnreadNotifications,
} from './useNotifications';

// Store queries
export { useStores, useActiveStores, useStore, useStorePerformance } from './useStores';

// Team queries
export {
  useTeamMembers,
  useTeamMember,
  useMyPermissions,
  useTeamRoles,
  useTeamPayroll,
} from './useTeam';

// Wallet queries
export {
  useWalletBalance,
  useWalletTransactions,
  useWalletStats,
  useWalletWithdrawals,
  useWalletBankDetails,
} from './useWallet';

// Fraud queries
export { useFraudAlerts, useFraudAlertDetail, useFraudStatus } from './useFraud';

// Feature flag queries
export { useFeatureFlags, useFeatureFlag } from './useFeatureFlags';

// Audit Log queries
export {
  useAuditLogs,
  useInfiniteAuditLogs,
  useResourceHistory,
  useActivityTimeline,
  useTodayActivities,
  useRecentActivities,
  useActivitySummary,
  useCriticalActivities,
  useActivityHeatmap,
  useSearchAuditLogs,
  useAuditStatistics,
  useUserActivity,
  useExportAuditLogs,
  useComplianceReport,
  useRetentionStatistics,
  useArchivedLogs,
  useActionOptions,
  useResourceTypeOptions,
  useSeverityOptions,
  useFormatAuditLog,
} from './useAudit';
