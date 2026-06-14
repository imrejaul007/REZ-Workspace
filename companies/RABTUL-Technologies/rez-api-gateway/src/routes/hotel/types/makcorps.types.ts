/**
 * Makcorps OTA Types
 * Type definitions for hotel booking integration
 */

export interface OTARoom {
  roomId: string;
  roomType: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  baseRate: number;
  corporateRate: number;
  discount: number;
  amenities: string[];
  cancellationPolicy: {
    freeCancellationUntil: string;
    cancellationFee: number;
  };
  available: boolean;
  availableRooms: number;
}

export interface OTAProperty {
  propertyId: string;
  name: string;
  description: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  location: { lat: number; lng: number };
  starRating: number;
  userRating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    childrenAllowed: boolean;
    petsAllowed: boolean;
  };
  rooms: OTARoom[];
  gstInfo: {
    hsnCode: string;
    taxRate: number;
  };
  corporatePricing: {
    enabled: boolean;
    discountPercent: number;
    markupPercent: number;
  };
}

export interface OTABooking {
  bookingId: string;
  confirmationNumber: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  property: {
    propertyId: string;
    name: string;
    address: string;
    phone: string;
  };
  room: {
    roomId: string;
    name: string;
    bedType: string;
  };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  dates: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  pricing: {
    roomRate: number;
    numberOfRooms: number;
    subtotal: number;
    discount: number;
    gstAmount: number;
    totalAmount: number;
    currency: string;
  };
  createdAt: string;
}

export interface SearchParams {
  city?: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  minRating?: number;
  maxPrice?: number;
}

export interface CreateBookingParams {
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestDetails: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>;
  specialRequests?: string;
  corporateCode?: string;
}

export interface PricingParams {
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  corporateCode?: string;
}

export interface PricingResult {
  baseRate: number;
  corporateRate: number;
  nights: number;
  subtotal: number;
  corporateDiscount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
  totalAmount: number;
  itcEligible: boolean;
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
