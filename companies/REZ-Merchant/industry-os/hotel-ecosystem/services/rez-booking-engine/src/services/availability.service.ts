import { v4 as uuidv4 } from 'uuid';
import { DynamicPricingService } from './dynamic-pricing.service';

export interface Room {
  roomId: string;
  hotelId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  bedType: string;
  capacity: number;
  basePrice: number;
  amenities: { name: string }[];
  status: 'available' | 'occupied' | 'maintenance';
}

export interface AvailabilityResult {
  available: boolean;
  requestedRooms: number;
  availableRooms: number;
  nights: number;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
  rooms: {
    roomId: string;
    roomNumber: string;
    roomTypeId: string;
    floor: number;
  }[];
}

export class AvailabilityService {
  private rooms: Map<string, Room> = new Map();
  private pricingService: DynamicPricingService;

  constructor() {
    this.pricingService = new DynamicPricingService();
    this.initializeMockRooms();
  }

  private initializeMockRooms() {
    const mockRooms: Room[] = [
      { roomId: 'R001', hotelId: 'h1', roomNumber: '101', roomTypeId: 'std', roomTypeName: 'Standard', floor: 1, bedType: 'King', capacity: 2, basePrice: 3000, amenities: [{ name: 'WiFi' }, { name: 'TV' }], status: 'available' },
      { roomId: 'R002', hotelId: 'h1', roomNumber: '102', roomTypeId: 'std', roomTypeName: 'Standard', floor: 1, bedType: 'Queen', capacity: 2, basePrice: 3000, amenities: [{ name: 'WiFi' }, { name: 'TV' }], status: 'available' },
      { roomId: 'R003', hotelId: 'h1', roomNumber: '201', roomTypeId: 'dlx', roomTypeName: 'Deluxe', floor: 2, bedType: 'King', capacity: 3, basePrice: 5000, amenities: [{ name: 'WiFi' }, { name: 'TV' }, { name: 'Minibar' }], status: 'available' },
      { roomId: 'R004', hotelId: 'h1', roomNumber: '202', roomTypeId: 'dlx', roomTypeName: 'Deluxe', floor: 2, bedType: 'Twin', capacity: 3, basePrice: 5000, amenities: [{ name: 'WiFi' }, { name: 'TV' }, { name: 'Minibar' }], status: 'available' },
      { roomId: 'R005', hotelId: 'h1', roomNumber: '301', roomTypeId: 'ste', roomTypeName: 'Suite', floor: 3, bedType: 'King', capacity: 4, basePrice: 8000, amenities: [{ name: 'WiFi' }, { name: 'TV' }, { name: 'Minibar' }, { name: 'Jacuzzi' }], status: 'available' },
    ];
    mockRooms.forEach(r => this.rooms.set(r.roomId, r));
  }

  async checkAvailability(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    roomTypeId?: string,
    guests?: number,
    rooms: number = 1
  ): Promise<AvailabilityResult> {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Filter rooms
    let availableRooms = Array.from(this.rooms.values()).filter(r => {
      if (r.hotelId !== hotelId) return false;
      if (r.status !== 'available') return false;
      if (roomTypeId && r.roomTypeId !== roomTypeId) return false;
      if (guests && r.capacity < guests) return false;
      return true;
    });

    const resultRooms = availableRooms.slice(0, rooms);
    const basePrice = resultRooms.length > 0 ? resultRooms[0].basePrice : 3000;

    const pricing = await this.pricingService.calculateRate({
      hotelId,
      roomTypeId: roomTypeId || 'std',
      checkIn,
      checkOut,
      occupancy: 0.7,
      basePrice,
    });

    return {
      available: resultRooms.length >= rooms,
      requestedRooms: rooms,
      availableRooms: resultRooms.length,
      nights,
      pricing: {
        basePrice: pricing.basePrice,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency,
      },
      rooms: resultRooms.map(r => ({
        roomId: r.roomId,
        roomNumber: r.roomNumber,
        roomTypeId: r.roomTypeId,
        floor: r.floor,
      })),
    };
  }

  async searchRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    guests?: number,
    budget?: number
  ): Promise<any[]> {
    let rooms = Array.from(this.rooms.values()).filter(r => {
      if (r.hotelId !== hotelId) return false;
      if (r.status !== 'available') return false;
      if (guests && r.capacity < guests) return false;
      return true;
    });

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const results = await Promise.all(
      rooms.map(async r => {
        const pricing = await this.pricingService.calculateRate({
          hotelId,
          roomTypeId: r.roomTypeId,
          checkIn,
          checkOut,
          occupancy: 0.7,
          basePrice: r.basePrice,
        });

        return {
          roomId: r.roomId,
          roomNumber: r.roomNumber,
          roomTypeId: r.roomTypeId,
          roomTypeName: r.roomTypeName,
          floor: r.floor,
          bedType: r.bedType,
          capacity: r.capacity,
          amenities: r.amenities,
          pricing: {
            basePrice: pricing.basePrice,
            finalPrice: pricing.finalPrice,
            pricePerNight: Math.round(pricing.finalPrice / nights),
            currency: pricing.currency,
          },
        };
      })
    );

    return results.sort((a, b) => a.pricing.finalPrice - b.pricing.finalPrice);
  }
}
