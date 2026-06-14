/**
 * UNIFIED BOOKING API SERVICE
 * Integration with RABTUL Booking Service
 *
 * Service: rez-booking-service
 * Port: 4020
 * URL: https://rez-booking-service.onrender.com
 *
 * Features:
 * - Unified booking management
 * - Hotels, travel, events booking
 * - Booking status tracking
 * - Cancellation & modifications
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type BookingType = 'hotel' | 'flight' | 'train' | 'bus' | 'cab' | 'event' | 'restaurant' | 'other';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface UnifiedBooking {
  id: string;
  userId: string;
  type: BookingType;
  status: BookingStatus;
  bookingDetails: BookingDetails;
  paymentDetails?: PaymentDetails;
  guestDetails?: GuestDetails;
  timeline: BookingTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetails {
  // Hotel
  hotelId?: string;
  hotelName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  rooms?: number;
  guests?: number;

  // Travel
  from?: Location;
  to?: Location;
  departureDate?: string;
  returnDate?: string;
  passengers?: Passenger[];

  // Event
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  ticketType?: string;
  quantity?: number;

  // Restaurant
  restaurantId?: string;
  restaurantName?: string;
  date?: string;
  time?: string;
  partySize?: number;

  // Generic
  title?: string;
  description?: string;
  providerReference?: string;
}

export interface Location {
  name: string;
  code?: string;
  city?: string;
  country?: string;
  airport?: string;
  address?: string;
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type: 'adult' | 'child' | 'infant';
  title?: string;
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  method?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface BookingTimeline {
  status: BookingStatus;
  message: string;
  timestamp: string;
  location?: string;
}

export interface BookingSearchParams {
  type?: BookingType;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BookingStats {
  totalBookings: number;
  totalSpent: number;
  upcomingTrips: number;
  completedTrips: number;
}

// ============================================================================
// BOOKING CRUD
// ============================================================================

/**
 * Get user's bookings
 */
export async function getBookings(
  params?: BookingSearchParams
): Promise<ApiResponse<{
  bookings: UnifiedBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return await apiClient.get(`/bookings${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('unifiedBookingApi.getBookings', { params, error });
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.get(`/bookings/${bookingId}`);
  } catch (error) {
    logger.error('unifiedBookingApi.getBookingById', { bookingId, error });
    throw error;
  }
}

/**
 * Get upcoming bookings
 */
export async function getUpcomingBookings(): Promise<ApiResponse<UnifiedBooking[]>> {
  try {
    return await apiClient.get('/bookings/upcoming');
  } catch (error) {
    logger.error('unifiedBookingApi.getUpcomingBookings', { error });
    throw error;
  }
}

/**
 * Get past bookings
 */
export async function getPastBookings(
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<{
  bookings: UnifiedBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 10}` : '';
    return await apiClient.get(`/bookings/past${query}`);
  } catch (error) {
    logger.error('unifiedBookingApi.getPastBookings', { error });
    throw error;
  }
}

/**
 * Get booking stats
 */
export async function getBookingStats(): Promise<ApiResponse<BookingStats>> {
  try {
    return await apiClient.get('/bookings/stats');
  } catch (error) {
    logger.error('unifiedBookingApi.getBookingStats', { error });
    throw error;
  }
}

// ============================================================================
// HOTEL BOOKINGS
// ============================================================================

export interface HotelSearchResult {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  images: string[];
  amenities: string[];
  roomType: string;
  freeCancellation?: boolean;
}

/**
 * Search hotels
 */
export async function searchHotels(params: {
  location?: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
  priceRange?: { min: number; max: number };
  amenities?: string[];
  rating?: number;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  hotels: HotelSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    return await apiClient.post('/bookings/hotels/search', params);
  } catch (error) {
    logger.error('unifiedBookingApi.searchHotels', { params, error });
    throw error;
  }
}

/**
 * Get hotel details
 */
export async function getHotelDetails(hotelId: string): Promise<ApiResponse<HotelDetails>> {
  try {
    return await apiClient.get(`/bookings/hotels/${hotelId}`);
  } catch (error) {
    logger.error('unifiedBookingApi.getHotelDetails', { hotelId, error });
    throw error;
  }
}

export interface HotelDetails {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: HotelAmenity[];
  rooms: RoomOption[];
  policies: HotelPolicy[];
  reviews: HotelReview[];
}

export interface HotelAmenity {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

export interface RoomOption {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  bedType: string;
  price: number;
  originalPrice?: number;
  cancellationPolicy: string;
  images: string[];
  amenities: string[];
}

export interface HotelPolicy {
  type: string;
  policy: string;
}

export interface HotelReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

/**
 * Create hotel booking
 */
export async function createHotelBooking(params: {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: GuestDetails;
  guestsCount: number;
  rooms: number;
  specialRequests?: string;
  paymentMethodId?: string;
}): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.post('/bookings/hotels', params);
  } catch (error) {
    logger.error('unifiedBookingApi.createHotelBooking', { params, error });
    throw error;
  }
}

// ============================================================================
// TRAVEL BOOKINGS
// ============================================================================

export interface FlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departure: { airport: string; time: string; airportName: string };
  arrival: { airport: string; time: string; airportName: string };
  duration: string;
  stops: number;
  stopLocations?: string[];
  price: number;
  originalPrice?: number;
  seatsAvailable?: number;
  class: string;
}

/**
 * Search flights
 */
export async function searchFlights(params: {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: 'economy' | 'business' | 'first';
}): Promise<ApiResponse<{
  outboundFlights: FlightResult[];
  returnFlights?: FlightResult[];
}>> {
  try {
    return await apiClient.post('/bookings/flights/search', params);
  } catch (error) {
    logger.error('unifiedBookingApi.searchFlights', { params, error });
    throw error;
  }
}

/**
 * Create flight booking
 */
export async function createFlightBooking(params: {
  flightId: string;
  passengers: Passenger[];
  contactDetails: GuestDetails;
  paymentMethodId?: string;
}): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.post('/bookings/flights', params);
  } catch (error) {
    logger.error('unifiedBookingApi.createFlightBooking', { params, error });
    throw error;
  }
}

export interface TrainResult {
  id: string;
  trainNumber: string;
  trainName: string;
  departure: { station: string; time: string };
  arrival: { station: string; time: string };
  duration: string;
  classes: TrainClass[];
}

/**
 * Search trains
 */
export async function searchTrains(params: {
  from: string;
  to: string;
  date: string;
  passengers: number;
}): Promise<ApiResponse<{ trains: TrainResult[] }>> {
  try {
    return await apiClient.post('/bookings/trains/search', params);
  } catch (error) {
    logger.error('unifiedBookingApi.searchTrains', { params, error });
    throw error;
  }
}

export interface TrainClass {
  id: string;
  name: string;
  availability: 'AVAILABLE' | 'RAC' | 'WL';
  price: number;
  seatsAvailable?: number;
}

/**
 * Create train booking
 */
export async function createTrainBooking(params: {
  trainId: string;
  classId: string;
  passengers: Passenger[];
  contactDetails: GuestDetails;
  paymentMethodId?: string;
}): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.post('/bookings/trains', params);
  } catch (error) {
    logger.error('unifiedBookingApi.createTrainBooking', { params, error });
    throw error;
  }
}

// ============================================================================
// EVENT BOOKINGS
// ============================================================================

export interface EventResult {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  imageUrl: string;
  startingPrice: number;
  category: string;
  interested: number;
}

/**
 * Search events
 */
export async function searchEvents(params: {
  location?: string;
  category?: string;
  date?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  events: EventResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    return await apiClient.post('/bookings/events/search', params);
  } catch (error) {
    logger.error('unifiedBookingApi.searchEvents', { params, error });
    throw error;
  }
}

/**
 * Get event details
 */
export async function getEventDetails(eventId: string): Promise<ApiResponse<EventDetails>> {
  try {
    return await apiClient.get(`/bookings/events/${eventId}`);
  } catch (error) {
    logger.error('unifiedBookingApi.getEventDetails', { eventId, error });
    throw error;
  }
}

export interface EventDetails {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  venue: string;
  address: string;
  city: string;
  imageUrl: string;
  images: string[];
  organizer: string;
  category: string;
  ticketTypes: TicketType[];
  attendees?: number;
  interested?: number;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  available: number;
  maxPerOrder: number;
}

/**
 * Create event booking
 */
export async function createEventBooking(params: {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  attendeeDetails: GuestDetails;
  paymentMethodId?: string;
}): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.post('/bookings/events', params);
  } catch (error) {
    logger.error('unifiedBookingApi.createEventBooking', { params, error });
    throw error;
  }
}

// ============================================================================
// RESTAURANT BOOKINGS
// ============================================================================

export interface RestaurantResult {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  images: string[];
  availableSlots: string[];
  distance?: number;
}

/**
 * Search restaurants
 */
export async function searchRestaurants(params: {
  location: string;
  date: string;
  time: string;
  partySize: number;
  cuisine?: string;
  priceRange?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  restaurants: RestaurantResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    return await apiClient.post('/bookings/restaurants/search', params);
  } catch (error) {
    logger.error('unifiedBookingApi.searchRestaurants', { params, error });
    throw error;
  }
}

/**
 * Create restaurant booking
 */
export async function createRestaurantBooking(params: {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  guestDetails: GuestDetails;
  specialRequests?: string;
}): Promise<ApiResponse<UnifiedBooking>> {
  try {
    return await apiClient.post('/bookings/restaurants', params);
  } catch (error) {
    logger.error('unifiedBookingApi.createRestaurantBooking', { params, error });
    throw error;
  }
}

// ============================================================================
// BOOKING ACTIONS
// ============================================================================

/**
 * Cancel booking
 */
export async function cancelBooking(
  bookingId: string,
  params?: { reason?: string; refundMethod?: string }
): Promise<ApiResponse<{ success: boolean; refundId?: string; refundAmount?: number }>> {
  try {
    return await apiClient.post(`/bookings/${bookingId}/cancel`, params || {});
  } catch (error) {
    logger.error('unifiedBookingApi.cancelBooking', { bookingId, params, error });
    throw error;
  }
}

/**
 * Modify booking
 */
export async function modifyBooking(
  bookingId: string,
  modifications: {
    dates?: { checkIn?: string; checkOut?: string };
    guests?: number;
    roomType?: string;
  }
): Promise<ApiResponse<{ booking: UnifiedBooking; additionalCharges?: number }>> {
  try {
    return await apiClient.patch(`/bookings/${bookingId}`, modifications);
  } catch (error) {
    logger.error('unifiedBookingApi.modifyBooking', { bookingId, modifications, error });
    throw error;
  }
}

/**
 * Get booking cancellation policy
 */
export async function getCancellationPolicy(
  bookingId: string
): Promise<ApiResponse<{ policy: string; refundAmount?: number; penalties?: number }>> {
  try {
    return await apiClient.get(`/bookings/${bookingId}/cancellation-policy`);
  } catch (error) {
    logger.error('unifiedBookingApi.getCancellationPolicy', { bookingId, error });
    throw error;
  }
}

/**
 * Download booking ticket/invoice
 */
export async function downloadBookingTicket(
  bookingId: string,
  type: 'ticket' | 'invoice' | 'itinerary'
): Promise<ApiResponse<{ downloadUrl: string }>> {
  try {
    return await apiClient.get(`/bookings/${bookingId}/download?type=${type}`);
  } catch (error) {
    logger.error('unifiedBookingApi.downloadTicket', { bookingId, type, error });
    throw error;
  }
}

/**
 * Share booking
 */
export async function shareBooking(
  bookingId: string,
  params: { via: 'email' | 'sms' | 'whatsapp'; recipient: string }
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/bookings/${bookingId}/share`, params);
  } catch (error) {
    logger.error('unifiedBookingApi.shareBooking', { bookingId, params, error });
    throw error;
  }
}

export default {
  // Booking CRUD
  getBookings,
  getBookingById,
  getUpcomingBookings,
  getPastBookings,
  getBookingStats,
  // Hotel
  searchHotels,
  getHotelDetails,
  createHotelBooking,
  // Travel
  searchFlights,
  createFlightBooking,
  searchTrains,
  createTrainBooking,
  // Events
  searchEvents,
  getEventDetails,
  createEventBooking,
  // Restaurants
  searchRestaurants,
  createRestaurantBooking,
  // Actions
  cancelBooking,
  modifyBooking,
  getCancellationPolicy,
  downloadBookingTicket,
  shareBooking,
};
