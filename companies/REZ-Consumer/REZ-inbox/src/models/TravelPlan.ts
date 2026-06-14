import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Travel mode types
 */
export type TravelMode = 'flight' | 'train' | 'bus' | 'car_rental' | 'hotel' | 'cruise' | 'other';

/**
 * Travel plan status
 */
export type TravelStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

/**
 * Travel plan data model for storing imported travel plans from emails
 */
export interface TravelPlan {
  plan_id: string;
  user_id: string;
  source_email: string;
  booking_reference: string;
  merchant_name: string;
  travel_mode: TravelMode;
  status: TravelStatus;
  departure_location?: string;
  arrival_location?: string;
  departure_date?: Date;
  arrival_date?: Date;
  total_amount?: number;
  currency?: string;
  passengers?: string[];
  confirmation_date: Date;
  imported_at: Date;
  metadata?: Record<string, unknown>;
  confidence_score?: number;
}

/**
 * Zod schema for TravelPlan validation
 */
export const TravelPlanSchema = z.object({
  plan_id: z.string().uuid(),
  user_id: z.string().min(1),
  source_email: z.string().email(),
  booking_reference: z.string().min(1),
  merchant_name: z.string().min(1),
  travel_mode: z.enum(['flight', 'train', 'bus', 'car_rental', 'hotel', 'cruise', 'other']),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed']),
  departure_location: z.string().optional(),
  arrival_location: z.string().optional(),
  departure_date: z.date().optional(),
  arrival_date: z.date().optional(),
  total_amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  passengers: z.array(z.string()).optional(),
  confirmation_date: z.date(),
  imported_at: z.date(),
  metadata: z.record(z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
});

/**
 * Flight segment information
 */
export interface FlightSegment {
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time?: Date;
  arrival_time?: Date;
  seat_class?: 'economy' | 'premium_economy' | 'business' | 'first';
}

/**
 * Hotel booking details
 */
export interface HotelBooking {
  hotel_name: string;
  address?: string;
  check_in_date?: Date;
  check_out_date?: Date;
  room_type?: string;
  guests?: number;
  amenities?: string[];
}

/**
 * Car rental details
 */
export interface CarRental {
  company: string;
  vehicle_type?: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_date?: Date;
  dropoff_date?: Date;
}

/**
 * Create a new TravelPlan instance
 */
export function createTravelPlan(
  data: Omit<TravelPlan, 'plan_id' | 'imported_at' | 'confirmation_date' | 'status'>
): TravelPlan {
  return {
    ...data,
    plan_id: uuidv4(),
    confirmation_date: new Date(),
    imported_at: new Date(),
    status: 'confirmed',
  };
}

/**
 * Validate travel plan data
 */
export function validateTravelPlan(data: unknown): TravelPlan {
  return TravelPlanSchema.parse(data);
}

/**
 * Travel plan detection result
 */
export interface TravelPlanDetection {
  is_travel: boolean;
  travel_mode?: TravelMode;
  confidence: number;
  details: {
    booking_reference?: string;
    departure?: string;
    arrival?: string;
    dates?: { departure?: Date; arrival?: Date };
    passengers?: string[];
  };
  indicators: string[];
}
