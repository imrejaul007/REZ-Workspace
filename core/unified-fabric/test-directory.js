/**
 * Smoke tests for the nexha-business-directory client methods on
 * NexhaConnection. Runs against a stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-directory.js
 *
 * Covers (ADR-0009 Phase 3, 2026-06-22):
 *   - searchCompanies with filters
 *   - searchCompanies with no filters
 *   - getCompany with id
 *   - searchAgents with filters
 *   - getCapabilityGraph
 *   - getEntityTrust
 *   - 502 / network error returns null
 *
 * Pattern matches test-connections.js in this dir (which is shell-style
 * for the upstream services — we use node:test here for HTTP-mock convenience).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NexhaConnection } from './src/connections/nexha.js';

// In-memory fetch stub. We replace globalThis.fetch per test.
const originalFetch = globalThis.fetch;

function installFetchMock(responder) {
  let calls = [];
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

test('searchCompanies builds URL with all filters', async () => {
  const mock = installFetchMock(() => jsonResponse({ items: [{ id: 'sup-acme', name: 'ACME' }], total: 1 }));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchCompanies({ q: 'steel', industry: 'manufacturing', minTrust: 70, limit: 5 });
    assert.equal(res.items.length, 1);
    assert.equal(mock.calls.length, 1);
    const url = mock.calls[0].url;
    assert.match(url, /\/api\/nexha\/nexha-business-directory\/companies/);
    assert.match(url, /q=steel/);
    assert.match(url, /industry=manufacturing/);
    assert.match(url, /minTrust=70/);
    assert.match(url, /limit=5/);
  } finally {
    mock.restore();
  }
});

test('searchCompanies with empty params omits query string', async () => {
  const mock = installFetchMock(() => jsonResponse({ items: [], total: 0 }));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchCompanies();
    assert.equal(res.total, 0);
    const url = mock.calls[0].url;
    assert.equal(url, 'http://localhost:4399/api/nexha/nexha-business-directory/companies');
  } finally {
    mock.restore();
  }
});

test('searchCompanies returns null on 5xx', async () => {
  const mock = installFetchMock(() => jsonResponse({ error: 'down' }, 502));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchCompanies({ q: 'x' });
    assert.equal(res, null);
  } finally {
    mock.restore();
  }
});

test('searchCompanies returns null on network error', async () => {
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  try {
    const c = new NexhaConnection({});
    const res = await c.searchCompanies({ q: 'x' });
    assert.equal(res, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getCompany builds URL with encoded id', async () => {
  const mock = installFetchMock(() => jsonResponse({ id: 'a/b', name: 'X' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getCompany('a/b');
    assert.equal(res.id, 'a/b');
    assert.match(mock.calls[0].url, /companies\/a%2Fb$/);
  } finally {
    mock.restore();
  }
});

test('searchAgents builds URL with filters', async () => {
  const mock = installFetchMock(() => jsonResponse({ items: [{ id: 'agt-1' }], total: 1 }));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchAgents({ category: 'pricing', companyId: 'sup-acme-001' });
    assert.equal(res.items.length, 1);
    const url = mock.calls[0].url;
    assert.match(url, /\/api\/nexha\/nexha-business-directory\/agents/);
    assert.match(url, /category=pricing/);
    assert.match(url, /companyId=sup-acme-001/);
  } finally {
    mock.restore();
  }
});

test('getCapabilityGraph hits the correct path', async () => {
  const mock = installFetchMock(() => jsonResponse({ nodes: [], edges: [] }));
  try {
    const c = new NexhaConnection({});
    await c.getCapabilityGraph();
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-business-directory/capabilities/graph');
  } finally {
    mock.restore();
  }
});

test('getEntityTrust hits the correct path', async () => {
  const mock = installFetchMock(() => jsonResponse({ entityId: 'sup-acme-001', overallScore: 87, riskLevel: 'LOW' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getEntityTrust('sup-acme-001');
    assert.equal(res.overallScore, 87);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/nexha/nexha-business-directory/trust/sup-acme-001');
  } finally {
    mock.restore();
  }
});

test('headers include Authorization when token is provided', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = init;
    return jsonResponse({ items: [], total: 0 });
  };
  try {
    const c = new NexhaConnection({ token: 'test-jwt-123' });
    await c.searchCompanies();
    assert.equal(captured.headers.Authorization, 'Bearer test-jwt-123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('headers do NOT include Authorization when token is omitted', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = init;
    return jsonResponse({ items: [], total: 0 });
  };
  try {
    const c = new NexhaConnection({});
    await c.searchCompanies();
    assert.equal(captured.headers.Authorization, undefined);
    assert.equal(captured.headers['Content-Type'], 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
