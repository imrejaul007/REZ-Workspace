// Fare Configuration
export const FARE_CONFIG = {
  // Base fares by vehicle type
  VEHICLE_TYPES: {
    auto: {
      name: 'Auto',
      icon: '🛺',
      baseFare: 25,
      perKm: 10,
      perMinute: 1.5,
      waitingPerMinute: 1,
      minFare: 30,
      maxSpeedKmh: 40,
    },
    cab: {
      name: 'Cab',
      icon: '🚗',
      baseFare: 40,
      perKm: 14,
      perMinute: 2,
      waitingPerMinute: 2,
      minFare: 60,
      maxSpeedKmh: 60,
    },
    suv: {
      name: 'SUV',
      icon: '🚙',
      baseFare: 60,
      perKm: 18,
      perMinute: 2.5,
      waitingPerMinute: 2.5,
      minFare: 80,
      maxSpeedKmh: 60,
    },
    bike: {
      name: 'Bike',
      icon: '🏍️',
      baseFare: 15,
      perKm: 6,
      perMinute: 1,
      waitingPerMinute: 0.5,
      minFare: 20,
      maxSpeedKmh: 50,
    },
    bus: {
      name: 'Shared Bus',
      icon: '🚌',
      baseFare: 15,
      perKm: 5,
      perMinute: 0.5,
      waitingPerMinute: 0,
      minFare: 20,
      maxSpeedKmh: 40,
    },
  },

  // Surge pricing configuration
  SURGE: {
    minMultiplier: 1.0,
    maxMultiplier: 3.0,
    thresholds: [
      { ratio: 1.0, multiplier: 1.0 },    // Normal
      { ratio: 1.5, multiplier: 1.25 },  // Moderate
      { ratio: 2.0, multiplier: 1.5 },    // High
      { ratio: 3.0, multiplier: 2.0 },   // Very High
      { ratio: 4.0, multiplier: 2.5 },   // Extreme
      { ratio: 5.0, multiplier: 3.0 },   // Maximum
    ],
  },

  // Night charges (11 PM - 6 AM)
  NIGHT_CHARGES: {
    enabled: true,
    multiplier: 1.25,
    startHour: 23,
    endHour: 6,
  },

  // Waiting charges
  WAITING: {
    freeMinutes: 2,      // First 2 minutes free
    minChargeableMinutes: 1, // Minimum chargeable
  },

  // Distance included in base fare
  BASE_FARE_KM: {
    auto: 1.5,
    cab: 2,
    suv: 2,
    bike: 1,
    bus: 3,
  },

  // Cashback
  CASHBACK: {
    percentage: 10, // 10% cashback on every ride
  },
} as const;

// ===========================================
// FARE CALCULATION TYPES
// ===========================================
export type VehicleType = 'auto' | 'cab' | 'suv' | 'bike' | 'bus';

export interface FareCalculationInput {
  vehicleType: VehicleType;
  distanceKm: number;
  durationMinutes: number;
  waitingMinutes?: number;
  surgeMultiplier?: number;
  isNightTime?: boolean;
}

export interface FareBreakdown {
  base: number;
  distanceCharge: number;
  timeCharge: number;
  waitingCharge: number;
  nightCharges: number;
  surge: number;
  surgeMultiplier: number;
  subtotal: number;
  total: number;
  cashback: number;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Check if current time is night time (11 PM - 6 AM)
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= FARE_CONFIG.NIGHT_CHARGES.startHour || hour < FARE_CONFIG.NIGHT_CHARGES.endHour;
}

/**
 * Calculate fare for a ride
 */
export function calculateFare(input: FareCalculationInput): FareBreakdown {
  const config = FARE_CONFIG.VEHICLE_TYPES[input.vehicleType];
  const baseKm = FARE_CONFIG.BASE_FARE_KM[input.vehicleType];

  // Distance charge (only for km beyond base fare)
  const chargeableKm = Math.max(0, input.distanceKm - baseKm);
  const distanceCharge = Math.round(chargeableKm * config.perKm * 100) / 100;

  // Time charge
  const timeCharge = Math.round(input.durationMinutes * config.perMinute * 100) / 100;

  // Waiting charges (after free minutes)
  const chargeableWaiting = Math.max(0, (input.waitingMinutes || 0) - FARE_CONFIG.WAITING.freeMinutes);
  const waitingCharge = Math.round(chargeableWaiting * config.waitingPerMinute * 100) / 100;

  // Calculate subtotal before surcharges
  const subtotal = config.baseFare + distanceCharge + timeCharge + waitingCharge;

  // Surge multiplier
  const surgeMultiplier = input.surgeMultiplier || 1.0;
  const surge = Math.round((surgeMultiplier - 1) * subtotal * 100) / 100;

  // Night charges
  const isNight = input.isNightTime ?? isNightTime();
  const nightMultiplier = isNight && FARE_CONFIG.NIGHT_CHARGES.enabled
    ? FARE_CONFIG.NIGHT_CHARGES.multiplier
    : 1.0;
  const nightCharges = Math.round((nightMultiplier - 1) * subtotal * 100) / 100;

  // Total
  const total = Math.round((subtotal + surge + nightCharges) * 100) / 100;

  // Apply minimum fare
  const finalTotal = Math.max(total, config.minFare);

  // Calculate cashback (10% of fare)
  const cashback = Math.round(finalTotal * (FARE_CONFIG.CASHBACK.percentage / 100) * 100) / 100;

  return {
    base: config.baseFare,
    distanceCharge,
    timeCharge,
    waitingCharge,
    nightCharges,
    surge: Math.round(surge * 100) / 100,
    surgeMultiplier,
    subtotal: Math.round(subtotal * 100) / 100,
    total: finalTotal,
    cashback,
  };
}

/**
 * Calculate surge multiplier based on demand/supply ratio
 */
export function calculateSurgeMultiplier(demandRatio: number): number {
  const { thresholds, maxMultiplier } = FARE_CONFIG.SURGE;

  for (const threshold of thresholds) {
    if (demandRatio <= threshold.ratio) {
      return threshold.multiplier;
    }
  }

  return maxMultiplier;
}

/**
 * Estimate fare (without actual route)
 */
export function estimateFare(
  vehicleType: VehicleType,
  distanceKm: number,
  estimatedMinutes: number
): FareBreakdown {
  // Use average waiting time of 2 minutes
  return calculateFare({
    vehicleType,
    distanceKm,
    durationMinutes: estimatedMinutes,
    waitingMinutes: 2,
    surgeMultiplier: 1.0,
    isNightTime: isNightTime(),
  });
}

/**
 * Get fare estimate with price range
 */
export function getFareRange(
  vehicleType: VehicleType,
  distanceKm: number,
  minMinutes: number,
  maxMinutes: number
): { low: number; high: number } {
  const lowFare = estimateFare(vehicleType, distanceKm, minMinutes);
  const highFare = estimateFare(vehicleType, distanceKm, maxMinutes);

  return {
    low: lowFare.total,
    high: Math.max(lowFare.total, highFare.total),
  };
}

/**
 * Get vehicle type info
 */
export function getVehicleInfo(type: VehicleType) {
  return FARE_CONFIG.VEHICLE_TYPES[type];
}

/**
 * Vehicle info type
 */
export type VehicleInfo = typeof FARE_CONFIG.VEHICLE_TYPES.auto;

/**
 * Get all vehicle types
 */
export function getAllVehicleTypes(): Array<{ type: VehicleType; info: typeof FARE_CONFIG.VEHICLE_TYPES[VehicleType] }> {
  return Object.entries(FARE_CONFIG.VEHICLE_TYPES).map(([type, info]) => ({
    type: type as VehicleType,
    info: info as typeof FARE_CONFIG.VEHICLE_TYPES[VehicleType],
  }));
}
