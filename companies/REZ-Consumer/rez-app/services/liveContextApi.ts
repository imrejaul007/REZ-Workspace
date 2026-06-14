// Live Context API
// Fetches time-aware, location-aware context data for the Near-U homepage pill and carousel.

import apiClient from './apiClient';

export interface LiveContextData {
  nearbyStoreCount: number;
  nearbyOfferCount: number;
  topDeal: {
    storeId: string;
    storeName: string;
    offerTitle: string;
    savingsAmount: number;
    distance: string;
  } | null;
  timeSlot: 'morning' | 'lunch' | 'evening' | 'night';
}

export const getLiveContext = (lat: number, lng: number) =>
  apiClient.get<LiveContextData>('/home/live-context', { lat, lng });
