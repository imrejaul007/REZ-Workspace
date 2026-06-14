/**
 * Hotel OTA API Service
 *
 * Thin wrapper over axios for calls to the Hotel OTA microservice.
 * Shares the apiClient's timeout (10 s) and 401-refresh-and-retry pattern,
 * but targets the OTA base URL and uses the hotel-staff JWT stored in
 * SecureStore rather than the REZ merchant auth token.
 *
 * Replaces the raw `otaFetchWithTimeout` / `hotelFetch` helpers that were
 * previously inline in hotel-ota.tsx (MER-HIGH-07 fix).
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export interface OtaBookingSummary {
  id: string;
  bookingRef: string;
  guestName: string;
  roomTypeName: string;
  checkinDate: string;
  checkoutDate: string;
  numRooms: number;
  totalValuePaise: number;
  status: 'hold' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BrandCoinProgram {
  enabled: boolean;
  brandCoinName: string;
  brandCoinSymbol: string;
  earnPct: number;
  maxBurnPct: number;
  totalMembersCount: number;
  totalOutstandingPaise: number;
}

export interface PmsStatus {
  connected: boolean;
  lastSync: string | null;
  pendingPush: number;
}

// MER-MED-10/12 FIX: Lazy URL resolution — never throw at module evaluation time.
// Allows the rest of the app to boot even if hotel OTA is unavailable.
const OTA_BASE =
  process.env.EXPO_PUBLIC_HOTEL_OTA_URL ??
  (__DEV__ ? 'http://localhost:3008' : 'https://hotel-ota-placeholder.rez.in');

const OTA_TIMEOUT_MS = 10000;
const KEYCHAIN_SERVICE = 'rez.merchant.hotel';

function buildOtaClient(jwt: string): AxiosInstance {
  const client = axios.create({
    baseURL: OTA_BASE,
    timeout: OTA_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });
  return client;
}

async function refreshOtaToken(currentToken: string): Promise<string | null> {
  try {
    const res = await axios.post(
      `${OTA_BASE}/v1/auth/refresh`,
      { token: currentToken },
      { timeout: OTA_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );
    const newToken: string | undefined = res.data?.data?.token ?? res.data?.token;
    if (!newToken) return null;
    await SecureStore.setItemAsync('@hotel_ota:staff_token', newToken, {
      keychainService: KEYCHAIN_SERVICE,
    });
    return newToken;
  } catch {
    return null;
  }
}

async function getOtaToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('@hotel_ota:staff_token', {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch {
    return null;
  }
}

async function clearOtaToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('@hotel_ota:staff_token', {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch {
    // Non-fatal
  }
}

class HotelOtaService {
  /**
   * Fetch the bookings list for the connected hotel property.
   * On 401, attempts one token refresh and retries.
   * Throws if the session is expired after refresh failure.
   */
  async getBookings(limit = 20): Promise<OtaBookingSummary[]> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<{ bookings?: OtaBookingSummary[] }>(
        `/v1/hotel/bookings?limit=${limit}`
      );
      return res.data?.bookings ?? [];
    } catch (err) {
      return this._handleAuthError(err, () => this.getBookings(limit));
    }
  }

  /**
   * Fetch the brand coin program config for the connected hotel.
   * On 401, attempts one token refresh and retries.
   * Throws if the session is expired after refresh failure.
   */
  async getBrandCoinProgram(): Promise<BrandCoinProgram> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<BrandCoinProgram>('/v1/hotel/brand-coin/program');
      return res.data;
    } catch (err) {
      return this._handleAuthError(err, () => this.getBrandCoinProgram());
    }
  }

  /**
   * Fetch PMS connection status for the connected hotel.
   */
  async getPmsStatus(): Promise<PmsStatus> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<PmsStatus>('/v1/hotel/pms/status');
      return res.data;
    } catch (err) {
      return this._handleAuthError(err, () => this.getPmsStatus());
    }
  }

  /**
   * FIX-BIZOS-002: Trigger PMS inventory sync.
   * Triggers Hotel OTA to push current inventory to PMS.
   */
  async syncPmsInventory(): Promise<{ success: boolean; syncedAt: string }> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.post<{ success: boolean; synced_at: string }>('/v1/hotel/pms/sync');
      return { success: res.data.success, syncedAt: res.data.synced_at };
    } catch (err) {
      return this._handleAuthError(err, () => this.syncPmsInventory());
    }
  }

  /**
   * Internal: handles 401 by refreshing the OTA JWT and retrying once.
   * Clears the stored token if refresh fails so the UI shows the connect screen.
   */
  private async _handleAuthError<T>(err: unknown, retry: () => Promise<T>): Promise<T> {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status !== 401) {
      // Non-401 errors — surface a readable message
      const responseData = axiosErr.response?.data as { message?: string } | null;
      const message =
        responseData?.message ??
        (axiosErr.response?.status ? `Error ${axiosErr.response.status}` : axiosErr.message);
      throw new Error(message);
    }

    const currentToken = await getOtaToken();
    if (!currentToken) throw new Error('Session expired. Please reconnect your hotel property.');

    const newToken = await refreshOtaToken(currentToken);
    if (!newToken) {
      await clearOtaToken();
      throw new Error('Session expired. Please reconnect your hotel property.');
    }

    // Retry once with the refreshed token
    return retry();
  }
}

export const hotelOtaService = new HotelOtaService();
export default hotelOtaService;
