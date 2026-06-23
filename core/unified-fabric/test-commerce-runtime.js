/**
 * Smoke tests for the nexha-commerce-runtime client methods on
 * NexhaConnection (ADR-0010 Phase 8, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-commerce-runtime.js
 *
 * Covers:
 *   - Orders: create, list, get, update, place, cancel, fulfill, ship,
 *     deliver, complete, refund
 *   - Payments: create, list, get, authorize, capture, complete, fail,
 *     cancel, refund
 *   - Returns: create, list, get, approve, reject, in-transit, received,
 *     complete, refund
 *   - Stats
 *   - null on network error
 *   - Authorization header is forwarded
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

const HUB = 'http://localhost:4399/api/nexha/nexha-commerce-runtime';

// ============================================================================
// Orders
// ============================================================================

test('createOrder POSTs to /api/orders', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ orderId: 'ord_1', status: 'DRAFT' }));
  try {
    const c = baseConn();
    const res = await c.createOrder({
      buyerRef: 'b', sellerRef: 's',
      items: [{ sku: 'X', name: 'X', quantity: 1, unitPrice: 10 }],
    });
    assert.equal(res.orderId, 'ord_1');
    assert.equal(calls[0].url, `${HUB}/api/orders`);
    assert.equal(calls[0].init.method, 'POST');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.items[0].sku, 'X');
  } finally { restore(); }
});

test('listOrders builds query string', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ orders: [], total: 0 }));
  try {
    const c = baseConn();
    await c.listOrders({ status: 'PLACED', buyerRef: 'b1', limit: 10, offset: 5 });
    const url = calls[0].url;
    assert.ok(url.includes('status=PLACED'));
    assert.ok(url.includes('buyerRef=b1'));
    assert.ok(url.includes('limit=10'));
    assert.ok(url.includes('offset=5'));
  } finally { restore(); }
});

test('getOrder encodes special characters', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ orderId: 'ord a/b' }));
  try {
    const c = baseConn();
    await c.getOrder('ord a/b');
    assert.equal(calls[0].url, `${HUB}/api/orders/ord%20a%2Fb`);
  } finally { restore(); }
});

test('updateOrder sends PATCH', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ orderId: 'ord_1', notes: 'fragile' }));
  try {
    const c = baseConn();
    await c.updateOrder('ord_1', { notes: 'fragile' });
    assert.equal(calls[0].init.method, 'PATCH');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.notes, 'fragile');
  } finally { restore(); }
});

test('placeOrder POSTs /place', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ order: {}, payment: {} }));
  try {
    const c = baseConn();
    await c.placeOrder('ord_1', { method: 'CARD' });
    assert.equal(calls[0].url, `${HUB}/api/orders/ord_1/place`);
    assert.equal(calls[0].init.method, 'POST');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.method, 'CARD');
  } finally { restore(); }
});

test('cancelOrder POSTs /cancel with reason', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ status: 'CANCELLED' }));
  try {
    const c = baseConn();
    await c.cancelOrder('ord_1', 'buyer changed mind');
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.reason, 'buyer changed mind');
  } finally { restore(); }
});

test('shipOrder POSTs /ship with trackingNumber', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ status: 'SHIPPED' }));
  try {
    const c = baseConn();
    await c.shipOrder('ord_1', { trackingNumber: 'TRK-1' });
    assert.equal(calls[0].url, `${HUB}/api/orders/ord_1/ship`);
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.trackingNumber, 'TRK-1');
  } finally { restore(); }
});

test('order lifecycle methods (fulfill/deliver/complete/refund)', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ status: 'OK' }));
  try {
    const c = baseConn();
    await c.startFulfillment('ord_1', { warehouseRef: 'wh-1' });
    await c.deliverOrder('ord_1');
    await c.completeOrder('ord_1');
    await c.refundOrder('ord_1', { reason: 'out of stock' });
    assert.equal(calls[0].url, `${HUB}/api/orders/ord_1/fulfill`);
    assert.equal(calls[1].url, `${HUB}/api/orders/ord_1/deliver`);
    assert.equal(calls[2].url, `${HUB}/api/orders/ord_1/complete`);
    assert.equal(calls[3].url, `${HUB}/api/orders/ord_1/refund`);
    for (const call of calls) {
      assert.equal(call.init.method, 'POST');
    }
  } finally { restore(); }
});

// ============================================================================
// Payments
// ============================================================================

test('createPayment POSTs to /api/payments', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ paymentId: 'pay_1', status: 'PENDING' }));
  try {
    const c = baseConn();
    const res = await c.createPayment({ orderId: 'ord_1', amount: 100, method: 'CARD' });
    assert.equal(res.paymentId, 'pay_1');
    assert.equal(calls[0].url, `${HUB}/api/payments`);
  } finally { restore(); }
});

test('listPayments with filters', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ payments: [] }));
  try {
    const c = baseConn();
    await c.listPayments({ orderId: 'ord_1', status: 'CAPTURED' });
    const url = calls[0].url;
    assert.ok(url.includes('orderId=ord_1'));
    assert.ok(url.includes('status=CAPTURED'));
  } finally { restore(); }
});

test('getPayment encodes ID', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ paymentId: 'pay a' }));
  try {
    const c = baseConn();
    await c.getPayment('pay a');
    assert.equal(calls[0].url, `${HUB}/api/payments/pay%20a`);
  } finally { restore(); }
});

test('payment lifecycle (authorize/capture/complete/fail/cancel/refund)', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ status: 'OK' }));
  try {
    const c = baseConn();
    await c.authorizePayment('pay_1', { providerRef: 'stripe' });
    await c.capturePayment('pay_1');
    await c.completePayment('pay_1');
    await c.failPayment('pay_1', 'declined');
    await c.cancelPayment('pay_1', 'timeout');
    await c.refundPayment('pay_1', { amount: 50 });
    assert.equal(calls[0].url, `${HUB}/api/payments/pay_1/authorize`);
    assert.equal(calls[1].url, `${HUB}/api/payments/pay_1/capture`);
    assert.equal(calls[2].url, `${HUB}/api/payments/pay_1/complete`);
    assert.equal(calls[3].url, `${HUB}/api/payments/pay_1/fail`);
    assert.equal(calls[4].url, `${HUB}/api/payments/pay_1/cancel`);
    assert.equal(calls[5].url, `${HUB}/api/payments/pay_1/refund`);
    assert.equal(JSON.parse(calls[3].init.body).reason, 'declined');
    assert.equal(JSON.parse(calls[5].init.body).amount, 50);
  } finally { restore(); }
});

// ============================================================================
// Returns
// ============================================================================

test('createReturn POSTs to /api/returns', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ returnId: 'ret_1' }));
  try {
    const c = baseConn();
    const res = await c.createReturn({
      orderId: 'ord_1',
      lines: [{ sku: 'X', quantity: 1, reason: 'DEFECTIVE' }],
    });
    assert.equal(res.returnId, 'ret_1');
    assert.equal(calls[0].url, `${HUB}/api/returns`);
  } finally { restore(); }
});

test('listReturns with filters', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ returns: [] }));
  try {
    const c = baseConn();
    await c.listReturns({ orderId: 'ord_1', status: 'REQUESTED' });
    const url = calls[0].url;
    assert.ok(url.includes('orderId=ord_1'));
    assert.ok(url.includes('status=REQUESTED'));
  } finally { restore(); }
});

test('getReturn encodes ID', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ returnId: 'ret a' }));
  try {
    const c = baseConn();
    await c.getReturn('ret a');
    assert.equal(calls[0].url, `${HUB}/api/returns/ret%20a`);
  } finally { restore(); }
});

test('return lifecycle (approve/reject/in-transit/received/complete/refund)', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ status: 'OK' }));
  try {
    const c = baseConn();
    await c.approveReturn('ret_1', { refundAmount: 50 });
    await c.rejectReturn('ret_1', 'past window');
    await c.markReturnInTransit('ret_1', { trackingNumber: 'R-1' });
    await c.markReturnReceived('ret_1');
    await c.completeReturn('ret_1');
    await c.refundReturn('ret_1', { amount: 50 });
    assert.equal(calls[0].url, `${HUB}/api/returns/ret_1/approve`);
    assert.equal(calls[1].url, `${HUB}/api/returns/ret_1/reject`);
    assert.equal(calls[2].url, `${HUB}/api/returns/ret_1/in-transit`);
    assert.equal(calls[3].url, `${HUB}/api/returns/ret_1/received`);
    assert.equal(calls[4].url, `${HUB}/api/returns/ret_1/complete`);
    assert.equal(calls[5].url, `${HUB}/api/returns/ret_1/refund`);
  } finally { restore(); }
});

// ============================================================================
// Stats
// ============================================================================

test('getCommerceStats GETs /api/stats', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({ orders: {}, payments: {}, returns: {} }));
  try {
    const c = baseConn();
    const res = await c.getCommerceStats();
    assert.ok(res.orders);
    assert.equal(calls[0].url, `${HUB}/api/stats`);
  } finally { restore(); }
});

// ============================================================================
// Error handling
// ============================================================================

test('createOrder returns null on 400', async () => {
  const { restore } = installFetchMock(() => jsonResponse({ error: 'bad' }, 400));
  try {
    const c = baseConn();
    assert.equal(await c.createOrder({}), null);
  } finally { restore(); }
});

test('capturePayment returns null on 422 state transition', async () => {
  const { restore } = installFetchMock(() => jsonResponse({ error: 'illegal' }, 422));
  try {
    const c = baseConn();
    assert.equal(await c.capturePayment('pay_1'), null);
  } finally { restore(); }
});

test('createOrder returns null on network error', async () => {
  const { restore } = installFetchMock(() => { throw new Error('ECONNREFUSED'); });
  try {
    const c = baseConn();
    assert.equal(await c.createOrder({}), null);
  } finally { restore(); }
});

// ============================================================================
// Auth forwarding
// ============================================================================

test('Authorization header is forwarded when token set', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = baseConn();
    await c.createOrder({});
    assert.equal(calls[0].init.headers['Authorization'], 'Bearer jwt-abc');
  } finally { restore(); }
});

test('No Authorization header when no token', async () => {
  const { calls, restore } = installFetchMock(() => jsonResponse({}));
  try {
    const c = new NexhaConnection({});
    await c.createOrder({});
    assert.equal(calls[0].init.headers['Authorization'], undefined);
  } finally { restore(); }
});