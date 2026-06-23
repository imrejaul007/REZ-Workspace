/**
 * Smoke tests for the provisioning-engine + hooks-sdk client methods on
 * NexhaConnection (ADR-0011 Phase 12, 2026-06-23). Runs against a stubbed
 * fetch so no Hub is required.
 *
 * Usage:  node --test test-provisioning-hooks.js
 *
 * Covers:
 *   Provisioning engine (port 4385):
 *     - createPlan / listPlans / getPlan / getPlanJson
 *     - transitionPlan, recordResourceApplied/Failed, recordOutputs
 *     - cancelPlan, destroyPlan, markDestroyed
 *     - listPlanEvents, getStats
 *   Hooks SDK (port 4386):
 *     - createSubscription / listSubscriptions / getSubscription / updateSubscription
 *     - disable/enable/delete/rotateSecret
 *     - emitEvent, processDeliveries, listDeliveries, getDelivery
 *     - listEventTypes, getStats
 *   Common:
 *     - null on 5xx and on network error
 *     - URL encoding for IDs with special characters
 *     - Body shape pass-through
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
// Provisioning Engine
// ============================================

test('createProvisioningPlan POSTs to /api/nexha/nexha-provisioning-engine/api/plans', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    planId: 'pp_abc',
    tenantId: 't_x',
    targetKind: 'SUTAR_INSTANCE',
    isolationLevel: 'SHARED',
    status: 'PENDING',
    apiVersion: 'rtmn.io/v1',
    resources: [{ name: 'shared-secret', kind: 'API_KEY', spec: {} }],
  }));
  const res = await conn.createProvisioningPlan({
    tenantId: 't_x',
    targetKind: 'SUTAR_INSTANCE',
    isolationLevel: 'SHARED',
  });
  assert.equal(res.planId, 'pp_abc');
  assert.equal(res.status, 'PENDING');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans');
  assert.equal(calls[0].init.method, 'POST');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.tenantId, 't_x');
  assert.equal(body.targetKind, 'SUTAR_INSTANCE');
  assert.equal(body.isolationLevel, 'SHARED');
  restoreFetch();
});

test('listProvisioningPlans GETs with status + tenant filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ plans: [], total: 0, limit: 50, offset: 0 }));
  await conn.listProvisioningPlans({ status: 'READY', tenantId: 't_x', limit: 25, offset: 10 });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans?status=READY&tenantId=t_x&limit=25&offset=10');
  restoreFetch();
});

test('listProvisioningPlans GETs without query when no filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ plans: [], total: 0 }));
  await conn.listProvisioningPlans();
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans');
  restoreFetch();
});

test('getProvisioningPlan GETs by id with URL encoding', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'READY' }));
  await conn.getProvisioningPlan('pp_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc');
  restoreFetch();
});

test('getProvisioningPlanJson fetches plan.json sub-resource', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ apiVersion: 'rtmn.io/v1', kind: 'ProvisioningPlan' }));
  await conn.getProvisioningPlanJson('pp_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/plan.json');
  restoreFetch();
});

test('transitionProvisioningPlan POSTs to /transition with toStatus', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'APPLYING' }));
  await conn.transitionProvisioningPlan('pp_abc', 'APPLYING', { actor: 'test' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/transition');
  assert.equal(calls[0].init.method, 'POST');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.toStatus, 'APPLYING');
  assert.equal(body.actor, 'test');
  restoreFetch();
});

test('recordResourceApplied POSTs to /apply with resourceName + outputs', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'APPLYING' }));
  await conn.recordResourceApplied('pp_abc', 'shared-secret', { secretRef: 'k1' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/apply');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.resourceName, 'shared-secret');
  assert.deepEqual(body.outputs, { secretRef: 'k1' });
  restoreFetch();
});

test('recordResourceFailed POSTs to /fail-resource with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'FAILED' }));
  await conn.recordResourceFailed('pp_abc', 'shared-secret', 'k8s timeout');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/fail-resource');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.resourceName, 'shared-secret');
  assert.equal(body.reason, 'k8s timeout');
  restoreFetch();
});

test('recordProvisioningOutputs POSTs to /outputs', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'READY' }));
  await conn.recordProvisioningOutputs('pp_abc', { host: 'sutar.x.com', port: 4141 });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/outputs');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body, { host: 'sutar.x.com', port: 4141 });
  restoreFetch();
});

test('cancelProvisioningPlan POSTs to /cancel with reason', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'CANCELLED' }));
  await conn.cancelProvisioningPlan('pp_abc', 'no longer needed');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/cancel');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.reason, 'no longer needed');
  restoreFetch();
});

test('destroyProvisioningPlan POSTs to /destroy', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'DESTROYING' }));
  await conn.destroyProvisioningPlan('pp_abc', 'tenant offboarded');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/destroy');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.reason, 'tenant offboarded');
  restoreFetch();
});

test('markProvisioningDestroyed POSTs to /mark-destroyed', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ planId: 'pp_abc', status: 'DESTROYED' }));
  await conn.markProvisioningDestroyed('pp_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/mark-destroyed');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('listProvisioningPlanEvents GETs with limit + kind filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ events: [], total: 0 }));
  await conn.listProvisioningPlanEvents('pp_abc', { limit: 20, kind: 'TRANSITION' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp_abc/events?limit=20&kind=TRANSITION');
  restoreFetch();
});

test('getProvisioningStats GETs /stats with optional tenantId', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    plans: { total: 5, byStatus: { READY: 3, APPLYING: 2 } },
  }));
  await conn.getProvisioningStats({ tenantId: 't_x' });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/stats?tenantId=t_x');
  restoreFetch();
});

// ============================================
// Hooks SDK
// ============================================

test('createHookSubscription POSTs to /api/nexha/nexha-hooks-sdk/api/subscriptions', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    subscriptionId: 'hs_abc',
    tenantId: 't_x',
    targetUrl: 'https://example.com/webhook',
    eventTypes: ['*'],
    secret: 'whsec_plaintext',
    status: 'ACTIVE',
  }));
  const res = await conn.createHookSubscription({
    tenantId: 't_x',
    targetUrl: 'https://example.com/webhook',
    eventTypes: ['*'],
  });
  assert.equal(res.subscriptionId, 'hs_abc');
  assert.equal(res.secret, 'whsec_plaintext');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions');
  assert.equal(calls[0].init.method, 'POST');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.tenantId, 't_x');
  assert.equal(body.targetUrl, 'https://example.com/webhook');
  assert.deepEqual(body.eventTypes, ['*']);
  restoreFetch();
});

test('listHookSubscriptions GETs with status + tenant + eventType filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptions: [], total: 0 }));
  await conn.listHookSubscriptions({
    status: 'ACTIVE',
    tenantId: 't_x',
    eventType: 'sutar.instance.provisioned',
    limit: 10,
    offset: 0,
  });
  assert.equal(
    calls[0].url,
    'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions?status=ACTIVE&tenantId=t_x&eventType=sutar.instance.provisioned&limit=10&offset=0'
  );
  restoreFetch();
});

test('getHookSubscription GETs by id', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptionId: 'hs_abc' }));
  await conn.getHookSubscription('hs_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc');
  restoreFetch();
});

test('updateHookSubscription PATCHes the subscription', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptionId: 'hs_abc', eventTypes: ['sutar.*'] }));
  await conn.updateHookSubscription('hs_abc', { eventTypes: ['sutar.*'] });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc');
  assert.equal(calls[0].init.method, 'PATCH');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.eventTypes, ['sutar.*']);
  restoreFetch();
});

test('disableHookSubscription POSTs to /disable', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptionId: 'hs_abc', status: 'DISABLED' }));
  await conn.disableHookSubscription('hs_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc/disable');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('enableHookSubscription POSTs to /enable', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptionId: 'hs_abc', status: 'ACTIVE' }));
  await conn.enableHookSubscription('hs_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc/enable');
  restoreFetch();
});

test('deleteHookSubscription DELETEs the subscription', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ deleted: true }));
  await conn.deleteHookSubscription('hs_abc');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc');
  assert.equal(calls[0].init.method, 'DELETE');
  restoreFetch();
});

test('rotateHookSecret POSTs to /rotate-secret and returns new plaintext secret', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ subscriptionId: 'hs_abc', secret: 'whsec_new' }));
  const res = await conn.rotateHookSecret('hs_abc');
  assert.equal(res.secret, 'whsec_new');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs_abc/rotate-secret');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('emitHookEvent POSTs to /events', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    eventId: 'he_1',
    eventType: 'sutar.instance.provisioned',
    deliveriesCreated: 1,
  }));
  await conn.emitHookEvent({
    eventType: 'sutar.instance.provisioned',
    tenantId: 't_x',
    payload: { instanceId: 'si_x' },
  });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/events');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.eventType, 'sutar.instance.provisioned');
  assert.equal(body.tenantId, 't_x');
  restoreFetch();
});

test('processHookDeliveries POSTs to /deliveries/process with optional limit', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ processed: 3, succeeded: 2, failed: 1 }));
  await conn.processHookDeliveries({ limit: 50 });
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/deliveries/process?limit=50');
  assert.equal(calls[0].init.method, 'POST');
  restoreFetch();
});

test('listHookDeliveries GETs with status + subscriptionId filters', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ deliveries: [], total: 0 }));
  await conn.listHookDeliveries({ status: 'FAILED', subscriptionId: 'hs_abc', limit: 20 });
  assert.equal(
    calls[0].url,
    'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/deliveries?subscriptionId=hs_abc&status=FAILED&limit=20'
  );
  restoreFetch();
});

test('getHookDelivery GETs by id', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({ deliveryId: 'hd_1', status: 'SUCCESS' }));
  await conn.getHookDelivery('hd_1');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/deliveries/hd_1');
  restoreFetch();
});

test('listHookEventTypes GETs the canonical 28-type list', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    eventTypes: [
      'sutar.instance.provisioned',
      'sutar.instance.destroyed',
      'industry.tenant.activated',
      '*',
    ],
  }));
  const res = await conn.listHookEventTypes();
  assert.ok(Array.isArray(res.eventTypes));
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/event-types');
  restoreFetch();
});

test('getHookStats GETs /stats', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({
    subscriptions: { total: 5, byStatus: { ACTIVE: 4, DISABLED: 1 } },
    deliveries: { total: 100, byStatus: { SUCCESS: 80, FAILED: 15, RETRYING: 5 } },
  }));
  await conn.getHookStats();
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/stats');
  restoreFetch();
});

// ============================================
// Error / edge cases
// ============================================

test('returns null on 5xx (provisioning)', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => ({ ok: false }));
  const res = await conn.listProvisioningPlans();
  assert.equal(res, null);
  restoreFetch();
});

test('returns null on network error (hooks)', async () => {
  const conn = new NexhaConnection({});
  installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  const res = await conn.getHookSubscription('hs_abc');
  assert.equal(res, null);
  restoreFetch();
});

test('URL-encodes IDs with special characters (provisioning)', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({}));
  await conn.getProvisioningPlan('pp/with/slashes');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-provisioning-engine/api/plans/pp%2Fwith%2Fslashes');
  restoreFetch();
});

test('URL-encodes IDs with special characters (hooks)', async () => {
  const conn = new NexhaConnection({});
  const calls = installFetchMock(() => okJson({}));
  await conn.getHookSubscription('hs with space');
  assert.equal(calls[0].url, 'http://localhost:4399/api/nexha/nexha-hooks-sdk/api/subscriptions/hs%20with%20space');
  restoreFetch();
});