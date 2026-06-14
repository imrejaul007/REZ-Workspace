/**
 * Employee Homepage API Service
 *
 * Endpoints for employee-specific homepage sections:
 *   - Lunch deals near office
 *   - After-work picks
 *   - Smart value packs
 */

import apiClient, { ApiResponse } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LunchDeal {
  id: string;
  restaurantName: string;
  cuisineType: string;
  distance: string;           // e.g. "0.3 km"
  avgMealPrice: number;
  cashbackPercent: number;
  isExpress: boolean;         // < 20 min service
  imageUrl?: string;
  nextSlotLabel?: string;     // e.g. "Open till 3 PM"
  rating?: number;
  category: 'buffet' | 'combo' | 'express' | 'prepaid';
}

export interface AfterWorkPick {
  id: string;
  name: string;
  type: 'casual_dining' | 'rooftop' | 'happy_hour' | 'date_night' | 'weekend_special';
  discount: string;           // e.g. "30% off"
  distance: string;
  imageUrl?: string;
  groupBookingOffer?: string; // e.g. "Extra 10% for 4+ people"
  timing: string;             // e.g. "5 PM – 11 PM"
  rating?: number;
}

export interface ValuePack {
  id: string;
  title: string;
  category: 'salon' | 'dining' | 'wellness';
  price: number;              // amount to pay
  value: number;              // total worth
  savings: number;            // absolute saving
  savingsPercent: number;
  validityDays: number;
  highlights: string[];
  ctaLabel: string;
  badgeColor: string;
}

export interface LunchDealsResponse {
  deals: LunchDeal[];
  lunchHoursActive: boolean;
  countdownMinutes?: number;  // mins left in lunch window
}

export interface AfterWorkResponse {
  picks: AfterWorkPick[];
  isAfterWorkHours: boolean;
  groupBookingCta: string;
}

export interface ValuePacksResponse {
  packs: ValuePack[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch lunch deals near the user's office location.
 * @param lat  Latitude of the user
 * @param lng  Longitude of the user
 */
export async function getLunchDeals(
  lat: number,
  lng: number,
): Promise<ApiResponse<LunchDealsResponse>> {
  return apiClient.get<LunchDealsResponse>('/homepage/lunch-deals', { lat, lng });
}

/**
 * Fetch after-work dining + social picks near the user.
 * @param lat  Latitude of the user
 * @param lng  Longitude of the user
 */
export async function getAfterWorkPicks(
  lat: number,
  lng: number,
): Promise<ApiResponse<AfterWorkResponse>> {
  return apiClient.get<AfterWorkResponse>('/homepage/after-work', { lat, lng });
}

/**
 * Fetch smart value packs available for corporate employees.
 */
export async function getValuePacks(): Promise<ApiResponse<ValuePacksResponse>> {
  return apiClient.get<ValuePacksResponse>('/homepage/value-packs');
}

// ─── Default export ───────────────────────────────────────────────────────────

const employeeHomepageApi = {
  getLunchDeals,
  getAfterWorkPicks,
  getValuePacks,
};

export default employeeHomepageApi;
