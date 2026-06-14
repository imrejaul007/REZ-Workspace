# Performance Optimization Guide

**Last Updated:** 2026-05-16

---

## Bundle Optimization

### 1. Tree Shaking

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: true,
  },
};
```

### 2. Code Splitting

```typescript
// Lazy load routes
const AuthScreen = lazy(() => import('./screens/AuthScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
```

### 3. Compression

```yaml
# render.yaml
buildCommand: npm install && npm run build
startCommand: npm start
autoDeploy: false
```

---

## API Optimization

### 1. Response Caching

```typescript
app.get('/api/data', cache('5 minutes'), (req, res) => {
  res.json(data);
});
```

### 2. Pagination

```typescript
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const page = parseInt(req.query.page) || 1;
const skip = (page - 1) * limit;
```

### 3. Database Indexing

```javascript
// Create indexes
db.collection.createIndex({ userId: 1, createdAt: -1 });
db.collection.createIndex({ email: 1 }, { unique: true });
```

---

## Caching Strategy

### Redis Cache

| Data | TTL | Strategy |
|------|-----|----------|
| User Session | 24h | LRU |
| API Response | 5min | Cache-aside |
| Product Data | 1h | Read-through |
| Session Token | 1h | Write-through |

### Headers

```typescript
res.set({
  'Cache-Control': 'public, max-age=300',
  'ETag': generateETag(data),
});
```

---

## Database Optimization

### Query Optimization

```javascript
// Use projection
const users = await User.find({}, '-password -tokens').lean();

// Use indexes
const orders = await Order.find({ userId }).populate('items');

// Batch operations
const results = await User.insertMany(newUsers, { ordered: false });
```

### Connection Pooling

```typescript
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
});
```

---

## Memory Optimization

### Node.js

```bash
# Set memory limit
node --max-old-space-size=512 server.js

# Enable garbage collection
node --expose-gc server.js
```

### React Native

```javascript
// Clear unused images
Image.clearMemoryCache();

// FlatList optimization
<FlatList
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## Network Optimization

### 1. Enable HTTP/2

```yaml
# render.yaml
services:
  - type: web
    name: api
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=31536000
```

### 2. CDN for Static Assets

```javascript
const cdnUrl = process.env.CDN_URL || '';
const imageUrl = `${cdnUrl}/images/${imageId}`;
```

---

## Monitoring Performance

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| TTFB | < 200ms | > 500ms |
| FCP | < 1.5s | > 3s |
| LCP | < 2.5s | > 4s |
| CLS | < 0.1 | > 0.25 |
| API Latency | < 300ms | > 1s |

### APM Tools

- New Relic
- Datadog
- AWS X-Ray
- OpenTelemetry

---

## Load Testing

### k6 Script

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.example.com/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

Run:
```bash
k6 run load-test.js
```
