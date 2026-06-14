/**
 * REZ Revenue AI - Unified SDK with Vertical Adapters
 *
 * Single SDK for ALL merchant verticals:
 * - Restaurant
 * - Hotel
 * - Salon
 * - Fitness
 * - Healthcare
 * - Retail
 * - Ride
 * - Travel
 * - B2B
 */

import axios, { AxiosInstance } from 'axios';

// ================== CORE TYPES ==================

export type Vertical =
  | 'restaurant'
  | 'hotel'
  | 'salon'
  | 'gym'
  | 'clinic'
  | 'retail'
  | 'home_services'
  | 'corp_perks'
  | 'ecommerce'
  | 'travel'
  | 'auto_rental'
  | 'ride'
  | 'entertainment';

export interface EntityContext {
  id: string;
  type: 'product' | 'service' | 'room' | 'appointment' | 'ride' | 'flight';
  category: string;
  name: string;
  basePrice: number;
  cost: number;
}

export interface TimeContext {
  dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hourOfDay?: number;
  isPeakHour?: boolean;
  isWeekend?: boolean;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  month?: number;
  isHoliday?: boolean;
  eventNearby?: boolean;
}

export interface DemandContext {
  current?: number;
  predicted?: number;
  trend?: 'increasing' | 'stable' | 'decreasing';
  confidence?: number;
}

export interface InventoryContext {
  level?: number;
  percentage?: number;
  slotsRemaining?: number;
  totalSlots?: number;
  daysUntilExpiry?: number;
  velocity?: 'fast' | 'normal' | 'slow';
}

export interface LocationContext {
  city?: string;
  tier?: 1 | 2 | 3;
  latitude?: number;
  longitude?: number;
  weather?: 'clear' | 'rainy' | 'stormy' | 'hot' | 'cold' | 'cloudy';
  footfallIndex?: number;
  nearbyEvents?: number;
}

export interface AudienceContext {
  userId?: string;
  segment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
  ltv?: number;
  churnRisk?: number;
  engagementScore?: number;
  orderCount?: number;
  daysSinceLastOrder?: number;
}

export interface PricingContext {
  entity: EntityContext;
  time: TimeContext;
  demand?: DemandContext;
  inventory?: InventoryContext;
  location?: LocationContext;
  audience?: AudienceContext;
  constraints?: {
    minMargin?: number;
    maxSurge?: number;
    maxDiscount?: number;
  };
}

export interface PricingResult {
  entityId: string;
  finalPrice: number;
  originalPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based';
  confidence: number;
  factors: Array<{
    name: string;
    category: string;
    value: number;
    contribution: number;
    reason: string;
  }>;
  alternativePrices?: Array<{
    label: string;
    price: number;
    offer?: string;
  }>;
}

// ================== VERTICAL CONSTANTS ==================

export const VERTICAL_DEFAULTS: Record<Vertical, {
  maxSurge: number;
  maxDiscount: number;
  minMargin: number;
  peakHours: number[];
  offPeakHours: number[];
  weekendMultiplier: number;
}> = {
  restaurant: {
    maxSurge: 2.0,
    maxDiscount: 0.5,
    minMargin: 0.25,
    peakHours: [12, 13, 19, 20, 21],
    offPeakHours: [14, 15, 16],
    weekendMultiplier: 1.15,
  },
  hotel: {
    maxSurge: 3.0,
    maxDiscount: 0.4,
    minMargin: 0.2,
    peakHours: [],
    offPeakHours: [],
    weekendMultiplier: 1.2,
  },
  salon: {
    maxSurge: 1.5,
    maxDiscount: 0.4,
    minMargin: 0.3,
    peakHours: [10, 11, 18, 19, 20],
    offPeakHours: [13, 14, 15],
    weekendMultiplier: 1.2,
  },
  gym: {
    maxSurge: 1.3,
    maxDiscount: 0.3,
    minMargin: 0.35,
    peakHours: [7, 8, 9, 18, 19, 20],
    offPeakHours: [11, 12, 13, 14],
    weekendMultiplier: 1.1,
  },
  clinic: {
    maxSurge: 1.5,
    maxDiscount: 0.35,
    minMargin: 0.3,
    peakHours: [10, 11, 17, 18, 19],
    offPeakHours: [13, 14, 15],
    weekendMultiplier: 1.1,
  },
  retail: {
    maxSurge: 1.8,
    maxDiscount: 0.5,
    minMargin: 0.2,
    peakHours: [10, 11, 17, 18],
    offPeakHours: [14, 15, 16],
    weekendMultiplier: 1.2,
  },
  home_services: {
    maxSurge: 1.8,
    maxDiscount: 0.35,
    minMargin: 0.25,
    peakHours: [9, 10, 17, 18],
    offPeakHours: [12, 13, 14],
    weekendMultiplier: 1.15,
  },
  corp_perks: {
    maxSurge: 1.3,
    maxDiscount: 0.25,
    minMargin: 0.2,
    peakHours: [],
    offPeakHours: [],
    weekendMultiplier: 1.0,
  },
  ecommerce: {
    maxSurge: 2.5,
    maxDiscount: 0.6,
    minMargin: 0.15,
    peakHours: [10, 11, 18, 19, 20],
    offPeakHours: [2, 3, 4, 5],
    weekendMultiplier: 1.1,
  },
  travel: {
    maxSurge: 3.5,
    maxDiscount: 0.35,
    minMargin: 0.15,
    peakHours: [],
    offPeakHours: [],
    weekendMultiplier: 1.15,
  },
  auto_rental: {
    maxSurge: 3.0,
    maxDiscount: 0.35,
    minMargin: 0.2,
    peakHours: [9, 10],
    offPeakHours: [20, 21, 22],
    weekendMultiplier: 1.25,
  },
  ride: {
    maxSurge: 2.5,
    maxDiscount: 0.3,
    minMargin: 0.15,
    peakHours: [9, 10, 18, 19],
    offPeakHours: [14, 15, 16],
    weekendMultiplier: 1.2,
  },
  entertainment: {
    maxSurge: 4.0,
    maxDiscount: 0.5,
    minMargin: 0.15,
    peakHours: [19, 20, 21],
    offPeakHours: [10, 11, 12],
    weekendMultiplier: 1.3,
  },
};

// ================== UNIFIED CLIENT ==================

export class RevenueAIClient {
  private client: AxiosInstance;

  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
  }) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
      },
    });
  }

  /**
   * Universal pricing for ANY vertical
   */
  async price(context: PricingContext): Promise<PricingResult> {
    const response = await this.client.post('/api/v1/pricing/calculate', {
      context,
    });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Pricing failed');
    }
    return response.data.data;
  }

  /**
   * Batch pricing
   */
  async priceBatch(
    items: Array<{
      entity: EntityContext;
      context: Omit<PricingContext, 'entity'>;
    }>
  ): Promise<{ results: PricingResult[]; summary: unknown }> {
    const response = await this.client.post('/api/v1/pricing/batch', { items });
    return response.data.data;
  }

  /**
   * Demand forecast
   */
  async forecast(params: {
    merchantId: string;
    vertical: Vertical;
    location: LocationContext;
    horizon: 'day' | 'week' | 'month';
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/forecast', params);
    return response.data.data;
  }

  /**
   * Offer optimization
   */
  async optimizeOffer(params: {
    merchantId: string;
    entityId: string;
    basePrice: number;
    audience?: AudienceContext;
    context?: {
      demand?: number;
      isWeekend?: boolean;
    };
    goal?: 'revenue' | 'conversion' | 'retention' | 'acquisition';
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/offers/optimize', params);
    return response.data.data;
  }

  /**
   * Cashback optimization
   */
  async optimizeCashback(params: {
    merchantId: string;
    userId: string;
    orderValue: number;
    vertical: Vertical;
    audience: AudienceContext;
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/cashback/optimize', params);
    return response.data.data;
  }

  /**
   * Revenue copilot
   */
  async getRevenuePlan(params: {
    merchantId: string;
    goal: { type: 'revenue' | 'customers' | 'orders'; target: number; timeframe: 'week' | 'month' };
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/copilot/revenue-plan', params);
    return response.data.data;
  }

  /**
   * Simulation
   */
  async simulate(params: {
    merchantId: string;
    scenario: {
      type: 'pricing' | 'offer' | 'cashback' | 'bundle';
      changes: Record<string, number>;
    };
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/simulation/run', params);
    return response.data.data;
  }

  /**
   * Benchmark score
   */
  async getBenchmark(merchantId: string): Promise<unknown> {
    const response = await this.client.get(`/api/v1/benchmarks/${merchantId}`);
    return response.data.data;
  }

  /**
   * Segment analysis
   */
  async getSegments(merchantId: string): Promise<unknown> {
    const response = await this.client.get(`/api/v1/segments/${merchantId}`);
    return response.data.data;
  }

  /**
   * Chat with MerchantGPT
   */
  async chat(params: {
    merchantId: string;
    message: string;
    conversationId?: string;
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/chat', params);
    return response.data.data;
  }

  /**
   * Generate campaign
   */
  async generateCampaign(params: {
    merchantId: string;
    objective: 'acquisition' | 'retention' | 'reactivation';
    target: 'new_users' | 'existing' | 'at_risk' | 'dormant' | 'all';
    offer: { type: string; value: number };
    channels: ('whatsapp' | 'sms' | 'push' | 'instagram')[];
  }): Promise<unknown> {
    const response = await this.client.post('/api/v1/campaigns/generate', params);
    return response.data.data;
  }
}

// ================== VERTICAL ADAPTERS ==================

export abstract class VerticalAdapter {
  protected client: RevenueAIClient;
  protected vertical: Vertical;
  protected defaults = VERTICAL_DEFAULTS;

  constructor(client: RevenueAIClient, vertical: Vertical) {
    this.client = client;
    this.vertical = vertical;
  }

  abstract price(context: PricingContext): Promise<PricingResult>;
  abstract forecast(merchantId: string, horizon: string): Promise<unknown>;
  abstract optimizeOffer(params: unknown): Promise<unknown>;
  abstract optimizeCashback(params: unknown): Promise<unknown>;
}

// ================== RESTAURANT ADAPTER ==================

export class RestaurantAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'restaurant');
  }

  async priceMenuItem(
    item: { id: string; name: string; category: string; price: number; cost: number },
    context: {
      tableId?: string;
      time: Date;
      tablesRemaining?: number;
      totalTables?: number;
      customerId?: string;
    }
  ): Promise<PricingResult> {
    const isPeakHour = [12, 13, 19, 20, 21].includes(context.time.getHours());
    const isWeekend = context.time.getDay() === 0 || context.time.getDay() === 6;

    return this.client.price({
      entity: {
        id: item.id,
        type: 'product',
        category: item.category,
        name: item.name,
        basePrice: item.price,
        cost: item.cost,
      },
      time: {
        dayOfWeek: context.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: context.time.getHours(),
        isPeakHour,
        isWeekend,
      },
      inventory: {
        slotsRemaining: context.tablesRemaining,
        totalSlots: context.totalTables,
      },
      audience: context.customerId ? { userId: context.customerId } : undefined,
      constraints: {
        minMargin: this.defaults.restaurant.minMargin,
        maxSurge: this.defaults.restaurant.maxSurge,
        maxDiscount: this.defaults.restaurant.maxDiscount,
      },
    });
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'restaurant',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }

  async optimizeOffer(params: {
    entityId: string;
    basePrice: number;
    goal?: 'revenue' | 'conversion' | 'retention';
    customerId?: string;
  }): Promise<unknown> {
    return this.client.optimizeOffer({
      merchantId: 'restaurant_001', // Would come from context
      entityId: params.entityId,
      basePrice: params.basePrice,
      goal: params.goal,
    });
  }

  async optimizeCashback(params: {
    customerId: string;
    orderValue: number;
    segment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
  }): Promise<unknown> {
    return this.client.optimizeCashback({
      merchantId: 'restaurant_001',
      userId: params.customerId,
      orderValue: params.orderValue,
      vertical: 'restaurant',
      audience: { segment: params.segment },
    });
  }
}

// ================== HOTEL ADAPTER ==================

export class HotelAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'hotel');
  }

  async priceRoom(
    room: { id: string; name: string; category: string; baseRate: number; cost: number },
    context: {
      checkIn: Date;
      checkOut: Date;
      availableRooms?: number;
      totalRooms?: number;
      guestId?: string;
    }
  ): Promise<PricingResult> {
    const isWeekend = context.checkIn.getDay() === 5 || context.checkIn.getDay() === 6;

    return this.client.price({
      entity: {
        id: room.id,
        type: 'room',
        category: room.category,
        name: room.name,
        basePrice: room.baseRate,
        cost: room.cost,
      },
      time: {
        dayOfWeek: context.checkIn.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: context.checkIn.getHours(),
        isWeekend,
        season: this.getSeason(context.checkIn.getMonth()),
      },
      inventory: {
        slotsRemaining: context.availableRooms,
        totalSlots: context.totalRooms,
      },
      constraints: {
        minMargin: this.defaults.hotel.minMargin,
        maxSurge: this.defaults.hotel.maxSurge,
        maxDiscount: this.defaults.hotel.maxDiscount,
      },
    });
  }

  private getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'hotel',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }

  async optimizeOffer(params: { roomId: string; basePrice: number; goal?: string }): Promise<unknown> {
    return this.client.optimizeOffer({
      merchantId: 'hotel_001',
      entityId: params.roomId,
      basePrice: params.basePrice,
    });
  }

  async optimizeCashback(params: { guestId: string; bookingValue: number }): Promise<unknown> {
    return this.client.optimizeCashback({
      merchantId: 'hotel_001',
      userId: params.guestId,
      orderValue: params.bookingValue,
      vertical: 'hotel',
      audience: {},
    });
  }
}

// ================== SALON ADAPTER ==================

export class SalonAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'salon');
  }

  async priceService(
    service: { id: string; name: string; category: string; price: number; cost: number },
    context: {
      slot: Date;
      stylistId?: string;
      slotsRemaining?: number;
      totalSlots?: number;
      customerId?: string;
    }
  ): Promise<PricingResult> {
    const hour = context.slot.getHours();
    const isPeakHour = [10, 11, 18, 19, 20].includes(hour);
    const isWeekend = context.slot.getDay() === 0 || context.slot.getDay() === 5 || context.slot.getDay() === 6;

    return this.client.price({
      entity: {
        id: service.id,
        type: 'service',
        category: service.category,
        name: service.name,
        basePrice: service.price,
        cost: service.cost,
      },
      time: {
        dayOfWeek: context.slot.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: hour,
        isPeakHour,
        isWeekend,
      },
      inventory: {
        slotsRemaining: context.slotsRemaining,
        totalSlots: context.totalSlots,
      },
      constraints: {
        minMargin: this.defaults.salon.minMargin,
        maxSurge: this.defaults.salon.maxSurge,
        maxDiscount: this.defaults.salon.maxDiscount,
      },
    });
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'salon',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }

  async optimizeOffer(params: { serviceId: string; basePrice: number; goal?: string }): Promise<unknown> {
    return this.client.optimizeOffer({
      merchantId: 'salon_001',
      entityId: params.serviceId,
      basePrice: params.basePrice,
    });
  }

  async optimizeCashback(params: { customerId: string; servicePrice: number }): Promise<unknown> {
    return this.client.optimizeCashback({
      merchantId: 'salon_001',
      userId: params.customerId,
      orderValue: params.servicePrice,
      vertical: 'salon',
      audience: {},
    });
  }
}

// ================== GYM ADAPTER ==================

export class GymAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'gym');
  }

  async priceClass(
    classItem: { id: string; name: string; category: string; price: number; cost: number },
    context: {
      classTime: Date;
      capacityRemaining?: number;
      totalCapacity?: number;
      memberId?: string;
    }
  ): Promise<PricingResult> {
    const hour = context.classTime.getHours();
    const isPeakHour = [7, 8, 9, 18, 19, 20].includes(hour);
    const isWeekend = context.classTime.getDay() === 0 || context.classTime.getDay() === 6;

    return this.client.price({
      entity: {
        id: classItem.id,
        type: 'service',
        category: classItem.category,
        name: classItem.name,
        basePrice: classItem.price,
        cost: classItem.cost,
      },
      time: {
        dayOfWeek: context.classTime.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: hour,
        isPeakHour,
        isWeekend,
      },
      inventory: {
        slotsRemaining: context.capacityRemaining,
        totalSlots: context.totalCapacity,
      },
      constraints: {
        minMargin: this.defaults.gym.minMargin,
        maxSurge: this.defaults.gym.maxSurge,
        maxDiscount: this.defaults.gym.maxDiscount,
      },
    });
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'gym',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }
}

// ================== HEALTHCARE ADAPTER ==================

export class HealthcareAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'clinic');
  }

  async priceConsultation(
    consultation: { id: string; name: string; specialization: string; fee: number; cost: number },
    context: {
      slot: Date;
      mode: 'in_clinic' | 'teleconsult' | 'home_visit';
      slotsRemaining?: number;
      totalSlots?: number;
      patientId?: string;
    }
  ): Promise<PricingResult> {
    const hour = context.slot.getHours();
    const isPeakHour = [10, 11, 17, 18, 19].includes(hour);
    const isWeekend = context.slot.getDay() === 0;

    return this.client.price({
      entity: {
        id: consultation.id,
        type: 'appointment',
        category: consultation.specialization,
        name: consultation.name,
        basePrice: consultation.fee,
        cost: consultation.cost,
      },
      time: {
        dayOfWeek: context.slot.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        hourOfDay: hour,
        isPeakHour,
        isWeekend,
      },
      inventory: {
        slotsRemaining: context.slotsRemaining,
        totalSlots: context.totalSlots,
      },
      constraints: {
        minMargin: this.defaults.clinic.minMargin,
        maxSurge: this.defaults.clinic.maxSurge,
        maxDiscount: this.defaults.clinic.maxDiscount,
      },
    });
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'clinic',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }
}

// ================== RIDE ADAPTER ==================

export class RideAdapter extends VerticalAdapter {
  constructor(client: RevenueAIClient) {
    super(client, 'ride');
  }

  async priceRide(
    ride: { id: string; name: string; category: 'auto' | 'bike' | 'cab' | 'suv'; baseFare: number },
    context: {
      pickup: { lat: number; lng: number };
      drop: { lat: number; lng: number };
      distance: number;
      weather?: string;
      nearbyEvents?: number;
    }
  ): Promise<PricingResult> {
    const hour = new Date().getHours();
    const isPeakHour = [9, 10, 18, 19].includes(hour);

    return this.client.price({
      entity: {
        id: ride.id,
        type: 'service',
        category: ride.category,
        name: ride.name,
        basePrice: ride.baseFare,
        cost: ride.baseFare * 0.6,
      },
      time: {
        hourOfDay: hour,
        isPeakHour,
        isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
      },
      location: {
        latitude: context.pickup.lat,
        longitude: context.pickup.lng,
        weather: context.weather as LocationContext['weather'],
        nearbyEvents: context.nearbyEvents,
      },
      constraints: {
        minMargin: this.defaults.ride.minMargin,
        maxSurge: this.defaults.ride.maxSurge,
        maxDiscount: this.defaults.ride.maxDiscount,
      },
    });
  }

  async forecast(merchantId: string, horizon: string): Promise<unknown> {
    return this.client.forecast({
      merchantId,
      vertical: 'ride',
      location: {},
      horizon: horizon as 'day' | 'week' | 'month',
    });
  }
}

// ================== FACTORY ==================

export const createRevenueAI = (baseUrl: string = 'http://localhost:4300', apiKey?: string) => {
  const client = new RevenueAIClient({ baseUrl, apiKey });

  return {
    client,
    restaurant: new RestaurantAdapter(client),
    hotel: new HotelAdapter(client),
    salon: new SalonAdapter(client),
    gym: new GymAdapter(client),
    healthcare: new HealthcareAdapter(client),
    ride: new RideAdapter(client),
  };
};

export default RevenueAIClient;
