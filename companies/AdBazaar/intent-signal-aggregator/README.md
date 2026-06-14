# Intent Signal Aggregator

**Port:** 4800

A critical service for the Intent Exchange that collects, normalizes, and enriches intent signals from multiple REZ ecosystem sources.

## Overview

The Intent Signal Aggregator is the central ingestion point for all user intent signals across the REZ ecosystem. It processes signals from various services, normalizes them to a canonical schema, enriches them with context, and routes them to downstream services like the Intent Graph and Marketplace.

## Features

- **Multi-source signal ingestion** from buzzlocal, airzy, rez-menu-qr, rez-now, risacare, corpperks
- **Signal normalization** to canonical schema with event type and category mapping
- **Context enrichment** including user profile, signal history, and affinities
- **Hash-based deduplication** with Redis caching
- **Confidence scoring** (0-1) based on signal characteristics
- **Real-time routing** to Intent Graph and Marketplace

## API Endpoints

### POST /api/signals/ingest
Ingest a single intent signal.

```json
{
  "source": "buzzlocal",
  "sourceService": "buzzlocal-app",
  "userId": "user-123",
  "eventType": "search",
  "category": "DINING",
  "intentKey": "pizza near me",
  "intentQuery": "pizza delivery",
  "metadata": { "location": "mumbai" },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/signals/batch
Batch ingest multiple signals (up to 1000).

```json
{
  "signals": [
    { ... },
    { ... }
  ]
}
```

### GET /api/signals/stats
Get aggregation statistics.

### GET /api/signals/user/:userId
Get user signal history with pagination.

### GET /api/signals/source/:source
Get signals by source with pagination.

### GET /api/signals/:signalId
Get a specific signal by ID.

## Signal Sources

| Source | Category | Event Types |
|--------|----------|-------------|
| buzzlocal | DINING, RETAIL, GENERAL | search, view, wishlist |
| airzy | TRAVEL | search, view, booking_start, booking_complete |
| rez-menu-qr | DINING | scan, view_menu, add_to_cart, order |
| rez-now | DINING, RETAIL | search, view_restaurant, add_to_cart, order_start, order_complete |
| risacare | HEALTHCARE | search, view_doctor, book_appointment |
| corpperks | GENERAL, HEALTHCARE | search, view_benefit, enroll, redeem |

## Signal Schema

```typescript
interface IntentSignal {
  signalId: string;           // UUID
  source: string;             // e.g., "buzzlocal"
  sourceService: string;       // e.g., "buzzlocal-app"
  userId: string;
  eventType: EventType;       // 'search' | 'view' | 'wishlist' | 'cart_add' | 'checkout_start' | 'fulfilled'
  category: SignalCategory;    // 'DINING' | 'TRAVEL' | 'RETAIL' | 'HEALTHCARE' | 'GENERAL'
  intentKey: string;           // Normalized intent key
  intentQuery?: string;       // Original search query
  metadata: Record<string, unknown>;
  confidence: number;         // 0-1
  enriched: boolean;
  timestamp: Date;
}
```

## Configuration

```bash
PORT=4800
MONGODB_URI=mongodb://localhost:27017/intent-signal-aggregator
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
INTERNAL_SERVICE_KEY=your-internal-key
SIGNAL_DEDUP_WINDOW_MS=300000
NODE_ENV=development
LOG_LEVEL=info
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Health Check

```bash
curl http://localhost:4800/health
```

## Metrics

Prometheus metrics available at `/metrics`.

## Architecture

```
┌─────────────────┐
│  Signal Sources │
│  buzzlocal      │
│  airzy          │
│  rez-menu-qr    │
│  rez-now        │
│  risacare       │
│  corpperks      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Signal Normalization           │
│  - Event type mapping               │
│  - Category mapping                 │
│  - Intent extraction                │
│  - Confidence scoring              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Signal Enrichment              │
│  - User profile context             │
│  - Signal history                   │
│  - Affinity calculation             │
│  - Intent clusters                  │
│  - Next action prediction           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Signal Routing                 │
│  - Intent Graph                    │
│  - Marketplace                    │
│  - Ads Targeting                   │
└─────────────────────────────────────┘
```

## Integration Points

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Intent Graph | `/api/intent/graph` | Real-time intent tracking |
| Marketplace | `/api/recommendations/:category` | Personalization |
| Ads | `/api/ads/targeting` | Ad targeting |

## License

Proprietary - REZ Ecosystem