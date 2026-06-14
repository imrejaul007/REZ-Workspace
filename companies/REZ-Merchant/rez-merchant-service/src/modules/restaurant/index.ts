/**
 * ReZ Restaurant OS - Main Module Export
 * All restaurant-specific modules unified
 */

// AI Modules
export * from './ai/demandForecast';
export * from './ai/smartInventory';

// Operations Modules
export * from './operations/recipeCosting';
export * from './operations/dynamicPricing';
export * from './operations/voiceOrder';
export * from './operations/reservations';

// Analytics Modules
export * from './analytics/dashboard';

// Re-export instances
import { restaurantDemandForecast } from './ai/demandForecast';
import { restaurantSmartInventory } from './ai/smartInventory';
import { recipeCosting } from './operations/recipeCosting';
import { restaurantPricing } from './operations/dynamicPricing';
import { restaurantVoiceOrder } from './operations/voiceOrder';
import { restaurantReservations } from './operations/reservations';
import { restaurantAnalytics } from './analytics/dashboard';

export const restaurantModules = {
  ai: {
    demandForecast: restaurantDemandForecast,
    smartInventory: restaurantSmartInventory
  },
  operations: {
    recipeCosting,
    pricing: restaurantPricing,
    voiceOrder: restaurantVoiceOrder,
    reservations: restaurantReservations
  },
  analytics: {
    dashboard: restaurantAnalytics
  }
};
