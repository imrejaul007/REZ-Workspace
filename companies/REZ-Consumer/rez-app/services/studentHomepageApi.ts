// @ts-nocheck
/**
 * Student Homepage API Service
 *
 * Provides campus-specific and student-targeted data for homepage sections.
 * All endpoints are student-persona scoped.
 *
 * Backend endpoints exist in personaHomepageRoutes.ts:
 *   GET /api/homepage/campus-trending
 *   GET /api/homepage/student-utility
 *   GET /api/homepage/student-packs
 * Each function calls the real endpoint and falls back to placeholder data
 * when the backend returns an error or empty response.
 */

import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampusTrendingItem {
  id: string;
  name: string;
  thumbnail: string;
  studentVisitsToday: number;
  cashbackPercent: number;
  distanceFromCampus: number; // in km
  isLimitedTime?: boolean;
  isTrending?: boolean;
  category?: string;
}

export interface StudentUtilityDeal {
  id: string;
  icon: string;
  name: string;
  saveAmount: number; // in Rs.
  category: string;
  route?: string;
}

export interface StudentMicroPack {
  id: string;
  price: number; // Rs. 49 / 79 / 99
  worthValue: number; // Rs. 75 / 120 / 160
  savingsPercent: number;
  category: 'food' | 'grooming' | 'entertainment';
  color: string;
  accentColor: string;
  emoji: string;
  title: string;
}

// ─── Placeholder data (used until backend endpoints are ready) ─────────────────

const PLACEHOLDER_CAMPUS_TRENDING: CampusTrendingItem[] = [
  {
    id: 'ct-1',
    name: 'Campus Bites',
    thumbnail: 'https://placehold.co/200x140/F97316/fff?text=Campus+Bites',
    studentVisitsToday: 142,
    cashbackPercent: 18,
    distanceFromCampus: 0.3,
    isLimitedTime: true,
    isTrending: true,
    category: 'food',
  },
  {
    id: 'ct-2',
    name: 'GameZone Arena',
    thumbnail: 'https://placehold.co/200x140/7C3AED/fff?text=GameZone',
    studentVisitsToday: 89,
    cashbackPercent: 12,
    distanceFromCampus: 0.8,
    isTrending: true,
    category: 'entertainment',
  },
  {
    id: 'ct-3',
    name: 'Print & Study Hub',
    thumbnail: 'https://placehold.co/200x140/0EA5E9/fff?text=Print+Hub',
    studentVisitsToday: 201,
    cashbackPercent: 10,
    distanceFromCampus: 0.2,
    category: 'utility',
  },
  {
    id: 'ct-4',
    name: 'Chai Corner',
    thumbnail: 'https://placehold.co/200x140/FBBF24/1a3a52?text=Chai+Corner',
    studentVisitsToday: 312,
    cashbackPercent: 15,
    distanceFromCampus: 0.1,
    isLimitedTime: true,
    isTrending: true,
    category: 'food',
  },
  {
    id: 'ct-5',
    name: 'Freshly Laundry',
    thumbnail: 'https://placehold.co/200x140/34D399/fff?text=Laundry',
    studentVisitsToday: 56,
    cashbackPercent: 8,
    distanceFromCampus: 0.5,
    category: 'utility',
  },
];

const PLACEHOLDER_UTILITY_DEALS: StudentUtilityDeal[] = [
  { id: 'ud-1', icon: '🖨️', name: 'Print & Xerox', saveAmount: 15, category: 'print', route: '/near-u/food?subcategory=print' },
  { id: 'ud-2', icon: '📓', name: 'Stationery', saveAmount: 30, category: 'stationery', route: '/near-u/student-offers' },
  { id: 'ud-3', icon: '🔧', name: 'Bike Repair', saveAmount: 50, category: 'repair', route: '/near-u/services?subcategory=bike-repair' },
  { id: 'ud-4', icon: '👕', name: 'Laundry', saveAmount: 40, category: 'laundry', route: '/near-u/services?subcategory=laundry' },
  { id: 'ud-5', icon: '🍱', name: 'PG Mess / Tiffin', saveAmount: 60, category: 'tiffin', route: '/near-u/food?subcategory=tiffin' },
  { id: 'ud-6', icon: '📱', name: 'Mobile Recharge', saveAmount: 12, category: 'recharge', route: '/bill-payment' },
  { id: 'ud-7', icon: '🏠', name: 'Hostel Food', saveAmount: 35, category: 'hostel-food', route: '/near-u/food?subcategory=hostel' },
];

const PLACEHOLDER_MICRO_PACKS: StudentMicroPack[] = [
  {
    id: 'mp-49',
    price: 49,
    worthValue: 75,
    savingsPercent: 35,
    category: 'food',
    color: '#FFF7ED',
    accentColor: '#F97316',
    emoji: '🍕',
    title: 'Food Starter',
  },
  {
    id: 'mp-79',
    price: 79,
    worthValue: 120,
    savingsPercent: 34,
    category: 'grooming',
    color: '#FDF4FF',
    accentColor: '#9333EA',
    emoji: '✂️',
    title: 'Grooming Pack',
  },
  {
    id: 'mp-99',
    price: 99,
    worthValue: 160,
    savingsPercent: 38,
    category: 'entertainment',
    color: '#FFFBEB',
    accentColor: '#D97706',
    emoji: '🎮',
    title: 'Fun Pack',
  },
];

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch trending merchants near campus, sorted by student_booking_count.
 * Calls GET /api/homepage/campus-trending?campusId={campusId}
 * Falls back to placeholder data if the backend endpoint is not yet live.
 */
export async function getCampusTrending(campusId: string): Promise<CampusTrendingItem[]> {
  const response = await apiClient.get<{ items: CampusTrendingItem[] }>(
    `/homepage/campus-trending`,
    { campusId }
  );
  if (response.success && response.data?.items) {
    return response.data.items;
  }
  if (__DEV__) logger.warn('[StudentHomepage] Backend returned no data for campus-trending — showing empty state');
  return [];
}

/**
 * Fetch student utility deals near given location.
 * Calls GET /api/homepage/student-utility?lat={lat}&lng={lng}
 * Falls back to placeholder data if the backend endpoint is not yet live.
 */
export async function getStudentUtilityDeals(lat: number, lng: number): Promise<StudentUtilityDeal[]> {
  const response = await apiClient.get<{ items: StudentUtilityDeal[] }>(
    `/homepage/student-utility`,
    { lat, lng }
  );
  if (response.success && response.data?.items) {
    return response.data.items;
  }
  if (__DEV__) logger.warn('[StudentHomepage] Backend returned no data for student-utility — showing empty state');
  return [];
}

/**
 * Fetch micro prepaid pack configurations.
 * Calls GET /api/homepage/student-packs
 * Falls back to placeholder data if the backend endpoint is not yet live.
 */
export async function getStudentMicroPacks(): Promise<StudentMicroPack[]> {
  const response = await apiClient.get<{ packs: StudentMicroPack[] }>(
    '/homepage/student-packs'
  );
  if (response.success && response.data?.packs) {
    return response.data.packs;
  }
  if (__DEV__) logger.warn('[StudentHomepage] Backend returned no data for student-packs — showing empty state');
  return [];
}

export default {
  getCampusTrending,
  getStudentUtilityDeals,
  getStudentMicroPacks,
};
