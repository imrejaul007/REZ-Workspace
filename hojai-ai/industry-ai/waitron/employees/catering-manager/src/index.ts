/**
 * Catering Manager - Event Catering Agent
 * Part of WAITRON - Restaurant AI Operating System
 */

export interface CateringRequest {
  eventType: 'wedding' | 'corporate' | 'birthday' | 'inauguration' | 'other';
  guestCount: number;
  dateTime: string;
  dietaryRestrictions?: string[];
  preferences?: string[];
  budget?: number;
}

export interface CateringQuote {
  eventType: string;
  guestCount: number;
  dateTime: string;
  menu: CateringMenuItem[];
  pricing: {
    perPerson: number;
    subtotal: number;
    serviceCharge: number;
    taxes: number;
    total: number;
  };
  validUntil: string;
}

export interface CateringMenuItem {
  name: string;
  type: 'veg' | 'non-veg' | 'both';
  servings: number;
  perPerson: number;
}

export class CateringManager {
  private readonly basePricePerPerson: Record<string, number> = {
    wedding: 1200,
    corporate: 800,
    birthday: 600,
    inauguration: 1000,
    other: 700
  };

  /**
   * Generate a catering quote
   */
  async generateQuote(request: CateringRequest): Promise<CateringQuote> {
    const basePrice = this.basePricePerPerson[request.eventType] || 700;

    // Build menu based on event type
    const menu = this.buildMenu(request.eventType, request.guestCount, request.dietaryRestrictions);

    // Calculate pricing
    const perPersonPrice = this.calculatePerPersonPrice(basePrice, request);
    const subtotal = perPersonPrice * request.guestCount;
    const serviceCharge = subtotal * 0.1;
    const taxes = subtotal * 0.18;
    const total = subtotal + serviceCharge + taxes;

    return {
      eventType: request.eventType,
      guestCount: request.guestCount,
      dateTime: request.dateTime,
      menu,
      pricing: {
        perPerson: Math.round(perPersonPrice),
        subtotal: Math.round(subtotal),
        serviceCharge: Math.round(serviceCharge),
        taxes: Math.round(taxes),
        total: Math.round(total)
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Get recommended menu based on event type
   */
  async getRecommendedMenu(eventType: string, guestCount: number): Promise<string[]> {
    const recommendations: Record<string, string[]> = {
      wedding: [
        'Starters: 4 varieties (2 veg, 2 non-veg)',
        'Main Course: Paneer Butter Masala, Dal Makhani, Butter Chicken, Biryani',
        'Desserts: Gulab Jamun, Ice Cream, Cake',
        'Beverages: Soft drinks, Masala Chai, Lassi'
      ],
      corporate: [
        'Starters: 3 varieties (assorted)',
        'Main Course: 2 curries, rice, dal, roti',
        'Desserts: 2 varieties',
        'Beverages: Tea, Coffee, Soft drinks'
      ],
      birthday: [
        'Starters: Pizza, Samosa, Pakode',
        'Main Course: Pasta, Biryani, Chinese',
        'Cake: Customized',
        'Beverages: Mocktails, Juices'
      ]
    };

    return recommendations[eventType] || recommendations.corporate;
  }

  /**
   * Check availability for a date
   */
  async checkAvailability(dateTime: string, guestCount: number): Promise<{
    available: boolean;
    capacity: number;
    message: string;
  }> {
    // Simulate availability check
    const capacity = 500;
    const available = guestCount <= capacity;

    return {
      available,
      capacity,
      message: available
        ? `Great! We can accommodate ${guestCount} guests on ${dateTime}.`
        : `We're fully booked for ${guestCount} guests on ${dateTime}. Maximum capacity is ${capacity}.`
    };
  }

  private buildMenu(
    eventType: string,
    guestCount: number,
    dietaryRestrictions?: string[]
  ): CateringMenuItem[] {
    const isJain = dietaryRestrictions?.includes('Jain');
    const isPureVeg = dietaryRestrictions?.includes('Pure Vegetarian');

    const menu: CateringMenuItem[] = [
      {
        name: 'Starters',
        type: isJain || isPureVeg ? 'veg' : 'both',
        servings: Math.ceil(guestCount / 4),
        perPerson: 150
      },
      {
        name: 'Main Course',
        type: isJain || isPureVeg ? 'veg' : 'both',
        servings: Math.ceil(guestCount / 3),
        perPerson: this.basePricePerPerson[eventType] || 500
      },
      {
        name: 'Desserts',
        type: 'veg',
        servings: Math.ceil(guestCount / 5),
        perPerson: 100
      },
      {
        name: 'Beverages',
        type: 'veg',
        servings: Math.ceil(guestCount / 3),
        perPerson: 80
      }
    ];

    return menu;
  }

  private calculatePerPersonPrice(basePrice: number, request: CateringRequest): number {
    let price = basePrice;

    // Premium events
    if (request.eventType === 'wedding') price *= 1.2;
    if (request.eventType === 'inauguration') price *= 1.3;

    // Budget constraint
    if (request.budget && request.budget < price * request.guestCount) {
      price = Math.min(price, request.budget / request.guestCount);
    }

    // Additional preferences
    if (request.preferences?.includes('premium')) price *= 1.3;
    if (request.preferences?.includes('luxury')) price *= 1.5;

    return price;
  }
}

export default CateringManager;
