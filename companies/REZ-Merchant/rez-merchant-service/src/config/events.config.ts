/**
 * Event Platform Configuration
 * Configure how this service connects to the REZ Event Platform
 */

export const eventsConfig = {
  // Event Platform URL
  platformUrl: process.env.EVENT_PLATFORM_URL || 'http://localhost:4008',

  // Enable/disable event emission
  // Set to 'false' in development if Event Platform is not running
  emitEvents: process.env.ENABLE_EVENT_EMISSION !== 'false',

  // Default inventory thresholds
  inventory: {
    // Default low stock threshold when not specified on product
    defaultThreshold: 5,

    // How often to check inventory levels (in milliseconds)
    // Only used if you implement periodic inventory checks
    checkInterval: 60000, // 1 minute
  },

  // Retry configuration for failed event emissions
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  },

  // Which events to emit
  events: {
    inventoryLow: true,
    orderCompleted: true,
    paymentSuccess: true,
  },
} as const;

// Validate configuration on import
export function validateEventsConfig(): void {
  const errors: string[] = [];

  if (!eventsConfig.platformUrl) {
    errors.push('EVENT_PLATFORM_URL is required');
  }

  if (errors.length > 0) {
    console.warn('[EventsConfig] Configuration warnings:', errors);
  }
}

// Run validation
validateEventsConfig();

export default eventsConfig;
