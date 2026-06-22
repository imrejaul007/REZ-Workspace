/**
 * Smoke tests for the marketplace-listings client methods on
 * NexhaConnection (ADR-0010 Phase 5, 2026-06-22). Runs against a
 * stubbed fetch so no Hub is required.
 *
 * Usage:  node --test test-marketplace-listings.js
 *
 * Covers:
 *   - createMarketplaceListing (POST /api/listings)
 *   - searchMarketplaceListings (GET /api/listings with q/category/sort/limit)
 *   - getMarketplaceListing (GET /api/listings/:id)
 *   - updateMarketplaceListing (PATCH /api/listings/:id)
 *   - publishMarketplaceListing (POST /api/listings/:id/publish)
 *   - recordMarketplaceView (POST /api/listings/:id/view)
 *   - recordMarketplaceInstall (POST /api/listings/:id/install)
 *   - listMarketplaceReviews (GET /api/listings/:id/reviews)
 *   - upsertMarketplaceReview (PUT /api/listings/:id/reviews)
 *   - getMyMarketplaceReview (GET /api/my-reviews?listingId=)
 *   - getMarketplaceStats (GET /api/stats)
 *   - null on network error
 *   - Authorization header is forwarded
 *
 * Pattern matches test-acp-messaging.js and test-directory.js in this dir.
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

test('createMarketplaceListing POSTs to /api/listings', async () => {
  const mock = installFetchMock(() => jsonResponse({
    listingId: 'L-1', tenantId: 't-1', title: 'Hotel Bot', status: 'DRAFT',
  }, 201));
  try {
    const c = new NexhaConnection({});
    const res = await c.createMarketplaceListing({
      title: 'Hotel Bot', category: 'agent', pricingModel: 'subscription',
      price: 99, publisherName: 'Acme', tenantId: 't-1',
    });
    assert.equal(res.listingId, 'L-1');
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings');
    assert.equal(mock.calls[0].init.method, 'POST');
    const body = JSON.parse(mock.calls[0].init.body);
    assert.equal(body.title, 'Hotel Bot');
    assert.equal(body.tenantId, 't-1');
  } finally {
    mock.restore();
  }
});

test('searchMarketplaceListings forwards q + category + sort + limit', async () => {
  const mock = installFetchMock(() => jsonResponse({
    items: [{ listingId: 'L-1', title: 'Hotel Bot' }], total: 1, limit: 10, offset: 0,
  }));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchMarketplaceListings({ q: 'hotel', category: 'agent', sort: 'rating', limit: 10 });
    assert.equal(res.total, 1);
    const url = mock.calls[0].url;
    assert.match(url, /\/api\/sutar\/marketplace-listings\/api\/listings/);
    assert.match(url, /q=hotel/);
    assert.match(url, /category=agent/);
    assert.match(url, /sort=rating/);
    assert.match(url, /limit=10/);
  } finally {
    mock.restore();
  }
});

test('searchMarketplaceListings returns null on 5xx', async () => {
  const mock = installFetchMock(() => jsonResponse({ error: 'down' }, 502));
  try {
    const c = new NexhaConnection({});
    const res = await c.searchMarketplaceListings({ q: 'x' });
    assert.equal(res, null);
  } finally {
    mock.restore();
  }
});

test('getMarketplaceListing GETs /api/listings/:id and encodes id', async () => {
  const mock = installFetchMock(() => jsonResponse({ listingId: 'a/b', title: 'X' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getMarketplaceListing('a/b');
    assert.equal(res.listingId, 'a/b');
    assert.match(mock.calls[0].url, /\/api\/listings\/a%2Fb$/);
  } finally {
    mock.restore();
  }
});

test('updateMarketplaceListing PATCHes /api/listings/:id', async () => {
  const mock = installFetchMock(() => jsonResponse({ listingId: 'L-1', title: 'Renamed' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.updateMarketplaceListing('L-1', { title: 'Renamed' });
    assert.equal(res.title, 'Renamed');
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings/L-1');
    assert.equal(mock.calls[0].init.method, 'PATCH');
    assert.equal(JSON.parse(mock.calls[0].init.body).title, 'Renamed');
  } finally {
    mock.restore();
  }
});

test('publishMarketplaceListing POSTs to /api/listings/:id/publish', async () => {
  const mock = installFetchMock(() => jsonResponse({ listingId: 'L-1', status: 'PUBLISHED' }));
  try {
    const c = new NexhaConnection({});
    const res = await c.publishMarketplaceListing('L-1');
    assert.equal(res.status, 'PUBLISHED');
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings/L-1/publish');
    assert.equal(mock.calls[0].init.method, 'POST');
  } finally {
    mock.restore();
  }
});

test('recordMarketplaceView POSTs to /api/listings/:id/view', async () => {
  const mock = installFetchMock(() => jsonResponse({ ok: true }));
  try {
    const c = new NexhaConnection({});
    const res = await c.recordMarketplaceView('L-1');
    assert.equal(res.ok, true);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings/L-1/view');
    assert.equal(mock.calls[0].init.method, 'POST');
  } finally {
    mock.restore();
  }
});

test('recordMarketplaceInstall POSTs to /api/listings/:id/install', async () => {
  const mock = installFetchMock(() => jsonResponse({ ok: true }, 201));
  try {
    const c = new NexhaConnection({});
    const res = await c.recordMarketplaceInstall('L-1');
    assert.equal(res.ok, true);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings/L-1/install');
    assert.equal(mock.calls[0].init.method, 'POST');
  } finally {
    mock.restore();
  }
});

test('listMarketplaceReviews forwards status + limit', async () => {
  const mock = installFetchMock(() => jsonResponse({
    items: [{ reviewId: 'R-1', rating: 5 }], total: 1, limit: 20, offset: 0,
  }));
  try {
    const c = new NexhaConnection({});
    const res = await c.listMarketplaceReviews('L-1', { status: 'published', limit: 20 });
    assert.equal(res.items.length, 1);
    const url = mock.calls[0].url;
    assert.match(url, /\/api\/listings\/L-1\/reviews/);
    assert.match(url, /status=published/);
    assert.match(url, /limit=20/);
  } finally {
    mock.restore();
  }
});

test('upsertMarketplaceReview PUTs /api/listings/:id/reviews with rating + dimensions', async () => {
  const mock = installFetchMock(() => jsonResponse({
    review: { rating: 5, dimensions: { easeOfUse: 5 } },
    listing: { averageRating: 5, reviewCount: 1 },
    created: true,
  }));
  try {
    const c = new NexhaConnection({});
    const res = await c.upsertMarketplaceReview('L-1', {
      rating: 5, title: 'Great', body: 'Loved it',
      dimensions: { easeOfUse: 5, documentation: 4 },
    });
    assert.equal(res.created, true);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/listings/L-1/reviews');
    assert.equal(mock.calls[0].init.method, 'PUT');
    const body = JSON.parse(mock.calls[0].init.body);
    assert.equal(body.rating, 5);
    assert.equal(body.dimensions.easeOfUse, 5);
  } finally {
    mock.restore();
  }
});

test('getMyMarketplaceReview GETs /api/my-reviews?listingId=...', async () => {
  const mock = installFetchMock(() => jsonResponse({ review: { rating: 5 } }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getMyMarketplaceReview('L-1');
    assert.equal(res.review.rating, 5);
    assert.match(mock.calls[0].url, /\/api\/my-reviews\?listingId=L-1/);
  } finally {
    mock.restore();
  }
});

test('getMarketplaceStats GETs /api/stats', async () => {
  const mock = installFetchMock(() => jsonResponse({
    total: 7, byStatus: { PUBLISHED: 5, DRAFT: 2 }, byCategory: { agent: 4, twin: 3 },
  }));
  try {
    const c = new NexhaConnection({});
    const res = await c.getMarketplaceStats();
    assert.equal(res.total, 7);
    assert.equal(mock.calls[0].url, 'http://localhost:4399/api/sutar/marketplace-listings/api/stats');
  } finally {
    mock.restore();
  }
});

test('all marketplace methods return null on network error', async () => {
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  try {
    const c = new NexhaConnection({});
    assert.equal(await c.createMarketplaceListing({ title: 'x', category: 'agent', pricingModel: 'free', publisherName: 'p', tenantId: 't' }), null);
    assert.equal(await c.searchMarketplaceListings(), null);
    assert.equal(await c.getMarketplaceListing('L-1'), null);
    assert.equal(await c.updateMarketplaceListing('L-1', { title: 'x' }), null);
    assert.equal(await c.publishMarketplaceListing('L-1'), null);
    assert.equal(await c.recordMarketplaceView('L-1'), null);
    assert.equal(await c.recordMarketplaceInstall('L-1'), null);
    assert.equal(await c.listMarketplaceReviews('L-1'), null);
    assert.equal(await c.upsertMarketplaceReview('L-1', { rating: 5 }), null);
    assert.equal(await c.getMyMarketplaceReview('L-1'), null);
    assert.equal(await c.getMarketplaceStats(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('marketplace methods forward Authorization header when token is set', async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = init;
    return jsonResponse({ items: [], total: 0 });
  };
  try {
    const c = new NexhaConnection({ token: 'jwt-abc' });
    await c.searchMarketplaceListings({ q: 'x' });
    assert.equal(captured.headers.Authorization, 'Bearer jwt-abc');
  } finally {
    globalThis.fetch = originalFetch;
  }
});