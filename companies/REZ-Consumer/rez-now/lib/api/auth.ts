import { publicClient, normalizeTokenResponse } from './client';
import { AuthUser, AuthTokens } from '@/lib/types';

const OTP_COOLDOWN_KEY = 'rez:otp-sent-at';
const OTP_COOLDOWN_MS = 30_000; // 30 seconds

export async function sendOtp(phone: string, countryCode = '+91', channel: 'sms' | 'whatsapp' = 'sms') {
  // NW-MED-029: Client-side cooldown prevents rapid OTP spam while backend enforces per-IP limits.
  const now = Date.now();
  const lastSent = Number(sessionStorage.getItem(OTP_COOLDOWN_KEY)) || 0;
  if (now - lastSent < OTP_COOLDOWN_MS) {
    const remaining = Math.ceil((OTP_COOLDOWN_MS - (now - lastSent)) / 1000);
    throw new Error(`Please wait ${remaining}s before requesting a new OTP`);
  }

  const { data } = await publicClient.post('/api/user/auth/send-otp', {
    phone,
    countryCode,
    channel,
  });
  if (!data.success) throw new Error(data.error || 'Failed to send OTP');

  // Record send time for cooldown enforcement on next attempt
  sessionStorage.setItem(OTP_COOLDOWN_KEY, String(now));
  return data as { success: true; isNewUser: boolean; hasPIN: boolean; message?: string };
}

export async function verifyOtp(
  phone: string,
  otp: string,
  countryCode = '+91'
): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  const { data } = await publicClient.post('/api/user/auth/verify-otp', {
    phone,
    otp,
    countryCode,
  });
  if (!data.success) throw new Error(data.error || 'Invalid OTP');
  // NW-CRIT-014: Backend sets httpOnly cookies directly — tokens are no longer in the
  // JSON body. The middleware reads from cookies for auth; no client-side token storage needed.
  return { tokens: { accessToken: null, refreshToken: null }, user: data.user };
}

export async function verifyPin(
  phone: string,
  pin: string,
  countryCode = '+91'
): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  const { data } = await publicClient.post('/api/user/auth/login-pin', {
    phone,
    pin,
    countryCode,
  });
  if (!data.success) throw new Error(data.error || 'Invalid PIN');
  // NW-CRIT-014: Backend sets httpOnly cookies directly — tokens are no longer in the
  // JSON body. The middleware reads from cookies for auth; no client-side token storage needed.
  return { tokens: { accessToken: null, refreshToken: null }, user: data.user };
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  // NW-MED-028: Standardize to /api prefix for consistency with other endpoints.
  const { data } = await publicClient.post('/api/auth/token/refresh', { refreshToken: token });
  const { accessToken, refreshToken: newRefreshToken } = normalizeTokenResponse(data);
  if (!data.success || !accessToken) throw new Error('Token refresh failed');
  return { accessToken: accessToken, refreshToken: newRefreshToken ?? token };
}
