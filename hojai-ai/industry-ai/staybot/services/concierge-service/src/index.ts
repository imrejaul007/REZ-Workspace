/**
 * Concierge Service - Local Recommendations & Booking Backend
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface LocalRecommendation {
  id: string;
  type: 'restaurant' | 'attraction' | 'spa' | 'shopping' | 'transport' | 'entertainment';
  name: string;
  description: string;
  rating: number;
  priceRange: string;
  distance: string;
  address?: string;
  phone?: string;
  openingHours?: string;
  bookingRequired?: boolean;
  aiNotes?: string;
  imageUrl?: string;
  tags: string[];
}

export interface BookingRequest {
  id: string;
  guestId: string;
  recommendationId: string;
  recommendationName: string;
  dateTime: string;
  guests?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface TransportBooking {
  id: string;
  guestId: string;
  type: 'taxi' | 'car-rental' | 'airport-transfer' | 'train' | 'flight';
  pickupTime: string;
  pickupLocation: string;
  destination: string;
  vehicleType?: string;
  estimatedCost?: number;
  driverName?: string;
  driverPhone?: string;
  status: 'pending' | 'confirmed' | 'en-route' | 'completed' | 'cancelled';
  createdAt: string;
}

export class ConciergeService {
  private recommendations: Map<string, LocalRecommendation> = new Map();
  private bookings: Map<string, BookingRequest> = new Map();
  private transportBookings: Map<string, TransportBooking> = new Map();

  constructor() {
    this.initializeRecommendations();
  }

  private initializeRecommendations(): void {
    const recs: LocalRecommendation[] = [
      { id: '1', type: 'restaurant', name: 'Rooftop Restaurant', description: 'Fine dining with city views', rating: 4.8, priceRange: '₹1500-3000', distance: '0.5 km', openingHours: '6 PM - 11 PM', bookingRequired: true, aiNotes: 'Great for romantic dinners', tags: ['romantic', 'fine-dining'] },
      { id: '2', type: 'restaurant', name: 'Local Bistro', description: 'Authentic local cuisine', rating: 4.5, priceRange: '₹500-1000', distance: '1 km', aiNotes: 'Famous for biryani', tags: ['local', 'budget-friendly'] },
      { id: '3', type: 'attraction', name: 'City Heritage Walk', description: 'Guided historical tour', rating: 4.6, priceRange: '₹200', distance: '1.5 km', aiNotes: 'Best at 7-9 AM', tags: ['history', 'walking'] },
      { id: '4', type: 'spa', name: 'Hotel Spa', description: 'Full service spa and wellness', rating: 4.9, priceRange: '₹2500-5000', distance: 'Same floor', bookingRequired: true, tags: ['spa', 'wellness'] },
      { id: '5', type: 'shopping', name: 'Local Market', description: 'Traditional crafts and textiles', rating: 4.3, priceRange: 'Variable', distance: '2 km', openingHours: '9 AM - 8 PM', tags: ['shopping', 'local'] },
    ];

    recs.forEach(rec => this.recommendations.set(rec.id, rec));
  }

  async getRecommendations(type?: LocalRecommendation['type']): Promise<LocalRecommendation[]> {
    const all = Array.from(this.recommendations.values());
    if (type) {
      return all.filter(r => r.type === type);
    }
    return all;
  }

  async getRecommendationById(id: string): Promise<LocalRecommendation | undefined> {
    return this.recommendations.get(id);
  }

  async bookRecommendation(guestId: string, recommendationId: string, dateTime: string, guests?: number): Promise<BookingRequest> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) throw new Error('Recommendation not found');

    const booking: BookingRequest = {
      id: uuidv4(),
      guestId,
      recommendationId,
      recommendationName: recommendation.name,
      dateTime,
      guests,
      status: recommendation.bookingRequired ? 'pending' : 'confirmed',
      confirmationNumber: `BOOK${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getBookingsByGuest(guestId: string): Promise<BookingRequest[]> {
    return Array.from(this.bookings.values()).filter(b => b.guestId === guestId);
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;

    booking.status = 'cancelled';
    this.bookings.set(bookingId, booking);
    return true;
  }

  async bookTransport(data: Omit<TransportBooking, 'id' | 'createdAt' | 'status'>): Promise<TransportBooking> {
    const booking: TransportBooking = {
      ...data,
      id: uuidv4(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    this.transportBookings.set(booking.id, booking);
    return booking;
  }

  async getTransportBooking(bookingId: string): Promise<TransportBooking | undefined> {
    return this.transportBookings.get(bookingId);
  }

  async getTransportBookingsByGuest(guestId: string): Promise<TransportBooking[]> {
    return Array.from(this.transportBookings.values()).filter(b => b.guestId === guestId);
  }

  async updateTransportStatus(bookingId: string, status: TransportBooking['status'], driverInfo?: { name: string; phone: string }): Promise<TransportBooking | undefined> {
    const booking = this.transportBookings.get(bookingId);
    if (!booking) return undefined;

    booking.status = status;
    if (driverInfo) {
      booking.driverName = driverInfo.name;
      booking.driverPhone = driverInfo.phone;
    }

    this.transportBookings.set(bookingId, booking);
    return booking;
  }

  async getPersonalizedRecommendations(guestId: string, preferences?: string[]): Promise<LocalRecommendation[]> {
    const all = Array.from(this.recommendations.values());

    // Simple preference matching
    if (preferences && preferences.length > 0) {
      return all
        .map(rec => ({
          ...rec,
          matchScore: rec.tags.filter(tag => preferences.some(p => p.toLowerCase().includes(tag.toLowerCase()))).length
        }))
        .filter(rec => rec.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(({ matchScore, ...rec }) => rec);
    }

    // Return top rated if no preferences
    return all.sort((a, b) => b.rating - a.rating).slice(0, 5);
  }

  async getLocalInfo(topic: string): Promise<{ info: string; related?: LocalRecommendation[] }> {
    const infoMap: Record<string, { info: string; relatedType?: LocalRecommendation['type'] }> = {
      'weather': { info: 'Current weather: Sunny, 28°C. Perfect for outdoor activities!', relatedType: 'attraction' },
      'currency': { info: 'Currency exchange available at the front desk. Current rate: 1 USD = 83 INR' },
      'emergency': { info: 'Emergency services: Hospital - 2km, Police - 1km. Hotel emergency: Extension 9' },
      'transport': { info: 'Nearest metro: 1.5km. Taxi stand: At hotel entrance. Airport: 15km (25 mins)', relatedType: 'transport' },
    };

    const data = infoMap[topic.toLowerCase()];
    if (!data) {
      return { info: 'Information not available. Please ask the concierge.' };
    }

    const related = data.relatedType ? await this.getRecommendations(data.relatedType) : undefined;

    return { info: data.info, related };
  }
}

export default ConciergeService;