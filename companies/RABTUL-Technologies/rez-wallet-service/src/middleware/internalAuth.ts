import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';

// ROUTE-SEC-001: IP allowlist cache
let _ipAllowlistCache: string[] | null = null;
function getIpAllowlist(): string[] {
  if (_ipAllowlistCache !== null) return _ipAllowlistCache;
  const raw = process.env.ALLOWED_INTERNAL_IPS;
  _ipAllowlistCache = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return _ipAllowlistCache;
}

function ipInRange(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function isPrivateIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, '');
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(normalized)) return true;
  if (normalized === '::1' || normalized === 'fe80:' || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  return false;
}

function getCallerIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    // Take the rightmost non-private IP — this is the most trustworthy as it was added
    // by the innermost trusted proxy (or load balancer). Attacker-controlled XFF values
    // appear at the left (client) position.
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = parts[i].replace(/^::ffff:/, '');
      if (!isPrivateIp(candidate)) return candidate;
    }
    // All IPs are private — fall back to rightmost (trust LB)
    if (parts.length > 0) return parts[parts.length - 1].replace(/^::ffff:/, '');
  }
  return (req as unknown).ip || (req as unknown).socket?.remoteAddress || null;
}

// ROUTE-SEC-001: IP allowlist check — defense-in-depth. Best enforced at network layer (K8s NetworkPolicy).
function checkIpAllowlist(req: Request): boolean {
  const allowlist = getIpAllowlist();
  if (allowlist.length === 0) return true;
  const callerIp = getCallerIp(req);
  if (!callerIp) return false;
  const normalizedIp = callerIp.replace(/^::ffff:/, '');
  return allowlist.some((cidr) => ipInRange(normalizedIp, cidr));
}

function resolveScopedTokens(): Record<string, string> | null {
  const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    // R2-M10: Crash-safe — return null so the service can still start with legacy token.
    // Log a warning so operators notice the misconfiguration.
    if (process.env.NODE_ENV === 'production') {
      logger.warn('[InternalAuth] WARNING: INTERNAL_SERVICE_TOKENS_JSON is not valid JSON — scoped auth disabled');
    }
    return null;
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  // ROUTE-SEC-001 FIX: IP allowlist — defense-in-depth, best at network layer
  if (!checkIpAllowlist(req)) {
    res.status(403).json({ success: false, message: 'Caller IP not in allowlist' });
    return;
  }

  const token = req.headers['x-internal-token'] as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;
  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!scopedTokens && !legacyToken) {
    res.status(503).json({ success: false, message: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' });
    return;
  }

  let isValid = false;
  const tokenBuf = Buffer.from(token || '');

  if (scopedTokens) {
    const expected = callerService ? scopedTokens[callerService] : undefined;
    const expectedBuf = Buffer.from(expected || '');
    isValid = !!expected &&
      tokenBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(tokenBuf, expectedBuf);
  }

  if (!isValid && legacyToken) {
    const legacyBuf = Buffer.from(legacyToken);
    isValid = tokenBuf.length === legacyBuf.length &&
      crypto.timingSafeEqual(tokenBuf, legacyBuf);
  }

  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid internal token' });
    return;
  }

  next();
}
