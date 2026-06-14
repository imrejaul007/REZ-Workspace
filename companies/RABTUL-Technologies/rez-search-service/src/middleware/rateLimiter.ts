import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { TRUST_PROXY } from '../config/server';

function createLimiter(prefix: string, maxRequests: number, windowSec: number) {
  // Atomic Lua script: increments counter and sets TTL on first hit.
  const luaScript = `
local key = KEYS[1]
local ttl = tonumber(ARGV[1])
local current = redis.call('incr', key)
if current == 1 then
  redis.call('expire', key, ttl)
end
return current
`;
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // SEA-002 FIX: req.ip reads X-Forwarded-For when trust proxy is enabled in Express,
    // which is user-controllable and enables IP spoofing attacks against the rate limiter.
    // Derive the client IP from the socket address when TRUST_PROXY is not explicitly
    // set, and only use req.ip (which respects X-Forwarded-For) when behind a trusted proxy.
    const clientIp = TRUST_PROXY ? (req.ip ?? req.socket.remoteAddress ?? 'unknown') : (req.socket.remoteAddress ?? 'unknown');
    const key = `${prefix}:${clientIp}`;
    try {
      // SEA-005 FIX: Use redis.call('eval', ...) instead of `redis as any`.
      // IORedis exposes call() as the typed interface for raw commands.
      const count = await (redis as unknown as { call: (cmd: string, ...args: (string | number)[]) => Promise<number> }).call('eval', luaScript, 1, key, windowSec);
      if (count > maxRequests) { res.status(429).json({ success: false, error: 'Too many requests' }); return; }
    } catch {
      // BAK-CROSS-001 FIX: Fail-closed for auth endpoints. Rate limiting must not
      // silently degrade when Redis is unavailable — doing so allows attackers to
      // bypass rate limits entirely during Redis outages.
      res.status(429).json({ success: false, error: 'Rate limit service unavailable — please retry later' });
      return;
    }
    next();
  };
}

export const searchLimiter = createLimiter('rl:search', 60, 60);
export const autocompleteLimiter = createLimiter('rl:autocomplete', 120, 60);
