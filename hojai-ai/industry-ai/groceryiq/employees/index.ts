/**
 * GroceryIQ - AI Employees Index
 *
 * Exports all AI employees for GroceryIQ.
 */

export { inventoryAgent } from './inventory-agent';
export { pricingAgent } from './pricing-agent';
export { demandAgent } from './demand-agent';

export const employees = {
  inventory: {
    name: 'Inventory Agent',
    description: 'Monitors stock levels, triggers reorders, manages expiry',
    methods: [
      'checkStockLevels',
      'generateReorderRecommendations',
      'checkExpiringProducts',
      'executeReorder',
      'getDashboardSummary'
    ]
  },
  pricing: {
    name: 'Pricing Agent',
    description: 'Dynamic pricing, competitor analysis, margin optimization',
    methods: [
      'getPricingRecommendations',
      'analyzeCompetitorPrices',
      'optimizePrice',
      'generatePromotionalPricing',
      'updatePrice',
      'getPricingAnalytics'
    ]
  },
  demand: {
    name: 'Demand Forecasting Agent',
    description: 'Predicts sales, identifies trends, optimizes inventory',
    methods: [
      'getForecast',
      'getAllForecasts',
      'getSeasonalityPatterns',
      'analyzeTrends',
      'identifyHighDemandPeriods',
      'predictRestockingNeeds',
      'getDemandSummary'
    ]
  }
};

export const employeeCount = 3;