/**
 * Smoke tests for the sutar-tenant-instances client methods on
 * NexhaConnection (ADR-0010 Phase 9, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-tenant-instances.js
 *
 * Covers:
 *   - Provision / list / get / getByTenant / update
 *   - Lifecycle: suspend / resume / destroy / fail / rotateKey
 *   - Health / usage / limits / stats
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

test('provisionInstance POSTs to /api/sutar/sutar-tenant-instances/api/instances', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_abc', tenantId: 't_x', status: 'ACTIVE', _apiKey: 'sk_xyz' }));
  const res = await conn.provisionInstance({ tenantId: 't_x', isolationLevel: 'DEDICATED' });
  assert.equal(res.instanceId, 'sti_abc');
  assert.equal(res._apiKey, 'sk_xyz');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(JSON.parse(calls[0].init.body).tenantId, 't_x');
  assert.equal(JSON.parse(calls[0].init.body).isolationLevel, 'DEDICATED');
  restoreFetch();
});

test('listInstances GETs with query string', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instances: [], total: 0, limit: 50, offset: 0 }));
  await conn.listInstances({ status: 'ACTIVE', isolationLevel: 'SHARED' });
  assert.match(calls[0].url, /\/api\/sutar\/sutar-tenant-instances\/api\/instances\?/);
  assert.match(calls[0].url, /status=ACTIVE/);
  assert.match(calls[0].url, /isolationLevel=SHARED/);
  restoreFetch();
});

test('getInstance fetches by instanceId', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_x', tenantId: 't_x', status: 'ACTIVE' }));
  const res = await conn.getInstance('sti_x');
  assert.equal(res.instanceId, 'sti_x');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_x');
  restoreFetch();
});

test('getInstanceByTenant uses the by-tenant route', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_y', tenantId: 't_y' }));
  await conn.getInstanceByTenant('t_y');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/by-tenant/t_y');
  restoreFetch();
});

test('updateInstance PATCHes partial fields', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_z', region: 'eu-west-1' }));
  await conn.updateInstance('sti_z', { region: 'eu-west-1' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_z');
  assert.equal(calls[0].init.method, 'PATCH');
  assert.equal(JSON.parse(calls[0].init.body).region, 'eu-west-1');
  restoreFetch();
});

test('suspendInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_a', status: 'SUSPENDED' }));
  await conn.suspendInstance('sti_a', 'maintenance');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_a/suspend');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'maintenance');
  restoreFetch();
});

test('resumeInstance POSTs empty body', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_b', status: 'ACTIVE' }));
  await conn.resumeInstance('sti_b');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_b/resume');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('destroyInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_c', status: 'DESTROYED' }));
  await conn.destroyInstance('sti_c', 'contract ended');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_c/destroy');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'contract ended');
  restoreFetch();
});

test('failInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_d', status: 'FAILED' }));
  await conn.failInstance('sti_d', 'crash');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_d/fail');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'crash');
  restoreFetch();
});

test('rotateInstanceKey POSTs and returns the new key', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_e', _apiKey: 'sk_new' }));
  const res = await conn.rotateInstanceKey('sti_e');
  assert.equal(res._apiKey, 'sk_new');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_e/rotate-key');
  restoreFetch();
});

test('recordInstanceHealth POSTs status', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_f', healthCheckStatus: 'degraded' }));
  await conn.recordInstanceHealth('sti_f', 'degraded');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_f/health');
  assert.equal(JSON.parse(calls[0].init.body).status, 'degraded');
  restoreFetch();
});

test('recordInstanceUsage POSTs event counters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ metrics: [{ apiCalls: 100 }] }));
  await conn.recordInstanceUsage('sti_g', { apiCalls: 100, missionsCreated: 5 });
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_g/usage');
  assert.deepEqual(JSON.parse(calls[0].init.body), { apiCalls: 100, missionsCreated: 5 });
  restoreFetch();
});

test('getInstanceUsage GETs with optional date range', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_h', metrics: [] }));
  await conn.getInstanceUsage('sti_h', { startDate: '2026-06-01', date: '2026-06-22' });
  assert.match(calls[0].url, /startDate=2026-06-01/);
  assert.match(calls[0].url, /date=2026-06-22/);
  restoreFetch();
});

test('checkInstanceLimits returns violations', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'sti_i', violations: [] }));
  await conn.checkInstanceLimits('sti_i');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti_i/limits');
  restoreFetch();
});

test('getTenantInstanceStats aggregates', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    instances: { total: 5, byStatus: { ACTIVE: 5 }, byIsolation: { SHARED: 5 } },
    usage: { totalApiCalls: 0, totalMissionsCreated: 0, totalMissionsCompleted: 0, totalErrors: 0 },
  }));
  const res = await conn.getTenantInstanceStats();
  assert.equal(res.instances.total, 5);
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/stats');
  restoreFetch();
});

test('returns null on 5xx', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => ({ ok: false }));
  const res = await conn.listInstances();
  assert.equal(res, null);
  restoreFetch();
});

test('returns null on network error', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  const res = await conn.getInstance('sti_x');
  assert.equal(res, null);
  restoreFetch();
});

test('URL-encodes IDs with special characters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({}));
  await conn.getInstance('sti/with/slashes');
  assert.equal(calls[0].url, 'http://localhost:4399/api/sutar/sutar-tenant-instances/api/instances/sti%2Fwith%2Fslashes');
  restoreFetch();
});