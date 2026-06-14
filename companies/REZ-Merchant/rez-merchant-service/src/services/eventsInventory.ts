// Events inventory extends BaseInventory
import { BaseInventory } from '@rez/base-services/inventory';

export interface TicketInventory {
  eventId: string;
  available: number;
  tier: string;
  total: number;
  reserved: number;
}

export interface TicketReservation {
  reservationId: string;
  customerId: string;
  eventId: string;
  tickets: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface EventAvailability {
  eventId: string;
  tiers: {
    tier: string;
    available: number;
    total: number;
    price: number;
  }[];
  totalAvailable: number;
  totalCapacity: number;
}

export class EventsInventoryService extends BaseInventory {
  /**
   * FIX (security): Helper for secure ID generation
   */
  private generateSecureId(prefix: string): string {
    try {
      const { randomUUID } = require('crypto');
      return `${prefix}_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
    } catch {
      // Legacy fallback (only for environments without crypto)
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Track ticket inventory for an event
   */
  async trackTickets(
    eventId: string,
    available: number,
    tier: string
  ): Promise<TicketInventory> {
    const inventory: TicketInventory = {
      eventId,
      available,
      tier,
      total: available,
      reserved: 0,
    };

    // Track in inventory system
    await this.updateInventory(eventId, available, { tier });

    return inventory;
  }

  /**
   * Reserve tickets for a customer
   */
  async reserveTickets(
    customerId: string,
    eventId: string,
    tickets: number
  ): Promise<TicketReservation> {
    const reservation: TicketReservation = {
      reservationId: this.generateSecureId('res'),
      customerId,
      eventId,
      tickets,
      status: 'pending',
      createdAt: new Date(),
    };

    // Create reservation record
    await this.reserve(eventId, tickets, { customerId });

    reservation.status = 'confirmed';
    return reservation;
  }

  /**
   * Get availability for an event
   */
  async getEventAvailability(eventId: string): Promise<EventAvailability> {
    const inventoryData = await this.getInventory(eventId);

    return {
      eventId,
      tiers: Object.entries(inventoryData).map(([tier, data]: [string, unknown]) => ({
        tier,
        available: data.available || 0,
        total: data.total || 0,
        price: data.price || 0,
      })),
      totalAvailable: inventoryData.totalAvailable || 0,
      totalCapacity: inventoryData.totalCapacity || 0,
    };
  }
}
