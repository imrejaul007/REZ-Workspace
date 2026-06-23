/**
 * Smoke tests for the tenant-summary client methods on NexhaConnection
 * (ADR-0011 Phase 13, 2026-06-23). Runs against a stubbed fetch so no
 * Hub is required.
 *
 * Usage:  node --test test-tenant-summary.js
 *
 * Covers:
 *   - buildTenantSummary (full fan-out)
 *   - getTenantSummarySection (single section)
 *   - listTenantSummarySources (sources registry)
 *   - checkTenantSummaryUpstreams (upstream health)
 *   - null on 5xx and on network error
 *   - URL encoding for IDs with special characters
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
  return calls;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function okJson(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

// ============================================
// buildTenantSummary
// ============================================

test('buildTenantSummary GETs the full summary with the right URL', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    success: true,
    tenantId: 't_x',
    generatedAt: '2026-06-23T12:00:00Z',
    summary: { totalSources: 9, okCount: 9, errorCount: 0, health: 'healthy' },
    sections: { directory: { label: 'Business Directory', data: { total: 1, companies: [] } } },
  }));
  const res = await conn.buildTenantSummary('t_x');
  assert.equal(res.tenantId, 't_x');
  assert.equal(res.summary.health, 'healthy');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-tenant-summary/api/tenants/t_x/summary');
  restoreFetch();
});

test('buildTenantSummary URL-encodes tenantId with special characters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ tenantId: 't/x', summary: {}, sections: {} }));
  await conn.buildTenantSummary('t/x with space');
  assert.equal(
    calls[0].url,
    'http://localhost:4399/api/nexha/nexha-tenant-summary/api/tenants/t%2Fx%20with%20space/summary'
  );
  restoreFetch();
});

// ============================================
// getTenantSummarySection
// ============================================

test('getTenantSummarySection GETs a single section', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    success: true,
    section: 'missions',
    tenantId: 't_x',
    data: { total: 2, missions: [{ missionId: 'm_1' }, { missionId: 'm_2' }] },
  }));
  const res = await conn.getTenantSummarySection('t_x', 'missions');
  assert.equal(res.section, 'missions');
  assert.equal(res.data.total, 2);
  assert.equal(
    calls[0].url,
    'http://localhost:4399/api/nexha/nexha-tenant-summary/api/tenants/t_x/summary/missions'
  );
  restoreFetch();
});

test('getTenantSummarySection URL-encodes both tenantId and section', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ success: true, section: 'x', data: { total: 0 } }));
  await conn.getTenantSummarySection('t/x', 'sutar/instances');
  assert.equal(
    calls[0].url,
    'http://localhost:4399/api/nexha/nexha-tenant-summary/api/tenants/t%2Fx/summary/sutar%2Finstances'
  );
  restoreFetch();
});

// ============================================
// listTenantSummarySources
// ============================================

test('listTenantSummarySources GETs /sources', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    success: true,
    sources: [
      { key: 'directory', label: 'Business Directory', service: 'nexha-business-directory', path: '/api/...' },
      { key: 'missions', label: 'Missions', service: 'nexha-mission-planner', path: '/api/...' },
    ],
    total: 9,
  }));
  const res = await conn.listTenantSummarySources();
  assert.equal(res.total, 9);
  assert.equal(res.sources.length, 2);
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-tenant-summary/api/sources');
  restoreFetch();
});

// ============================================
// checkTenantSummaryUpstreams
// ============================================

test('checkTenantSummaryUpstreams GETs /health/upstreams', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    success: true,
    generatedAt: '2026-06-23T12:00:00Z',
    upstreams: {
      directory: { label: 'Business Directory', ok: true },
      missions: { label: 'Missions', ok: false, error: 'boom' },
    },
    summary: { total: 9, up: 8, down: 1 },
  }));
  const res = await conn.checkTenantSummaryUpstreams();
  assert.equal(res.summary.up, 8);
  assert.equal(res.summary.down, 1);
  assert.equal(res.upstreams.directory.ok, true);
  assert.equal(res.upstreams.missions.ok, false);
  assert.equal(res.upstreams.missions.error, 'boom');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-tenant-summary/api/health/upstreams');
  restoreFetch();
});

// ============================================
// Error / edge cases
// ============================================

test('returns null on 5xx', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => ({ ok: false }));
  const res = await conn.buildTenantSummary('t_x');
  assert.equal(res, null);
  restoreFetch();
});

test('returns null on network error', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  const res = await conn.listTenantSummarySources();
  assert.equal(res, null);
  restoreFetch();
});