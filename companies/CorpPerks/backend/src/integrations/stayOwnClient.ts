/**
 * StayOwn Hotel OS Integration
 * Corporate travel booking via RTNM ecosystem
 */

import axios from 'axios';

const STAYOWN_URL = process.env.STAYOWN_URL || 'http://localhost:3899';
const HOTEL_OS_URL = process.env.HOTEL_OS_URL || 'http://localhost:3899';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Internal headers for service-to-service calls
const getInternalHeaders = () => ({
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
  'Content-Type': 'application/json',
});

/**
 * Search hotels for corporate travel
 */
export async function searchHotels(params: {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  corporateId?: string;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/hotels/search`,
      params,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Hotel search failed:', error.message);
    throw error;
  }
}

/**
 * Book hotel room for corporate traveler
 */
export async function bookHotel(params: {
  hotelId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  corporateId: string;
  employeeId: string;
  billingType?: 'corporate' | 'personal';
  costCenter?: string;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/bookings/create`,
      {
        ...params,
        source: 'corpperks',
        bookingType: 'corporate',
        metadata: {
          corporateId: params.corporateId,
          employeeId: params.employeeId,
          costCenter: params.costCenter,
        },
      },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Hotel booking failed:', error.message);
    throw error;
  }
}

/**
 * Get hotel booking status
 */
export async function getBookingStatus(bookingId: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/bookings/${bookingId}`,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Get booking status failed:', error.message);
    throw error;
  }
}

/**
 * Cancel hotel booking
 */
export async function cancelBooking(bookingId: string, reason: string) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/bookings/${bookingId}/cancel`,
      { reason },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Cancel booking failed:', error.message);
    throw error;
  }
}

/**
 * Get hotel recommendations based on employee travel history
 */
export async function getRecommendations(employeeId: string, city: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/recommendations`,
      {
        params: { employeeId, city },
        headers: getInternalHeaders() },
    );
    return response.data;
  } catch (error) {
    console.error('Get recommendations failed:', error.message);
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
 * Sync corporate travel policy with StayOwn
 */
export async function syncTravelPolicy(corporateId: string, policy: {
  maxDailyRate: number;
  allowedCategories: string[];
  preferredHotels: string[];
  autoApprovalThreshold: number;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/corporate/${corporateId}/travel-policy`,
      policy,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Sync travel policy failed:', error.message);
    throw error;
  }
}

export default {
  searchHotels,
  bookHotel,
  getBookingStatus,
  cancelBooking,
  getRecommendations,
  checkHealth,
  syncTravelPolicy,
};