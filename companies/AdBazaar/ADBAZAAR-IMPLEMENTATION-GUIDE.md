# AdBazaar Implementation Guide
**Phase 1: Foundation - Multi-Tenant & Unified Campaigns**
**Date:** May 27, 2026

---

## What Was Created

### 1. Shared Tenant Middleware Package
**Location:** `shared/tenant-middleware/`

| File | Purpose |
|------|---------|
| `src/types.ts` | Complete type definitions for tenant system |
| `src/context.ts` | Tenant context management |
| `src/middleware.ts` | Express middleware for tenant identification |
| `src/index.ts` | Main exports |
| `package.json` | Package configuration |
| `tsconfig.json` | TypeScript configuration |

### 2. Unified Campaign Service
**Location:** `unified-campaign-service/`

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Campaign, budget, targeting types |
| `src/services/campaignOrchestrator.ts` | Campaign orchestration logic |
| `src/index.ts` | Express server with all routes |
| `package.json` | Package configuration |
| `tsconfig.json` | TypeScript configuration |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADBAZAAR MULTI-TENANT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TENANT IDENTIFICATION                               │   │
│  │                                                                      │   │
│  │   x-adbazaar-tenant-id: rez_ride                    ← Header        │   │
│  │   x-adbazaar-tenant-type: rez_internal             ← Header        │   │
│  │   x-adbazaar-company-id: rez-ride                 ← Header        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 TENANT MIDDLEWARE                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │  Create Tenant │  │ Check Inventory │  │ Apply Rate     │     │   │
│  │  │    Context      │  │    Access       │  │    Limits       │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              UNIFIED CAMPAIGN ORCHESTRATOR                            │   │
│  │                                                                      │   │
│  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │   │
│  │   │  Create  │ │  Budget  │ │  Target   │ │ Schedule  │            │   │
│  │   │ Campaign │ │ Allocator│ │  Engine   │ │  Engine   │            │   │
│  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘            │   │
│  │                                                                      │   │
│  │   ┌─────────────────────────────────────────────────────────────┐  │   │
│  │   │              INVENTORY ROUTER                                 │  │   │
│  │   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │   │
│  │   │   │  DOOH   │ │   QR    │ │ WhatsApp│ │ Creator │            │  │   │
│  │   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │   │
│  │   └─────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How to Use

### 1. Install Tenant Middleware

```bash
cd shared/tenant-middleware
npm install
npm run build
```

### 2. Using Tenant Middleware in Your Service

```typescript
import {
  tenantMiddleware,
  requireInternalTenant,
  requireInventoryAccess,
  InventoryCategory,
  TenantType,
} from '@rez/tenant-middleware';

// Apply to all routes
app.use(tenantMiddleware());

// Require internal tenant
app.get('/api/internal/stats', requireInternalTenant(), (req, res) => {
  // Only REZ internal tenants can access
  const tenant = req.tenant;
  res.json({ tenantId: tenant.tenantId });
});

// Require specific inventory access
app.post('/api/campaign', requireInventoryAccess(InventoryCategory.REZ_APP_HOME_FEED), handler);

// Check in route handler
app.get('/api/data', (req, res) => {
  if (!req.tenant) {
    return res.status(401).json({ error: 'Tenant required' });
  }

  // Check if internal
  if (req.tenant.tenantType === TenantType.REZ_INTERNAL) {
    // Has privileged access
  } else {
    // Has marketplace access only
  }
});
```

### 3. Tenant Headers

Include in all requests to AdBazaar services:

```typescript
// For REZ Internal tenants
headers: {
  'x-adbazaar-tenant-id': 'rez_ride',
  'x-adbazaar-tenant-type': 'rez_internal',
  'x-adbazaar-company-id': 'rez-ride',
}

// For External tenants
headers: {
  'x-adbazaar-tenant-id': 'tenant_abc123',
  'x-adbazaar-tenant-type': 'external',
}
```

### 4. Using Unified Campaign Service

```typescript
// Create campaign (internal tenant)
const response = await fetch('http://localhost:4500/api/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-adbazaar-tenant-id': 'rez_ride',
    'x-adbazaar-tenant-type': 'rez_internal',
    'x-adbazaar-company-id': 'rez-ride',
  },
  body: JSON.stringify({
    name: 'Summer Ride Campaign',
    objective: 'conversion',
    inventory: {
      categories: ['rez_app_home_feed', 'dooh_public'],
      platforms: ['app', 'dooh'],
    },
    budget: {
      totalBudget: 100000,
      model: 'daily',
      dailyLimit: 5000,
    },
    creative: {
      primary: {
        id: 'creative_1',
        type: 'image',
        assets: [{ url: 'https://...', type: 'image', mimeType: 'image/png' }],
        headline: 'Get 50% off your first ride!',
        description: 'Download ReZ Ride now',
        callToAction: 'Book Now',
      },
      variations: [],
      rotation: 'random',
    },
  }),
});

const campaign = await response.json();
```

---

## Inventory Classification

### Internal Inventory (REZ Internal Only)

| Category | Description |
|----------|-------------|
| `rez_app_home_feed` | ReZ App home feed placements |
| `rez_app_recommendation` | ReZ App recommendations |
| `rez_ride_inapp` | ReZ Ride in-app placements |
| `airzy_traveler` | Airzy traveler placements |
| `stayown_guest` | StayOwn guest room |
| `corpperks_employee` | CorpPerks employee targeting |
| `karma_loyalty` | Karma loyalty placements |

### Marketplace Inventory (All Tenants)

| Category | Description |
|----------|-------------|
| `dooh_public` | Public DOOH screens |
| `qr_public` | QR campaigns |
| `creator_public` | Creator/influencer |
| `whatsapp_public` | WhatsApp placements |
| `event_public` | Event inventory |
| `hospitality_public` | Hotel/restaurant displays |

---

## Rate Limits by Tenant Type

| Tenant Type | Requests/min | Campaigns/month | Max Budget |
|------------|-------------|----------------|------------|
| REZ Internal | Unlimited | Unlimited | Unlimited |
| External Tier-0 | 1,000 | 200 | Custom |
| External Tier-1 | 500 | 50 | ₹10L/month |
| External Tier-2 | 100 | 10 | ₹1L/month |

---

## Features by Tenant Type

### REZ Internal

- Full inventory access
- Cross-platform targeting
- Multi-touch attribution
- Wallet attribution
- Ride attribution
- AI optimization
- Custom audiences
- Lookalike audiences

### External

- Marketplace inventory only
- Basic targeting
- Standard attribution
- No internal data access

---

## Integration Points

### RABTUL Services

| Service | Integration | Status |
|---------|-------------|--------|
| Auth | JWT validation | ✅ Ready |
| Wallet | Coin rewards | ✅ Ready |
| Notifications | Push/SMS/WhatsApp | ✅ Ready |
| Payment | Razorpay | ✅ Ready |

### REZ Intelligence

| Service | Integration | Status |
|---------|-------------|--------|
| Intent Graph | Targeting | 🔄 In Progress |
| Decision Engine | Campaign optimization | 🔄 In Progress |
| Attribution Hub | Multi-touch | 🔄 In Progress |

### External Integrations

| Provider | Integration | Status |
|----------|-------------|--------|
| DOOH Screens | via REZ-dooh-service | ✅ Ready |
| QR Campaigns | via adsqr | ✅ Ready |
| WhatsApp | via rez-whatsapp-commerce | ✅ Ready |
| Creators | via creators | ✅ Ready |

---

## Next Steps

### Phase 1 Complete ✅

- [x] Tenant middleware package
- [x] Unified campaign service
- [x] Inventory classification
- [x] Basic access control

### Phase 2: Integration (Next)

- [ ] Connect to existing ad services
- [ ] Add MongoDB persistence
- [ ] Integrate with Redis caching
- [ ] Add campaign optimization AI

### Phase 3: Ecosystem Integration

- [ ] Connect ReZ Ride data
- [ ] Connect Airzy/StayOwn inventory
- [ ] Connect BuzzLocal community
- [ ] Connect CorpPerks employee

---

## Environment Variables

```bash
# Shared Tenant Middleware
INTERNAL_SERVICE_TOKEN=your-token-here

# Unified Campaign Service
PORT=4500
MONGODB_URI=mongodb://localhost:27017/unified-campaigns
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://admin.rez.money,https://adbazaar.rez.money

# RABTUL Integration
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-notifications.onrender.com
```

---

## Example: Updating Existing Service

### Before (No Tenant Awareness)

```typescript
// REZ-ads-service/src/index.ts
app.get('/api/campaigns', async (req, res) => {
  const campaigns = await Campaign.find({}); // All campaigns!
  res.json({ campaigns });
});
```

### After (With Tenant Awareness)

```typescript
import {
  tenantMiddleware,
  TenantType,
} from '@rez/tenant-middleware';

app.use(tenantMiddleware());

app.get('/api/campaigns', async (req, res) => {
  const tenant = req.tenant;

  if (!tenant) {
    return res.status(401).json({ error: 'Tenant required' });
  }

  // For external tenants, only show their campaigns
  if (tenant.tenantType === TenantType.EXTERNAL) {
    const campaigns = await Campaign.find({ tenantId: tenant.tenantId });
    return res.json({ campaigns });
  }

  // For internal tenants, show all (with optional filtering)
  const campaigns = await Campaign.find(tenant.tenantId ? { tenantId: tenant.tenantId } : {});
  res.json({ campaigns });
});
```

---

## Example: Inventory Access Check

```typescript
import {
  requireInventoryAccess,
  InventoryCategory,
  isInternalInventory,
} from '@rez/tenant-middleware';

// Require specific inventory
app.post('/api/campaigns',
  requireInventoryAccess(InventoryCategory.REZ_APP_HOME_FEED),
  handler
);

// Or inline check
app.post('/api/campaigns', async (req, res) => {
  const { categories } = req.body;

  // Check if trying to access internal inventory
  const hasInternalRequest = categories.some(isInternalInventory);

  if (hasInternalRequest && req.tenant?.tenantType !== TenantType.REZ_INTERNAL) {
    return res.status(403).json({
      error: 'INTERNAL_INVENTORY_DENIED',
      message: 'Internal inventory requires REZ internal tenant access',
    });
  }

  // Continue with campaign creation
});
```

---

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| `unified-campaign-service` | 4500 | Unified campaign orchestration |
| `REZ-dooh-service` | 4018 | DOOH backend |
| `REZ-ads-service` | 4007 | Ad serving |
| `REZ-marketing` | 4000 | Marketing |
| `REZ-attribution-hub` | 4100 | Attribution |
| `karma-service` | 3009 | Karma |

---

## Monitoring

### Health Endpoints

```bash
# Unified Campaign Service
GET /health  # Basic health
GET /ready   # Readiness check

# Response
{
  "status": "ok",
  "service": "unified-campaign-service",
  "version": "1.0.0",
  "timestamp": "2026-05-27T12:00:00.000Z"
}
```

### Metrics

```bash
GET /metrics  # Prometheus metrics
```

---

## Troubleshooting

### Tenant Not Identified

```bash
# Check headers are being sent
curl -H "x-adbazaar-tenant-id: rez_ride" \
     -H "x-adbazaar-tenant-type: rez_internal" \
     http://localhost:4500/api/campaigns
```

### Internal Inventory Access Denied

```
Error: Inventory rez_app_home_feed requires internal tenant access
```

**Solution:** Ensure `x-adbazaar-tenant-type: rez_internal` header is sent

### Campaign Creation Fails

```
Error: MIN_BUDGET_NOT_MET
```

**Solution:** Ensure budget exceeds minimum (₹500 for external tenants)

---

## File Structure

```
REZ-Media/
├── shared/
│   └── tenant-middleware/           # NEW: Tenant isolation
│       ├── src/
│       │   ├── types.ts
│       │   ├── context.ts
│       │   ├── middleware.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── unified-campaign-service/       # NEW: Campaign orchestrator
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── campaignOrchestrator.ts
│   │   ├── index.ts
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
└── [existing services...]
    ├── REZ-dooh-service/
    ├── REZ-ads-service/
    ├── REZ-marketing/
    └── ...
```

---

## Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Services with tenant awareness | 100% | 5% |
| Campaign API coverage | 100% | 15% |
| Inventory classification | Complete | Partial |
| Integration readiness | 100% | 30% |

---

**End of Implementation Guide**
