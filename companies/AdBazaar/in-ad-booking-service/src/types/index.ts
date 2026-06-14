/**
 * Type definitions for in-ad-booking-service
 */

export type BookingType = 'restaurant' | 'healthcare' | 'salon' | 'service' | 'appointment';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface BookingDetails {
  date?: Date;
  time?: string;
  guests?: number;
  service?: string;
  notes?: string;
}

export interface BookingPayment {
  required: boolean;
  amount?: number;
  status?: PaymentStatus;
  transactionId?: string;
}

export interface AdBooking {
  bookingId: string;
  adId: string;
  advertiserId: string;
  userId: string;
  businessId: string;
  type: BookingType;
  details: BookingDetails;
  status: BookingStatus;
  payment?: BookingPayment;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  adId: string;
  advertiserId: string;
  userId: string;
  businessId: string;
  type: BookingType;
  details: BookingDetails;
  paymentRequired?: boolean;
  paymentAmount?: number;
}

export interface BookingResponse {
  success: boolean;
  data?: AdBooking;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdAttribution {
  adId: string;
  advertiserId: string;
  campaignId?: string;
  source: string;
  timestamp: Date;
}

export interface UserBookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}