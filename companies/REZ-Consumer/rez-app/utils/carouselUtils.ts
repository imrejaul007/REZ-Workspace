// @ts-nocheck
import { CategoryCarouselItem } from '@/types/category.types';

export interface CarouselActionResult {
  success: boolean;
  action: string;
  target: string;
  params?: Record<string, unknown>;
  analyticsEvent?: {
    event: string;
    properties: Record<string, unknown>;
  };
}

/**
 * Handles carousel item interactions and returns appropriate action results
 * This function is backend-ready and can be extended for API calls and analytics
 */
export const handleCarouselAction = async (
  carouselItem: CategoryCarouselItem,
  categorySlug: string,
  userId?: string
): Promise<CarouselActionResult> => {
  try {
    const actionResult: CarouselActionResult = {
      success: true,
      action: carouselItem.action?.type || 'view',
      target: carouselItem.action?.target || '',
      params: carouselItem.action?.params,
      analyticsEvent: {
        event: 'carousel_item_clicked',
        properties: {
          carousel_item_id: carouselItem.id,
          carousel_item_title: carouselItem.title,
          carousel_item_brand: carouselItem.brand,
          category_slug: categorySlug,
          action_type: carouselItem.action?.type,
          action_target: carouselItem.action?.target,
          cashback_percentage: carouselItem.cashback,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      },
    };

    // M-7 FIX: Send carousel analytics event and personalization signal
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const analytics = require('@/services/analytics/AnalyticsService').default as {
        trackEvent: (name: string, props: object) => void;
      };
      if (actionResult.analyticsEvent) {
        analytics.trackEvent(
          actionResult.analyticsEvent.event,
          actionResult.analyticsEvent.properties ?? {}
        );
      }
    } catch { /* analytics unavailable */ }

    return actionResult;
  } catch (error) {
    return {
      success: false,
      action: 'error',
      target: '',
    };
  }
};

/**
 * Validates carousel items structure for backend compatibility
 */
export const validateCarouselItems = (items: CategoryCarouselItem[]): boolean => {
  if (!Array.isArray(items)) return false;
  
  return items.every(item => 
    item.id && 
    typeof item.id === 'string' &&
    item.brand && 
    typeof item.brand === 'string' &&
    item.title && 
    typeof item.title === 'string' &&
    item.subtitle && 
    typeof item.subtitle === 'string' &&
    item.image && 
    typeof item.image === 'string' &&
    typeof item.cashback === 'number' &&
    item.cashback >= 0 &&
    item.cashback <= 100
  );
};

/**
 * Transforms carousel items for API response
 * This function prepares carousel data for backend consumption
 */
export const formatCarouselItemsForAPI = (
  items: CategoryCarouselItem[],
  categoryId: string
): unknown[] => {
  return items.map(item => ({
    id: item.id,
    brand: item.brand,
    title: item.title,
    subtitle: item.subtitle,
    image_url: item.image,
    cashback_percentage: item.cashback,
    category_id: categoryId,
    action: item.action ? {
      type: item.action.type,
      target: item.action.target,
      parameters: item.action.params || {},
    } : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

/**
 * Transforms API response to carousel items
 * This function converts backend data to frontend carousel structure
 */
export const parseCarouselItemsFromAPI = (apiResponse: unknown[]): CategoryCarouselItem[] => {
  if (!Array.isArray(apiResponse)) return [];
  
  return apiResponse.map(item => ({
    id: item.id,
    brand: item.brand,
    title: item.title,
    subtitle: item.subtitle,
    image: item.image_url,
    cashback: item.cashback_percentage,
    action: item.action ? {
      type: item.action.type,
      target: item.action.target,
      params: item.action.parameters,
    } : undefined,
  }));
};

/**
 * Backend-ready carousel configuration
 */
export const carouselConfig = {
  maxItems: 5,
  cacheDuration: 1000 * 60 * 30, // 30 minutes
  preloadImages: true,
  analytics: {
    trackViews: true,
    trackClicks: true,
    trackScrollPosition: true,
  },
  api: {
    endpoints: {
      get: '/api/categories/:categoryId/carousel',
      track: '/api/analytics/carousel-interaction',
      update: '/api/admin/categories/:categoryId/carousel',
    },
  },
};
