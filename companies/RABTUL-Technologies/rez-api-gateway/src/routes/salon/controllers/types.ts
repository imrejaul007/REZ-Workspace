/**
 * Salon Types
 *
 * TypeScript interfaces for salon-related entities.
 */

export interface Salon {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: Address;
  contact: Contact;
  location: GeoLocation;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  openingHours: OpeningHours;
  services: SalonService[];
  stylists: Stylist[];
  verified: boolean;
  isOpen: boolean;
  priceRange: 1 | 2 | 3 | 4;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

export interface Contact {
  phone: string;
  email?: string;
  website?: string;
  whatsapp?: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "20:00"
  isClosed: boolean;
}

export interface SalonService {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  price: number;
  discountedPrice?: number;
  isAvailable: boolean;
  isPackage: boolean;
  packageItems?: string[];
}

export interface Stylist {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  isAvailable: boolean;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  date: string; // "2024-01-15"
  time: string; // "10:00"
  available: boolean;
  stylistId?: string;
}

export interface Availability {
  date: string;
  slots: TimeSlot[];
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  salonId: string;
  salonName: string;
  userId: string;
  services: BookingService[];
  stylistId?: string;
  date: string;
  time: string;
  status: BookingStatus;
  totalPrice: number;
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface BookingService {
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface CreateBookingRequest {
  salonId: string;
  services: { serviceId: string }[];
  stylistId?: string;
  date: string;
  time: string;
  notes?: string;
}

export interface SearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // km
  };
  query?: string;
  category?: string;
  minRating?: number;
  maxPrice?: number;
  amenities?: string[];
  availableDate?: string;
  availableTime?: string;
  sortBy?: 'distance' | 'rating' | 'price_low' | 'price_high' | 'popular';
}

export interface SearchResult {
  salons: Salon[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
