/**
 * StayOwn Hotel OS Integration for AdBazaar Marketing
 * Hotel guest engagement and targeted marketing campaigns
 */

import axios from 'axios';
import { logger } from '../config/logger';

const STAYOWN_URL = process.env.STAYOWN_URL || 'http://localhost:3899';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

const getInternalHeaders = () => ({
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
  'Content-Type': 'application/json',
});

/**
 * Get hotel guests for targeted marketing
 */
export async function getHotelGuests(params: {
  hotelId: string;
  checkIn?: string;
  checkOut?: string;
  segment?: string;
}) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${params.hotelId}/guests`,
      {
        params: {
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          segment: params.segment,
        },
        headers: getInternalHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    logger.error('Get hotel guests failed:', error.message);
    throw error;
  }
}

/**
 * Create hotel-specific campaign
 */
export async function createHotelCampaign(campaign: {
  hotelId: string;
  name: string;
  type: 'promotion' | 'loyalty' | 'upsell' | 'winback';
  targetSegments: string[];
  content: {
    title: string;
    body: string;
    cta: string;
  };
  targeting: {
    guestTypes?: string[];
    stayDates?: { from: string; to: string };
    minSpend?: number;
  };
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/hotels/${campaign.hotelId}/marketing/campaigns`,
      {
        ...campaign,
        source: 'adbazaar-marketing',
      },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Create hotel campaign failed:', error.message);
    throw error;
  }
}

/**
 * Get campaign performance from hotel
 */
export async function getCampaignPerformance(campaignId: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/campaigns/${campaignId}/performance`,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Get campaign performance failed:', error.message);
    throw error;
  }
}

/**
 * Track campaign conversion
 */
export async function trackConversion(params: {
  campaignId: string;
  guestId: string;
  action: 'view' | 'click' | 'conversion' | 'revenue';
  value?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/campaigns/${params.campaignId}/track`,
      params,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Track conversion failed:', error.message);
    throw error;
  }
}

/**
 * Get guest preferences for personalization
 */
export async function getGuestPreferences(guestId: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/guests/${guestId}/preferences`,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Get guest preferences failed:', error.message);
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
 * Get hotel loyalty program members
 */
export async function getLoyaltyMembers(hotelId: string, tier?: string) {
  try {
    const response = await axios.get(
      `${STAYOWN_URL}/api/hotels/${hotelId}/loyalty/members`,
      {
        params: { tier },
        headers: getInternalHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    logger.error('Get loyalty members failed:', error.message);
    throw error;
  }
}

/**
 * Send targeted offer to guest
 */
export async function sendGuestOffer(params: {
  hotelId: string;
  guestId: string;
  offerType: 'discount' | 'upgrade' | 'amenity' | 'experience';
  offerValue: string;
  validUntil: string;
}) {
  try {
    const response = await axios.post(
      `${STAYOWN_URL}/api/guests/${params.guestId}/offers`,
      params,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    logger.error('Send guest offer failed:', error.message);
    throw error;
  }
}

export default {
  getHotelGuests,
  createHotelCampaign,
  getCampaignPerformance,
  trackConversion,
  getGuestPreferences,
  checkHealth,
  getLoyaltyMembers,
  sendGuestOffer,
};