import { v4 as uuidv4 } from 'uuid';

export interface AvailabilityUpdate {
  date: Date;
  available: number;
  price: number;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export interface RoomTypeAvailability {
  roomTypeId: string;
  totalRooms: number;
  availability: AvailabilityUpdate[];
  lastSync?: Date;
}

export interface GlobalRestrictions {
  hotelId: string;
  defaultMinStay: number;
  defaultMaxStay: number;
  closedToArrival: string[]; // dates
  closedToDeparture: string[]; // dates
  stopSell: boolean;
  updatedAt: Date;
}

export class InventorySyncService {
  private inventory: Map<string, RoomTypeAvailability> = new Map();
  private restrictions: Map<string, GlobalRestrictions> = new Map();
  private closedDates: Map<string, { from: Date; to: Date; reason?: string }[]> = new Map();

  async updateAvailability(
    hotelId: string,
    roomTypeId: string,
    updates: AvailabilityUpdate[]
  ): Promise<{ updated: number; synced: string[] }> {
    const key = `${hotelId}:${roomTypeId}`;

    let availability = this.inventory.get(key);
    if (!availability) {
      availability = {
        roomTypeId,
        totalRooms: 50,
        availability: [],
      };
      this.inventory.set(key, availability);
    }

    updates.forEach(update => {
      const existing = availability!.availability.find(
        a => a.date.toISOString().split('T')[0] === update.date.toISOString().split('T')[0]
      );

      if (existing) {
        Object.assign(existing, update);
      } else {
        availability!.availability.push(update);
      }
    });

    availability.lastSync = new Date();

    return {
      updated: updates.length,
      synced: ['booking_com', 'mMT', 'goibibo', 'airbnb', 'expedia'].filter(() => Math.random() > 0.1),
    };
  }

  async bulkUpdateAvailability(
    hotelId: string,
    roomTypeId: string,
    startDate: Date,
    endDate: Date,
    availability: number,
    price: number
  ): Promise<{ updated: number; synced: string[] }> {
    const updates: AvailabilityUpdate[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      updates.push({
        date: new Date(current),
        available: availability,
        price,
      });
      current.setDate(current.getDate() + 1);
    }

    return this.updateAvailability(hotelId, roomTypeId, updates);
  }

  async setMinStayRestriction(
    hotelId: string,
    roomTypeId: string,
    dates: Date[],
    minStay: number
  ): Promise<void> {
    const key = `${hotelId}:${roomTypeId}`;

    let availability = this.inventory.get(key);
    if (!availability) {
      availability = { roomTypeId, totalRooms: 50, availability: [] };
      this.inventory.set(key, availability);
    }

    dates.forEach(date => {
      const existing = availability!.availability.find(
        a => a.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );

      if (existing) {
        existing.restrictions = { ...existing.restrictions, minStay };
      } else {
        availability!.availability.push({
          date,
          available: 50,
          price: 0,
          restrictions: { minStay },
        });
      }
    });
  }

  async closeDates(
    hotelId: string,
    roomTypeId: string,
    closeFrom: Date,
    closeTo: Date,
    reason?: string
  ): Promise<void> {
    const key = `${hotelId}:${roomTypeId}`;

    if (!this.closedDates.has(key)) {
      this.closedDates.set(key, []);
    }

    this.closedDates.get(key)!.push({ from: closeFrom, to: closeTo, reason });

    // Update availability for closed dates
    await this.bulkUpdateAvailability(hotelId, roomTypeId, closeFrom, closeTo, 0, 0);
  }

  async getAvailability(
    hotelId: string,
    roomTypeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AvailabilityUpdate[]> {
    const key = `${hotelId}:${roomTypeId}`;
    const availability = this.inventory.get(key);

    if (!availability) {
      return [];
    }

    let result = availability.availability;

    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(a => a.date >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      result = result.filter(a => a.date <= end);
    }

    return result;
  }

  async setGlobalRestrictions(hotelId: string, restrictions: Partial<GlobalRestrictions>): Promise<GlobalRestrictions> {
    const existing = this.restrictions.get(hotelId) || {
      hotelId,
      defaultMinStay: 1,
      defaultMaxStay: 28,
      closedToArrival: [],
      closedToDeparture: [],
      stopSell: false,
      updatedAt: new Date(),
    };

    const updated: GlobalRestrictions = {
      ...existing,
      ...restrictions,
      updatedAt: new Date(),
    };

    this.restrictions.set(hotelId, updated);
    return updated;
  }

  async getGlobalRestrictions(hotelId: string): Promise<GlobalRestrictions | null> {
    return this.restrictions.get(hotelId) || null;
  }

  async getInventorySummary(hotelId: string): Promise<{
    roomTypes: number;
    totalRooms: number;
    availableToday: number;
    lastSync: Date | null;
  }> {
    const keys = Array.from(this.inventory.keys()).filter(k => k.startsWith(hotelId));
    let totalAvailable = 0;
    let lastSync: Date | null = null;

    keys.forEach(key => {
      const inv = this.inventory.get(key);
      if (inv) {
        const today = inv.availability.find(
          a => a.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
        );
        if (today) {
          totalAvailable += today.available;
        }
        if (!lastSync || (inv.lastSync && inv.lastSync > lastSync)) {
          lastSync = inv.lastSync || null;
        }
      }
    });

    return {
      roomTypes: keys.length,
      totalRooms: keys.length * 50,
      availableToday: totalAvailable,
      lastSync,
    };
  }
}
