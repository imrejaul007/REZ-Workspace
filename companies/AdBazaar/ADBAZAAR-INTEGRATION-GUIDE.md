# AdBazaar Integration Guide
**Complete Phase 1-2 Implementation**

---

## What Was Built

### New Services Created

| Service | Port | Purpose |
|---------|------|---------|
| `shared/tenant-middleware` | - | Tenant isolation package |
| `tenant-registry` | 4510 | Tenant management |
| `inventory-classifier` | 4515 | Inventory categorization |
| `unified-campaign-service` | 4500 | Campaign orchestrator |
| `attribution-hub-enhanced` | 4520 | Multi-touch attribution |

### Files Created

```
REZ-Media/
├── shared/
│   └── tenant-middleware/           # Multi-tenant package
│       ├── src/
│       │   ├── types.ts             # Tenant types, inventory categories
│       │   ├── context.ts           # Tenant context management
│       │   ├── middleware.ts        # Express middleware
│       │   └── index.ts
│       └── package.json
│
├── tenant-registry/                  # Tenant management service
│   ├── src/
│   │   ├── models/
│   │   │   └── tenant.ts           # Tenant MongoDB model
│   │   ├── services/
│   │   │   └── tenantService.ts    # Business logic
│   │   └── index.ts                # Express server
│   └── package.json
│
├── unified-campaign-service/          # Campaign orchestrator
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts           # Campaign types
│   │   ├── services/
│   │   │   └── campaignOrchestrator.ts
│   │   └── index.ts
│   └── package.json
│
├── inventory-classifier/             # Inventory categorization
│   ├── src/
│   │   ├── services/
│   │   │   └── inventoryService.ts # 23 inventory categories
│   │   └── index.ts
│   └── package.json
│
├── attribution-hub-enhanced/         # Multi-touch attribution
│   ├── src/
│   │   ├── models/
│   │   │   └── attribution.ts     # MongoDB models
│   │   ├── services/
│   │   │   └── attributionService.ts
│   │   └── index.ts
│   └── package.json
│
├── ADBAZAAR-COMPLETE-AUDIT.md       # Audit report
└── ADBAZAAR-IMPLEMENTATION-GUIDE.md # Implementation guide
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADBAZAAR PLATFORM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TENANT REGISTRY (4510)                            │   │
│  │  • Tenant registration (REZ Internal + External)                     │   │
│  │  • API key management                                              │   │
│  │  • Authentication                                                 │   │
│  │  • Rate limiting by tier                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 INVENTORY CLASSIFIER (4515)                         │   │
│  │  • 23 inventory categories                                         │   │
│  │  • Internal vs Marketplace classification                         │   │
│  │  • Access control                                               │   │
│  │  • Pricing and reach estimates                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              UNIFIED CAMPAIGN SERVICE (4500)                           │   │
│  │  • Cross-platform campaign creation                                │   │
│  │  • Budget allocation                                              │   │
│  │  • Targeting engine                                             │   │
│  │  • Multi-inventory routing                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │           ATTRIBUTION HUB ENHANCED (4520)                            │   │
│  │  • Multi-touch attribution (5 models)                               │   │
│  │  • Cross-device tracking                                          │   │
│  │  • Campaign attribution                                           │   │
│  │  • Conversion path analysis                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd shared/tenant-middleware && npm install && npm run build
cd tenant-registry && npm install
cd unified-campaign-service && npm install
cd inventory-classifier && npm install
cd attribution-hub-enhanced && npm install
```

### 2. Start Services

```bash
# Terminal 1: Tenant Registry
cd tenant-registry && npm run dev

# Terminal 2: Inventory Classifier
cd inventory-classifier && npm run dev

# Terminal 3: Unified Campaign Service
cd unified-campaign-service && npm run dev

# Terminal 4: Attribution Hub
cd attribution-hub-enhanced && npm run dev
```

### 3. Seed REZ Internal Tenants

```bash
curl -X POST http://localhost:4510/api/seed \
  -H "x-admin-token: admin-token"
```

---

## Usage Examples

### Create Tenant (REZ Internal)

```bash
curl -X POST http://localhost:4510/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rez_internal",
    "name": "ReZ Ride",
    "companyName": "ReZ Mobility",
    "email": "ride@rez.money",
    "rezCompanyId": "rez-ride",
    "password": "secure-password"
  }'
```

### Create Campaign (Internal Tenant)

```bash
curl -X POST http://localhost:4500/api/campaigns \
  -H "Content-Type: application/json" \
  -H "x-adbazaar-tenant-id: rez_rez-ride" \
  -H "x-adbazaar-tenant-type: rez_internal" \
  -H "x-adbazaar-company-id: rez-ride" \
  -d '{
    "name": "Summer Ride Campaign",
    "objective": "conversion",
    "inventory": {
      "categories": ["rez_app_home_feed", "dooh_public"],
      "platforms": ["app", "dooh"]
    },
    "budget": {
      "totalBudget": 100000,
      "model": "daily",
      "dailyLimit": 5000
    },
    "creative": {
      "primary": {
        "id": "creative_1",
        "type": "image",
        "assets": [{
          "url": "https://cdn.example.com/ride-ad.jpg",
          "type": "image",
          "mimeType": "image/jpeg"
        }],
        "headline": "Get 50% off your first ride!",
        "callToAction": "Book Now"
      },
      "variations": [],
      "rotation": "random"
    }
  }'
```

### Record Touchpoint

```bash
curl -X POST http://localhost:4520/api/touchpoint \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "userId": "user_456",
    "source": "dooh",
    "campaignId": "camp_xyz789",
    "utmSource": "rech_local"
  }'
```

### Record Conversion

```bash
curl -X POST http://localhost:4520/api/conversion \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD123456",
    "userId": "user_456",
    "value": 250,
    "model": "last_click"
  }'
```

---

## API Reference

### Tenant Registry (Port 4510)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register tenant |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current tenant |
| POST | `/api/keys` | Create API key |
| DELETE | `/api/keys/:name` | Revoke API key |
| GET | `/api/tenants` | List tenants (admin) |
| POST | `/api/seed` | Seed REZ tenants |
| POST | `/api/internal/validate-key` | Validate API key |

### Inventory Classifier (Port 4515)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | All inventory |
| GET | `/api/inventory/internal` | Internal only |
| GET | `/api/inventory/marketplace` | Marketplace only |
| GET | `/api/platforms` | All platforms |
| GET | `/api/summary` | Inventory summary |

### Unified Campaign Service (Port 4500)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/:id` | Get campaign |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| POST | `/api/campaigns/:id/activate` | Activate |
| POST | `/api/campaigns/:id/pause` | Pause |
| GET | `/api/campaigns/:id/metrics` | Get metrics |
| POST | `/api/audience/estimate` | Estimate audience |

### Attribution Hub (Port 4520)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/touchpoint` | Record touchpoint |
| POST | `/api/conversion` | Record conversion |
| GET | `/api/campaign/:id/attribution` | Campaign report |
| GET | `/api/user/:id/cross-device` | Cross-device |
| POST | `/api/config/attribution-window` | Set window |

---

## Inventory Categories

### REZ Internal (Privileged)

| Category | Platform | Min Budget |
|----------|----------|-----------|
| `rez_app_home_feed` | App | ₹10,000 |
| `rez_app_recommendation` | App | ₹5,000 |
| `rez_ride_inapp` | App | ₹8,000 |
| `rez_ride_external` | DOOH | ₹15,000 |
| `airzy_traveler` | Hospitality | ₹20,000 |
| `airzy_lounge` | Hospitality | ₹30,000 |
| `stayown_guest` | Hospitality | ₹12,000 |
| `corpperks_employee` | App | ₹10,000 |
| `karma_loyalty` | App | ₹5,000 |

### Marketplace (All Tenants)

| Category | Platform | Min Budget |
|----------|----------|-----------|
| `dooh_public` | DOOH | ₹10,000 |
| `qr_public` | QR | ₹2,000 |
| `creator_public` | Creator | ₹10,000 |
| `whatsapp_public` | WhatsApp | ₹5,000 |
| `event_public` | Event | ₹20,000 |
| `society_public` | DOOH | ₹5,000 |

---

## Multi-Touch Attribution Models

| Model | Description | Use Case |
|-------|-------------|---------|
| `first_click` | First touchpoint gets 100% credit | Brand awareness |
| `last_click` | Last touchpoint gets 100% credit | Direct response |
| `linear` | Equal credit to all touchpoints | Mid-funnel |
| `time_decay` | Recent touchpoints get more credit | B2B sales |
| `position_based` | First/last get 40%, middle distributed | Complex journeys |

---

## Rate Limits

| Tenant Type | Requests/min | Campaigns/month | Max Budget |
|------------|-------------|----------------|------------|
| REZ Internal | Unlimited | Unlimited | Unlimited |
| External Tier-0 | 1,000 | 200 | Custom |
| External Tier-1 | 500 | 50 | ₹10L/month |
| External Tier-2 | 100 | 10 | ₹1L/month |

---

## Environment Variables

```bash
# Tenant Registry
PORT=4510
MONGODB_URI=mongodb://localhost:27017/tenant-registry
JWT_SECRET=your-jwt-secret
ADMIN_TOKEN=admin-token

# Unified Campaign Service
PORT=4500
MONGODB_URI=mongodb://localhost:27017/unified-campaigns
INTERNAL_SERVICE_TOKEN=service-token

# Attribution Hub
PORT=4520
MONGODB_URI=mongodb://localhost:27017/attribution-hub-enhanced

# CORS (all services)
CORS_ORIGIN=https://admin.rez.money,https://adbazaar.rez.money
```

---

## Next Steps

### Phase 3: Ecosystem Integration

1. Connect ReZ Ride data → Mobility targeting
2. Connect Airzy/StayOwn → Hospitality inventory
3. Connect BuzzLocal → Community targeting
4. Connect CorpPerks → Employee targeting

### Phase 4: Intelligence Layer

1. Integrate Hojai AI gateway
2. Build commerce graph
3. Add predictive scoring

### Phase 5: Flywheel

1. Autonomous optimization
2. AI campaign orchestration
3. Unified dashboard

---

## Monitoring

### Health Checks

```bash
curl http://localhost:4510/health  # Tenant Registry
curl http://localhost:4515/health  # Inventory Classifier
curl http://localhost:4500/health  # Campaign Service
curl http://localhost:4520/health  # Attribution Hub
```

---

## Troubleshooting

### Tenant Not Found
```bash
# Check tenant exists
curl http://localhost:4510/api/tenants/rez_rez-ride
```

### Inventory Access Denied
```bash
# Ensure correct headers
curl -H "x-adbazaar-tenant-type: rez_internal" ...
```

### Attribution Not Working
```bash
# Check touchpoints recorded
curl http://localhost:4520/api/touchpoint -d '{"sessionId": "test"}'
```

---

**End of Integration Guide**
