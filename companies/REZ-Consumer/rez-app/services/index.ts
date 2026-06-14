// @ts-nocheck
/**
 * SERVICES INDEX
 * Central export for all API services
 *
 * Organization:
 * - Core: apiClient, auth, identity
 * - Commerce: products, orders, cart, payments, wallet
 * - Engagement: notifications, push, ads
 * - Intelligence: intent, taste, care, feedback
 * - Marketing: journey, attribution, email
 * - Support: corporate, feature flags
 */

// Core Services
export { default as apiClient, type ApiResponse } from './apiClient';
export { default as authApi } from './authApi';
export { default as identityGraphApi } from './identityGraphApi';

// Commerce Services
export { default as productsApi } from './productsApi';
export { default as storesApi } from './storesApi';
export { default as cartApi } from './cartApi';
export { default as checkoutApi } from './checkoutApi';
export { default as orderApi } from './orderApi';
export { default as bookingApi, type BookingType } from './bookingApi';
export { default as unifiedBookingApi } from './unifiedBookingApi';
export { default as razorpayApi } from './razorpayApi';
export { default as walletApi } from './walletApi';

// Engagement Services
export { default as notificationsApi } from './notificationsApi';
export { default as pushNotificationService } from './pushNotificationService';
export { default as adsApi } from './adsApi';
export { default as referralApi } from './referralApi';

// Intelligence Services
export { default as intentGraphApi } from './intentGraphApi';
export { default as tasteProfileService } from './tasteProfileService';
export { default as careService } from './careService';
export { default as feedbackService } from './feedbackService';
export { default as socialImpactApi } from './socialImpactApi';

// Marketing & Lifecycle Services
export { default as journeyService } from './journeyService';
export { default as attributionService } from './attributionService';
export { default as emailService } from './emailService';
export { default as homepageDataService } from './homepageDataService';

// Support & Corporate Services
export { default as corporateService } from './corporateService';
export { default as featureFlagsService } from './featureFlagsService';
export { default as earningsApi } from './earningsApi';

// Game & Entertainment Services
export { default as gameApi } from './gameApi';
export { default as tournamentApi } from './tournamentApi';
export { default as leaderboardApi } from './leaderboardApi';

// Additional Services
export { default as searchApi } from './searchApi';
export { default as categoryApi } from './categoryApi';
export { default as offersApi } from './offersApi';
export { default as loyaltyApi } from './loyaltyApi';
export { default as engagementApi } from './engagementApi';
export { default as realTimeService } from './realTimeService';
export { default as socketService } from './socketService';

// Legacy/Re-exports for backward compatibility
export { default as hotelsApi } from './hotelsApi';
export { default as flightsApi } from './flightsApi';
export { default as trainsApi } from './trainsApi';
export { default as restaurantBookingApi } from './restaurantBookingApi';
export { default as tableBookingApi } from './tableBookingApi';
export { default as serviceBookingService } from './serviceBookingService';
export { default as eventsApiService } from './eventsApiService';
export { default as vouchersService } from './vouchersService';
export { default as realOffersApi } from './realOffersApi';

// Image Services (Unified)
export { default as unifiedImageService } from './unifiedImageService';
export { PreloadPriority, NetworkQuality } from './unifiedImageService';
export type { UnifiedCacheStats, ImageQualityResult } from './unifiedImageService';

/**
 * Service health check utility
 * Tests connectivity to key services
 */
export async function checkServiceHealth(): Promise<Record<string, boolean>> {
  const services: Array<{ name: string; test: () => Promise<boolean> }> = [
    // Core services
    { name: 'apiClient', test: async () => { try { const r = await apiClient.get('/health'); return r.success; } catch { return false; } } },

    // Commerce
    { name: 'products', test: async () => { try { const r = await productsApi.getCategories(); return r.success; } catch { return false; } } },
    { name: 'orders', test: async () => { try { const r = await orderApi.getOrders(); return r.success; } catch { return false; } } },

    // Intelligence
    { name: 'intentGraph', test: async () => { try { const r = await intentGraphApi.getUserProfile('test'); return r.success; } catch { return false; } } },

    // Marketing
    { name: 'journey', test: async () => { try { const r = await journeyService.getUserJourneys('test'); return r.success; } catch { return false; } } },

    // Support
    { name: 'featureFlags', test: async () => { try { const r = await featureFlagsService.getFlags({ userId: 'test', attributes: {} }); return r.success; } catch { return false; } } },
  ];

  const results: Record<string, boolean> = {};
  await Promise.all(
    services.map(async (s) => {
      results[s.name] = await s.test();
    })
  );

  return results;
}

/**
 * Get all service URLs configured
 */
export function getServiceUrls(): Record<string, string | undefined> {
  return {
    // Core
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    AUTH_URL: process.env.EXPO_PUBLIC_AUTH_SERVICE_URL,

    // Commerce
    WALLET_URL: process.env.EXPO_PUBLIC_WALLET_SERVICE_URL,
    PAYMENT_URL: process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL,
    ORDER_URL: process.env.EXPO_PUBLIC_ORDER_SERVICE_URL,

    // Intelligence
    INTENT_GRAPH_URL: process.env.EXPO_PUBLIC_INTENT_GRAPH_URL,
    TASTE_PROFILE_URL: process.env.EXPO_PUBLIC_TASTE_PROFILE_URL,
    CARE_SERVICE_URL: process.env.EXPO_PUBLIC_CARE_SERVICE_URL,
    FEEDBACK_SERVICE_URL: process.env.EXPO_PUBLIC_FEEDBACK_SERVICE_URL,

    // Marketing
    JOURNEY_SERVICE_URL: process.env.EXPO_PUBLIC_JOURNEY_SERVICE_URL,
    ATTRIBUTION_SERVICE_URL: process.env.EXPO_PUBLIC_ATTRIBUTION_SERVICE_URL,
    EMAIL_SERVICE_URL: process.env.EXPO_PUBLIC_EMAIL_SERVICE_URL,

    // Support
    CORPORATE_SERVICE_URL: process.env.EXPO_PUBLIC_CORPORATE_SERVICE_URL,
    FEATURE_FLAGS_URL: process.env.EXPO_PUBLIC_FEATURE_FLAGS_URL,

    // Media
    ADS_URL: process.env.EXPO_PUBLIC_ADS_URL,
    KARMA_URL: process.env.EXPO_PUBLIC_KARMA_URL,

    // Other
    HOTEL_OTA_URL: process.env.EXPO_PUBLIC_HOTEL_OTA_URL,
    SAFE_QR_API: process.env.EXPO_PUBLIC_SAFE_QR_API,
  };
}
