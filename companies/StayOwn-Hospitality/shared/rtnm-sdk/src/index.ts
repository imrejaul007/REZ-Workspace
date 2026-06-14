/**
 * RTNM Ecosystem Integration SDK
 *
 * Universal SDK for connecting StayOwn Hotel OS to all RTNM sister companies.
 * Use this SDK in any RTNM service to connect to StayOwn.
 *
 * @example
 * import { RTNMHotelSDK } from './rtnm-sdk';
 *
 * const hotel = new RTNMHotelSDK({ stayOwnUrl: 'http://localhost:3899' });
 *
 * // Book hotel for guest
 * await hotel.bookHotel({ guestId, destination: 'Bangalore', checkIn, checkOut });
 *
 * // Send flight update
 * await hotel.updateFlight({ guestId, bookingId, delayMinutes: 120 });
 *
 * // Get corporate booking status
 * await hotel.getCorporateBooking(bookingId);
 */

export interface RTNMConfig {
  stayOwnUrl?: string;
  stayBotUrl?: string;
  memoryUrl?: string;
  genieUrl?: string;
  authUrl?: string;
  paymentUrl?: string;
  walletUrl?: string;
  brandPulseUrl?: string;
  timeout?: number;
}

export interface Guest {
  guestId: string;
  name?: string;
  email?: string;
  phone?: string;
  preferences?: GuestPreferences;
}

export interface GuestPreferences {
  temperature?: number;
  pillow?: 'firm' | 'soft' | 'memory';
  water?: 'still' | 'sparkling';
  breakfast?: string[];
  dietary?: string[];
  language?: string;
  roomFloor?: 'high' | 'low' | 'any';
  amenities?: string[];
  checkInTime?: string;
}

export interface HotelBooking {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount?: number;
  confirmationCode?: string;
}

export interface FlightUpdate {
  guestId: string;
  bookingId: string;
  flightNumber: string;
  originalArrival: string;
  newArrival: string;
  delayMinutes: number;
  reason?: string;
}

export interface CorporateBookingRequest {
  companyId: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  requirements: {
    conferenceRooms?: number;
    teamActivities?: boolean;
    dining?: 'included' | 'optional' | 'none';
    transport?: 'airport' | 'local' | 'none';
  };
  budget?: {
    perRoom: number;
    total: number;
  };
}

export interface ServiceRequest {
  guestId: string;
  roomId?: string;
  serviceType: 'minibar' | 'restaurant' | 'spa' | 'housekeeping' | 'parking' | 'concierge' | 'maintenance';
  action: string;
  details?: Record<string, any>;
}

export interface CheckoutResult {
  success: boolean;
  guestId: string;
  bookingId: string;
  folio: {
    charges: Array<{ description: string; amount: number }>;
    total: number;
  };
  payment: 'completed' | 'pending' | 'failed';
  pointsEarned: number;
  invoiceUrl?: string;
}

export interface PreArrivalData {
  guestId: string;
  bookingId: string;
  preferences: GuestPreferences;
  flightInfo?: {
    flightNumber: string;
    arrivalTime: string;
  };
}

export interface RTNMHotelResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
  timestamp: string;
}

/**
 * RTNM Hotel SDK - Connect any RTNM service to StayOwn Hotel OS
 */
export class RTNMHotelSDK {
  private config: Required<RTNMConfig>;

  constructor(config: RTNMConfig = {}) {
    this.config = {
      stayOwnUrl: config.stayOwnUrl || 'http://localhost:3899',
      stayBotUrl: config.stayBotUrl || 'http://localhost:4840',
      memoryUrl: config.memoryUrl || 'http://localhost:4520',
      genieUrl: config.genieUrl || 'http://localhost:4703',
      authUrl: config.authUrl || 'http://localhost:4002',
      paymentUrl: config.paymentUrl || 'http://localhost:4001',
      walletUrl: config.walletUrl || 'http://localhost:4004',
      brandPulseUrl: config.brandPulseUrl || 'http://localhost:4770',
      timeout: config.timeout || 30000,
    };
  }

  private async fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-RTNM-SDK': 'true',
        ...options.headers,
      },
      timeout: this.config.timeout,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  // ============================================
  // HOTEL BOOKING
  // ============================================

  /**
   * Search hotels
   */
  async searchHotels(params: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    rooms?: number;
    filters?: Record<string, any>;
  }): Promise<RTNMHotelResponse<{ hotels: any[] }>> {
    return this.fetch(`${this.config.stayOwnUrl}/api/hotels/search`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Book a hotel room
   */
  async bookHotel(params: {
    guestId: string;
    hotelId: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    preferences?: GuestPreferences;
    paymentMethod?: string;
  }): Promise<RTNMHotelResponse<HotelBooking>> {
    return this.fetch(`${this.config.stayBotUrl}/api/booking`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Book hotel via Genie (AI-powered automatic booking)
   */
  async bookHotelViaGenie(params: {
    userId: string;
    destination: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    preferences?: GuestPreferences;
  }): Promise<RTNMHotelResponse<{ booking: HotelBooking; genieNote: string }>> {
    return this.fetch(`${this.config.genieUrl}/api/genie/${params.userId}/book-hotel`, {
      method: 'POST',
      body: JSON.stringify({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
        preferences: params.preferences,
      }),
    });
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<RTNMHotelResponse<HotelBooking>> {
    return this.fetch(`${this.config.stayOwnUrl}/api/bookings/${bookingId}`);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(params: {
    bookingId: string;
    guestId: string;
    reason?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/booking/cancel`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Extend stay
   */
  async extendStay(params: {
    bookingId: string;
    newCheckOut: string;
    paymentMethod?: string;
  }): Promise<RTNMHotelResponse<HotelBooking>> {
    return this.fetch(`${this.config.stayBotUrl}/api/booking/extend`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // FLIGHT TRACKING (AIRZY)
  // ============================================

  /**
   * Send flight update to hotel (Airzy integration)
   */
  async updateFlight(update: FlightUpdate): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/flight-update`, {
      method: 'POST',
      body: JSON.stringify(update),
    });
  }

  /**
   * Get guest flight status
   */
  async getFlightStatus(guestId: string, bookingId?: string): Promise<RTNMHotelResponse> {
    const params = bookingId ? `?bookingId=${bookingId}` : '';
    return this.fetch(`${this.config.stayOwnUrl}/api/airzy/guest/${guestId}/flight-status${params}`);
  }

  /**
   * Register flight for tracking
   */
  async registerFlight(params: {
    guestId: string;
    bookingId: string;
    flightNumber: string;
    arrivalDate: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/airzy/guest/${params.guestId}/register-flight`, {
      method: 'POST',
      body: JSON.stringify({
        bookingId: params.bookingId,
        flightNumber: params.flightNumber,
        arrivalDate: params.arrivalDate,
      }),
    });
  }

  // ============================================
  // CORPORATE BOOKING (CORPPERKS)
  // ============================================

  /**
   * Create corporate booking (via CorpPerks CoPilot)
   */
  async createCorporateBooking(request: CorporateBookingRequest): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/corporate-booking`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get corporate booking status
   */
  async getCorporateBooking(bookingId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/corp/bookings/${bookingId}`);
  }

  /**
   * Cancel corporate booking
   */
  async cancelCorporateBooking(params: {
    bookingId: string;
    companyId: string;
    reason: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/corp/bookings/${params.bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: params.reason, companyId: params.companyId }),
    });
  }

  // ============================================
  // HOTEL SERVICES
  // ============================================

  /**
   * Request a hotel service
   */
  async requestService(request: ServiceRequest): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/service/${request.serviceType}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get room service menu
   */
  async getRoomServiceMenu(roomId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/room-service/${roomId}/menu`);
  }

  /**
   * Book restaurant
   */
  async bookRestaurant(params: {
    guestId: string;
    restaurantId: string;
    date: string;
    time: string;
    guests: number;
    preferences?: { seating?: string; occasion?: string };
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/service/restaurant`, {
      method: 'POST',
      body: JSON.stringify({ ...params, action: 'book' }),
    });
  }

  /**
   * Book spa treatment
   */
  async bookSpa(params: {
    guestId: string;
    treatment: string;
    date: string;
    time: string;
    therapist?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/service/spa`, {
      method: 'POST',
      body: JSON.stringify({ ...params, action: 'book' }),
    });
  }

  /**
   * Request housekeeping
   */
  async requestHousekeeping(params: {
    guestId: string;
    roomId: string;
    type: 'clean' | 'turndown' | 'towels' | 'supplies';
    scheduledTime?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/service/housekeeping`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Request airport transfer
   */
  async requestAirportTransfer(params: {
    guestId: string;
    hotelId: string;
    flightNumber: string;
    pickupTime: string;
    pickupType?: 'pickup' | 'dropoff';
    vehicleType?: 'standard' | 'premium' | 'luxury';
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/airport-transfer`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // CHECKOUT
  // ============================================

  /**
   * Process guest checkout
   */
  async checkout(guestId: string, bookingId?: string): Promise<RTNMHotelResponse<CheckoutResult>> {
    return this.fetch(`${this.config.stayBotUrl}/api/checkout`, {
      method: 'POST',
      body: JSON.stringify({ guestId, bookingId }),
    });
  }

  /**
   * Get folio/bill
   */
  async getFolio(guestId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/service/checkout`, {
      method: 'POST',
      body: JSON.stringify({ guestId, action: 'folio' }),
    });
  }

  // ============================================
  // GUEST PREFERENCES & MEMORY
  // ============================================

  /**
   * Get guest preferences
   */
  async getGuestPreferences(guestId: string): Promise<RTNMHotelResponse<{ preferences: GuestPreferences }>> {
    return this.fetch(`${this.config.stayBotUrl}/api/guest/${guestId}/preferences`);
  }

  /**
   * Update guest preferences
   */
  async updateGuestPreferences(params: {
    guestId: string;
    preferences: Partial<GuestPreferences>;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/guest/${params.guestId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(params.preferences),
    });
  }

  /**
   * Get Genie briefing
   */
  async getGuestBriefing(guestId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.genieUrl}/api/genie/${guestId}/briefing`);
  }

  /**
   * Remember a fact about guest
   */
  async rememberGuestFact(params: {
    guestId: string;
    fact: string;
    category?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.genieUrl}/api/genie/${params.guestId}/remember`, {
      method: 'POST',
      body: JSON.stringify({ fact: params.fact, category: params.category }),
    });
  }

  // ============================================
  // PAYMENT & WALLET
  // ============================================

  /**
   * Get loyalty points balance
   */
  async getLoyaltyBalance(guestId: string): Promise<RTNMHotelResponse<{ balance: number; tier: string }>> {
    return this.fetch(`${this.config.walletUrl}/wallet/balance?guestId=${guestId}`);
  }

  /**
   * Redeem loyalty points
   */
  async redeemPoints(params: {
    guestId: string;
    points: number;
    rewardId?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/rabtul/wallet`, {
      method: 'POST',
      body: JSON.stringify({ ...params, action: 'redeem' }),
    });
  }

  /**
   * Process payment
   */
  async processPayment(params: {
    guestId: string;
    amount: number;
    currency?: string;
    method: 'upi' | 'card' | 'wallet' | 'corporate';
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.paymentUrl}/payments/order`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // PRE-ARRIVAL
  // ============================================

  /**
   * Prepare room for guest arrival
   */
  async prepareRoom(data: PreArrivalData): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/pre-arrival`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get upcoming arrivals for hotel
   */
  async getUpcomingArrivals(hotelId: string, date?: string): Promise<RTNMHotelResponse> {
    const params = date ? `?date=${date}` : '';
    return this.fetch(`${this.config.stayOwnUrl}/api/airzy/hotel/${hotelId}/upcoming-arrivals${params}`);
  }

  // ============================================
  // HOTEL INTELLIGENCE
  // ============================================

  /**
   * Get finance analytics (RIDZA)
   */
  async getFinanceAnalytics(hotelId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/finance/${hotelId}`);
  }

  /**
   * Get brand reputation (BrandPulse)
   */
  async getBrandReputation(hotelId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/reputation/${hotelId}`);
  }

  // ============================================
  // BRANDPULSE INTEGRATION
  // ============================================

  /**
   * Get brand overview from BrandPulse
   */
  async getBrandOverview(brandId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/analytics/brand/${brandId}/overview`);
  }

  /**
   * Get sentiment trend from BrandPulse
   */
  async getSentimentTrend(brandId: string, period?: 'day' | 'week' | 'month'): Promise<RTNMHotelResponse> {
    const params = period ? `?period=${period}` : '';
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/analytics/brand/${brandId}/sentiment${params}`);
  }

  /**
   * Get rating distribution from BrandPulse
   */
  async getRatingDistribution(brandId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/analytics/brand/${brandId}/ratings`);
  }

  /**
   * Get aspect analysis from BrandPulse
   */
  async getAspectAnalysis(brandId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/analytics/brand/${brandId}/aspects`);
  }

  /**
   * Create a review in BrandPulse
   */
  async createReview(params: {
    brandId: string;
    tenantId: string;
    source: 'google' | 'yelp' | 'tripadvisor' | 'facebook' | 'direct' | 'internal';
    content: string;
    rating: number;
    author: { name: string; isVerified?: boolean };
    title?: string;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/reviews`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get active alerts from BrandPulse
   */
  async getBrandAlerts(brandId: string, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<RTNMHotelResponse> {
    const params = severity ? `?severity=${severity}` : '';
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/analytics/brand/${brandId}/alerts${params}`);
  }

  /**
   * Analyze text sentiment
   */
  async analyzeSentiment(text: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.brandPulseUrl}/api/v1/sentiment/analyze`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Create marketing campaign (AdBazaar)
   */
  async createMarketingCampaign(params: {
    hotelId: string;
    targetAudience: string;
    objective: string;
    budget: number;
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/marketing/campaign`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create procurement request (Nexha)
   */
  async createProcurement(params: {
    hotelId: string;
    items: Array<{ name: string; quantity: number; unit: string }>;
    priority?: 'urgent' | 'normal' | 'low';
  }): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/procurement`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Get full guest journey/experience
   */
  async getGuestExperience(guestId: string): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/api/rtnm/experience/${guestId}`);
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayBotUrl}/api/services/status`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<RTNMHotelResponse> {
    return this.fetch(`${this.config.stayOwnUrl}/health`);
  }
}

// ============================================
// HOJAI HOTEL AGENTS SDK
// ============================================

export interface HotelAgent {
  name: string;
  role: string;
  capabilities: string[];
}

/**
 * Get hotel AI agents
 */
export async function getHotelAgents(): Promise<HotelAgent[]> {
  return [
    {
      name: 'StayBot',
      role: 'AI Concierge',
      capabilities: ['answer_questions', 'book_services', 'handle_complaints', 'checkout'],
    },
    {
      name: 'RoomTwin',
      role: 'Room Personalization',
      capabilities: ['set_temperature', 'control_lights', 'prepare_room', 'detect_issues'],
    },
    {
      name: 'GuestTwin',
      role: 'Guest Memory',
      capabilities: ['remember_preferences', 'predict_needs', 'personalize_experience'],
    },
    {
      name: 'RevenueTwin',
      role: 'Revenue Management',
      capabilities: ['dynamic_pricing', 'upsell', 'forecast', 'optimize_revenue'],
    },
    {
      name: 'RestaurantTwin',
      role: 'Dining Intelligence',
      capabilities: ['recommend_dishes', 'track_preferences', 'forecast_demand'],
    },
    {
      name: 'BusinessTwin',
      role: 'Business Intelligence',
      capabilities: ['track_kpis', 'generate_reports', 'recommend_actions'],
    },
  ];
}

export default RTNMHotelSDK;
