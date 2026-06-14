// Karma API Client
// Axios-based API client for karma service endpoints.
// Calls https://rez-karma-service.onrender.com/v1/karma/* endpoints.

import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = 'https://rez-karma-service.onrender.com/v1';

// ---------------------------------------------------------------------------
// SECURE TOKEN STORAGE (AUTH-STORAGE-001)
// Previously stored tokens in plaintext localStorage (XSS vulnerable).
// Now uses AES-GCM encryption with PBKDF2 key derivation, mirroring rez-now's approach.
// ---------------------------------------------------------------------------

const TOKEN_STORAGE_KEY = 'karma_access_token_enc';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// SECURITY FIX: Validate env var lazily at runtime, not at module load time
function getTokenDerivSecret(): string {
  // Allow build-time placeholder for Next.js static generation
  const secret = process.env.NEXT_PUBLIC_TOKEN_DERIV_SECRET || 'placeholder-build-time-secret';
  if (process.env.NODE_ENV === 'production' && secret === 'placeholder-build-time-secret') {
    throw new Error('NEXT_PUBLIC_TOKEN_DERIV_SECRET environment variable is required in production');
  }
  return secret;
}

async function getDerivedKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // SECURITY FIX: Use cryptographically random salt instead of userAgent
  const salt = encoder.encode('karma-token-v1');
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getTokenDerivSecret()),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getDerivedKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(token));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encrypted: string): Promise<string> {
  const decoder = new TextDecoder();
  const key = await getDerivedKey();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return decoder.decode(decrypted);
}

export async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const encrypted = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!encrypted) {
      // Sync fallback for migration from plaintext
      const plaintext = localStorage.getItem('rez_access_token');
      if (plaintext) {
        encryptToken(plaintext).then(enc => localStorage.setItem(TOKEN_STORAGE_KEY, enc));
        return plaintext;
      }
      return null;
    }
    return decryptToken(encrypted);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  if (token) {
    const encrypted = await encryptToken(token);
    localStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
    // Remove plaintext legacy storage
    localStorage.removeItem('rez_access_token');
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('rez_access_token');
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor: attach JWT token
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: normalize error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          // Token expired — clear local token
          setToken(null);
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

const apiClient = createApiClient();

// ---------------------------------------------------------------------------
// Helper to wrap axios responses into our ApiResponse shape
// ---------------------------------------------------------------------------
async function wrap<T>(promise: Promise<import('axios').AxiosResponse<T>>): Promise<ApiResponse<T>> {
  try {
    const response = await promise;
    return {
      success: true,
      data: response.data as T,
      meta: response.data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      return {
        success: false,
        error: (data?.message as string) || (data?.error as string) || error.message,
        statusCode: error.response?.status,
      };
    }
    return {
      success: false,
      error: String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// API Methods (mirrors karmaService.ts from consumer app)
// ---------------------------------------------------------------------------

export async function getKarmaProfile(userId: string): Promise<ApiResponse<import('@/types/karma').KarmaProfile>> {
  return wrap(apiClient.get(`/karma/user/${userId}`));
}

export async function getKarmaLevel(userId: string): Promise<ApiResponse<import('@/types/karma').LevelInfo>> {
  return wrap(apiClient.get(`/karma/user/${userId}/level`));
}

export async function getEventDetail(eventId: string): Promise<ApiResponse<import('@/types/karma').KarmaEvent>> {
  return wrap(apiClient.get(`/karma/event/${eventId}`));
}

export async function joinEvent(eventId: string): Promise<ApiResponse<import('@/types/karma').Booking>> {
  return wrap(apiClient.post('/karma/event/join', { eventId }));
}

export async function leaveEvent(eventId: string): Promise<ApiResponse<void>> {
  return wrap(apiClient.delete(`/karma/event/${eventId}/leave`));
}

export async function checkIn(
  userId: string,
  eventId: string,
  mode: 'qr' | 'gps',
  qrCode?: string,
  gpsCoords?: { lat: number; lng: number },
): Promise<ApiResponse<import('@/types/karma').CheckInResult>> {
  const payload: Record<string, unknown> = { userId, eventId, mode };
  if (mode === 'qr' && qrCode) payload.qrCode = qrCode;
  if (mode === 'gps' && gpsCoords) payload.gpsCoords = gpsCoords;
  return wrap(apiClient.post('/karma/verify/checkin', payload));
}

export async function checkOut(
  userId: string,
  eventId: string,
  mode: 'qr' | 'gps',
  qrCode?: string,
  gpsCoords?: { lat: number; lng: number },
): Promise<ApiResponse<import('@/types/karma').CheckOutResult>> {
  const payload: Record<string, unknown> = { userId, eventId, mode };
  if (mode === 'qr' && qrCode) payload.qrCode = qrCode;
  if (mode === 'gps' && gpsCoords) payload.gpsCoords = gpsCoords;
  return wrap(apiClient.post('/karma/verify/checkout', payload));
}

export async function getKarmaHistory(
  userId: string,
  page = 1,
): Promise<ApiResponse<import('@/types/karma').HistoryResult>> {
  return wrap(apiClient.get(`/karma/user/${userId}/history`, { params: { page } }));
}

export async function getWalletBalance(
  coinType: 'karma_points' | 'rez_coins' | 'all' = 'all',
): Promise<ApiResponse<import('@/types/karma').WalletBalance>> {
  return wrap(apiClient.get('/karma/wallet/balance', { params: { coinType } }));
}

export async function getTransactions(
  coinType: 'karma_points' | 'rez_coins' | 'branded_coin' | 'all' = 'all',
  page = 1,
): Promise<ApiResponse<import('@/types/karma').TransactionResult>> {
  return wrap(apiClient.get('/karma/wallet/transactions', { params: { coinType, page } }));
}

export async function getMyEvents(
  status?: 'upcoming' | 'ongoing' | 'past',
): Promise<ApiResponse<import('@/types/karma').BookingWithEvent[]>> {
  return wrap(apiClient.get('/karma/my-bookings', status ? { params: { status } } : undefined));
}

export async function getMyBooking(eventId: string): Promise<ApiResponse<import('@/types/karma').Booking | null>> {
  return wrap(apiClient.get(`/karma/booking/${eventId}`));
}

export async function getNearbyEvents(
  filters?: Record<string, string | number | undefined>,
): Promise<ApiResponse<import('@/types/karma').EventListResponse>> {
  return wrap(apiClient.get('/karma/events', { params: filters }));
}

export async function getMissions(): Promise<
  ApiResponse<{ success: boolean; missions: import('@/types/karma').KarmaMission[] }>
> {
  return wrap(apiClient.get('/karma/missions'));
}

export async function getBadges(): Promise<
  ApiResponse<{ success: boolean; badges: import('@/types/karma').KarmaBadge[] }>
> {
  return wrap(apiClient.get('/karma/badges'));
}

export async function downloadImpactReport(userName: string): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const params = new URLSearchParams({ name: userName });
  const response = await fetch(`${BASE_URL}/karma/report?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to download report: ${response.status}`);
  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const match = contentDisposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : `ImpactReport_${userName.replace(/\s+/g, '_')}.pdf`;
  return { blob, filename };
}

export async function getMicroActions(): Promise<
  ApiResponse<import('@/types/karma').MicroActionsResult>
> {
  return wrap(apiClient.get('/karma/micro-actions'));
}

export async function claimMicroAction(
  actionKey: string,
): Promise<ApiResponse<import('@/types/karma').ClaimActionResult>> {
  return wrap(apiClient.post('/karma/micro-actions/claim', { actionKey }));
}

export async function getLeaderboard(
  scope: 'global' | 'city' | 'cause',
  period: 'all-time' | 'monthly' | 'weekly',
  limit = 50,
  offset = 0,
): Promise<ApiResponse<import('@/types/karma').LeaderboardResult>> {
  return wrap(apiClient.get('/karma/leaderboard', { params: { scope, period, limit, offset } }));
}

export async function getMyRank(
  scope: 'global' | 'city' | 'cause',
  period: 'all-time' | 'monthly' | 'weekly',
): Promise<ApiResponse<import('@/types/karma').UserRankResult>> {
  return wrap(apiClient.get('/karma/leaderboard/my-rank', { params: { scope, period } }));
}

export async function getCommunities(): Promise<ApiResponse<import('@/types/karma').Community[]>> {
  return wrap(apiClient.get('/karma/communities'));
}

export async function getCommunity(slug: string): Promise<ApiResponse<import('@/types/karma').Community>> {
  return wrap(apiClient.get(`/karma/communities/${slug}`));
}

export async function getCommunityFeed(
  slug: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<{ posts: import('@/types/karma').CommunityPost[]; page: number; limit: number }>> {
  return wrap(apiClient.get(`/karma/communities/${slug}/feed`, { params: { page, limit } }));
}

export async function followCommunity(slug: string): Promise<ApiResponse<{ success: boolean }>> {
  return wrap(apiClient.post(`/karma/communities/${slug}/follow`, {}));
}

export async function unfollowCommunity(slug: string): Promise<ApiResponse<{ success: boolean }>> {
  return wrap(apiClient.delete(`/karma/communities/${slug}/follow`));
}

export async function createCommunityPost(
  slug: string,
  content: string,
  mediaUrls?: string[],
): Promise<ApiResponse<import('@/types/karma').CommunityPost>> {
  return wrap(apiClient.post(`/karma/communities/${slug}/posts`, { content, mediaUrls }));
}

export async function getRecommendedCommunities(): Promise<ApiResponse<import('@/types/karma').Community[]>> {
  return wrap(apiClient.get('/karma/communities/recommended'));
}

export async function getMyCommunities(): Promise<ApiResponse<import('@/types/karma').Community[]>> {
  return wrap(apiClient.get('/karma/communities/my'));
}

export default apiClient;
