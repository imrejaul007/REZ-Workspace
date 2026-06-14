# Rate Limiting

## Overview

The REZ RisnaEstate API implements rate limiting to ensure fair usage and protect the system from excessive requests. Rate limits are applied per API key and enforced on a rolling window basis.

---

## Rate Limits by Endpoint Type

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `GET /api/*` |100 requests | Per minute |
| `POST /api/*` | 50 requests | Per minute |
| `PATCH /api/*` | 50 requests | Per minute |
| `DELETE /api/*` | 20 requests | Per minute |
| `/health` | Unlimited | - |

---

## Response Headers

Every API response includes rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1750000000
X-RateLimit-Window: 60
```

### Header Descriptions

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `X-RateLimit-Window` | Window duration in seconds |

---

## Rate Limit Exceeded Response

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Please retry after 30 seconds.",
  "retryAfter": 30
}
```

### Headers on Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1750000000
Retry-After: 30
Content-Type: application/json
```

---

## Best Practices

### 1. Implement Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 30;
      const delay = retryAfter * 1000 * Math.pow(2, i); // Exponential backoff
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}
```

### 2. Check Remaining Requests

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);

  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');

  console.log(`Rate limit: ${remaining}/${limit} remaining`);

  // Add delay if approaching limit
  if (remaining < 10) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return response;
}
```

### 3. Batch Requests When Possible

Instead of making individual requests:

```javascript
// Bad: Multiple individual requests
for (const id of ids) {
  await fetch(`/api/v1/deals/${id}`);
}

// Good: Use pagination and batch processing
const deals = await fetch('/api/v1/deals?limit=100');
```

### 4. Cache Responses

```javascript
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function cachedFetch(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

---

## Endpoint-Specific Limits

### High-Traffic Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `GET /api/v1/properties` | 100/min | Heavy database queries |
| `GET /api/v1/analytics/*` | 30/min | Aggregated computations |
| `POST /api/v1/documents` | 20/min | File processing |

### Low-Traffic Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `POST /api/v1/deals` | 50/min | Normal CRUD operations |
| `POST /api/v1/agreements/generate` | 10/min | PDF generation is CPU-intensive |
| `DELETE /api/v1/*` | 20/min | Safety limit for destructive operations |

---

## Burst Limits

For short bursts of activity, the API allows:

- **Burst allowance**: Up to 150% of the per-minute limit over a 10-second window
- **Cool-down period**: After a burst, requests are throttled until the window normalizes

Example:
- Normal limit: 100 requests/minute
- Burst limit: 150 requests over 10 seconds
- After burst: 50 requests/minute until window normalizes

---

## Enterprise Limits

Enterprise tier customers have higher limits:

| Tier | GET/min | POST/min | DELETE/min |
|------|---------|----------|------------|
| Free | 100 | 50 | 20 |
| Starter | 500 | 250 | 100 |
| Professional | 2000 | 1000 | 400 |
| Enterprise | Custom | Custom | Custom |

Contact [api@rez.com](mailto:api@rez.com) to upgrade your tier.

---

## Monitoring Your Usage

### Check Current Usage

```bash
curl -I http://localhost:3000/api/v1/deals \
  -H "Authorization: Bearer <token>"
```

### Track Usage Over Time

```javascript
const usageHistory = [];

async function trackUsage(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  const reset = response.headers.get('X-RateLimit-Reset');

  usageHistory.push({
    timestamp: Date.now(),
    remaining: parseInt(remaining),
    limit: parseInt(limit),
    reset: parseInt(reset)
  });

  // Keep only last 100 entries
  if (usageHistory.length > 100) {
    usageHistory.shift();
  }

  // Alert if consistently low
  const avgRemaining = usageHistory.slice(-10).reduce((a, b) => a + b.remaining, 0) / 10;
  if (avgRemaining < 10) {
    console.warn('Approaching rate limit!');
  }
}
```

---

## Troubleshooting

### "Rate limit exceeded" Errors

1. **Check the Retry-After header** - Wait the specified time before retrying
2. **Implement exponential backoff** - Don't retry immediately
3. **Optimize your requests** - Use pagination, caching, and batching
4. **Consider upgrading** - Contact us for higher limits

### Unexpected Rate Limits

1. **Check for shared API keys** - Multiple services using the same key
2. **Review webhook integrations** - External triggers may cause spikes
3. **Monitor background jobs** - Scheduled tasks may hit limits

---

## Contact Support

For rate limit increases or enterprise tier inquiries:
- Email: [api@rez.com](mailto:api@rez.com)
- Portal: [https://dashboard.rez.com/api-access](https://dashboard.rez.com/api-access)
