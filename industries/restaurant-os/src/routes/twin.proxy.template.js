/**
 * Twin-Proxy Helper
 *
 * Shared proxy logic for the restaurant-os orchestrator to forward
 * requests to a downstream twin service (kitchen, orders, staff,
 * customers). Each twin..js exports a router that uses this helper.
 *
 * Endpoint mapping (per twin):
 *   Orchestrator (5010)        →  Twin Service (PORT)
 *   ──────────────────────────────────────────────────
 *   /api/<twin>/*             →  /api/twins/<twin>/*
 *
 * Fail-open: 503 with twin-specific error code on transport failure.
 * Auth: forwards x-internal-token + x-corp-id.
 *
 * Refs NEXHA-VS-CODE-AUDIT-V2.md Phase 9-12 (wire remaining twins).
 */

import { Router } from 'express';

export function createTwinProxy(twinKey, opts) {
  const router = Router();

  const TWIN_URL = opts.url || `http://localhost:${opts.port}`;
  const TWIN_PATH = opts.path || `/api/twins/${twinKey}`;
  const REQUEST_TIMEOUT_MS = opts.timeoutMs || 10000;
  const INTERNAL_SERVICE_TOKEN = opts.token || process.env.INTERNAL_SERVICE_TOKEN || '';

  async function proxyToTwin(req, res, next) {
    const orchPath = req.path.replace(/^\/+/, '');
    const twinPath = orchPath.length > 0 ? orchPath : '';
    const targetPath = twinPath ? `${TWIN_PATH}/${twinPath}` : TWIN_PATH;

    const queryIdx = req.url.indexOf('?');
    const queryString = queryIdx >= 0 ? req.url.substring(queryIdx) : '';
    const targetUrl = `${TWIN_URL}${targetPath}${queryString}`;

    const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
    if (INTERNAL_SERVICE_TOKEN) headers['x-internal-token'] = INTERNAL_SERVICE_TOKEN;
    if (req.headers['x-corp-id']) headers['x-corp-id'] = req.headers['x-corp-id'];

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
        error: { code: `${twinKey.toUpperCase()}_TWIN_UNREACHABLE`, message: `${twinKey}-twin-service unreachable: ${message}` },
      });
    }
  }

  router.use('/', proxyToTwin);
  return router;
}