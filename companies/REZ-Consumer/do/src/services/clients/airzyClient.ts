/**
 * Airzy Client for DO App
 *
 * Connect DO App to KHAIRMOVE Airzy (Flights, Hotels, Transfers)
 */

import axios, { AxiosInstance } from 'axios';

const AIRZY_URL = process.env.AIRZY_URL || 'http://localhost:4500';

export class AirzyClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: AIRZY_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // FLIGHTS
  // =========================================================================

  async searchFlights(params: {
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    passengers?: number;
    class?: 'economy' | 'business' | 'first';
  }) {
    try {
      const { data } = await this.client.get('/api/flights/search', { params });
      return data;
    } catch (error) {
      console.error('Airzy searchFlights error:', error);
      return { flights: [] };
    }
  }

  async getFlightDetails(flightId: string) {
    try {
      const { data } = await this.client.get(`/api/flights/${flightId}`);
      return data;
    } catch (error) {
      console.error('Airzy getFlightDetails error:', error);
      return null;
    }
  }

  async bookFlight(params: {
    flightId: string;
    passengerId: string;
    seatPreference?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/flights/book', params);
      return data;
    } catch (error) {
      console.error('Airzy bookFlight error:', error);
      return null;
    }
  }

  async getBooking(bookingId: string) {
    try {
      const { data } = await this.client.get(`/api/bookings/${bookingId}`);
      return data;
    } catch (error) {
      console.error('Airzy getBooking error:', error);
      return null;
    }
  }

  async cancelBooking(bookingId: string, reason?: string) {
    try {
      const { data } = await this.client.post(`/api/bookings/${bookingId}/cancel`, { reason });
      return data;
    } catch (error) {
      console.error('Airzy cancelBooking error:', error);
      return null;
    }
  }

  // =========================================================================
  // HOTELS
  // =========================================================================

  async searchHotels(params: {
    city: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms?: number;
  }) {
    try {
      const { data } = await this.client.get('/api/hotels/search', { params });
      return data;
    } catch (error) {
      console.error('Airzy searchHotels error:', error);
      return { hotels: [] };
    }
  }

  async getHotelDetails(hotelId: string) {
    try {
      const { data } = await this.client.get(`/api/hotels/${hotelId}`);
      return data;
    } catch (error) {
      console.error('Airzy getHotelDetails error:', error);
      return null;
    }
  }

  async bookHotel(params: {
    hotelId: string;
    guestId: string;
    roomType: string;
    guests: number;
  }) {
    try {
      const { data } = await this.client.post('/api/hotels/book', params);
      return data;
    } catch (error) {
      console.error('Airzy bookHotel error:', error);
      return null;
    }
  }

  async getHotelBooking(bookingId: string) {
    try {
      const { data } = await this.client.get(`/api/hotel-bookings/${bookingId}`);
      return data;
    } catch (error) {
      console.error('Airzy getHotelBooking error:', error);
      return null;
    }
  }

  // =========================================================================
  // TRAINS
  // =========================================================================

  async searchTrains(params: {
    from: string;
    to: string;
    date: string;
    class?: 'sleeper' | 'ac' | 'first';
  }) {
    try {
      const { data } = await this.client.get('/api/trains/search', { params });
      return data;
    } catch (error) {
      console.error('Airzy searchTrains error:', error);
      return { trains: [] };
    }
  }

  async bookTrain(params: {
    trainId: string;
    passengerId: string;
    class: string;
  }) {
    try {
      const { data } = await this.client.post('/api/trains/book', params);
      return data;
    } catch (error) {
      console.error('Airzy bookTrain error:', error);
      return null;
    }
  }

  // =========================================================================
  // RIDES / TRANSFERS
  // =========================================================================

  async bookRide(params: {
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    vehicleType?: 'economy' | 'premium' | 'suv';
    scheduledTime?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/rides/book', params);
      return data;
    } catch (error) {
      console.error('Airzy bookRide error:', error);
      return null;
    }
  }

  async getRideStatus(rideId: string) {
    try {
      const { data } = await this.client.get(`/api/rides/${rideId}`);
      return data;
    } catch (error) {
      console.error('Airzy getRideStatus error:', error);
      return null;
    }
  }

  async trackRide(rideId: string) {
    try {
      const { data } = await this.client.get(`/api/rides/${rideId}/track`);
      return data;
    } catch (error) {
      console.error('Airzy trackRide error:', error);
      return null;
    }
  }

  // =========================================================================
  // ITINERARY
  // =========================================================================

  async createItinerary(userId: string, name: string) {
    try {
      const { data } = await this.client.post('/api/itineraries', { userId, name });
      return data;
    } catch (error) {
      console.error('Airzy createItinerary error:', error);
      return null;
    }
  }

  async getItinerary(itineraryId: string) {
    try {
      const { data } = await this.client.get(`/api/itineraries/${itineraryId}`);
      return data;
    } catch (error) {
      console.error('Airzy getItinerary error:', error);
      return null;
    }
  }

  async addToItinerary(itineraryId: string, item: {
    type: 'flight' | 'hotel' | 'train' | 'ride';
    bookingId: string;
  }) {
    try {
      const { data } = await this.client.post(`/api/itineraries/${itineraryId}/items`, item);
      return data;
    } catch (error) {
      console.error('Airzy addToItinerary error:', error);
      return null;
    }
  }

  // =========================================================================
  // USER BOOKINGS
  // =========================================================================

  async getMyBookings(userId: string) {
    try {
      const { data } = await this.client.get('/api/bookings/user', {
        params: { userId },
      });
      return data;
    } catch (error) {
      console.error('Airzy getMyBookings error:', error);
      return { bookings: [] };
    }
  }

  async getUpcomingBookings(userId: string) {
    try {
      const { data } = await this.client.get('/api/bookings/upcoming', {
        params: { userId },
      });
      return data;
    } catch (error) {
      console.error('Airzy getUpcomingBookings error:', error);
      return { bookings: [] };
    }
  }

  // =========================================================================
  // PAYMENTS
  // =========================================================================

  async initiatePayment(params: {
    bookingId: string;
    amount: number;
    method: 'card' | 'upi' | 'wallet' | 'coins';
  }) {
    try {
      const { data } = await this.client.post('/api/payments/initiate', params);
      return data;
    } catch (error) {
      console.error('Airzy initiatePayment error:', error);
      return null;
    }
  }

  async verifyPayment(paymentId: string) {
    try {
      const { data } = await this.client.get(`/api/payments/${paymentId}`);
      return data;
    } catch (error) {
      console.error('Airzy verifyPayment error:', error);
      return null;
    }
  }

  // =========================================================================
  // DO APP SPECIFIC METHODS
  // =========================================================================

  async bookTrip(userId: string, tripDetails: {
    flights?: any;
    hotels?: any;
    rides?: any[];
  }) {
    try {
      // Create itinerary
      const itinerary = await this.createItinerary(userId, `Trip ${new Date().toLocaleDateString()}`);

      if (!itinerary) return null;

      // Book each component
      if (tripDetails.flights) {
        await this.bookFlight({
          flightId: tripDetails.flights.id,
          passengerId: userId,
        });
      }

      if (tripDetails.hotels) {
        await this.bookHotel({
          hotelId: tripDetails.hotels.id,
          guestId: userId,
          roomType: 'standard',
          guests: 1,
        });
      }

      for (const ride of (tripDetails.rides || [])) {
        await this.bookRide(ride);
      }

      return itinerary;
    } catch (error) {
      console.error('Airzy bookTrip error:', error);
      return null;
    }
  }

  async getTravelSummary(userId: string) {
    const [upcoming, past] = await Promise.all([
      this.getUpcomingBookings(userId),
      this.getMyBookings(userId),
    ]);

    return {
      upcomingTrips: upcoming.bookings || [],
      pastTrips: past.bookings || [],
      totalTrips: ((upcoming.bookings || []).length + (past.bookings || []).length),
    };
  }
}

// Export singleton
export const airzyClient = new AirzyClient();

export default AirzyClient;
