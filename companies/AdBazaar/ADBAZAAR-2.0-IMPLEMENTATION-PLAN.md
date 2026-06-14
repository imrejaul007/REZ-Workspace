# AdBazaar 2.0 Implementation Plan

**Date:** June 6, 2026  
**Status:** PENDING APPROVAL  
**Estimated Duration:** 8 months (20 weeks)

---

## Executive Summary

Build the world's first **AI-Powered Commerce, Intent, and Retail Media Intelligence Network** - not just an AdTech platform.

**Key Differentiators vs Magnite:**
- Intent Exchange (no competitor has this)
- Audience Twins (behavioral simulation)
- Commerce Ads (click-to-book-to-pay)
- Hyperlocal targeting (apartment-level)
- Cross-Ecosystem network (REZ-owned inventory)

---

## Phase 1: Intelligence Foundation (Weeks 1-4)

### 1.1 Intent Exchange Core (P0 - 4 services)

| Service | Port | Description |
|---------|------|-------------|
| `intent-signal-aggregator` | 4800 | Collect signals from BuzzLocal, Airzy, REZ Menu QR, REZ Now, RisaCare |
| `intent-prediction-engine` | 4801 | ML intent scoring, dormancy detection, revival prediction |
| `intent-marketplace` | 4802 | Buy/sell intent audiences |
| `intent-attribution` | 4803 | Track intent → conversion attribution |

### 1.2 Audience Twin Layer (P0 - 3 services)

| Service | Port | Description |
|---------|------|-------------|
| `audience-twin-service` | 4805 | Derive from hojai-twin (4860) for ads |
| `user-twin-service` | 4806 | User behavioral twin |
| `merchant-twin-service` | 4807 | Merchant behavior model |

### 1.3 Customer Graph (P0 - 1 service)

| Service | Port | Description |
|---------|------|-------------|
| `customer-graph-360` | 4808 | Unified customer 360 view |

---

## Phase 2: Commerce & Hyperlocal (Weeks 5-8)

### 2.1 Commerce Ads (P0 - 3 services)

| Service | Port | Description |
|---------|------|-------------|
| `in-ad-booking-service` | 4810 | Booking flow inside ads |
| `ecosystem-transaction-hub` | 4811 | Unified ad transactions |
| `cross-channel-orchestrator` | 4812 | Unified WhatsApp/SMS/Email/Push DSP |

### 2.2 Hyperlocal Intelligence (P0 - 2 services)

| Service | Port | Description |
|---------|------|-------------|
| `apartment-targeting-service` | 4815 | Apartment/community targeting |
| `place-graph-index` | 4816 | POI database (malls, airports, hospitals) |

### 2.3 DSP Enhancement (P0 - 2 services)

| Service | Port | Description |
|---------|------|-------------|
| `conversion-optimization-ai` | 4820 | AI conversion optimization |
| `goal-driven-campaign-agent` | 4821 | Autonomous goal-driven campaigns |

---

## Phase 3: CTV/OTT & Retail Media (Weeks 9-12)

### 3.1 CTV Stack (P0 - 4 services)

| Service | Port | Description |
|---------|------|-------------|
| `ctv-ad-server` | 4702 | SpringServe equivalent |
| `ssai-service` | 4701 | Server-side ad insertion |
| `programmatic-tv` | 4700 | ClearLine equivalent (OpenRTB 2.6) |
| `ott-streaming-sdk` | 4703 | Smart TV SDK |

### 3.2 Retail Media (P0 - 2 services)

| Service | Port | Description |
|---------|------|-------------|
| `retail-media-network-hub` | 4830 | Central retail media hub |
| `sponsored-products-service` | 4831 | Sponsored product ads |

### 3.3 Creative AI (P0 - 2 services)

| Service | Port | Description |
|---------|------|-------------|
| `ai-banner-generator` | 4840 | AI banner generation |
| `dynamic-product-ad-engine` | 4841 | Dynamic product ads from feed |

---

## Phase 4: Ecosystem & Scale (Weeks 13-20)

### 4.1 SSP Expansion (P0 - 2 services)

| Service | Port | Description |
|---------|------|-------------|
| `website-ssp-sdk` | 4850 | Web publisher monetization |
| `mobile-ssp-sdk` | 4851 | Mobile app monetization |

### 4.2 Additional Services (P1 - 10 services)

| Service | Port | Description |
|---------|------|-------------|
| `nl-campaign-builder-v2` | 4822 | Natural language to campaign |
| `campaign-copilot` | 4823 | Conversational campaign AI |
| `business-twin-service` | 4809 | Business Twin |
| `pmp-invite-service` | 4601 | Private marketplace invites |
| `ai-video-ad-generator` | 4842 | Text-to-video ads |
| `localized-ad-translator` | 4843 | Regional language ads |
| `ai-marketing-manager` | 4860 | AI marketing manager for SMBs |
| `whatsapp-campaign-automation` | 4861 | AI WhatsApp campaigns |
| `ctv-device-targeting` | 4705 | CTV device targeting |
| `ott-measurement` | 4706 | CTV measurement |

---

## Service Specifications

### intent-signal-aggregator (Port 4800)

**Purpose:** Central hub for collecting, normalizing, and enriching intent signals

**API Endpoints:**
```
POST /api/signals/ingest       - Ingest single signal
POST /api/signals/batch        - Batch ingest
GET  /api/signals/stats        - Aggregation statistics
GET  /api/signals/user/:userId - User signal history
```

**Signal Sources:**
- BuzzLocal (search, view, wishlist)
- Airzy (travel search, booking)
- REZ Menu QR (dining discovery)
- REZ Now (restaurant discovery)
- RisaCare (healthcare intent)
- CorpPerks (B2B benefits)

**Signal Schema:**
```typescript
interface IntentSignal {
  signalId: string;
  source: string;
  userId: string;
  eventType: 'search' | 'view' | 'wishlist' | 'cart_add' | 'checkout_start' | 'fulfilled';
  category: 'DINING' | 'TRAVEL' | 'RETAIL' | 'HEALTHCARE' | 'GENERAL';
  intentKey: string;
  intentQuery?: string;
  metadata: Record<string, unknown>;
  confidence: number;
  timestamp: Date;
}
```

---

### intent-prediction-engine (Port 4801)

**Purpose:** ML-powered intent analysis and audience segmentation

**API Endpoints:**
```
POST /api/predict/intent-score       - Get intent confidence
POST /api/predict/audience           - Generate intent audience
GET  /api/predict/revival-candidates - Dormant intent revival
POST /api/predict/lookalike          - Generate lookalike audience
```

**ML Models:**
- `intent-scorer` - Score intent confidence (0-1)
- `dormancy-detector` - Identify inactive intents
- `conversion-predictor` - Predict conversion likelihood
- `revival-scorer` - Score re-engagement success
- `timing-predictor` - Optimal contact timing

---

### intent-marketplace (Port 4802)

**Purpose:** Enable advertisers to buy intent audiences

**API Endpoints:**
```
GET  /api/marketplace/segments                - List audiences
POST /api/marketplace/segments/:id/purchase   - Purchase segment
POST /api/marketplace/bid                     - RTB bid
GET  /api/marketplace/campaigns/:id/performance - Campaign metrics
```

**Segment Types:**
- `active_buyers` - High purchase intent
- `dormant_interest` - Past interest, high revival
- `researchers` - Deep content engagement
- `near_purchase` - Checkout-started

---

### intent-attribution (Port 4803)

**Purpose:** Track conversion attribution from intent to purchase

**API Endpoints:**
```
POST /api/attribution/convert    - Report conversion
GET  /api/attribution/report     - Attribution report
GET  /api/attribution/journey/:userId - User journey
```

**Attribution Models:**
- `first_touch` - 100% to first signal
- `last_touch` - 100% to last signal
- `linear` - Equal credit
- `time_decay` - More credit to recent
- `position_based` - 40% first, 40% last, 20% middle

---

### audience-twin-service (Port 4805)

**Purpose:** Behavioral simulation of user audiences

**API Endpoints:**
```
POST /api/audience/create     - Create audience twin
GET  /api/audience/:id        - Get audience twin
POST /api/audience/:id/predict - Predict behavior
GET  /api/audience/:id/segments - Get segments
```

**Twin Attributes:**
- Interests (top 10 categories)
- Intent likelihood (purchase probability)
- Channel preference (WhatsApp, email, push)
- Timing preference (best contact time)
- Lifetime value estimate
- Brand affinity scores

---

### ctv-ad-server (Port 4702)

**Purpose:** CTV/OTT video ad decisioning (SpringServe equivalent)

**API Endpoints:**
```
GET  /api/vast/:placementId       - Get VAST XML
POST /api/decision                - Real-time decision
POST /api/track/:eventType       - Track events
GET  /api/campaigns              - List campaigns
POST /api/campaigns              - Create campaign
GET  /api/pacing/:campaignId     - Pacing status
```

**VAST 4.x Features:**
- Pod serving (multiple ads in break)
- Skip ad support
- Companion ads
- Nielsen/Comscore measurement
- Frequency capping per device

---

### ssai-service (Port 4701)

**Purpose:** Server-side ad insertion for live/VOD

**API Endpoints:**
```
GET  /api/stream/:streamId/manifest - Modified manifest
POST /api/splice/:streamId         - Insert ad splice
POST /api/cue                      - Process SCTE-35 cue
GET  /api/break/:streamId          - Ad break info
```

**Supported Formats:**
- HLS with X-DISCONTINUITY tags
- DASH Period insertion
- SCTE-35 cue points
- Live stream with ad slates

---

### programmatic-tv (Port 4700)

**Purpose:** OpenRTB 2.6 for CTV programmatic buying

**API Endpoints:**
```
POST /api/bid             - OpenRTB bid request
GET  /api/deals           - Available deals
POST /api/deals           - Create private deal
GET  /api/floors          - Floor prices
```

**CTV OpenRTB Extensions:**
- `imp.video.ctv` object
- Device categories (Smart TV, Set-top, Gaming)
- SSAI availability flags
- Living room targeting

---

### website-ssp-sdk (Port 4850)

**Purpose:** JavaScript SDK for web publishers

**SDK Features:**
```javascript
// Install
<script src="https://cdn.adbazaar.com/ssp-sdk.js"></script>

// Initialize
const ad = new AdBazaarSSP({
  publisherId: 'pub_123',
  slotId: 'home-banner'
});

// Request ad
ad.request().then(ad => {
  if (ad) {
    ad.show();
  }
});
```

---

## Port Registry

| Port | Service | Phase |
|------|---------|-------|
| 4800 | intent-signal-aggregator | 1 |
| 4801 | intent-prediction-engine | 1 |
| 4802 | intent-marketplace | 1 |
| 4803 | intent-attribution | 1 |
| 4805 | audience-twin-service | 1 |
| 4806 | user-twin-service | 1 |
| 4807 | merchant-twin-service | 1 |
| 4808 | customer-graph-360 | 1 |
| 4809 | business-twin-service | 4 |
| 4810 | in-ad-booking-service | 2 |
| 4811 | ecosystem-transaction-hub | 2 |
| 4812 | cross-channel-orchestrator | 2 |
| 4815 | apartment-targeting-service | 2 |
| 4816 | place-graph-index | 2 |
| 4820 | conversion-optimization-ai | 2 |
| 4821 | goal-driven-campaign-agent | 2 |
| 4822 | nl-campaign-builder-v2 | 4 |
| 4823 | campaign-copilot | 4 |
| 4830 | retail-media-network-hub | 3 |
| 4831 | sponsored-products-service | 3 |
| 4840 | ai-banner-generator | 3 |
| 4841 | dynamic-product-ad-engine | 3 |
| 4842 | ai-video-ad-generator | 4 |
| 4843 | localized-ad-translator | 4 |
| 4850 | website-ssp-sdk | 4 |
| 4851 | mobile-ssp-sdk | 4 |
| 4860 | ai-marketing-manager | 4 |
| 4861 | whatsapp-campaign-automation | 4 |
| 4700 | programmatic-tv | 3 |
| 4701 | ssai-service | 3 |
| 4702 | ctv-ad-server | 3 |
| 4703 | ott-streaming-sdk | 3 |
| 4705 | ctv-device-targeting | 4 |
| 4706 | ott-measurement | 4 |
| 4601 | pmp-invite-service | 4 |

---

## Implementation Priority Matrix

### Week 1-2: Intent Exchange Foundation
1. intent-signal-aggregator (4800)
2. intent-prediction-engine (4801)
3. intent-marketplace (4802)
4. intent-attribution (4803)

### Week 3-4: Twin Layer
5. audience-twin-service (4805)
6. user-twin-service (4806)
7. merchant-twin-service (4807)
8. customer-graph-360 (4808)

### Week 5-6: Commerce Ads
9. in-ad-booking-service (4810)
10. ecosystem-transaction-hub (4811)
11. cross-channel-orchestrator (4812)

### Week 7-8: Hyperlocal + DSP
12. apartment-targeting-service (4815)
13. place-graph-index (4816)
14. conversion-optimization-ai (4820)
15. goal-driven-campaign-agent (4821)

### Week 9-10: CTV Foundation
16. ctv-ad-server (4702)
17. ssai-service (4701)
18. programmatic-tv (4700)
19. ott-streaming-sdk (4703)

### Week 11-12: Retail Media + Creative
20. retail-media-network-hub (4830)
21. sponsored-products-service (4831)
22. ai-banner-generator (4840)
23. dynamic-product-ad-engine (4841)

### Week 13-16: Ecosystem Scale
24. nl-campaign-builder-v2 (4822)
25. campaign-copilot (4823)
26. business-twin-service (4809)
27. pmp-invite-service (4601)
28. ai-video-ad-generator (4842)
29. localized-ad-translator (4843)
30. website-ssp-sdk (4850)
31. mobile-ssp-sdk (4851)

### Week 17-20: Merchant + CTV Measurement
32. ai-marketing-manager (4860)
33. whatsapp-campaign-automation (4861)
34. ctv-device-targeting (4705)
35. ott-measurement (4706)

---

## Estimated Resource Requirements

| Category | Count |
|----------|-------|
| Total Services | 35 |
| P0 Services | 23 |
| P1 Services | 8 |
| P2 Services | 4 |
| Estimated Dev Time | 20 weeks |
| Team Size | 8 developers |
| Services per Developer | ~4-5 |

---

## Key Dependencies

```
intent-signal-aggregator
├── RABTUL Auth (4002)
├── MongoDB
└── Redis

intent-prediction-engine
├── intent-signal-aggregator
├── REZ Intent Graph
└── ML Pipeline

intent-marketplace
├── intent-prediction-engine
├── RABTUL Wallet
└── REZ-ads-service

audience-twin-service
├── hojai-twin (4860)
└── REZ-identity-graph

ctv-ad-server
├── REZ-video-ads
├── REZ-pricing-engine
└── REZ-attribution-hub

ssai-service
├── ctv-ad-server
└── CDN integration
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Intent signals processed | 1M/day |
| Intent audience coverage | 10M users |
| Campaign ROAS improvement | 25% |
| CTV ad revenue | ₹10Cr/month |
| Retail media publishers | 1000+ |
| SMB merchants onboarded | 10,000+ |
