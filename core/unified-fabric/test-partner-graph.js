/**
 * Smoke tests for the nexha-partner-graph client methods on
 * NexhaConnection (ADR-0010 Phase 7, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-partner-graph.js
 *
 * Covers:
 *   - recordInteraction (POST /api/interactions)
 *   - listInteractions (GET /api/interactions with partnerRef/type/limit/offset)
 *   - listPartners (GET /api/partners with relationshipType/limit/offset)
 *   - getPartner (GET /api/partners/:ref)
 *   - listPartnersByType (GET /api/partners/by-type/:type)
 *   - recommendPartners (POST /api/recommend)
 *   - getPartnerStats (GET /api/stats)
 *   - null on network error
 *   - Authorization header is forwarded
 *
 * Pattern matches test-mission-planner.js.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NexhaConnection } from './src/connections/nexha.js';

const originalFetch = globalThis.fetch;

function installFetchMock(responder) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return responder(url, init);
  };
  return {
    calls,
    restore: () => { globalThis.fetch = originalFetch; },
  };
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function baseConn() {
  const c = new NexhaConnection({});
  c.tenantId = 'tenant-a';
  c.token = 'jwt-abc';
  return c;
}

// ============================================================================
// recordInteraction
// ============================================================================

test('recordInteraction POSTs to /api/interactions', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ ok: true, interaction: { interactionId: 'I-1' } }));
  try {
    const c = baseConn();
    const res = await c.recordInteraction({
      partnerRef: 'partner-1',
      type: 'transaction',
      direction: 'outgoing',
      value: 5000,
    });
    assert.equal(res.ok, true);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/interactions');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers['Authorization'], 'Bearer jwt-abc');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.partnerRef, 'partner-1');
    assert.equal(body.type, 'transaction');
    assert.equal(body.value, 5000);
  } finally { restore(); }
});

// ============================================================================
// listInteractions
// ============================================================================

test('listInteractions with no filter', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ interactions: [], total: 0 }));
  try {
    const c = baseConn();
    const res = await c.listInteractions();
    assert.equal(res.total, 0);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/interactions');
    assert.equal(calls[0].init.method, undefined);
  } finally { restore(); }
});

test('listInteractions with partnerRef, type, limit, offset', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ interactions: [], total: 0 }));
  try {
    const c = baseConn();
    await c.listInteractions({ partnerRef: 'partner-1', type: 'transaction', limit: 10, offset: 20 });
    const url = calls[0].url;
    assert.ok(url.includes('partnerRef=partner-1'));
    assert.ok(url.includes('type=transaction'));
    assert.ok(url.includes('limit=10'));
    assert.ok(url.includes('offset=20'));
  } finally { restore(); }
});

// ============================================================================
// listPartners
// ============================================================================

test('listPartners with relationshipType filter', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ partners: [], total: 0 }));
  try {
    const c = baseConn();
    const res = await c.listPartners({ relationshipType: 'supplier', limit: 5 });
    assert.equal(res.total, 0);
    const url = calls[0].url;
    assert.ok(url.includes('relationshipType=supplier'));
    assert.ok(url.includes('limit=5'));
  } finally { restore(); }
});

// ============================================================================
// getPartner
// ============================================================================

test('getPartner GETs by partnerRef', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ partnerRef: 'partner-1', strength: 0.85 }));
  try {
    const c = baseConn();
    const res = await c.getPartner('partner-1');
    assert.equal(res.partnerRef, 'partner-1');
    assert.equal(res.strength, 0.85);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/partners/partner-1');
  } finally { restore(); }
});

test('getPartner encodes special characters', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ partnerRef: 'a/b c' }));
  try {
    const c = baseConn();
    await c.getPartner('a/b c');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/partners/a%2Fb%20c');
  } finally { restore(); }
});

// ============================================================================
// listPartnersByType
// ============================================================================

test('listPartnersByType GETs by-type path', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ partners: [{ partnerRef: 'p1' }] }));
  try {
    const c = baseConn();
    const res = await c.listPartnersByType('supplier', { limit: 3 });
    assert.equal(res.partners.length, 1);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/partners/by-type/supplier?limit=3');
  } finally { restore(); }
});

// ============================================================================
// recommendPartners
// ============================================================================

test('recommendPartners POSTs to /api/recommend', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ recommendations: [{ partnerRef: 'p1', score: 0.92 }] }));
  try {
    const c = baseConn();
    const res = await c.recommendPartners({ relationshipType: 'supplier', capability: 'logistics', limit: 5 });
    assert.equal(res.recommendations[0].score, 0.92);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/recommend');
    assert.equal(calls[0].init.method, 'POST');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.capability, 'logistics');
  } finally { restore(); }
});

test('recommendPartners with empty body still works', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ recommendations: [] }));
  try {
    const c = baseConn();
    await c.recommendPartners();
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.body, '{}');
  } finally { restore(); }
});

// ============================================================================
// getPartnerStats
// ============================================================================

test('getPartnerStats GETs /api/stats', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ partners: 5, interactions: 100, totalGmv: 50000 }));
  try {
    const c = baseConn();
    const res = await c.getPartnerStats();
    assert.equal(res.partners, 5);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-partner-graph/api/stats');
  } finally { restore(); }
});

// ============================================================================
// Error handling
// ============================================================================

test('recordInteraction returns null on 4xx', async () => {
  const { restore } = installFetchMock(() => jsonResponse({ error: 'bad request' }, 400));
  try {
    const c = baseConn();
    const res = await c.recordInteraction({});
    assert.equal(res, null);
  } finally { restore(); }
});

test('listPartners returns null on 5xx', async () => {
  const { restore } = installFetchMock(() => jsonResponse({ error: 'server' }, 500));
  try {
    const c = baseConn();
    const res = await c.listPartners();
    assert.equal(res, null);
  } finally { restore(); }
});

test('recommendPartners returns null on network error', async () => {
  const { restore } = installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  try {
    const c = baseConn();
    const res = await c.recommendPartners({});
    assert.equal(res, null);
  } finally { restore(); }
});

// ============================================================================
// Auth forwarding
// ============================================================================

test('Authorization header is forwarded when token set', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ ok: true }));
  try {
    const c = baseConn();
    await c.getPartnerStats();
    assert.equal(calls[0].init.headers['Authorization'], 'Bearer jwt-abc');
  } finally { restore(); }
});

test('No Authorization header when no token', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ ok: true }));
  try {
    const c = new NexhaConnection({});
    await c.getPartnerStats();
    assert.equal(calls[0].init.headers['Authorization'], undefined);
  } finally { restore(); }
});