/**
 * RABTUL: OAuth2 routes for rez-merchant-service.
 * Enables merchant SSO via the RABTUL Auth Service partner OAuth2 flow.
 *
 * Flow:
 * 1. GET /oauth/authorize  → redirect to RABTUL Auth Service
 * 2. RABTUL redirects to GET /oauth/callback?code=xxx&state=yyy
 * 3. Exchange code for tokens at /oauth/token
 * 4. Fetch user profile at /oauth/userinfo
 * 5. Find or create Merchant linked to rezUserId
 * 6. Issue JWT + refresh token + httpOnly cookies
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('oauth');
const router = Router();

// RABTUL: OAuth service URL - must be configured via environment variables
const REZ_AUTH_URL = process.env.AUTH_SERVICE_URL || process.env.REZ_AUTH_SERVICE_URL;
const REZ_CLIENT_ID = process.env.PARTNER_REZ_MERCHANT_CLIENT_ID;
const REDIRECT_URI = process.env.PARTNER_REZ_MERCHANT_REDIRECT_URI;
const SCOPES = ['profile'];

// Validate required configuration at startup
if (!REZ_AUTH_URL) {
  throw new Error('AUTH_SERVICE_URL or REZ_AUTH_SERVICE_URL environment variable must be configured');
}
if (!REDIRECT_URI) {
  throw new Error('PARTNER_REZ_MERCHANT_REDIRECT_URI environment variable must be configured');
}

function assertOAuthConfigured(): void {
  if (!REZ_AUTH_URL) {
    throw Object.assign(new Error('REZ_AUTH_SERVICE_URL environment variable is required'), { statusCode: 503 });
  }
  if (!REZ_CLIENT_ID) {
    throw Object.assign(new Error('PARTNER_REZ_MERCHANT_CLIENT_ID environment variable is required'), { statusCode: 503 });
  }
}

function buildAuthorizeUrl(state?: string): string {
  assertOAuthConfigured();
  const params = new URLSearchParams({
    client_id: String(REZ_CLIENT_ID),
    redirect_uri: String(REDIRECT_URI),
    response_type: 'code',
    scope: SCOPES.join(' '),
  });
  if (state) params.set('state', state);
  return `${REZ_AUTH_URL}/oauth/authorize?${params.toString()}`;
}

async function fetchRezUserInfo(accessToken: string) {
  assertOAuthConfigured();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  let res: globalThis.Response;
  try {
    res = await fetch(`${REZ_AUTH_URL}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ac.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      `Userinfo failed (${res.status}): ${body.error || 'Unknown error'}`,
    );
  }
  return res.json() as Promise<{
    sub: string;
    phone: string;
    name: string;
    email?: string;
  }>;
}

async function exchangeCodeForTokens(code: string) {
  assertOAuthConfigured();
  const clientSecret = process.env.PARTNER_REZ_MERCHANT_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('PARTNER_REZ_MERCHANT_CLIENT_SECRET is not configured');
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  let res: globalThis.Response;
  try {
    res = await fetch(`${REZ_AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: REZ_CLIENT_ID,
        client_secret: clientSecret,
      }),
      signal: ac.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error_description?: string; error?: string };
    throw new Error(
      `Token exchange failed (${res.status}): ${body.error_description || body.error || 'Unknown error'}`,
    );
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }>;
}

function issueMerchantTokens(merchantId: string, role = 'owner') {
  const secret = process.env.JWT_MERCHANT_SECRET;
  if (!secret) throw new Error('JWT_MERCHANT_SECRET is not configured');

  const permissions = ['all'];
  const payload = { merchantId, role, permissions };

  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_MERCHANT_EXPIRES_IN || '1h',
  } as jwt.SignOptions);

  const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshTokenRaw)
    .digest('hex');

  return { token, refreshTokenRaw, refreshTokenHash };
}

const ALLOWED_REDIRECT_DOMAINS = [
  'rez.money',
  'merchant.rez.money',
  'admin.rez.money',
  'menu.rez.money',
  'www.rez.money',
  'rez-app-merchant.com',
];

function isAllowedRedirectUrl(url: string): boolean {
  if (!url) return false;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // SECURITY FIX: Parse hostname properly instead of using .includes()
      // which was vulnerable to subdomain bypass (e.g., evil.com/rez.money.evil.com)
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Exact match or subdomain of allowed domains
      const allowed = ALLOWED_REDIRECT_DOMAINS.some((d) => {
        const domain = d.toLowerCase();
        // Exact match or subdomain (hostname ends with .domain)
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });
      if (!allowed) return false;

      // Also verify no path traversal or other tricks
      if (parsed.pathname.includes('..')) return false;
    } else if (!url.startsWith('/')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setAuthCookies(res: Response, token: string, refreshToken: string) {
  const isSecure = process.env.NODE_ENV === 'production';
  res.cookie('merchant_access_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
    path: '/',
  });
  res.cookie('merchant_refresh_token', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * GET /oauth/authorize
 *
 * Redirects to the REZ Auth Service authorization endpoint.
 * Optionally pass ?redirect_to=xxx to return to that URL after login.
 */
router.get('/authorize', async (req: Request, res: Response) => {
  const redirectTo = (req.query.redirect_to as string) || '/dashboard';
  const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64');
  const authUrl = buildAuthorizeUrl(state);
  logger.info('Redirecting to REZ Auth', { redirectTo });
  res.redirect(authUrl);
});

/**
 * GET /oauth/callback
 *
 * OAuth2 callback handler — exchanges authorization code for tokens,
 * verifies the REZ user, creates or links a Merchant account, and
 * issues a JWT with httpOnly cookies.
 *
 * Redirects on error: /auth/login?oauth_error=xxx
 * Redirects on success: the redirect_to from state, or /dashboard
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  const loginRedirect = (errorParam?: string) => {
    const url = new URL('/auth/login', req.originalUrl.startsWith('http') ? req.protocol + '://' + req.get('host') : 'http://localhost:4005');
    if (errorParam) url.searchParams.set('oauth_error', errorParam);
    res.redirect(url.toString());
  };

  if (error) {
    logger.warn('OAuth error from RABTUL Auth', { error });
    return loginRedirect(error as string);
  }

  if (!code || typeof code !== 'string') {
    return loginRedirect('invalid_request');
  }

  let redirectTo = '/dashboard';
  if (state && typeof state === 'string') {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      redirectTo = decoded.redirectTo || '/dashboard';
    } catch {
      // Invalid state — use default
    }
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await fetchRezUserInfo(tokens.access_token);

    const { sub: rezUserId, name, phone, email } = userInfo;

    // Find or create merchant by rezUserId
    // TECH-007 FIX: Also check by phone/email to prevent duplicates
    // If user registered with email/password then tries OAuth, link existing account
    let existingMerchant = await Merchant.findOne({ rezUserId }).lean();
    let merchantId: string | undefined;
    let isNewMerchant = false;

    if (!existingMerchant) {
      // TECH-007: Check for existing merchant by phone or email
      // This prevents duplicates when user first registers with email/password
      // then later tries to log in via REZ OAuth2
      const duplicateQuery: Record<string, string> = {};
      if (phone) duplicateQuery.phone = phone;
      if (email) duplicateQuery.email = email.toLowerCase();

      if (Object.keys(duplicateQuery).length > 0) {
        const existingByContact = await Merchant.findOne(duplicateQuery).lean();
        if (existingByContact) {
          // Link existing merchant to REZ user instead of creating new
          await Merchant.findByIdAndUpdate(existingByContact._id, { $set: { rezUserId } });
          merchantId = String(existingByContact._id);
          logger.info('TECH-007: Existing merchant linked via REZ OAuth2 (phone/email match)', {
            rezUserId,
            merchantId,
            matchedBy: phone ? 'phone' : 'email',
          });
        }
      }

      // If still no match, create new merchant
      if (!merchantId) {
        const safeName = name || phone || 'My Business';
        const merchant = await Merchant.create({
          businessName: safeName,
          ownerName: name || safeName,
          email: email || `${rezUserId}@rez.money`,
          phone: phone || '',
          password: '__oauth_no_password__', // SSO-only; email/password login disabled
          rezUserId,
          verificationStatus: 'pending',
          onboarding: { completed: false },
        });
        merchantId = String(merchant._id);
        isNewMerchant = true;

        // Auto-create default store
        await Store.create({
          merchant: merchant._id,
          name: safeName,
          category: 'general',
          location: { address: '', city: '' },
        });

        logger.info('TECH-007: New merchant created via REZ OAuth2', { rezUserId, merchantId });
      }
    } else {
      merchantId = String(existingMerchant._id);
      logger.info('TECH-007: Returning merchant linked via REZ OAuth2', { rezUserId, merchantId });
    }

    // merchantId is guaranteed to be set at this point
    const { token, refreshTokenRaw, refreshTokenHash } = issueMerchantTokens(merchantId!);

    await Merchant.findByIdAndUpdate(merchantId, {
      $set: {
        refreshTokenHash,
        refreshTokenMeta: JSON.stringify({ role: 'owner', permissions: ['all'] }),
        lastLoginAt: new Date(),
      },
    });

    setAuthCookies(res, token, refreshTokenRaw);

    logger.info('OAuth2 login success', { rezUserId, merchantId });

    // Redirect to original destination (validated)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const targetUrl = isAllowedRedirectUrl(redirectTo)
      ? redirectTo.startsWith('http')
        ? redirectTo
        : `${baseUrl}${redirectTo}`
      : `${baseUrl}/dashboard`;
    res.redirect(targetUrl);
  } catch (err: unknown) {
    logger.error('OAuth callback error', { error: err.message });
    return loginRedirect('callback_error');
  }
});

/**
 * POST /oauth/refresh
 *
 * Refreshes the access token using a RABTUL OAuth2 refresh token.
 * Only available if RABTUL OAuth2 flow was used (not for regular email/password login).
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    res.status(400).json({ success: false, message: 'refresh_token required' });
    return;
  }

  try {
    const clientSecret = process.env.PARTNER_REZ_MERCHANT_CLIENT_SECRET;
    if (!clientSecret) {
      res.status(503).json({ success: false, message: 'OAuth not configured' });
      return;
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 10000);
    const tokenRes = await fetch(`${REZ_AUTH_URL}/oauth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: REZ_CLIENT_ID,
        client_secret: clientSecret,
      }),
      signal: ac.signal,
    });
    clearTimeout(timer);

    if (!tokenRes.ok) {
      res.status(401).json({ success: false, message: 'Token refresh failed' });
      return;
    }

    const tokens = await tokenRes.json();
    res.json({ success: true, data: tokens });
  } catch (err: unknown) {
    logger.error('OAuth refresh error', { error: err.message });
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
});

export default router;
