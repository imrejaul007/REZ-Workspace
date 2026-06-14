// dooh-mobile API service
// SECURITY: Token should be stored in secure storage (Keychain/Keystore)

import { Screen, Earnings, ApiResponse } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_DOOH_API_URL || 'http://localhost:4004';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchAPI<T>(url: string, options?: FetchOptions): Promise<T> {
  const controller = new AbortController();
  const timeout = options?.timeout || 30000; // 30 second default

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // In production, token should be retrieved from secure storage
    // For React Native, use expo-secure-store or react-native-keychain
    const token = await getAuthToken();

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error ${response.status}: ${error}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Get authentication token from secure storage
 * SECURITY: In production, use expo-secure-store or react-native-keychain
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // TODO: Implement secure token storage using:
    // - expo-secure-store: SecureStore.getItemAsync('auth_token')
    // - or react-native-keychain: Keychain.getGenericPassword()
    //
    // For now, return null (no auth header sent)
    // Production must implement proper token retrieval
    return null;
  } catch (error) {
    logger.error('Failed to retrieve auth token:', error);
    return null;
  }
}

// Mock data for development
const mockScreens: Screen[] = [
  { id: '1', name: 'Lobby Display', location: 'Hotel Reception', type: 'led', status: 'online', impressions: 12450, clicks: 234, earnings: 4500, todayEarnings: 234.50, lastUpdated: '2 min ago' },
  { id: '2', name: 'Restaurant Screen', location: 'Cafe Corner', type: 'tablet', status: 'online', impressions: 8920, clicks: 156, earnings: 2800, todayEarnings: 156.00, lastUpdated: '5 min ago' },
  { id: '3', name: 'Gym Entrance', location: 'Fitness Center', type: 'kiosk', status: 'offline', impressions: 0, clicks: 0, earnings: 0, todayEarnings: 0, lastUpdated: '1 hour ago' },
];

const mockEarnings: Earnings = {
  total: 12500,
  pending: 2340,
  paid: 10160,
  thisMonth: 4500,
  history: [
    { id: '1', amount: 500, date: '2026-05-01', type: 'credit', status: 'completed', description: 'Weekly payout' },
    { id: '2', amount: 234.50, date: '2026-05-13', type: 'credit', status: 'pending', description: 'Today earnings' },
  ],
};

export const api = {
  async getScreens(): Promise<Screen[]> {
    try {
      const res = await fetchAPI<ApiResponse<{ screens: Screen[] }>>(`${API_BASE}/api/screens`);
      return res.data?.screens || mockScreens;
    } catch (error) {
      logger.error('Failed to fetch screens:', error);
      return mockScreens;
    }
  },

  async getScreen(id: string): Promise<Screen | null> {
    try {
      const res = await fetchAPI<ApiResponse<Screen>>(`${API_BASE}/api/screens/${id}`);
      return res.data;
    } catch (error) {
      logger.error('Failed to fetch screen:', error);
      return mockScreens.find(s => s.id === id) || null;
    }
  },

  async getEarnings(): Promise<Earnings> {
    try {
      const res = await fetchAPI<ApiResponse<Earnings>>(`${API_BASE}/api/earnings`);
      return res.data;
    } catch (error) {
      logger.error('Failed to fetch earnings:', error);
      return mockEarnings;
    }
  },

  async toggleScreen(id: string, status: 'online' | 'offline'): Promise<boolean> {
    try {
      await fetchAPI(`${API_BASE}/api/screens/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return true;
    } catch (error) {
      logger.error('Failed to toggle screen:', error);
      return false;
    }
  },
};
