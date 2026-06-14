/**
 * Server-level configuration constants.
 *
 * SECURITY: TRUST_PROXY controls whether the rate limiter trusts the X-Forwarded-For
 * header (set by upstream proxies/load balancers) for client IP identification.
 * - Set to `true` ONLY when this service sits behind a trusted reverse proxy
 *   (e.g. nginx, Cloudflare, AWS ALB) that sanitizes X-Forwarded-For.
 * - Set to `false` (default) to always use the direct socket address, preventing
 *   IP spoofing attacks where a client injects a fake X-Forwarded-For header.
 *
 * See SEA-002 for the full security rationale.
 */
export const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
