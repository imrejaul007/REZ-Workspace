import { Request } from 'express';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['all'],
  manager: ['orders', 'products', 'stores', 'team', 'analytics', 'settings'],
  staff: ['orders', 'products'],
  cashier: ['orders', 'pos'],
  viewer: ['analytics'],
};

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

const rawTrustHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const TRUST_PROXY_HOPS = Number.isFinite(rawTrustHops)
  ? Math.max(1, Math.min(3, rawTrustHops))
  : 1;

export function getClientIp(req: Request): string {
  if (TRUST_PROXY_HOPS > 0) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const ips = forwarded.split(',').map((s) => s.trim());
      return ips[ips.length - TRUST_PROXY_HOPS] || req.socket.remoteAddress || 'unknown';
    }
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}
