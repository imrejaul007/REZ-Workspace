/**
 * REZ StayOwn → Intelligence Connector
 *
 * Connects hotel/guest data to REZ Intelligence
 *
 * Tracks:
 * - Booking patterns
 * - Guest preferences
 * - Travel patterns
 * - Cross-merchant opportunities
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const OFFLINE_TRACKER_URL = process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125';
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL || 'http://localhost:4018';
const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:4129';

// ============================================================================
// Types
// ============================================================================

export interface GuestBooking {
  bookingId: string;
  userId: string;
  hotelId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  purpose: 'business' | 'leisure' | 'medical' | 'other';
  source: 'direct' | 'ota' | 'walkin';
}

export interface GuestStay {
  guestId: string;
  hotelId: string;
  bookingId: string;
  services: {
    type: 'room_service' | 'spa' | 'restaurant' | 'transport';
    amount: number;
    timestamp: string;
  }[];
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface GuestProfile {
  userId: string;
  profile: {
    totalStays: number;
    avgStayDuration: number;
    preferredHotels: string[];
    preferredRoomTypes: string[];
    preferredServices: string[];
    travelPurpose: ('business' | 'leisure' | 'medical')[];
    avgSpending: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
}

export interface GuestFeedback {
  rating: number;
  comment?: string;
}

// ============================================================================
// StayOwn Intelligence Connector
// ============================================================================

class StayOwnIntelligenceConnector {

  // ============================================
  // Guest Journey Tracking
  // ============================================

  /**
   * Track: Booking Created
   */
  async trackBooking(booking: GuestBooking): Promise<void> {
    // Emit event
    await this.emitEvent({
      type: 'stayown.booking.created',
      userId: booking.userId,
      data: {
        bookingId: booking.bookingId,
        hotelId: booking.hotelId,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        purpose: booking.purpose
      }
    });

    // Update graph
    await this.updateGraph({
      type: 'booked_hotel',
      userId: booking.userId,
      entityId: booking.hotelId,
      properties: {
        bookingId: booking.bookingId,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        purpose: booking.purpose
      }
    });

    // Update intent signals
    await this.updateIntent({
      userId: booking.userId,
      intent: `hotel_${booking.purpose}`,
      strength: 0.9,
      metadata: {
        hotelId: booking.hotelId,
        checkIn: booking.checkIn
      }
    });
  }

  /**
   * Track: Check-in
   */
  async trackCheckIn(guestId: string, hotelId: string, bookingId: string): Promise<void> {
    await this.emitEvent({
      type: 'stayown.check_in',
      userId: guestId,
      data: { hotelId, bookingId }
    });

    await this.updateGraph({
      type: 'checked_in',
      userId: guestId,
      entityId: hotelId,
      properties: { bookingId, timestamp: new Date().toISOString() }
    });
  }

  /**
   * Track: Guest Service
   */
  async trackService(service: {
    guestId: string;
    hotelId: string;
    type: string;
    amount: number;
    timestamp: string;
  }): Promise<void> {
    await this.emitEvent({
      type: 'stayown.service.consumed',
      userId: service.guestId,
      data: {
        hotelId: service.hotelId,
        serviceType: service.type,
        amount: service.amount
      }
    });

    // Update spending patterns
    await this.updateSpendingProfile(service.guestId, service.amount);
  }

  /**
   * Track: Check-out
   */
  async trackCheckOut(guestId: string, hotelId: string, feedback?: GuestFeedback): Promise<void> {
    await this.emitEvent({
      type: 'stayown.check_out',
      userId: guestId,
      data: { hotelId, feedback }
    });
  }

  // ============================================
  // AI Recommendations
  // ============================================

  /**
   * Get upsell recommendations for guest
   */
  async getUpsells(guestId: string, hotelId: string): Promise<{
    upsells: {
      type: string;
      title: string;
      description: string;
      price: number;
      probability: number;
    }[];
  }> {
    const guestProfile = await this.getGuestProfile(guestId);
    const recommendations: unknown[] = [];

    // Room upgrade
    if (guestProfile?.profile?.loyaltyTier === 'gold' || (guestProfile?.profile?.avgSpending ?? 0) > 5000) {
      recommendations.push({
        type: 'room_upgrade',
        title: 'Upgrade to Suite',
        description: 'Get 20% off on premium rooms',
        price: 2000,
        probability: 0.7
      });
    }

    // Spa
    if (guestProfile?.profile?.preferredServices?.includes('spa')) {
      recommendations.push({
        type: 'spa',
        title: 'Spa Package',
        description: '50% off on spa services',
        price: 1500,
        probability: 0.8
      });
    }

    // Restaurant
    recommendations.push({
      type: 'restaurant',
      title: 'Dinner at our restaurant',
      description: '15% off for in-house guests',
      price: 500,
      probability: 0.6
    });

    return { upsells: recommendations };
  }

  /**
   * Get pre-arrival personalization
   */
  async getPreArrival(guestId: string): Promise<{
    preferences: {
      roomTemperature: number;
      pillowType: string;
      welcomeDrink: string;
      earlyCheckIn: boolean;
    };
    nearbyRecommendations: {
      type: string;
      name: string;
      distance: string;
    }[];
  }> {
    const profile = await this.getGuestProfile(guestId);

    return {
      preferences: {
        roomTemperature: 22,
        pillowType: 'memory_foam',
        welcomeDrink: profile?.profile?.preferredServices?.includes('spa') ? 'detox_water' : 'fresh_juice',
        earlyCheckIn: profile?.profile?.travelPurpose?.includes('business') ?? false
      },
      nearbyRecommendations: [
        { type: 'restaurant', name: 'Pizza Palace', distance: '200m' },
        { type: 'gym', name: 'FitLife Gym', distance: '500m' }
      ]
    };
  }

  // ============================================
  // Cross-Merchant Opportunities
  // ============================================

  /**
   * Get cross-merchant offers based on stay
   */
  async getCrossMerchantOffers(guestId: string, hotelId: string): Promise<{
    offers: {
      merchantName: string;
      merchantId: string;
      offer: string;
      cashback: number;
      distance: string;
    }[];
  }> {
    const profile = await this.getGuestProfile(guestId);
    const offers: unknown[] = [];

    // Restaurant near hotel
    offers.push({
      merchantName: 'Pizza Palace',
      merchantId: 'merchant_pizza_123',
      offer: '15% off for hotel guests',
      cashback: 5,
      distance: '200m'
    });

    // Gym (if leisure traveler)
    if (profile?.profile?.travelPurpose?.includes('leisure')) {
      offers.push({
        merchantName: 'FitLife Gym',
        merchantId: 'merchant_gym_456',
        offer: 'Day pass ₹199 (hotel guests)',
        cashback: 3,
        distance: '500m'
      });
    }

    // Spa (if wellness traveler)
    if (profile?.profile?.preferredServices?.includes('spa')) {
      offers.push({
        merchantName: 'Serenity Spa',
        merchantId: 'merchant_spa_789',
        offer: '20% off first visit',
        cashback: 8,
        distance: '1km'
      });
    }

    return { offers };
  }

  // ============================================
  // Private Methods
  // ============================================

  private async emitEvent(event: {
    type: string;
    userId?: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(
        `${process.env.EVENT_BUS_URL || 'http://localhost:4025'}/api/events`,
        {
          ...event,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to emit event:', error);
    }
  }

  private async updateGraph(data: {
    type: string;
    userId: string;
    entityId: string;
    properties: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${GRAPH_SERVICE_URL}/api/signals`, data);
    } catch (error) {
      console.error('Failed to update graph:', error);
    }
  }

  private async updateIntent(data: {
    userId: string;
    intent: string;
    strength: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${INTENT_SERVICE_URL}/api/intents`, data);
    } catch (error) {
      console.error('Failed to update intent:', error);
    }
  }

  private async updateSpendingProfile(guestId: string, amount: number): Promise<void> {
    try {
      await axios.post(`${OFFLINE_TRACKER_URL}/api/profiles/${guestId}/spending`, {
        amount
      });
    } catch (error) {
      console.error('Failed to update spending:', error);
    }
  }

  private async getGuestProfile(guestId: string): Promise<GuestProfile | null> {
    try {
      const response = await axios.get(
        `${OFFLINE_TRACKER_URL}/api/profiles/${guestId}`,
        { timeout: 3000 }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const stayownConnector = new StayOwnIntelligenceConnector();
export default stayownConnector;
