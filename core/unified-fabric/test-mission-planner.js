/**
 * Smoke tests for the nexha-mission-planner client methods on
 * NexhaConnection (ADR-0010 Phase 6, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-mission-planner.js
 *
 * Covers:
 *   - createMission (POST /api/missions)
 *   - listMissions (GET /api/missions with status/templateId/limit/offset)
 *   - getMission (GET /api/missions/:id)
 *   - updateMission (PATCH /api/missions/:id)
 *   - planMission (POST /api/missions/:id/plan)
 *   - startMission / pauseMission / cancelMission / retryMission
 *   - startSubtask / completeSubtask / failSubtask / skipSubtask
 *   - listMissionTemplates / getMissionTemplate / createMissionTemplate
 *   - getMissionStats
 *   - null on network error
 *   - Authorization header is forwarded
 *
 * Pattern matches test-marketplace-listings.js and test-acp-messaging.js.
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
// Mission lifecycle
// ============================================================================

test('createMission POSTs to /api/missions', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ missionId: 'M-1', status: 'DRAFT' }));
  try {
    const c = baseConn();
    const res = await c.createMission({
      name: 'Build HQ',
      subtasks: [{ name: 'Find architect', type: 'find-supplier', capability: 'supplier-registry' }],
    });
    assert.equal(res.missionId, 'M-1');
    assert.equal(res.status, 'DRAFT');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers['Authorization'], 'Bearer jwt-abc');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.name, 'Build HQ');
    assert.equal(body.subtasks[0].capability, 'supplier-registry');
  } finally { restore(); }
});

test('listMissions builds query string', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ items: [], total: 0, limit: 10, offset: 5 }));
  try {
    const c = baseConn();
    await c.listMissions({ status: 'PLANNED', templateId: 't1', limit: 10, offset: 5 });
    const url = calls[0].url;
    assert.ok(url.includes('/api/nexha/nexha-mission-planner/api/missions'));
    assert.ok(url.includes('status=PLANNED'));
    assert.ok(url.includes('templateId=t1'));
    assert.ok(url.includes('limit=10'));
    assert.ok(url.includes('offset=5'));
  } finally { restore(); }
});

test('getMission GETs /api/missions/:id', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ missionId: 'M-1' }));
  try {
    const c = baseConn();
    await c.getMission('M-1');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1');
    assert.equal(calls[0].init.method, undefined); // GET → no method set
  } finally { restore(); }
});

test('updateMission PATCHes /api/missions/:id', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ missionId: 'M-1', name: 'Y' }));
  try {
    const c = baseConn();
    await c.updateMission('M-1', { name: 'Y', priority: 9 });
    assert.equal(calls[0].init.method, 'PATCH');
    assert.equal(JSON.parse(calls[0].init.body).priority, 9);
  } finally { restore(); }
});

test('planMission POSTs assignments', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ missionId: 'M-1', status: 'PLANNED' }));
  try {
    const c = baseConn();
    await c.planMission('M-1', {
      'supplier-registry': { agentId: 'sup-1', tenantId: 'tenant-x' },
    });
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/plan');
    assert.equal(calls[0].init.method, 'POST');
    const body = JSON.parse(calls[0].init.body);
    assert.deepEqual(body.assignments['supplier-registry'], { agentId: 'sup-1', tenantId: 'tenant-x' });
  } finally { restore(); }
});

// ============================================================================
// Mission actions
// ============================================================================

test('startMission/pauseMission/cancelMission/retryMission hit correct endpoints', async () => {
  let n = 0;
  const { calls, restore } = installFetchMock(() => { n++; return jsonResponse({ status: 'OK', n }); });
  try {
    const c = baseConn();
    await c.startMission('M-1');
    await c.pauseMission('M-1');
    await c.cancelMission('M-1');
    await c.retryMission('M-1');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/start');
    assert.equal(calls[1].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/pause');
    assert.equal(calls[2].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/cancel');
    assert.equal(calls[3].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/retry');
    for (const call of calls) assert.equal(call.init.method, 'POST');
  } finally { restore(); }
});

// ============================================================================
// Subtask actions
// ============================================================================

test('startSubtask POSTs to subtasks/:id/start', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = baseConn();
    await c.startSubtask('M-1', 'S-1', { assignedTenant: 'tenant-x' });
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/subtasks/S-1/start');
    assert.equal(JSON.parse(calls[0].init.body).assignedTenant, 'tenant-x');
  } finally { restore(); }
});

test('completeSubtask POSTs result', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = baseConn();
    await c.completeSubtask('M-1', 'S-1', { found: 5 }, 'tenant-x');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/subtasks/S-1/complete');
    const body = JSON.parse(calls[0].init.body);
    assert.deepEqual(body.result, { found: 5 });
    assert.equal(body.assignedTenant, 'tenant-x');
  } finally { restore(); }
});

test('failSubtask POSTs error', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = baseConn();
    await c.failSubtask('M-1', 'S-1', 'agent offline');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/subtasks/S-1/fail');
    assert.equal(JSON.parse(calls[0].init.body).error, 'agent offline');
  } finally { restore(); }
});

test('skipSubtask POSTs', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = baseConn();
    await c.skipSubtask('M-1', 'S-1');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/missions/M-1/subtasks/S-1/skip');
    assert.equal(calls[0].init.method, 'POST');
  } finally { restore(); }
});

// ============================================================================
// Templates
// ============================================================================

test('listMissionTemplates GETs /api/templates with tenantId', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ items: [], total: 0 }));
  try {
    const c = baseConn();
    await c.listMissionTemplates('tenant-a');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/templates?tenantId=tenant-a');
  } finally { restore(); }
});

test('listMissionTemplates without tenantId → no query', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ items: [], total: 0 }));
  try {
    const c = baseConn();
    await c.listMissionTemplates();
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/templates');
  } finally { restore(); }
});

test('getMissionTemplate GETs /api/templates/:id', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ templateId: 'open-restaurant' }));
  try {
    const c = baseConn();
    await c.getMissionTemplate('open-restaurant', 'tenant-a');
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/templates/open-restaurant?tenantId=tenant-a');
  } finally { restore(); }
});

test('createMissionTemplate POSTs to /api/templates', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ templateId: 'my-tpl' }));
  try {
    const c = baseConn();
    await c.createMissionTemplate({
      name: 'My template',
      subtasks: [{ name: 's', type: 'find-supplier', capability: 'c' }],
    });
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/templates');
    assert.equal(calls[0].init.method, 'POST');
  } finally { restore(); }
});

// ============================================================================
// Stats
// ============================================================================

test('getMissionStats GETs /api/stats', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ total: 7, byStatus: { DRAFT: 5 }, byTemplate: { t1: 7 } }));
  try {
    const c = baseConn();
    const res = await c.getMissionStats();
    assert.equal(res.total, 7);
    assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-mission-planner/api/stats');
  } finally { restore(); }
});

// ============================================================================
// Error path
// ============================================================================

test('returns null on network error', async () => {
  const { restore } = installFetchMock(() => { throw new Error('connect ECONNREFUSED'); });
  try {
    const c = baseConn();
    const res = await c.createMission({ name: 'X', subtasks: [{ name: 's', type: 'custom', capability: 'c' }] });
    assert.equal(res, null);
  } finally { restore(); }
});

test('returns null on non-2xx', async () => {
  const { restore } = installFetchMock(() => ({ ok: false, status: 422, json: async () => ({ error: 'bad' }) }));
  try {
    const c = baseConn();
    const res = await c.createMission({ name: 'X', subtasks: [{ name: 's', type: 'custom', capability: 'c' }] });
    assert.equal(res, null);
  } finally { restore(); }
});