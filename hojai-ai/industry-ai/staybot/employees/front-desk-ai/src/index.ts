/**
 * Front Desk AI - Reception Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  room: string;
  preferences: string[];
  loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
  requests: string[];
}

export interface CheckInRequest {
  name: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  roomType: 'standard' | 'deluxe' | 'suite';
  preferences?: string[];
}

export interface CheckOutResponse {
  guestName: string;
  room: string;
  nights: number;
  roomRate: number;
  services: number;
  taxes: number;
  total: number;
  feedbackRequest: string;
}

export class FrontDeskAI {
  private readonly roomRates: Record<string, number> = {
    'standard': 3000,
    'deluxe': 5000,
    'suite': 10000
  };

  /**
   * Process guest check-in
   */
  async checkIn(request: CheckInRequest): Promise<{
    success: boolean;
    guestId: string;
    room: string;
    welcomeMessage: string;
    upgradeOffer?: string;
  }> {
    const guestId = uuidv4();
    const room = `${Math.floor(Math.random() * 3) + 1}0${Math.floor(Math.random() * 2) + 1}`;

    // AI generates personalized welcome
    const welcomeMessage = this.generateWelcomeMessage(request.name, request.roomType);

    // Check for upgrade opportunity
    const upgradeOffer = this.shouldOfferUpgrade(request.roomType)
      ? 'Would you like to upgrade to our Deluxe room for just ₹2000/night? It includes a mini-bar and city view!'
      : undefined;

    return {
      success: true,
      guestId,
      room,
      welcomeMessage,
      upgradeOffer
    };
  }

  /**
   * Process guest check-out
   */
  async checkOut(guestId: string): Promise<CheckOutResponse | null> {
    // Simulate fetching guest data
    const guest = this.getMockGuest(guestId);
    if (!guest) return null;

    const checkInDate = new Date(guest.checkIn);
    const checkOutDate = new Date(guest.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const roomRate = this.roomRates[guest.loyaltyTier === 'standard' ? 'standard' : 'deluxe'] || 3000;
    const subtotal = nights * roomRate;
    const services = 0;
    const taxes = subtotal * 0.18;
    const total = subtotal + services + taxes;

    return {
      guestName: guest.name,
      room: guest.room,
      nights,
      roomRate,
      services,
      taxes,
      total: Math.round(total),
      feedbackRequest: 'We hope you enjoyed your stay! Please rate your experience with our AI services.'
    };
  }

  /**
   * Handle guest complaint
   */
  async handleComplaint(
    guestId: string,
    complaint: string
  ): Promise<{
    success: boolean;
    ticketId: string;
    aiResponse: string;
    escalation: boolean;
    compensation?: string;
  }> {
    const ticketId = uuidv4();
    const analysis = this.analyzeComplaint(complaint);

    return {
      success: true,
      ticketId,
      aiResponse: analysis.response,
      escalation: analysis.escalation,
      compensation: analysis.compensation
    };
  }

  /**
   * Handle room change request
   */
  async requestRoomChange(
    guestId: string,
    newRoomType?: string
  ): Promise<{
    success: boolean;
    newRoom?: string;
    message: string;
  }> {
    const newRoom = `${Math.floor(Math.random() * 3) + 1}0${Math.floor(Math.random() * 2) + 1}`;

    return {
      success: true,
      newRoom,
      message: `Room change confirmed! Your new room is ${newRoom}. Bellhop will assist with luggage in 5 minutes.`
    };
  }

  /**
   * Get estimated bill
   */
  async getBillEstimate(guestId: string): Promise<{
    currentCharges: number;
    estimatedTotal: number;
    breakdown: { item: string; amount: number }[];
  }> {
    return {
      currentCharges: Math.round(Math.random() * 5000),
      estimatedTotal: Math.round(Math.random() * 10000),
      breakdown: [
        { item: 'Room Charges', amount: 6000 },
        { item: 'Room Service', amount: 450 },
        { item: 'Spa', amount: 2500 },
        { item: 'Taxes', amount: 1611 }
      ]
    };
  }

  /**
   * Verify guest identity
   */
  async verifyGuest(
    phone: string,
    name: string
  ): Promise<{ verified: boolean; guestId?: string; message: string }> {
    // Simulate verification
    const verified = Math.random() > 0.3;

    if (verified) {
      return {
        verified: true,
        guestId: uuidv4(),
        message: 'Guest verified successfully. Welcome back!'
      };
    }

    return {
      verified: false,
      message: 'Guest not found. Please verify the phone number or check-in details.'
    };
  }

  private generateWelcomeMessage(name: string, roomType: string): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return `${greeting}, ${name}! Welcome to our hotel. Your ${roomType} room is ready. ` +
      'Our AI Concierge is here to help you 24/7. Just ask!';
  }

  private shouldOfferUpgrade(currentType: string): boolean {
    return Math.random() > 0.6 && currentType === 'standard';
  }

  private analyzeComplaint(complaint: string): {
    response: string;
    escalation: boolean;
    compensation?: string;
  } {
    const lower = complaint.toLowerCase();

    if (lower.includes('noise') || lower.includes('loud')) {
      return {
        response: 'I understand the noise issue. I am arranging a room change to a quieter floor and offering a complimentary drink. Escalating to manager for immediate attention.',
        escalation: true,
        compensation: 'Complimentary drink + room upgrade option'
      };
    }

    if (lower.includes('clean') || lower.includes('dirty')) {
      return {
        response: 'I apologize for the cleanliness issue. Housekeeping will be at your room in 10 minutes with fresh linens. Complimentary breakfast is being added to your stay.',
        escalation: false,
        compensation: 'Complimentary breakfast'
      };
    }

    if (lower.includes('wifi') || lower.includes('internet')) {
      return {
        response: 'I see you are having WiFi issues. Your password has been reset and sent to your room. Technical team is on the way.',
        escalation: false
      };
    }

    return {
      response: 'I understand your concern. Let me help resolve this immediately.',
      escalation: false
    };
  }

  private getMockGuest(guestId: string): Guest | null {
    return {
      id: guestId,
      name: 'Guest',
      phone: '1234567890',
      email: 'guest@email.com',
      checkIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      checkOut: new Date().toISOString(),
      room: '201',
      preferences: [],
      loyaltyTier: 'gold',
      requests: []
    };
  }
}

export default FrontDeskAI;