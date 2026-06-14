export const config = {
  port: parseInt(process.env.FOOD_DELIVERY_PORT || '4010', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-food-delivery',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Delivery zones with radius in km and base delivery fee
  deliveryZones: [
    { zoneId: 'zone_1', name: 'Zone 1 - Local', radiusKm: 3, baseFee: 20, freeThreshold: 200 },
    { zoneId: 'zone_2', name: 'Zone 2 - Suburban', radiusKm: 6, baseFee: 35, freeThreshold: 350 },
    { zoneId: 'zone_3', name: 'Zone 3 - Extended', radiusKm: 10, baseFee: 50, freeThreshold: 500 },
  ],

  // Rush hour surge pricing (multiplier applied to delivery fee)
  rushHours: {
    lunch: { start: 11, end: 14, multiplier: 1.3 },
    dinner: { start: 18, end: 21, multiplier: 1.4 },
  },

  // Surge pricing threshold (orders per minute)
  surgeThreshold: 10,
  surgeMultiplier: 1.25,

  // Driver earnings configuration
  driverEarnings: {
    basePerKm: 8,
    baseFee: 30,
    tipPercentage: 0,
    incentiveBonus: 15, // per batch of 5 deliveries
  },

  // OTP settings
  otpExpiryMinutes: 10,
  otpLength: 4,

  // Tracking update interval (seconds)
  trackingUpdateInterval: 30,

  // Assignment timeout (seconds)
  assignmentTimeoutSeconds: 120,

  // Service tokens for internal communication
  internalServiceTokens: JSON.parse(
    process.env.INTERNAL_SERVICE_TOKENS_JSON || '{"orchestrator": "token", "payment": "token"}'
  ),
};
