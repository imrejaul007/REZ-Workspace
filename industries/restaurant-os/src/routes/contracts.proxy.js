/**
 * Contracts Proxy Route
 *
 * Proxies /api/contracts/* to the real sutar-contracts service
 * (port 4185 by default) via the SUTAR gateway (4140).
 *
 * After NEXHA-AUDIT-V2 Phase 9, the restaurant-os orchestrator exposes
 * the full Contract Engine surface for restaurant ops:
 *   - list/get contracts (filter by status, party)
 *   - draft + sign + fulfill + settle + cancel contracts
 *   - generate-from-deal convenience (used by procurement-os)
 *   - templates list (PO, Supply Agreement, Service, NDA, SLA, delivery, data_share, negotiation)
 *
 * Endpoint mapping:
 *
 *   Orchestrator (5010)                          → SUTAR gateway (4140)
 *   ──────────────────────────────────────────────────────────────────────────
 *   GET    /api/contracts/templates              → /api/sutar/contractsOS/api/templates
 *   GET    /api/contracts/templates/:kind        → /api/sutar/contractsOS/api/templates/:kind
 *   GET    /api/contracts                        → /api/sutar/contractsOS/api/contracts
 *   GET    /api/contracts/:id                    → /api/sutar/contractsOS/api/contracts/:id
 *   POST   /api/contracts                        → /api/sutar/contractsOS/api/contracts
 *   POST   /api/contracts/from-deal              → /api/sutar/contractsOS/api/contracts/from-deal
 *   POST   /api/contracts/:id/sign               → /api/sutar/contractsOS/api/contracts/:id/sign
 *   POST   /api/contracts/:id/fulfill            → /api/sutar/contractsOS/api/contracts/:id/fulfill
 *   POST   /api/contracts/:id/settle             → /api/sutar/contractsOS/api/contracts/:id/settle
 *   POST   /api/contracts/:id/cancel             → /api/sutar/contractsOS/api/contracts/:id/cancel
 *
 * Fail-open: if sutar-contracts is unreachable, returns 503 with a
 * clear error code so the caller can fall back to the dashboard's
 * aggregate view (which is independently cached).
 *
 * Service-to-service auth: uses x-internal-token. The SUTAR gateway
 * forwards auth headers as-is for /api/sutar/* routes.
 *
 * Refs NEXHA-VS-CODE-AUDIT-V2.md Phase 9 (Contract Engine wiring).
 */

import { Router } from 'express';

const router = Router();

const SUTAR_GATEWAY_URL = process.env.SUTAR_GATEWAY_URL || 'http://localhost:4140';
const SUTAR_CONTRACTS_KEY = process.env.SUTAR_CONTRACTS_KEY || 'contractsOS';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const REQUEST_TIMEOUT_MS = 10000;

async function proxyToSutar(req, res, next) {
  // Strip leading slash from req.path
  const suffix = req.path.replace(/^\/+/, '');
  const targetPath = suffix.length > 0 ? `api/${SUTAR_CONTRACTS_KEY}/api/${suffix}` : `api/${SUTAR_CONTRACTS_KEY}/api/contracts`;

  const queryIdx = req.url.indexOf('?');
  const queryString = queryIdx >= 0 ? req.url.substring(queryIdx) : '';
  const targetUrl = `${SUTAR_GATEWAY_URL}/${targetPath}${queryString}`;

  const headers = {
    'content-type': req.headers['content-type'] || 'application/json',
  };
  if (INTERNAL_SERVICE_TOKEN) {
    headers['x-internal-token'] = INTERNAL_SERVICE_TOKEN;
  }
  if (req.headers['x-corp-id']) {
    headers['x-corp-id'] = req.headers['x-corp-id'];
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutHandle);

    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.status(upstream.status);
    res.setHeader('content-type', contentType);
    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    clearTimeout(timeoutHandle);
    const message = err && err.message ? err.message : String(err);
    res.status(503).json({
      success: false,
      error: { code: 'SUTAR_CONTRACTS_UNREACHABLE', message: `sutar-contracts unreachable: ${message}` },
    });
  }
}

router.use('/', proxyToSutar);

export default router;