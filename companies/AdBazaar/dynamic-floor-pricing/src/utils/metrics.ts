import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for Dynamic Floor Pricing
export const floorPricingMetrics = {
  // Counter for floor price operations
  floorOperationsTotal: new client.Counter({
    name: 'floor_pricing_operations_total',
    help: 'Total number of floor pricing operations',
    labelNames: ['operation', 'status'],
    registers: [register]
  }),

  // Gauge for active floors
  activeFloorsGauge: new client.Gauge({
    name: 'floor_pricing_active_floors',
    help: 'Number of active floor prices',
    labelNames: ['type', 'status'],
    registers: [register]
  }),

  // Histogram for optimization duration
  optimizationDuration: new client.Histogram({
    name: 'floor_pricing_optimization_duration_seconds',
    help: 'Duration of floor optimization operations',
    labelNames: ['inventory_type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
  }),

  // Histogram for API response times
  apiResponseTime: new client.Histogram({
    name: 'floor_pricing_api_response_time_seconds',
    help: 'API response time in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register]
  }),

  // Counter for optimization recommendations
  optimizationRecommendationsTotal: new client.Counter({
    name: 'floor_pricing_recommendations_total',
    help: 'Total number of optimization recommendations generated',
    labelNames: ['confidence_level'],
    registers: [register]
  }),

  // Gauge for current floor prices
  currentFloorPrices: new client.Gauge({
    name: 'floor_pricing_current_prices',
    help: 'Current floor prices by inventory',
    labelNames: ['inventory_id', 'type'],
    registers: [register]
  }),

  // Counter for revenue impact
  revenueImpactTotal: new client.Counter({
    name: 'floor_pricing_revenue_impact_total',
    help: 'Total revenue impact from floor pricing decisions',
    labelNames: ['inventory_type'],
    registers: [register]
  }),

  // Histogram for price changes
  priceChangeDistribution: new client.Histogram({
    name: 'floor_pricing_price_change_percent',
    help: 'Distribution of floor price changes in percent',
    buckets: [-50, -25, -10, -5, 0, 5, 10, 25, 50],
    registers: [register]
  })
};

// Helper function to record API response time
export const recordResponseTime = (
  method: string,
  route: string,
  statusCode: number,
  durationMs: number
) => {
  floorPricingMetrics.apiResponseTime.observe(
    { method, route, status_code: statusCode.toString() },
    durationMs / 1000
  );
};

// Helper to increment operation counter
export const recordOperation = (operation: string, status: 'success' | 'error') => {
  floorPricingMetrics.floorOperationsTotal.inc({ operation, status });
};

export default register;