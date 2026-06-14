import { z } from 'zod';

// Flight search request schema
export const FlightSearchSchema = z.object({
  origin: z.string().length(3, 'Origin must be 3-letter airport code'),
  destination: z.string().length(3, 'Destination must be 3-letter airport code'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  passengers: z.object({
    adults: z.number().min(1).max(9).default(1),
    children: z.number().min(0).max(8).optional(),
    infants: z.number().min(0).max(4).optional()
  }).optional(),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  directOnly: z.boolean().optional(),
  maxStops: z.number().min(0).max(3).optional()
});

// Booking request schema
export const BookingRequestSchema = z.object({
  flightId: z.string(),
  passengerDetails: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(['male', 'female', 'other']),
    nationality: z.string().length(2),
    passportNumber: z.string().min(5).optional(),
    passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    email: z.string().email(),
    phone: z.string().min(10)
  })),
  contactDetails: z.object({
    email: z.string().email(),
    phone: z.string().min(10),
    countryCode: z.string().default('+91')
  }),
  seatPreference: z.string().optional(),
  mealPreference: z.string().optional(),
  specialAssistance: z.array(z.string()).optional(),
  baggage: z.object({
    checked: z.number().min(0).max(5).optional(),
    cabin: z.number().min(0).max(2).optional()
  }).optional()
});

// Price alert schema
export const PriceAlertSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxPrice: z.number().positive(),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  passengers: z.number().min(1).max(9).default(1),
  email: z.string().email(),
  notifyFrequency: z.enum(['daily', 'weekly', 'instant']).default('instant')
});

// Flight types
export type FlightSearchParams = z.infer<typeof FlightSearchSchema>;
export type BookingRequest = z.infer<typeof BookingRequestSchema>;
export type PriceAlertRequest = z.infer<typeof PriceAlertSchema>;

// Domain types
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Airline {
  code: string;
  name: string;
  logo: string;
  alliance?: string;
}

export interface FlightSegment {
  segmentId: string;
  flightNumber: string;
  airline: Airline;
  aircraft: string;
  departure: {
    airport: string;
    terminal?: string;
    time: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    terminal?: string;
    time: string;
    gate?: string;
  };
  duration: string;
  stops: number;
  baggage: {
    cabin: string;
    checked?: string;
  };
}

export interface Flight {
  id: string;
  price: {
    amount: number;
    currency: string;
    baseAmount: number;
    taxes: number;
    fees: number;
  };
  segments: FlightSegment[];
  totalDuration: string;
  stops: number;
  refundable: boolean;
  exchangeable: boolean;
  seatsAvailable: number;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface Passenger {
  id: string;
  type: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  email: string;
  phone: string;
}

export interface BookingContact {
  email: string;
  phone: string;
  countryCode: string;
}

export interface Booking {
  id: string;
  confirmationCode: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  flights: Flight[];
  passengers: Passenger[];
  contact: BookingContact;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  pnr: string;
  createdAt: Date;
  updatedAt: Date;
  itinerarySent: boolean;
  cancellation?: {
    reason: string;
    refundAmount: number;
    cancelledAt: Date;
  };
}

export interface PriceAlert {
  id: string;
  userId?: string;
  email: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  maxPrice: number;
  currency: string;
  cabinClass?: string;
  passengers: number;
  frequency: 'daily' | 'weekly' | 'instant';
  active: boolean;
  lastChecked?: Date;
  lastPrice?: number;
  notifyCount: number;
  createdAt: Date;
  unsubscribed: boolean;
}

export interface FlightStatus {
  flightNumber: string;
  airline: string;
  status: 'scheduled' | 'on_time' | 'delayed' | 'cancelled' | 'diverted' | 'landed' | 'boarding' | 'unknown';
  departure: {
    airport: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
  arrival: {
    airport: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
  delay?: {
    minutes: number;
    reason?: string;
  };
}

export interface SearchResult {
  flights: Flight[];
  searchId: string;
  expiresAt: Date;
  filters: {
    airlines?: string[];
    stops?: number[];
    priceRange?: { min: number; max: number };
    times?: { departure: { from: string; to: string }; arrival: { from: string; to: string } };
    duration?: { min: string; max: string };
  };
  sorting: 'price' | 'duration' | 'departure' | 'arrival';
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: number;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
}

// Cache types
export interface CachedSearch {
  searchId: string;
  results: Flight[];
  createdAt: Date;
  expiresAt: Date;
}