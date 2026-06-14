import { NextRequest, NextResponse } from 'next/server';
import { setTokens } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

const REZ_AUTH_URL = process.env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const REZ_CLIENT_ID = process.env.REZ_OAUTH_CLIENT_ID || 'rez-now';
const REZ_CLIENT_SECRET = process.env.REZ_OAUTH_CLIENT_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://now.rez.money';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * GET /api/auth/callback
 *
 * OAuth2 callback handler — exchanges authorization code for tokens and sets
 * httpOnly cookies, mirroring the existing JWT flow in /api/auth/set-cookies.
 *
 * Flow:
 * 1. Auth service redirects here with ?code=xxx&state=yyy
 * 2. We POST code + client credentials to /oauth/token
 * 3. Server sets httpOnly;Secure;SameSite=Lax cookies for both tokens
 * 4. Also syncs to encrypted localStorage via setTokens()
 * 5. Redirects to original destination or home
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors (e.g., user denied consent)
  if (error) {
    const redirectUrl = new URL('/?login=1', request.url);
    redirectUrl.searchParams.set('oauth_error', error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  // Decode state to get original destination
  let redirectTo = '/';
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      redirectTo = decoded.redirectTo || '/';
    } catch {
      // Invalid state — redirect to home
    }
  }

  try {
    // Exchange code for tokens at auth service
    const tokenRes = await fetch(`${REZ_AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/api/auth/callback`,
        client_id: REZ_CLIENT_ID,
        client_secret: REZ_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      logger.error('Token exchange failed', { errData });
      const redirectUrl = new URL('/?login=1', request.url);
      redirectUrl.searchParams.set('oauth_error', 'token_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token } = tokenData;

    if (!access_token || !refresh_token) {
      logger.error('Missing tokens in response', { tokenData });
      const redirectUrl = new URL('/?login=1', request.url);
      redirectUrl.searchParams.set('oauth_error', 'invalid_token_response');
      return NextResponse.redirect(redirectUrl);
    }

    // Set httpOnly cookies (same as /api/auth/set-cookies)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set('rez_access_token', access_token, {
      ...cookieOptions,
      maxAge: COOKIE_MAX_AGE,
    });
    response.cookies.set('rez_refresh_token', refresh_token, {
      ...cookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });

    // Also sync to encrypted localStorage for API client
    // This is non-blocking and won't affect the redirect
    void setTokens(access_token, refresh_token);

    return response;
  } catch (err) {
    logger.error('OAuth callback error', { error: err });
    const redirectUrl = new URL('/?login=1', request.url);
    redirectUrl.searchParams.set('oauth_error', 'callback_error');
    return NextResponse.redirect(redirectUrl);
  }
}
