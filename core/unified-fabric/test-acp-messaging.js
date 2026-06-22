/**
 * Smoke tests for the nexha-acp-messaging client methods on
 * NexhaConnection (ADR-0010 Phase 4, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-acp-messaging.js
 *
 * Covers:
 *   - sendAcpMessage without negotiationId (start of negotiation)
 *   - sendAcpMessage with negotiationId (append)
 *   - validateAcpMessage
 *   - listAcpNegotiations (filters + 5xx)
 *   - getAcpNegotiation (encoded id)
 *   - listAcpMessages
 *   - getAcpStats
 *   - null on network error
 *
 * Pattern matches test-directory.js in this dir.
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

test('sendAcpMessage without negotiationId POSTs to /api/negotiations', async () => {
  const mock = installFetchMock(() => jsonResponse({
    created: true,
    negotiation: { negotiationId: 'n-1', status: 'ACTIVE', currentType: 'QUERY' },
    message: { type: 'QUERY' },
  }, 201));
  try {
    const c = new NexhaConnection({});
    const res = await c.sendAcpMessage({
      type: 'QUERY', sender: 'a', receiver: 'b', intent: 'find supplier', tenantId: 't-1',
    });
    assert.equal(res.created, true);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-acp-messaging/api/negotiations');
    assert.equal(mock.calls[0].init.method, 'POST');
    const body = JSON.parse(mock.calls[0].init.body);
    assert.equal(body.type, 'QUERY');
    assert.equal(body.tenantId, 't-1');
  } finally {
    mock.restore();
  }
});

test('sendAcpMessage with negotiationId POSTs to /api/negotiations/:id/messages', async () => {
  const mock = installFetchMock(() => jsonResponse({
    created: false,
    negotiation: { negotiationId: 'n-1', status: 'ACTIVE', currentType: 'QUOTE' },
    message: { type: 'QUOTE' },
  }, 201));
  try {
    const c = new NexhaConnection({});
    const res = await c.sendAcpMessage({
      type: 'QUOTE', sender: 'b', receiver: 'a', payload: { price: 100 }, tenantId: 't-1', negotiationId: 'n-1',
    });
    assert.equal(res.negotiation.currentType, 'QUOTE');
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-acp-messaging/api/negotiations/n-1/messages');
  } finally {
    mock.restore();
  }
});

test('validateAcpMessage POSTs to /api/validate', async () => {
  const mock = installFetchMock(() => jsonResponse({ valid: true, cleaned: { type: 'QUERY' } }));
  try {
    const c = new NexhaConnection({});
    const res = await c.validateAcpMessage({ type: 'QUERY', sender: 'a', receiver: 'b', intent: 'x' });
    assert.equal(res.valid, true);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-acp-messaging/api/validate');
  } finally {
    mock.restore();
  }
});

test('listAcpNegotiations forwards status + limit query params', async () => {
  const mock = installFetchMock(() => jsonResponse({ items: [{ negotiationId: 'n-1' }], total: 1 }));
  try {
    const c = new NexhaConnection({});
    const res = await c.listAcpNegotiations({ status: 'ACTIVE', limit: 5 });
    assert.equal(res.items.length, 1);
    const url = mock.calls[0].url;
    assert.match(url, /\/api\/nexha\/nexha-acp-messaging\/api\/negotiations/);
    assert.match(url, /status=ACTIVE/);
    assert.match(url, /limit=5/);
  } finally {
    mock.restore();
  }
});

test('listAcpNegotiations returns null on 5xx', async () => {
  const mock = installFetchMock(() => jsonResponse({ error: 'down' }, 502));
  try {
    const c = new NexhaConnection({});
    const res = await c.listAcpNegotiations({ status: 'ACTIVE' });
    assert.equal(res, null);
  } finally {
    mock.restore();
  }
});

test('getAcpNegotiation encodes the id in the path', async () => {
  const mock = installFetchMock(() => jsonResponse({ negotiationId: 'a/b', status: 'ACTIVE' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getAcpNegotiation('a/b');
    assert.equal(res.negotiationId, 'a/b');
    assert.match(mock.calls[0].url, /\/api\/negotiations\/a%2Fb$/);
  } finally {
    mock.restore();
  }
});

test('listAcpMessages hits the correct path', async () => {
  const mock = installFetchMock(() => jsonResponse({ items: [{ type: 'QUERY' }], total: 1 }));
  try {
    const c = new NexhaConnection({});
    const res = await c.listAcpMessages('n-1');
    assert.equal(res.items.length, 1);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-acp-messaging/api/negotiations/n-1/messages');
  } finally {
    mock.restore();
  }
});

test('getAcpStats hits /api/stats', async () => {
  const mock = installFetchMock(() => jsonResponse({
    negotiations: 3, messages: 8,
    byStatus: { ACTIVE: 2, COMPLETED: 1 },
    byType: { QUERY: 3, QUOTE: 2 },
  }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getAcpStats();
    assert.equal(res.negotiations, 3);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-acp-messaging/api/stats');
  } finally {
    mock.restore();
  }
});

test('all methods return null on network error', async () => {
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  try {
    const c = new NexhaConnection({});
    assert.equal(await c.sendAcpMessage({ type: 'QUERY', sender: 'a', receiver: 'b', tenantId: 't' }), null);
    assert.equal(await c.validateAcpMessage({ type: 'QUERY', sender: 'a', receiver: 'b' }), null);
    assert.equal(await c.listAcpNegotiations(), null);
    assert.equal(await c.getAcpNegotiation('n-1'), null);
    assert.equal(await c.listAcpMessages('n-1'), null);
    assert.equal(await c.getAcpStats(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ACP methods forward Authorization header when token is set', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = init;
    return jsonResponse({ items: [], total: 0 });
  };
  try {
    const c = new NexhaConnection({ token: 'jwt-abc' });
    await c.listAcpNegotiations();
    assert.equal(captured.headers.Authorization, 'Bearer jwt-abc');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
