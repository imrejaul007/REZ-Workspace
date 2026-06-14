import { v4 as uuidv4 } from 'uuid';

export interface RatePlan {
  planId: string;
  hotelId: string;
  roomTypeId: string;
  name: string;
  description?: string;
  baseRate: number;
  currency: string;
  channels: {
    channelId: string;
    rate: number;
    enabled: boolean;
    restrictions?: {
      minStay?: number;
      maxStay?: number;
      closedToArrival?: boolean;
      closedToDeparture?: boolean;
    };
  }[];
  restrictions: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: string[];
    closedToDeparture?: string[];
    leadTime?: { min: number; max: number };
  };
  mealPlan?: 'room_only' | 'bb' | 'hb' | 'fb';
  cancellationPolicy: {
    type: 'free' | 'partial' | 'non_refundable';
    hoursBefore?: number;
    penalty?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class RatePlanService {
  private ratePlans: Map<string, RatePlan> = new Map();

  constructor() {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    // Create default rate plans
    const defaultPlans: Omit<RatePlan, 'planId' | 'createdAt' | 'updatedAt'>[] = [
      {
        planId: 'STD-BAR',
        hotelId: 'default',
        roomTypeId: 'standard',
        name: 'Standard Rate',
        description: 'Standard Best Available Rate',
        baseRate: 3000,
        currency: 'INR',
        channels: [
          { channelId: 'booking_com', rate: 3000, enabled: true },
          { channelId: 'mMT', rate: 3060, enabled: true },
          { channelId: 'goibibo', rate: 3060, enabled: true },
          { channelId: 'airbnb', rate: 3150, enabled: false },
          { channelId: 'expedia', rate: 3030, enabled: false },
        ],
        restrictions: { minStay: 1, maxStay: 28 },
        cancellationPolicy: { type: 'free', hoursBefore: 24 },
      },
      {
        planId: 'STD-NR',
        hotelId: 'default',
        roomTypeId: 'standard',
        name: 'Non-Refundable Rate',
        description: 'Discounted non-refundable rate',
        baseRate: 2700,
        currency: 'INR',
        channels: [
          { channelId: 'booking_com', rate: 2700, enabled: true },
          { channelId: 'mMT', rate: 2754, enabled: true },
          { channelId: 'goibibo', rate: 2754, enabled: true },
          { channelId: 'airbnb', rate: 2835, enabled: false },
          { channelId: 'expedia', rate: 2727, enabled: false },
        ],
        restrictions: { minStay: 1, maxStay: 28 },
        cancellationPolicy: { type: 'non_refundable' },
      },
      {
        planId: 'STD-FLEX',
        hotelId: 'default',
        roomTypeId: 'standard',
        name: 'Flexible Rate',
        description: 'Fully flexible rate with free cancellation',
        baseRate: 3500,
        currency: 'INR',
        channels: [
          { channelId: 'booking_com', rate: 3500, enabled: true },
          { channelId: 'mMT', rate: 3570, enabled: true },
          { channelId: 'goibibo', rate: 3570, enabled: true },
          { channelId: 'airbnb', rate: 3675, enabled: true },
          { channelId: 'expedia', rate: 3535, enabled: true },
        ],
        restrictions: { minStay: 1 },
        cancellationPolicy: { type: 'free' },
      },
    ];

    defaultPlans.forEach(plan => {
      const fullPlan: RatePlan = {
        ...plan,
        planId: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.ratePlans.set(fullPlan.planId, fullPlan);
    });
  }

  async createRatePlan(data: Partial<RatePlan>): Promise<RatePlan> {
    const planId = `${data.name?.substring(0, 3).toUpperCase()}-${uuidv4().substring(0, 8)}`;

    const plan: RatePlan = {
      planId,
      hotelId: data.hotelId || 'default',
      roomTypeId: data.roomTypeId || 'standard',
      name: data.name || 'New Rate Plan',
      description: data.description,
      baseRate: data.baseRate || 3000,
      currency: data.currency || 'INR',
      channels: data.channels || [
        { channelId: 'booking_com', rate: data.baseRate || 3000, enabled: true },
        { channelId: 'mMT', rate: (data.baseRate || 3000) * 1.02, enabled: true },
        { channelId: 'goibibo', rate: (data.baseRate || 3000) * 1.02, enabled: true },
        { channelId: 'airbnb', rate: (data.baseRate || 3000) * 1.05, enabled: false },
        { channelId: 'expedia', rate: (data.baseRate || 3000) * 1.01, enabled: false },
      ],
      restrictions: data.restrictions || { minStay: 1 },
      mealPlan: data.mealPlan || 'room_only',
      cancellationPolicy: data.cancellationPolicy || { type: 'free', hoursBefore: 24 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ratePlans.set(planId, plan);
    return plan;
  }

  async getRatePlan(planId: string): Promise<RatePlan | null> {
    return this.ratePlans.get(planId) || null;
  }

  async getHotelRatePlans(hotelId: string): Promise<RatePlan[]> {
    return Array.from(this.ratePlans.values()).filter(p => p.hotelId === hotelId);
  }

  async getAllRatePlans(): Promise<RatePlan[]> {
    return Array.from(this.ratePlans.values());
  }

  async updateRatePlan(planId: string, updates: Partial<RatePlan>): Promise<RatePlan | null> {
    const plan = this.ratePlans.get(planId);
    if (!plan) return null;

    const updated: RatePlan = {
      ...plan,
      ...updates,
      planId, // Prevent planId change
      updatedAt: new Date(),
    };

    this.ratePlans.set(planId, updated);
    return updated;
  }

  async updateChannelRates(
    planId: string,
    channelRates: { channelId: string; rate: number; enabled?: boolean }[],
    restrictions?: RatePlan['restrictions']
  ): Promise<RatePlan | null> {
    const plan = this.ratePlans.get(planId);
    if (!plan) return null;

    channelRates.forEach(update => {
      const channel = plan.channels.find(c => c.channelId === update.channelId);
      if (channel) {
        channel.rate = update.rate;
        if (update.enabled !== undefined) {
          channel.enabled = update.enabled;
        }
      }
    });

    if (restrictions) {
      plan.restrictions = { ...plan.restrictions, ...restrictions };
    }

    plan.updatedAt = new Date();
    this.ratePlans.set(planId, plan);

    return plan;
  }

  async deleteRatePlan(planId: string): Promise<boolean> {
    return this.ratePlans.delete(planId);
  }

  async getChannelRates(hotelId: string, channelId: string): Promise<{
    channelId: string;
    plans: { planId: string; name: string; rate: number }[];
  }> {
    const plans = Array.from(this.ratePlans.values()).filter(
      p => p.hotelId === hotelId && p.channels.some(c => c.channelId === channelId && c.enabled)
    );

    return {
      channelId,
      plans: plans.map(p => {
        const channel = p.channels.find(c => c.channelId === channelId)!;
        return {
          planId: p.planId,
          name: p.name,
          rate: channel.rate,
        };
      }),
    };
  }

  async applyMarkup(planId: string, markupPercentage: number): Promise<RatePlan | null> {
    const plan = this.ratePlans.get(planId);
    if (!plan) return null;

    plan.channels.forEach(channel => {
      channel.rate = Math.round(plan.baseRate * (1 + markupPercentage / 100) * 100) / 100;
    });

    plan.updatedAt = new Date();
    this.ratePlans.set(planId, plan);

    return plan;
  }
}
