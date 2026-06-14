/**
 * Hotel Service Types
 *
 * TypeScript type definitions for the hotel service
 */

export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
export type BookingSource = 'direct' | 'booking.com' | 'expedia' | 'agoda' | 'makemytrip' | 'goibibo' | 'phone' | 'walkin';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface IRoom {
  roomId: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  price: number;
  currency: string;
  amenities: string[];
  maxOccupancy: number;
  bedConfiguration: string;
  size: number;
  view: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  bookingId: string;
  hotelId: string;
  guestId: string;
  roomId: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  numGuests: number;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuest {
  guestId: string;
  hotelId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: 'passport' | 'driving_license' | 'aadhaar' | 'voter_id' | 'other';
  idNumber: string;
  address?: IAddress;
  dateOfBirth?: Date;
  nationality: string;
  preferences: {
    roomType?: string;
    floor?: string;
    smoking?: boolean;
    pillowType?: string;
    amenities?: string[];
  };
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  lastStay?: Date;
  notes?: string;
  isBlacklisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHousekeepingTask {
  taskId: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  taskType: 'cleaning' | 'deep_clean' | 'turndown' | 'inspection' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueBy: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating/updating
export interface CreateRoomInput {
  roomNumber: string;
  floor: number;
  type: RoomType;
  price: number;
  amenities: string[];
  maxOccupancy: number;
  bedConfiguration: string;
  size: number;
  view: string;
  images?: string[];
}

export interface UpdateRoomInput {
  type?: RoomType;
  status?: RoomStatus;
  price?: number;
  amenities?: string[];
  maxOccupancy?: number;
  bedConfiguration?: string;
  size?: number;
  view?: string;
  images?: string[];
  isActive?: boolean;
}

export interface CreateBookingInput {
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  source: BookingSource;
  specialRequests?: string;
}

export interface UpdateBookingInput {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  numGuests?: number;
  specialRequests?: string;
}

export interface CreateGuestInput {
  name: string;
  email: string;
  phone: string;
  idType: IGuest['idType'];
  idNumber: string;
  address?: IAddress;
  dateOfBirth?: string;
  nationality: string;
  preferences?: IGuest['preferences'];
}

export interface UpdateGuestInput {
  name?: string;
  email?: string;
  phone?: string;
  idType?: IGuest['idType'];
  idNumber?: string;
  address?: IAddress;
  dateOfBirth?: string;
  nationality?: string;
  preferences?: Partial<IGuest['preferences']>;
  loyaltyTier?: LoyaltyTier;
  notes?: string;
  isBlacklisted?: boolean;
}

export interface RoomSearchFilters {
  hotelId?: string;
  type?: RoomType;
  status?: RoomStatus;
  minPrice?: number;
  maxPrice?: number;
  floor?: number;
  availableFrom?: string;
  availableTo?: string;
}

export interface BookingSearchFilters {
  hotelId?: string;
  guestId?: string;
  roomId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  source?: BookingSource;
  checkInFrom?: string;
  checkInTo?: string;
  checkOutFrom?: string;
  checkOutTo?: string;
}

export interface GuestSearchFilters {
  hotelId?: string;
  loyaltyTier?: LoyaltyTier;
  isBlacklisted?: boolean;
  search?: string;
}
