/**
 * STAYBOT - Guest Service
 * Handles all guest-related operations with AI-powered personalization
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger';
import {
  Guest,
  GuestStatus,
  LoyaltyTier,
  GuestPreference,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types';

// In-memory stores
const guests: Map<string, Guest> = new Map();
const complaints: Map<string, Complaint> = new Map();

// External service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

// Loyalty point multipliers
const LOYALTY_MULTIPLIERS: Record<LoyaltyTier, number> = {
  standard: 1,
  silver: 1.25,
  gold: 1.5,
  platinum: 2,
};

export class GuestService {
  /**
   * Check in a new guest
   */
  async checkIn(data: {
    hotelId: string;
    name: string;
    phone: string;
    email?: string;
    checkIn: Date;
    checkOut: Date;
    roomNumber: string;
    roomType: 'standard' | 'deluxe' | 'suite' | 'presidential';
    preferences?: GuestPreference[];
  }): Promise<{ success: boolean; guest?: Guest; welcomeMessage?: string; error?: string }> {
    try {
      const guestId = `GUEST-${Date.now().toString(36).toUpperCase()}`;

      const guest: Guest = {
        guestId,
        hotelId: data.hotelId,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        status: 'checked-in',
        loyaltyTier: 'standard',
        preferences: data.preferences || [],
        requests: [],
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      guests.set(guestId, guest);

      // Generate welcome message using AI
      const welcomeMessage = this.generateWelcomeMessage(guest);

      // Send welcome notification
      await this.sendNotification(guest.phone, welcomeMessage);

      // Sync to HOJAI
      await this.syncToHOJAI('guest', 'checkin', guest);

      logger.info(`Guest checked in: ${guestId}`, {
        guestId,
        hotelId: data.hotelId,
        name: data.name,
        roomNumber: data.roomNumber,
      });

      return { success: true, guest, welcomeMessage };
    } catch (error: any) {
      logger.error(`Check-in failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check out a guest
   */
  async checkOut(
    guestId: string
  ): Promise<{ success: boolean; guest?: Guest; feedbackRequest?: string; error?: string }> {
    try {
      const guest = guests.get(guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      // Calculate stay duration and earned points
      const nights = Math.ceil(
        (new Date(guest.checkOut).getTime() - new Date(guest.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const earnedPoints = nights * 100 * LOYALTY_MULTIPLIERS[guest.loyaltyTier];

      guest.status = 'checked-out';
      guest.loyaltyPoints += earnedPoints;
      guest.updatedAt = new Date();

      // Check for tier upgrade
      this.checkTierUpgrade(guest);
      guests.set(guestId, guest);

      // Generate feedback request
      const feedbackRequest = `Thank you for staying with us, ${guest.name}! ` +
        `You earned ${earnedPoints} loyalty points. ` +
        `We would love to hear about your experience. Please rate us on a scale of 1-10.`;

      // Send checkout notification
      await this.sendNotification(guest.phone, feedbackRequest);

      // Sync to HOJAI
      await this.syncToHOJAI('guest', 'checkout', guest);

      logger.info(`Guest checked out: ${guestId}`, {
        guestId,
        name: guest.name,
        nights,
        earnedPoints,
      });

      return { success: true, guest, feedbackRequest };
    } catch (error: any) {
      logger.error(`Check-out failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get guest by ID
   */
  async getGuest(guestId: string): Promise<Guest | null> {
    return guests.get(guestId) || null;
  }

  /**
   * Get guest by phone
   */
  async getGuestByPhone(phone: string): Promise<Guest | null> {
    return (
      Array.from(guests.values()).find(
        (g) => g.phone === phone && g.status === 'checked-in'
      ) || null
    );
  }

  /**
   * Get all guests for a hotel
   */
  async getGuestsByHotel(
    hotelId: string,
    filters?: {
      status?: GuestStatus;
      floor?: number;
    }
  ): Promise<Guest[]> {
    let results = Array.from(guests.values()).filter((g) => g.hotelId === hotelId);

    if (filters?.status) {
      results = results.filter((g) => g.status === filters.status);
    }

    return results.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(
    guestId: string,
    preferences: GuestPreference[]
  ): Promise<{ success: boolean; guest?: Guest; error?: string }> {
    const guest = guests.get(guestId);
    if (!guest) {
      return { success: false, error: 'Guest not found' };
    }

    guest.preferences = preferences;
    guest.updatedAt = new Date();
    guests.set(guestId, guest);

    logger.info(`Guest preferences updated: ${guestId}`, {
      guestId,
      preferencesCount: preferences.length,
    });

    return { success: true, guest };
  }

  /**
   * Add request to guest
   */
  async addGuestRequest(
    guestId: string,
    request: string
  ): Promise<{ success: boolean; guest?: Guest; error?: string }> {
    const guest = guests.get(guestId);
    if (!guest) {
      return { success: false, error: 'Guest not found' };
    }

    guest.requests.push(request);
    guest.updatedAt = new Date();
    guests.set(guestId, guest);

    logger.info(`Guest request added: ${guestId}`, {
      guestId,
      request,
    });

    return { success: true, guest };
  }

  /**
   * Create a complaint
   */
  async createComplaint(data: {
    hotelId: string;
    guestId: string;
    roomNumber: string;
    category: ComplaintCategory;
    description: string;
    priority?: ComplaintPriority;
    phone?: string;
  }): Promise<{ success: boolean; complaint?: Complaint; aiResponse?: string; error?: string }> {
    try {
      const complaintId = `COMP-${Date.now().toString(36).toUpperCase()}`;

      const complaint: Complaint = {
        complaintId,
        hotelId: data.hotelId,
        guestId: data.guestId,
        roomNumber: data.roomNumber,
        category: data.category,
        description: data.description,
        priority: data.priority || 'medium',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      complaints.set(complaintId, complaint);

      // Generate AI response based on complaint type
      const aiResponse = this.generateComplaintResponse(complaint);

      // Send notification for high priority
      if (complaint.priority === 'high' || complaint.priority === 'critical') {
        await this.sendNotification(
          data.phone || '',
          aiResponse
        );
      }

      logger.info(`Complaint created: ${complaintId}`, {
        complaintId,
        category: data.category,
        priority: complaint.priority,
      });

      return { success: true, complaint, aiResponse };
    } catch (error: any) {
      logger.error(`Complaint creation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get complaints by hotel
   */
  async getComplaintsByHotel(
    hotelId: string,
    filters?: {
      status?: ComplaintStatus;
      priority?: ComplaintPriority;
    }
  ): Promise<Complaint[]> {
    let results = Array.from(complaints.values()).filter(
      (c) => c.hotelId === hotelId
    );

    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    if (filters?.priority) {
      results = results.filter((c) => c.priority === filters.priority);
    }

    return results.sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Resolve a complaint
   */
  async resolveComplaint(
    complaintId: string,
    resolution: string,
    compensation?: string
  ): Promise<{ success: boolean; complaint?: Complaint; error?: string }> {
    const complaint = complaints.get(complaintId);
    if (!complaint) {
      return { success: false, error: 'Complaint not found' };
    }

    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.compensation = compensation;
    complaint.resolvedAt = new Date();
    complaint.updatedAt = new Date();

    complaints.set(complaintId, complaint);

    logger.info(`Complaint resolved: ${complaintId}`, {
      complaintId,
      compensation,
    });

    return { success: true, complaint };
  }

  /**
   * Get guest statistics
   */
  async getGuestStats(hotelId: string): Promise<{
    total: number;
    checkedIn: number;
    checkedOut: number;
    byTier: Record<LoyaltyTier, number>;
    avgStayDuration: number;
  }> {
    const hotelGuests = Array.from(guests.values()).filter(
      (g) => g.hotelId === hotelId
    );

    const checkedIn = hotelGuests.filter((g) => g.status === 'checked-in').length;
    const checkedOut = hotelGuests.filter((g) => g.status === 'checked-out').length;

    const byTier: Record<LoyaltyTier, number> = {
      standard: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    hotelGuests.forEach((g) => {
      byTier[g.loyaltyTier]++;
    });

    // Calculate average stay duration
    const completedGuests = hotelGuests.filter(
      (g) => g.status === 'checked-out' && g.checkIn && g.checkOut
    );
    const avgStayDuration =
      completedGuests.length > 0
        ? completedGuests.reduce((sum, g) => {
            const nights = Math.ceil(
              (new Date(g.checkOut).getTime() - new Date(g.checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
            );
            return sum + nights;
          }, 0) / completedGuests.length
        : 0;

    return {
      total: hotelGuests.length,
      checkedIn,
      checkedOut,
      byTier,
      avgStayDuration: Math.round(avgStayDuration * 10) / 10,
    };
  }

  // Private helper methods

  private generateWelcomeMessage(guest: Guest): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const tierMessages: Record<LoyaltyTier, string> = {
      standard: '',
      silver: ' Welcome back! We have your favorite room ready.',
      gold: ' Gold member welcome! Enjoy complimentary late checkout.',
      platinum: ' Platinum member! Your suite is ready with welcome amenities.',
    };

    return `${greeting}, ${guest.name}! Welcome to our hotel. ` +
      `Your ${guest.roomType} room ${guest.roomNumber} is ready. ` +
      `${tierMessages[guest.loyaltyTier]} ` +
      'Our AI Concierge is available 24/7. Just say "Hey Genie" for any assistance!';
  }

  private checkTierUpgrade(guest: Guest): void {
    const points = guest.loyaltyPoints;
    let newTier: LoyaltyTier = 'standard';

    if (points >= 10000) newTier = 'platinum';
    else if (points >= 5000) newTier = 'gold';
    else if (points >= 2000) newTier = 'silver';

    if (newTier !== guest.loyaltyTier) {
      const oldTier = guest.loyaltyTier;
      guest.loyaltyTier = newTier;
      logger.info(`Guest tier upgraded: ${guest.guestId}`, {
        guestId: guest.guestId,
        from: oldTier,
        to: newTier,
      });
    }
  }

  private generateComplaintResponse(complaint: Complaint): string {
    const categoryResponses: Record<ComplaintCategory, string> = {
      room: 'We apologize for the room issue. Our housekeeping team has been notified and will address it within 15 minutes.',
      cleanliness: 'We apologize for the cleanliness issue. Fresh linens and a deep clean are being arranged immediately.',
      service: 'We apologize for the service issue. We are escalating this to our Guest Relations Manager.',
      noise: 'We apologize for the noise disturbance. We have arranged a room change to a quieter floor.',
      wifi: 'Your WiFi password has been reset. Technical team is on the way to your room.',
      food: 'We apologize for the food quality. A replacement order has been placed with priority.',
      billing: 'We apologize for the billing confusion. Our front desk will review and correct this immediately.',
      staff: 'We value your feedback. Our management team will review this immediately.',
      facilities: 'We apologize for the facilities issue. Maintenance team has been dispatched.',
      other: 'We apologize for any inconvenience. Our team is working to resolve this immediately.',
    };

    const baseResponse = categoryResponses[complaint.category] || categoryResponses.other;

    if (complaint.priority === 'critical') {
      return `Urgent attention required. ` + baseResponse +
        ' A manager will visit your room within 5 minutes.';
    } else if (complaint.priority === 'high') {
      return baseResponse + ' We aim to resolve this within 15 minutes.';
    } else {
      return baseResponse + ' We aim to resolve this within 30 minutes.';
    }
  }

  private async sendNotification(phone: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/sms/send`,
        { to: phone, message },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
      );
    } catch (error: any) {
      logger.error(`Notification failed: ${error.message}`, { phone });
    }
  }

  private async syncToHOJAI(entityType: string, action: string, data: any): Promise<void> {
    try {
      await axios.post(
        `${process.env.HOJAI_URL || 'http://localhost:4800'}/api/sync`,
        { entityType, action, source: 'staybot', data, timestamp: new Date().toISOString() },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
      );
    } catch (error: any) {
      if (error.response?.status !== 404) {
        logger.error(`HOJAI sync failed: ${error.message}`);
      }
    }
  }
}

export const guestService = new GuestService();
export default GuestService;