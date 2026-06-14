# REZ Real Estate OS - Property Management Operating System

**Company:** REZ-Merchant  
**Type:** Industry OS - Real Estate Vertical  
**Status:** NEW - June 5, 2026  
**Port Range:** 4800-4899

---

## Overview

REZ Real Estate OS is a comprehensive property management and real estate platform covering:
- Property Listings & Catalog
- Lead Management
- Site Visits & Scheduling
- Deal Management
- Document Management
- Post-Sale Services

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               REZ REAL ESTATE OS (Port 4800)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────┐│
│  │ Property  │  │   Lead    │  │   Site    │  │ Deal  ││
│  │ Service   │  │ Service   │  │ Visit Svc  │  │ Svc   ││
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───┬───┘│
│        │              │              │              │      │
│        └──────────────┴──────────────┴──────────────┘      │
│                            │                                │
│                   ┌────────┴────────┐                     │
│                   │  RE API Gateway  │                      │
│                   │   (Port 4800)    │                      │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RABTUL    │    │  REZ Mind   │    │   HOJAI    │
│ Payment/Wallet│   │ Lead Intent │    │ PropFlow AI │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `property-service` | 4801 | Property listings, inventory |
| `lead-service` | 4802 | Lead capture, scoring, assignment |
| `site-visit-service` | 4803 | Visit scheduling, tracking |
| `deal-service` | 4804 | Deal pipeline, negotiations |
| `document-service` | 4805 | Agreement, NOC, registry docs |
| `inventory-service` | 4806 | Unit management, availability |
| `pricing-service` | 4807 | Rate card, dynamic pricing |
| `channel-partner-service` | 4808 | Agent/broker management |
| `analytics-service` | 4809 | Market insights, ROI reports |

## Key Features

### Property Management
- Multi-property type support (apartments, villas, plots, commercial)
- Inventory management with real-time availability
- Price management with dynamic pricing
- Media gallery (photos, videos, virtual tours)
- Amenities and specification management

### Lead Management
- Multi-channel lead capture (web, WhatsApp, phone)
- AI-powered lead scoring (via REZ Mind)
- Auto-assignment to agents
- Follow-up reminders
- Lead nurturing campaigns

### Site Visit Management
- Online scheduling with calendar
- Geo-tagged check-in/check-out
- Visit feedback collection
- Competitor property comparison
- Visit history tracking

### Deal Management
- Pipeline visualization
- Stage-based tracking
- Discount approvals
- Agreement generation
- Payment milestone tracking

## Event Triggers

| Event | Trigger | Integrations |
|-------|---------|--------------|
| `property.inquired` | New inquiry | RABTUL Notifications |
| `lead.qualified` | Lead score > 80 | REZ Mind, Analytics |
| `visit.scheduled` | Visit booked | WhatsApp, Notifications |
| `deal.won` | Deal closed | RABTUL Payment, Wallet |
| `property.registered` | Registry completed | HOJAI Legal AI |

## Ecosystem Integration

```typescript
import { createEcosystemClient } from '@rez/sdk';

// AI-powered property recommendation
const recommendations = await ecosystem.hojai.query({
  prompt: `Recommend properties for customer:
    Budget: ₹50L - ₹80L
    Location: Whitefield, Bangalore
    BHK: 2-3 BHK
    Priority: Schools nearby, IT park access`
});

// Lead intent prediction
const intentScore = await ecosystem.intelligence.getIntentPrediction({
  leadId: 'lead_123',
  context: 'Looking for 3BHK under 1Cr'
});
```

---

**Version:** 1.0.0  
**Last Updated:** June 5, 2026  
**Ecosystem Connected:** ✅ RABTUL | ✅ REZ Intelligence | ✅ HOJAI AI
