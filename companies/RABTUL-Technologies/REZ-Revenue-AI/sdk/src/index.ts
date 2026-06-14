/**
 * REZ Revenue AI - Unified SDK
 *
 * Single SDK for ALL merchant verticals and revenue optimization
 *
 * @example
 * ```typescript
 * import { createMerchantIntegration } from '@rez/revenue-ai-sdk';
 *
 * // Restaurant
 * const restaurant = createMerchantIntegration('restaurant');
 * const price = await restaurant.calculatePrice({ ... });
 *
 * // Hotel
 * const hotel = createMerchantIntegration('hotel');
 * const rate = await hotel.calculatePrice({ ... });
 * ```
 */

// Re-export vertical adapters
export { createRevenueAI, RevenueAIClient } from './vertical-adapters';
export type {
  Vertical,
  PricingContext,
  PricingResult,
  VerticalAdapter,
} from './vertical-adapters';

// Re-export integrations
export { restaurantHubRevenue } from './integrations/restaurantHub';
export { hotelRevenue } from './integrations/hotelService';
export { salonRevenue } from './integrations/salonService';
export { fitnessRevenue } from './integrations/fitnessService';
export { healthcareRevenue } from './integrations/healthcareService';
export { retailRevenue } from './integrations/retailService';
export { rideRevenue } from './integrations/rideService';

// Main factory function
export { createMerchantIntegration, revenueAI, MerchantIntegration } from './integrations/index';
export type {
  Vertical as MerchantVertical,
} from './integrations/index';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
