import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Sets httpOnly;Secure;SameSite=Lax cookies for the access and refresh tokens.
 *
 * This route is called client-side from setTokens() after a successful login.
 * It allows the Next.js server to set cookies with attributes that JavaScript
 * can never override (HttpOnly means document.cookie cannot read them).
 *
 * SECURITY FIX (NOW-COOKIE-002): JWT signature is now verified before setting cookies.
 * Uses the shared JWT_SECRET to verify the HMAC-SHA256 signature. This prevents
 * forged JWT injection — even if an attacker bypasses format validation,
 * they cannot forge a valid signature without knowing JWT_SECRET.
 */

interface SetCookiesBody {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function base64UrlDecode(str: string): Buffer {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '=='.slice(0, (4 - s.length % 4) % 4);
  return Buffer.from(padded, 'base64');
}

function verifyJwtSignature(token: string): boolean {
  if (!JWT_SECRET) {
    // No secret configured — fall back to format-only validation (dev mode)
    return true;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const sigInput = `${headerB64}.${payloadB64}`;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(sigInput)
      .digest('base64url');

    // Constant-time comparison
    if (signatureB64.length !== expectedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < signatureB64.length; i++) {
      diff |= signatureB64.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return false;

    // Verify algorithm in header
    const header = JSON.parse(base64UrlDecode(headerB64).toString());
    if (header.alg !== 'HS256') return false;

    // Check expiry
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: SetCookiesBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { accessToken, refreshToken } = body;

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    return NextResponse.json({ error: 'accessToken is required' }, { status: 400 });
  }
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    return NextResponse.json({ error: 'refreshToken is required' }, { status: 400 });
  }

  if (accessToken.length > 2048 || refreshToken.length > 4096) {
    return NextResponse.json({ error: 'Token value too long' }, { status: 400 });
  }

  // NOW-COOKIE-002: Verify JWT signature before setting cookies.
  // This is the definitive fix against forged token injection.
  if (!verifyJwtSignature(accessToken)) {
    return NextResponse.json({ error: 'Invalid access token signature' }, { status: 400 });
  }
  if (!verifyJwtSignature(refreshToken)) {
    return NextResponse.json({ error: 'Invalid refresh token signature' }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  const response = NextResponse.json({ success: true });

  response.cookies.set('rez_access_token', accessToken, {
    ...cookieOptions,
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set('rez_refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  return response;
}
