// Hotel inventory extends BaseInventory
import { BaseInventoryService } from '@rez/base-services/inventory';

class HotelInventoryService extends BaseInventoryService {
  // Hotel-specific fields
  private roomAvailability: Map<string, number> = new Map();
  private amenityStock: Map<string, number> = new Map();

  async trackRoomAvailability(roomType: string, available: number): Promise<void> {
    this.roomAvailability.set(roomType, available);
    await this.updateInventory({
      type: 'room',
      variant: roomType,
      quantity: available,
      timestamp: new Date()
    });
  }

  async trackAmenity(amenityId: string, stock: number): Promise<void> {
    this.amenityStock.set(amenityId, stock);
    await this.updateInventory({
      type: 'amenity',
      variant: amenityId,
      quantity: stock,
      timestamp: new Date()
    });
  }

  async getRoomAvailability(checkIn: Date, checkOut: Date): Promise<Map<string, number>> {
    // Return current room availability for the date range
    return new Map(this.roomAvailability);
  }

  async getAmenityStock(): Promise<Map<string, number>> {
    return new Map(this.amenityStock);
  }
}

export const hotelInventoryService = new HotelInventoryService();
export { HotelInventoryService };
