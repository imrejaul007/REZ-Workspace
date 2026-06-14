# AdBazaar SSP Portal — Supply Side Platform

> **Competitors:** Google Ad Manager, PubMatic SSP, OpenX  
> **Positioning:** "Maximize your screen inventory revenue"

---

## Overview

SSP (Supply Side Platform) for screen owners to monetize their DOOH inventory. Connects to AdBazaar DSP for programmatic ad buying.

### Key Features

- 📺 **Screen Management** - Register and manage screens
- 💰 **Inventory Monetization** - Set floor prices, availability
- 📊 **Revenue Dashboard** - Real-time earnings
- 🔗 **Real-time Bidding** - Programmatic ad auctions
- 📈 **Performance Analytics** - Impressions, CPM, fill rate

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        SSP PORTAL                                │
│                   (React Dashboard)                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SSP API GATEWAY (Port 4520)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┼─────────────────────────────┐  │
│  │                         │                             │  │
│  ▼                         ▼                             ▼  │
│ ┌──────────┐    ┌──────────────────┐    ┌──────────────┐ │
│ │  RABTUL │    │   AdBazaar DSP   │    │    DOOH      │ │
│ ├──────────┤    ├──────────────────┤    ├──────────────┤ │
│ │Auth 4002│◄──►│  Ad Buying API  │◄──►│ Screen Network│ │
│ │Payment 4001│◄──►│  Programmatic   │    │   Bidding    │ │
│ └──────────┘    └──────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SSP SERVICES                           │  │
│  ├──────────┬──────────┬──────────┬──────────┬────────────┤ │
│  │ Screen   │ Inventory│   Bid    │ Revenue  │  Analytics │ │
│  │  4521    │  4522    │  4523   │  4524    │   4525    │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| `ssp-gateway` | 4520 | API Gateway |
| `ssp-screen-service` | 4521 | Screen management |
| `ssp-inventory-service` | 4522 | Inventory management |
| `ssp-bidding-service` | 4523 | Real-time bidding |
| `ssp-revenue-service` | 4524 | Revenue tracking |
| `ssp-analytics-service` | 4525 | Performance analytics |

---

## API Endpoints

### Screens
```bash
GET    /api/screens               # List screens
POST   /api/screens               # Register screen
GET    /api/screens/:id           # Screen details
PATCH  /api/screens/:id           # Update screen
DELETE /api/screens/:id           # Remove screen
```

### Inventory
```bash
GET    /api/inventory             # List inventory
POST   /api/inventory             # Create inventory slot
PATCH  /api/inventory/:id         # Update availability
DELETE /api/inventory/:id         # Remove slot
POST   /api/inventory/floor-price # Set floor price
```

### Bidding
```bash
POST   /api/bids                  # Receive bid
GET    /api/bids                  # Bid history
GET    /api/bids/pending          # Pending bids
POST   /api/bids/:id/accept       # Accept bid
POST   /api/bids/:id/reject       # Reject bid
```

### Revenue
```bash
GET    /api/revenue               # Revenue summary
GET    /api/revenue/daily         # Daily breakdown
GET    /api/revenue/screens       # Per-screen revenue
POST   /api/revenue/payout        # Request payout
```

---

## Integration

### AdBazaar DSP
```typescript
// Connect to DSP for programmatic buying
const dsp = new AdBazaarDSP({ apiKey: '...' });

// Register for bid notifications
await dsp.ssp.register({
  screenId: 'screen_123',
  inventory: availableSlots
});
```

---

## Environment Variables

```bash
# Services
SSP_GATEWAY_PORT=4520
SCREEN_SERVICE_PORT=4521
INVENTORY_SERVICE_PORT=4522
BIDDING_SERVICE_PORT=4523

# AdBazaar DSP
DSP_URL=http://localhost:4521
DSP_API_KEY=your-dsp-api-key

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
```

---

## Folder Structure

```
ssp-portal/
├── README.md
├── package.json
├── ssp-gateway/
│   ├── src/index.ts
│   └── package.json
├── ssp-screen-service/
│   ├── src/index.ts
│   ├── src/routes/screens.ts
│   └── package.json
├── ssp-inventory-service/
│   ├── src/index.ts
│   ├── src/routes/inventory.ts
│   └── package.json
├── ssp-bidding-service/
│   ├── src/index.ts
│   ├── src/routes/bids.ts
│   └── package.json
├── ssp-revenue-service/
│   ├── src/index.ts
│   ├── src/routes/revenue.ts
│   └── package.json
├── ssp-analytics-service/
│   ├── src/index.ts
│   ├── src/routes/analytics.ts
│   └── package.json
└── apps/
    └── dashboard/                # React admin dashboard
```

---

**Built with:** REZ Ecosystem, RABTUL, AdBazaar DSP  
**Company:** AdBazaar
