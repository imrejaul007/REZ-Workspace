/**
 * StayOwn Hotel OS Integration for KHAIRMOVE
 * Airport transfer booking for hotel guests
 */

import axios from 'axios';
import { logger } from '../../shared/logger';

const STAYOWN_URL = process.env.STAYOWN_URL || 'http://localhost:3899';
const HOTEL_OS_URL = process.env.HOTEL_OS_URL || 'http://localhost:3899';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Internal headers for service-to-service calls
const getInternalHeaders = () => ({
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
  'Content-Type': 'application/json',
});

/**
 * Get guest transfer requests from hotel
 * Called when guest checks in or requests airport transfer
 */
export async function getGuestTransferRequests(hotelId: string, date: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/transfer-requests`,
      {
        params: { date },
        headers: getInternalHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    logger.error('Get guest transfer requests failed:', error.message);
    throw error;
  }
}

/**
 * Book airport transfer for hotel guest
 */
export async function bookGuestTransfer(params: {
  hotelId: string;
  guestName: string;
  guestPhone: string;
  flightNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  vehicleType: 'bike' | 'auto' | 'cab' | 'suv';
  notes?: string;
  bookingRef?: string;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/transfers/book`,
      {
        ...params,
        source: 'khaimove',
        bookingType: 'airport_transfer',
      },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Book guest transfer failed:', error.message);
    throw error;
  }
}

/**
 * Update transfer status (notify hotel of driver ETA, arrival, etc.)
 */
export async function updateTransferStatus(params: {
  transferId: string;
  status: 'driver_assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driverLocation?: { lat: number; lng: number };
  eta?: number;
  driverName?: string;
  driverPhone?: string;
  vehicleDetails?: string;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/transfers/${params.transferId}/status`,
      params,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Update transfer status failed:', error.message);
    throw error;
  }
}

/**
 * Get hotel guest info for personalized service
 */
export async function getHotelGuestInfo(guestId: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/guests/${guestId}`,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Get hotel guest info failed:', error.message);
    throw error;
  }
}

/**
 * Check StayOwn service health
 */
export async function checkHealth() {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/health`,
      { timeout: 5000 }
    );
    return { connected: true, status: response.data };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Link ride to hotel booking for seamless checkout
 */
export async function linkRideToHotelBooking(params: {
  rideId: string;
  hotelBookingId: string;
  guestId: string;
  amount: number;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/rides/link`,
      params,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Link ride to hotel booking failed:', error.message);
    throw error;
  }
}

export default {
  getGuestTransferRequests,
  bookGuestTransfer,
  updateTransferStatus,
  getHotelGuestInfo,
  checkHealth,
  linkRideToHotelBooking,
};