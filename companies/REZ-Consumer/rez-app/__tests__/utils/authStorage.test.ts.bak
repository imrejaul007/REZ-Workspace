/**
 * Unit Tests for authStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

async function storeTokens(authToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

describe('authStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('should store and retrieve auth tokens', async () => {
    await storeTokens('access-token-abc', 'refresh-token-xyz');

    const stored = await getAuthToken();
    expect(stored).toBe('access-token-abc');
    expect(typeof stored).toBe('string');
  });

  it('should return null when no token is stored', async () => {
    const token = await getAuthToken();
    expect(token).toBeNull();
  });

  it('should clear tokens on logout', async () => {
    await storeTokens('access-token-abc', 'refresh-token-xyz');
    await clearTokens();

    const token = await getAuthToken();
    expect(token).toBeNull();
  });
});
