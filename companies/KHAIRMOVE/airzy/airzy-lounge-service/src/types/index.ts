import { z } from 'zod';

export const LoungeSearchSchema = z.object({
  airport: z.string().length(3).optional(),
  terminal: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  priceRange: z.object({ min: z.number(), max: z.number() }).optional(),
  guests: z.number().min(1).max(10).optional()
});

export const LoungeBookingSchema = z.object({
  loungeId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().min(1).max(10),
  flightNumber: z.string().optional(),
  specialRequests: z.string().optional()
});

export type LoungeSearchParams = z.infer<typeof LoungeSearchSchema>;
export type LoungeBookingRequest = z.infer<typeof LoungeBookingSchema>;

export interface Lounge {
  id: string;
  name: string;
  airport: string;
  terminal: string;
  description: string;
  images: string[];
  amenities: string[];
  operatingHours: string;
  rating: number;
  reviewCount: number;
  price: {
    amount: number;
    currency: string;
    perPerson: boolean;
  };
  capacity: number;
  available: boolean;
  restrictions?: string[];
  location: {
    lat: number;
    lng: number;
  };
}

export interface LoungeBooking {
  id: string;
  confirmationCode: string;
  userId: string;
  lounge: {
    id: string;
    name: string;
    airport: string;
    terminal: string;
  };
  date: string;
  guests: number;
  flightNumber?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  qrCode?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessValidation {
  valid: boolean;
  bookingId?: string;
  loungeId?: string;
  guestName?: string;
  guests?: number;
  validUntil?: Date;
  message?: string;
}

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
  };
}