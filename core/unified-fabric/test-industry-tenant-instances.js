/**
 * Smoke tests for the industry-tenant-instances client methods on
 * NexhaConnection (ADR-0010 Phase 10, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-industry-tenant-instances.js
 *
 * Covers:
 *   - Provision / list / get / getByTenant / update
 *   - Lifecycle: suspend / resume / destroy / fail / rotateKey
 *   - Health / usage / limits / stats
 *   - null on 5xx and on network error
 *   - URL encoding for IDs with special characters
 *   - Compliance metadata pass-through on provision
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

test('provisionIndustryInstance POSTs to /api/nexha/industry-tenant-instances/api/instances', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    instanceId: 'iti_abc',
    tenantId: 't_x',
    industry: 'healthcare',
    status: 'ACTIVE',
    isolationLevel: 'DEDICATED',
    compliance: { framework: 'HIPAA' },
    _apiKey: 'ik_xyz',
  }));
  const res = await conn.provisionIndustryInstance({
    tenantId: 't_x',
    industry: 'healthcare',
    isolationLevel: 'DEDICATED',
    compliance: { framework: 'HIPAA' },
  });
  assert.equal(res.instanceId, 'iti_abc');
  assert.equal(res._apiKey, 'ik_xyz');
  assert.equal(res.compliance.framework, 'HIPAA');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(JSON.parse(calls[0].init.body).tenantId, 't_x');
  assert.equal(JSON.parse(calls[0].init.body).industry, 'healthcare');
  assert.equal(JSON.parse(calls[0].init.body).isolationLevel, 'DEDICATED');
  restoreFetch();
});

test('listIndustryInstances GETs with industry + compliance filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instances: [], total: 0, limit: 50, offset: 0 }));
  await conn.listIndustryInstances({
    status: 'ACTIVE',
    industry: 'healthcare',
    complianceFramework: 'HIPAA',
    isolationLevel: 'DEDICATED',
    limit: 25,
    offset: 10,
  });
  assert.match(calls[0].url, /\/api\/nexha\/industry-tenant-instances\/api\/instances\?/);
  assert.match(calls[0].url, /status=ACTIVE/);
  assert.match(calls[0].url, /industry=healthcare/);
  assert.match(calls[0].url, /complianceFramework=HIPAA/);
  assert.match(calls[0].url, /isolationLevel=DEDICATED/);
  assert.match(calls[0].url, /limit=25/);
  assert.match(calls[0].url, /offset=10/);
  restoreFetch();
});

test('getIndustryInstance fetches by instanceId', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_x', tenantId: 't_x', industry: 'hotel' }));
  const res = await conn.getIndustryInstance('iti_x');
  assert.equal(res.instanceId, 'iti_x');
  assert.equal(res.industry, 'hotel');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_x');
  restoreFetch();
});

test('getIndustryInstanceByTenant uses the by-tenant route with industry', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_y', tenantId: 't_y', industry: 'finance' }));
  await conn.getIndustryInstanceByTenant('t_y', 'finance');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/by-tenant/t_y?industry=finance');
  restoreFetch();
});

test('getIndustryInstanceByTenant without industry omits query string', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_y', tenantId: 't_y' }));
  await conn.getIndustryInstanceByTenant('t_y');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/by-tenant/t_y');
  restoreFetch();
});

test('updateIndustryInstance PATCHes partial fields', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_z', region: 'eu-west-1' }));
  await conn.updateIndustryInstance('iti_z', { region: 'eu-west-1' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_z');
  assert.equal(calls[0].init.method, 'PATCH');
  assert.equal(JSON.parse(calls[0].init.body).region, 'eu-west-1');
  restoreFetch();
});

test('suspendIndustryInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_a', status: 'SUSPENDED' }));
  await conn.suspendIndustryInstance('iti_a', 'maintenance');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_a/suspend');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'maintenance');
  restoreFetch();
});

test('resumeIndustryInstance POSTs empty body', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_b', status: 'ACTIVE' }));
  await conn.resumeIndustryInstance('iti_b');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_b/resume');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('destroyIndustryInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_c', status: 'DESTROYED' }));
  await conn.destroyIndustryInstance('iti_c', 'contract ended');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_c/destroy');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'contract ended');
  restoreFetch();
});

test('failIndustryInstance POSTs with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_d', status: 'FAILED' }));
  await conn.failIndustryInstance('iti_d', 'crash');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_d/fail');
  assert.equal(JSON.parse(calls[0].init.body).reason, 'crash');
  restoreFetch();
});

test('rotateIndustryInstanceKey POSTs and returns the new key', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_e', _apiKey: 'ik_new' }));
  const res = await conn.rotateIndustryInstanceKey('iti_e');
  assert.equal(res._apiKey, 'ik_new');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_e/rotate-key');
  restoreFetch();
});

test('recordIndustryInstanceHealth POSTs status', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_f', healthCheckStatus: 'degraded' }));
  await conn.recordIndustryInstanceHealth('iti_f', 'degraded');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_f/health');
  assert.equal(JSON.parse(calls[0].init.body).status, 'degraded');
  restoreFetch();
});

test('recordIndustryInstanceUsage POSTs event counters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ metrics: [{ apiCalls: 100 }] }));
  await conn.recordIndustryInstanceUsage('iti_g', { apiCalls: 100, recordsCreated: 5, workflowsExecuted: 2 });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_g/usage');
  assert.deepEqual(JSON.parse(calls[0].init.body), { apiCalls: 100, recordsCreated: 5, workflowsExecuted: 2 });
  restoreFetch();
});

test('getIndustryInstanceUsage GETs with optional date range', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_h', industry: 'healthcare', metrics: [] }));
  await conn.getIndustryInstanceUsage('iti_h', { startDate: '2026-06-01', date: '2026-06-22' });
  assert.match(calls[0].url, /startDate=2026-06-01/);
  assert.match(calls[0].url, /date=2026-06-22/);
  restoreFetch();
});

test('checkIndustryInstanceLimits returns violations', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ instanceId: 'iti_i', violations: [] }));
  await conn.checkIndustryInstanceLimits('iti_i');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti_i/limits');
  restoreFetch();
});

test('getIndustryInstanceStats aggregates without industry', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    instances: { total: 5, byStatus: { ACTIVE: 5 }, byIndustry: {}, byIsolation: { SHARED: 5 } },
    usage: { totalApiCalls: 0, totalRecordsCreated: 0, totalWorkflowsExecuted: 0, totalErrors: 0 },
  }));
  const res = await conn.getIndustryInstanceStats();
  assert.equal(res.instances.total, 5);
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/stats');
  restoreFetch();
});

test('getIndustryInstanceStats with industry filter', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    instances: { total: 2, byStatus: { ACTIVE: 2 }, byIndustry: { healthcare: 2 }, byIsolation: {} },
    usage: { totalApiCalls: 0, totalRecordsCreated: 0, totalWorkflowsExecuted: 0, totalErrors: 0 },
  }));
  const res = await conn.getIndustryInstanceStats('healthcare');
  assert.equal(res.instances.byIndustry.healthcare, 2);
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/stats?industry=healthcare');
  restoreFetch();
});

test('returns null on 5xx', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => ({ ok: false }));
  const res = await conn.listIndustryInstances();
  assert.equal(res, null);
  restoreFetch();
});

test('returns null on network error', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  const res = await conn.getIndustryInstance('iti_x');
  assert.equal(res, null);
  restoreFetch();
});

test('URL-encodes IDs with special characters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({}));
  await conn.getIndustryInstance('iti/with/slashes');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/industry-tenant-instances/api/instances/iti%2Fwith%2Fslashes');
  restoreFetch();
});
