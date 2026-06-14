/**
 * Hospitality Service - MongoDB implementation
 */

import mongoose, { Schema, model, Document } from 'mongoose';

// ============================================================================
// MODELS
// ============================================================================

export interface IGuestStay extends Document {
  guestId: string;
  propertyId: string;
  propertyName: string;
  propertyType: 'hotel' | 'homestay' | 'resort';
  city: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  loyaltyTier?: 'silver' | 'gold' | 'platinum';
  purpose: 'business' | 'leisure' | 'medical';
}

const guestStaySchema = new Schema<IGuestStay>({
  guestId: { type: String, required: true, index: true },
  propertyId: String,
  propertyName: String,
  propertyType: { type: String, enum: ['hotel', 'homestay', 'resort'] },
  city: { type: String, required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  roomType: String,
  loyaltyTier: String,
  purpose: String,
});

export const GuestStay = model<IGuestStay>('GuestStay', guestStaySchema);

export interface ITravelBooking extends Document {
  travelerId: string;
  flightNumber?: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: Date;
  arrivalTime: Date;
  class: 'economy' | 'business' | 'first';
  passengerName: string;
  loyaltyTier?: 'basic' | 'plus' | 'elite' | 'royale';
}

const travelBookingSchema = new Schema<ITravelBooking>({
  travelerId: { type: String, required: true, index: true },
  flightNumber: String,
  departureCity: String,
  arrivalCity: { type: String, required: true, index: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  class: String,
  passengerName: String,
  loyaltyTier: String,
});

export const TravelBooking = model<ITravelBooking>('TravelBooking', travelBookingSchema);

// ============================================================================
// SERVICE
// ============================================================================

export class HospitalityService {
  /**
   * Get currently active guests
   */
  async getActiveGuests(city?: string): Promise<IGuestStay[]> {
    const now = new Date();
    const query: Record<string, unknown> = {
      checkIn: { $lte: now },
      checkOut: { $gte: now },
    };
    if (city) query.city = city;

    return GuestStay.find(query);
  }

  /**
   * Get guests by loyalty tier
   */
  async getGuestsByTier(tier: string): Promise<IGuestStay[]> {
    return GuestStay.find({
      loyaltyTier: tier,
      checkOut: { $gte: new Date() },
    });
  }

  /**
   * Get incoming travelers
   */
  async getIncomingTravelers(city: string): Promise<ITravelBooking[]> {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const query: Record<string, unknown> = {
      arrivalTime: { $gte: startDate, $lte: endDate },
    };
    if (city) query.arrivalCity = city;

    return TravelBooking.find(query);
  }

  /**
   * Get lounge visitors (premium)
   */
  async getLoungeVisitors(): Promise<ITravelBooking[]> {
    return TravelBooking.find({
      loyaltyTier: { $in: ['elite', 'royale'] },
      departureTime: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 4 * 60 * 60 * 1000), // Next 4 hours
      },
    });
  }

  /**
   * Get inventory summary
   */
  async getInventory(city?: string): Promise<{
    activeGuests: number;
    incomingTravelers: number;
    premiumTravelers: number;
  }> {
    const [guests, travelers, loungeVisitors] = await Promise.all([
      this.getActiveGuests(city),
      this.getIncomingTravelers(city || ''),
      this.getLoungeVisitors(),
    ]);

    return {
      activeGuests: guests.length,
      incomingTravelers: travelers.length,
      premiumTravelers: loungeVisitors.length,
    };
  }
}
