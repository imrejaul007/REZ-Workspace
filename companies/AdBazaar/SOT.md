# REZ Media (AdBazaar) - Source of Truth

**Version:** 16.0
**Date:** 2026-06-07
**Status:** AUTHORITATIVE

---

## Overview

AdBazaar is the world's first **AI-Powered Commerce, Intent, and Retail Media Intelligence Network** (vs Magnite):

- Intent Exchange (UNIQUE - no competitor has this)
- Audience Twins (AI behavioral simulation)
- Commerce Ads (click-to-book-to-pay)
- Hyperlocal Targeting (apartment-level)
- Retail Media Network
- Digital Out of Home (DOOH)
- CTV/OTT Advertising
- Creator/Influencer Marketing
- **Platform Moats** (Clean Room, OpenRTB Exchange, Measurement Cloud, Event Graph, Yield AI, Merchant Intel, Identity Cloud, Publisher OS, Agency OS)
- Multi-tenant Campaign Management
- Multi-touch Attribution
- AI Campaign Agents
- Ecosystem Integrations

**Tagline:** "AI-Powered Commerce, Intent & Retail Media Intelligence Network"

---

## ⚠️ CRITICAL: AdBazaar 2.0 Services (June 2026)

**123 NEW SERVICES BUILT** - Transforming from ad platform to Intelligence Network

| Category | Count | Ports |
|----------|-------|-------|
| Intent Exchange | 4 | 4800-4803 |
| Audience Twin Layer | 4 | 4805-4808 |
| Commerce Ads | 3 | 4810-4812 |
| Hyperlocal | 2 | 4815-4816 |
| DSP Enhancement | 2 | 4820-4821 |
| CTV/OTT | 4 | 4700-4703 |
| Retail Media | 2 | 4830-4831 |
| Creative AI | 2 | 4840-4841 |
| AI Marketing | 4 | 4822-4823, 4850-4851, 4860-4861 |
| PMP | 1 | 4601 |

---

## AdBazaar Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADBAZAAR UNIFIED PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    UNIFIED ADS MANAGER DASHBOARD                        │   │
│  │  • Campaign Management • Analytics • Inventory • Targeting              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              MULTI-TENANT ORCHESTRATION LAYER                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │ Tenant Registry│  │  Inventory     │  │  Unified      │     │   │
│  │  │    (4510)     │  │  Classifier   │  │  Campaign     │     │   │
│  │  │               │  │   (4515)      │  │   (4500)     │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 ECOSYSTEM INTEGRATION LAYER                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│   │
│  │  │ReZ Ride │ │ Airzy/  │ │BuzzLocal│ │CorpPerks│ │Commerce││   │
│  │  │ (4530)  │ │StayOwn  │ │ (4545)  │ │ (4555)  │ │(4540) ││   │
│  │  │          │ │ (4535)   │ │          │ │          │ │        ││   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     INTELLIGENCE LAYER                                │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │  Attribution   │  │  Hojai AI     │  │  Flywheel    │     │   │
│  │  │  Hub (4520)   │  │  Gateway     │  │  Analytics  │     │   │
│  │  │               │  │  (4560)      │  │  (4550)    │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  ADBAZAAR INTEGRATION HUB (4570)                      │   │
│  │  • Cross-Service Communication • Unified Metrics • Event Routing       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## NEW: Multi-Tenant System

### Tenant Types

| Type | Access | Examples |
|------|--------|-----------|
| **REZ_INTERNAL** | Full ecosystem + internal inventory | ReZ App, ReZ Ride, Airzy, StayOwn |
| **EXTERNAL** | Marketplace only | Restaurants, Retailers, Brands, Agencies |

### Tenant Headers

```
x-adbazaar-tenant-id: rez_rez-ride
x-adbazaar-tenant-type: rez_internal
x-adbazaar-company-id: rez-ride
```

### Inventory Classification

#### Internal Inventory (REZ Internal Only)
- `rez_app_home_feed` - ReZ App placements
- `rez_ride_inapp` - ReZ Ride in-app
- `airzy_traveler` - Airzy travelers
- `stayown_guest` - StayOwn guests
- `corpperks_employee` - CorpPerks employees

#### Marketplace Inventory (All Tenants)
- `dooh_public` - Public DOOH screens
- `qr_public` - QR campaigns
- `creator_public` - Creator inventory
- `whatsapp_public` - WhatsApp commerce

---

## Complete Service Registry (100+ Services)

### Phase 1-2: Core Infrastructure

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `tenant-middleware` | - | Multi-tenant package | No | No |
| `tenant-registry` | 4510 | Tenant management | No | No |
| `unified-campaign-service` | 4500 | Campaign orchestrator | No | No |
| `inventory-classifier` | 4515 | 23 inventory categories | No | No |
| `attribution-hub-enhanced` | 4520 | Multi-touch attribution | No | No |
| `REZ-gamification-service` | 3004 | Karma/Coins rewards | No | No |
| `REZ-marketing` | 4000 | Marketing campaigns | Yes | No |
| `REZ-ads-service` | 4007 | Ad serving | No | No |
| `REZ-dooh-service` | 4018 | DOOH backend | Yes | No |
| `adsqr` | 4068 | QR campaigns | No | No |
| `REZ-decision-service` | 4027 | Targeting/Decision | Yes | No |

### Phase 3: Ecosystem Integration

| Service | Port | Purpose | Integrates | Tests | Docs |
|---------|------|---------|------------|-------|------|
| `rez-ride-integration` | 4530 | Mobility targeting | ReZ Ride | No | No |
| `hospitality-integration` | 4535 | Airzy/StayOwn | Airzy, StayOwn | No | No |
| `buzzlocal-integration` | 4545 | Community targeting | BuzzLocal | No | No |
| `corpperks-integration` | 4555 | Employee targeting | CorpPerks | No | No |
| `commerce-graph-service` | 4540 | Purchase intelligence | Orders, Merchants | No | No |

### Phase 4: Intelligence

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `hojai-ai-gateway` | 4560 | Central AI gateway | No | No |
| `flywheel-analytics` | 4550 | Ecosystem tracking | No | No |
| `REZ-ad-ai` | - | AI ad generation | Yes | No |
| `REZ-intelligence-bridge` | - | Media-Intelligence bridge | Yes | No |
| `REZ-discovery-platform` | - | Semantic search/recommendations | Yes | No |

### Phase 5: Orchestration

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `adBazaar-integration-hub` | 4570 | Cross-service communication | No | No |
| `adBazaar-backend` | - | Screen marketplace backend | Yes | No |
| `adBazaar-dashboard` | - | Unified admin UI (Next.js) | No | No |
| `adBazaar-service` | - | Main orchestration | No | No |
| `adBazaar-creator` | - | Creator dashboard (Next.js) | No | No |
| `adBazaar-hojai-integration` | - | Hojai AI integration | No | No |
| `adBazaar-integration-service` | - | Service integration | No | No |

### Phase 6: Social Media Integrations

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-instagram-bridge` | - | Instagram OAuth, posting, analytics | Yes | No |
| `REZ-twitter-integration` | 4780 | Twitter/X posting & analytics | No | No |
| `REZ-tiktok-integration` | 4785 | TikTok video posting | No | No |
| `REZ-reddit-integration` | 4786 | Reddit posting & community | No | No |
| `REZ-linkedin-ads` | 4790 | LinkedIn B2B posting & ads | Yes | No |
| `REZ-meta-capi` | - | Meta Conversions API | No | No |

### Phase 7: Unified Platform

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-unified-calendar` | 4800 | Unified content calendar | No | No |
| `REZ-cross-analytics` | 4801 | Cross-platform analytics | No | No |
| `REZ-white-label-portal` | 4802 | Client white-label portal | No | No |
| `REZ-workflow-builder` | 4680 | Visual automation, triggers | No | No |
| `REZ-post-queue` | 4690 | Queue management, bulk scheduling | No | No |
| `REZ-media-library` | - | Centralized asset management | No | No |

### Phase 8: Automation & Tools

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-auto-responder` | 4750 | Keyword triggers, auto-replies | No | No |
| `REZ-approval-workflow` | 4700 | Content approval, workflows | No | No |
| `REZ-content-syndication` | 4760 | RSS feeds, auto-post | No | No |
| `REZ-zapier-connector` | 4796 | Zapier/Make integration | No | No |
| `REZ-time-tracker` | 4798 | Time tracking | No | No |
| `REZ-version-history` | 4799 | Content version control | No | No |

### Phase 9: Ad Tech & Intelligence

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-email-validator` | 4810 | Email verification | No | No |
| `REZ-fraud-detection` | 4811 | Ad fraud detection | No | No |
| `REZ-creative-ab-testing` | 4812 | Split testing | No | No |
| `REZ-brand-safety` | 4813 | Content moderation | No | No |
| `REZ-viewability-tracker` | 4814 | IAB viewability | No | No |
| `REZ-attribution-modeling` | 4815 | MTA models | No | No |
| `REZ-audience-sync` | 4816 | DMP integration | No | No |
| `REZ-creative-rotation` | 4817 | Smart rotation | No | No |
| `REZ-frequency-capping` | 4818 | Ad frequency | No | No |
| `REZ-budget-allocator` | 4819 | AI budget optimization | No | No |
| `REZ-churn-predictor` | 4900 | Churn prediction | No | No |
| `REZ-ltv-calculator` | 4901 | Lifetime value | No | No |
| `REZ-next-best-action` | 4902 | Next action | No | No |
| `REZ-sentiment-analyzer` | 4903 | Sentiment analysis | No | No |
| `REZ-competitor-monitor` | 4904 | Competitor tracking | No | No |

---

## ADBAZAAR 2.0: INTENT EXCHANGE (NEW - June 2026)

**THE UNIQUE DIFFERENTIATOR - NO COMPETITOR HAS THIS**

### Intent Exchange Core (Ports 4800-4803)

| Service | Port | Purpose | Integrates |
|---------|------|---------|------------|
| `intent-signal-aggregator` | 4800 | Collect signals from BuzzLocal, Airzy, REZ Menu QR, REZ Now, RisaCare, CorpPerks | All REZ apps |
| `intent-prediction-engine` | 4801 | ML intent scoring, dormancy detection, revival prediction | HOJAI ML |
| `intent-marketplace` | 4802 | Buy/sell intent audiences | RABTUL Wallet |
| `intent-attribution` | 4803 | Track intent → conversion attribution | REZ Attribution |

### Audience Twin Layer (Ports 4805-4808)

**AI BEHAVIORAL SIMULATION - NO COMPETITOR HAS THIS**

| Service | Port | Purpose | Integrates |
|---------|------|---------|------------|
| `audience-twin-service` | 4805 | Behavioral simulation of user audiences | HOJAI Twin (4860) |
| `user-twin-service` | 4806 | Individual user behavioral twin | HOJAI Twin |
| `merchant-twin-service` | 4807 | Merchant behavior model | REZ Merchant |
| `customer-graph-360` | 4808 | Unified 360° customer view | All REZ apps |

---

## ADBAZAAR 2.0: COMMERCE & HYPERLOCAL (NEW - June 2026)

**COMMERCE ADS = REZ'S MOAT OVER MAGNITE**

### Commerce Ads (Ports 4810-4812)

| Service | Port | Purpose | Integrates |
|---------|------|---------|------------|
| `in-ad-booking-service` | 4810 | Booking flow inside ads | RABTUL Wallet |
| `ecosystem-transaction-hub` | 4811 | Unified ad transactions | RABTUL |
| `cross-channel-orchestrator` | 4812 | Unified WhatsApp/SMS/Email/Push DSP | All channels |

### Hyperlocal Intelligence (Ports 4815-4816)

**TARGETING AT APARTMENT LEVEL - NO COMPETITOR HAS THIS**

| Service | Port | Purpose | Integrates |
|---------|------|---------|------------|
| `apartment-targeting-service` | 4815 | Apartment/community targeting | BuzzLocal |
| `place-graph-index` | 4816 | POI database (malls, airports, hospitals) | All REZ apps |

### DSP Enhancement (Ports 4820-4821)

| Service | Port | Purpose | Integrates |
|---------|------|---------|------------|
| `conversion-optimization-ai` | 4820 | AI conversion optimization | REZ Ads |
| `goal-driven-campaign-agent` | 4821 | "Get me 500 leads" → autonomous campaign | REZ Ads |

---

## ADBAZAAR 2.0: CTV/OTT STACK (NEW - June 2026)

**40% OF MAGNITE REVENUE - NOW ADBAZAAR HAS IT**

### CTV/OTT Stack (Ports 4700-4703)

| Service | Port | Purpose | Competitor |
|---------|------|---------|------------|
| `programmatic-tv` | 4700 | OpenRTB 2.6 for CTV | ClearLine |
| `ssai-service` | 4701 | Server-side ad insertion | - |
| `ctv-ad-server` | 4702 | CTV/OTT ad server | SpringServe |
| `ott-streaming-sdk` | 4703 | Smart TV SDK | - |

### Retail Media (Ports 4830-4831)

| Service | Port | Purpose |
|---------|------|---------|
| `retail-media-network-hub` | 4830 | Central retail media hub |
| `sponsored-products-service` | 4831 | Sponsored product ads |

### Creative AI (Ports 4840-4841)

| Service | Port | Purpose |
|---------|------|---------|
| `ai-banner-generator` | 4840 | AI banner generation |
| `dynamic-product-ad-engine` | 4841 | Dynamic product ads from feed |

---

## ADBAZAAR 2.0: AI MARKETING MANAGER (NEW - June 2026)

**"AI MARKETING MANAGER FOR LOCAL BUSINESSES"**

### AI Campaign Tools (Ports 4822-4823, 4601)

| Service | Port | Purpose |
|---------|------|---------|
| `nl-campaign-builder-v2` | 4822 | Natural language → campaign |
| `campaign-copilot` | 4823 | Conversational campaign AI |
| `pmp-invite-service` | 4601 | Private marketplace invites |

### Publisher SDKs (Ports 4850-4851)

| Service | Port | Purpose |
|---------|------|---------|
| `website-ssp-sdk` | 4850 | Web publisher SDK |
| `mobile-ssp-sdk` | 4851 | Mobile app SDK |

### AI Marketing Suite (Ports 4860-4861)

| Service | Port | Purpose |
|---------|------|---------|
| `ai-marketing-manager` | 4860 | AI marketing manager for SMBs |
| `whatsapp-campaign-automation` | 4861 | AI WhatsApp campaigns |

---

## ADBAZAAR 2.0: PLATFORM MOATS (NEW - June 2026)

**THE REAL MOATS - What Google, Amazon, Trade Desk, Magnite have spent years building**

### Tier 1: CRITICAL (Must Build) - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `data-clean-room-service` | 4950 | Privacy-preserving data matching | Amazon, Google | ✅ Built |
| `openrtb-exchange-service` | 4960 | OpenRTB 2.6 exchange | Magnite, PubMatic | ✅ Built |
| `measurement-cloud-service` | 4970 | Incrementality, lift studies | Nielsen, AppsFlyer | ✅ Built |
| `event-graph-service` | 4880 | Event intelligence network | Eventbrite | ✅ Built |
| `yield-optimization-brain` | 4890 | Central yield AI | Magnite | ✅ Built |

### Tier 2: STRATEGIC - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `merchant-insights-os` | 4870 | Merchant business intelligence | Shopify | ✅ Built |
| `retail-media-os-service` | 4990 | Full retail media OS | Amazon Ads | ✅ Built |
| `identity-cloud-service` | 4996 | Cross-device identity | Trade Desk UID2 | ✅ Built |
| `publisher-os-service` | 5000 | Publisher monetization | Google Ad Manager | ✅ Built |
| `agency-workspace-service` | 5010 | Agency operations | DV360 | ✅ Built |
| `retail-media-network-hub` | 4830 | Central retail media hub | Amazon Ads | ✅ Built |

### Tier 3: AUTONOMOUS GROWTH - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `autonomous-growth-orchestrator` | 4930 | AI business outcomes | AppLovin | ✅ Built |
| `business-outcome-engine` | 4931 | AI-driven outcome optimization | Google | ✅ Built |
| `incrementality-testing-engine` | 4971 | A/B testing, lift measurement | Nielsen | ✅ Built |
| `media-mix-modeling` | 4974 | MMM analysis | Meta MMA | ✅ Built |
| `seat-management-service` | 4962 | Multi-tenant access | - | ✅ Built |
| `shared-budget-pool` | 5013 | Agency budget management | - | ✅ Built |

### Tier 4: SPECIALIZED - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `client-management-service` | 5011 | Client portfolio management | Agency OS | ✅ Built |
| `sponsored-videos-service` | 4992 | Video ad serving | YouTube | ✅ Built |
| `shelf-ads-service` | 4994 | Retail shelf advertising | Amazon | ✅ Built |

### Tier 5: CLEAN ROOM & PRIVACY - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `privacy-preserving-compute` | 4951 | Federated learning, MPC | Google | ✅ Built |
| `identity-matching-engine` | 4952 | Deterministic + probabilistic matching | - | ✅ Built |

### Tier 6: OPENRTB EXCHANGE - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `auction-engine-service` | 4961 | 1st/2nd price auctions | - | ✅ Built |
| `deal-id-service` | 4963 | Programmatic deal management | - | ✅ Built |

### Tier 7: MEASUREMENT & ANALYTICS - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `lift-study-service` | 4972 | Brand lift, conversion lift | Nielsen | ✅ Built |
| `geo-experiment-service` | 4973 | Geographic holdout testing | Nielsen | ✅ Built |
| `offline-conversion-tracker` | 4975 | Offline conversion tracking | - | ✅ Built |

### Tier 8: YIELD OPTIMIZATION - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `yield-platform-service` | 4980 | Central yield optimization | Magnite | ✅ Built |
| `fill-rate-optimizer` | 4981 | Fill rate maximization | - | ✅ Built |
| `dynamic-floor-pricing` | 4982 | AI-driven floor pricing | - | ✅ Built |
| `pace-management-service` | 4983 | Campaign pacing control | - | ✅ Built |

### Tier 9: EVENT GRAPHS - ✅ ALL COMPLETE

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| `wedding-graph-service` | 4881 | Wedding event intelligence | ✅ Built |
| `festival-graph-service` | 4882 | Festival event intelligence | ✅ Built |
| `sports-graph-service` | 4883 | Sports event intelligence | ✅ Built |
| `conference-graph-service` | 4884 | Conference event intelligence | ✅ Built |
| `event-demand-forecaster` | 4885 | Event demand prediction | ✅ Built |

### Tier 10: RETAIL MEDIA - ✅ ALL COMPLETE

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| `sponsored-brands-service` | 4991 | Brand advertising | ✅ Built |
| `search-ads-service` | 4993 | Search engine advertising | ✅ Built |
| `retail-analytics-dashboard` | 4995 | Retail analytics | ✅ Built |

### Tier 11: IDENTITY & CONSENT - ✅ ALL COMPLETE

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| `device-graph-service` | 4997 | Cross-device identity | ✅ Built |
| `probabilistic-matching` | 4998 | Statistical identity resolution | ✅ Built |
| `consent-management` | 4999 | GDPR/CCPA compliance | ✅ Built |

### Tier 12: PUBLISHER & AGENCY - ✅ ALL COMPLETE

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| `publisher-dashboard-service` | 5001 | Publisher analytics | ✅ Built |
| `subscription-management` | 5002 | Publisher subscriptions | ✅ Built |
| `white-label-portal` | 5012 | Agency white labeling | ✅ Built |

### Tier 13: CREATIVE OS - ✅ ALL COMPLETE

| Service | Port | Purpose | Competitor | Status |
|---------|------|---------|------------|--------|
| `creative-os-service` | 5020 | Creative automation | Pencil, AdCreative | ✅ Built |

### Analytics & Insights

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-media-analytics` | 4069 | Media performance analytics | Yes | No |
| `REZ-realtime-dashboard` | 3001 | WebSocket live metrics | Yes | No |
| `REZ-attribution-dashboard` | - | Attribution visualization | No | No |
| `REZ-ads-analytics-dashboard` | - | Ads dashboard (Next.js) | No | No |
| `REZ-heatmaps` | - | Click/scroll tracking | No | No |
| `REZ-cohort-analysis` | - | Retention tracking | Yes | No |
| `REZ-graph-api` | - | Knowledge graph queries | No | No |
| `REZ-rfm-marketing-bridge` | - | RFM scoring | Yes | No |

### CRM & Engagement

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-crm-hub` | - | HubSpot/Zoho integration | No | No |
| `REZ-lead-intelligence` | - | Hot/Warm/Cold detection | Yes | No |
| `REZ-engagement-platform` | - | Loyalty, offers, referrals | No | No |
| `REZ-feedback-service` | - | Adaptive AI feedback | No | No |
| `REZ-journey-service` | - | Customer journey automation | No | No |
| `REZ-communications-platform` | - | Email, SMS, WhatsApp, Push | Yes | No |

### SDKs & Developer Tools

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-dooh-sdk` | - | DOOH SDK | Yes | No |
| `REZ-attribution-sdk` | - | Attribution tracking SDK | Yes | No |
| `REZ-partner-sdk` | - | Affiliate/referral SDK | Yes | No |
| `REZ-oem-sdk` | - | OEM/Telco SDK | Yes | No |
| `REZ-checkout-sdk` | - | One-click checkout SDK | Yes | No |
| `REZ-sdk-host` | - | SDK orchestration | No | No |
| `REZ-live-chat-widget` | - | Chat widget SDK | Yes | No |

### Rewards & Incentives

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-anniversary-rewards` | - | Milestone rewards | Yes | No |
| `REZ-birthday-rewards` | - | Birthday rewards | No | No |
| `REZ-abandonment-tracker` | - | Cart recovery | No | No |
| `REZ-referral-graph` | - | Referral network graph | No | No |
| `REZ-referral-marketplace` | - | Creator discovery | No | No |

### Commerce & Monetization

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-dsp-portal` | - | Self-serve DSP | Yes | No |
| `REZ-programmatic-bidding` | - | Real-time auctions | No | No |
| `REZ-rtb-service` | - | RTB service | Yes | No |
| `REZ-pricing-engine` | - | Pricing logic | Yes | No |
| `REZ-economic-engine` | - | Business rules | Yes | No |
| `REZ-video-ads` | - | VAST/VPAID support | No | No |
| `REZ-rto-engine` | - | Real-time optimization | No | No |
| `REZ-header-bidding` | - | Header bidding adapter | No | No |
| `REZ-ssp-adapter` | - | SSP integration | No | No |
| `REZ-google-enhanced` | - | Google integration | No | No |
| `REZ-payment-gateway` | - | Payment processing | No | No |
| `REZ-merchant-onboarding` | - | Merchant signup/KYC | Yes | No |
| `REZ-partner-portal` | - | Partner management | Yes | No |
| `REZ-support-tools-hub` | - | Zendesk/Freshdesk/Intercom | Yes | No |
| `REZ-consumer-kb` | - | Consumer memory/preferences | Yes | No |

### A/B Testing & Experimentation

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-ab-testing` | - | A/B test framework | Yes | No |
| `REZ-feature-flags` | - | Feature rollouts | Yes | No |
| `REZ-cross-device` | - | Device stitching | No | No |

### Integrations

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-ai-campaign-builder` | 4009 | AI campaign creation | No | No |
| `REZ-ads-api` | - | Campaign Management API | No | No |
| `REZ-media-integration` | - | Media integrations | No | No |
| `REZ-intelligence-bridge` | - | Media-Intelligence bridge | Yes | No |
| `REZ-unsplash-integration` | - | Stock photos | No | No |

### Other Services

| Service | Port | Purpose | Tests | Docs |
|---------|------|---------|-------|------|
| `REZ-alerting` | - | Unified alerting | No | No |
| `REZ-marketing-service` | - | Marketing automation | No | No |
| `REZ-discovery-platform` | - | Semantic discovery | Yes | No |
| `REZ-prompt-workflow-ai` | - | Prompt workflows | No | No |
| `REZ-buzzlocal-karma-bridge` | - | BuzzLocal karma | No | No |
| `REZ-automation-service` | - | General automation | No | No |
| `REZ-business-ai` | - | Business AI | No | No |
| `REZ-owner-service` | - | Owner management | No | No |
| `REZ-chatbot-builder-ui` | - | Chatbot builder | No | No |
| `REZ-crm-ui` | - | CRM UI | No | No |
| `REZ-deal-manager` | - | Deal management | No | No |
| `REZ-support-service` | - | Support system | No | No |
| `REZ-viral-loop` | - | Viral campaigns | No | No |
| `REZ-audience-marketplace` | - | Audience marketplace | No | No |
| `REZ-ad-exchange` | - | Ad exchange | No | No |
| `REZ-dsp-bidder` | - | DSP bidder | No | No |
| `REZ-live-shopping` | - | Live commerce | No | No |
| `REZ-marketing-dashboard` | - | Marketing dashboard | No | No |
| `REZ-media-intelligence` | - | Media intelligence | No | No |
| `REZ-merchant-whatsapp-manager` | - | WhatsApp merchant | No | No |
| `REZ-shelf-qr` | - | Shelf QR | No | No |
| `REZ-shopify-connector` | - | Shopify integration | No | No |
| `REZ-woocommerce-connector` | - | WooCommerce integration | No | No |
| `REZ-instagram-sales-agent` | - | Instagram sales | No | No |
| `REZ-whatsapp-commerce` | - | WhatsApp commerce | No | No |
| `REZ-whatsapp-provisioning` | - | WhatsApp setup | No | No |
| `REZ-whatsapp-store` | - | WhatsApp store | No | No |
| `REZ-whatsapp-store-ui` | - | WhatsApp store UI | No | No |
| `REZ-voice-billing` | - | Voice billing | No | No |
| `REZ-voice-cart-recovery` | - | Voice cart recovery | No | No |
| `REZ-ad-campaigns` | - | Ad campaigns | No | No |
| `REZ-ads` | - | Core ads | No | No |
| `REZ-admin-dashboard` | - | Admin dashboard | No | No |
| `REZ-media-integration-service` | - | Media integration | No | No |
| `rez-marketing-dashboard` | - | Marketing dashboard | No | No |
| `rez-media-integration-service` | - | Media service | No | No |
| `REZ-SDK/rez-mobile-sdk` | - | Mobile SDK | No | No |

---

## Service Dependencies

### Upstream Dependencies (Services that depend on others)

```
adBazaar-dashboard → adBazaar-backend, REZ-media-analytics, REZ-realtime-dashboard, REZ-instagram-bridge, REZ-gamification-service, REZ-ai-campaign-builder
adBazaar-backend → REZ-dooh-service, adsqr, REZ-ads-service, tenant-registry
adBazaar-service → tenant-registry, inventory-classifier, attribution-hub
adBazaar-creator → adBazaar-backend
```

### Downstream Dependencies (Services that are used by others)

```
REZ-marketing → REZ-gamification-service, adsqr
REZ-decision-service → REZ-dooh-service, REZ-ads-service
REZ-ads-analytics-dashboard → REZ-media-analytics
REZ-ai-campaign-builder → REZ-marketing
```

### External Integrations

| Service | External Dependency | Purpose |
|---------|---------------------|---------|
| `REZ-meta-capi` | Meta Conversions API | Conversion tracking |
| `REZ-linkedin-ads` | LinkedIn Marketing API | B2B advertising |
| `REZ-twitter-integration` | Twitter/X API v2 | Social posting |
| `REZ-tiktok-integration` | TikTok API | Video posting |
| `REZ-reddit-integration` | Reddit API | Community engagement |
| `REZ-unsplash-integration` | Unsplash API | Stock photos |
| `REZ-zapier-connector` | Zapier/Make API | Automation |
| `REZ-communications-platform` | SendGrid, Twilio, Firebase | Multi-channel comms |
| `REZ-crm-hub` | HubSpot, Zoho CRM | CRM integration |
| `REZ-support-tools-hub` | Zendesk, Freshdesk, Intercom | Support integration |
| `REZ-shopify-connector` | Shopify API | E-commerce |
| `REZ-woocommerce-connector` | WooCommerce API | E-commerce |

---

## Complete Port Registry

| Port | Service | Purpose |
|------|---------|---------|
| 3001 | REZ-realtime-dashboard | WebSocket live metrics |
| 3004 | REZ-gamification-service | Karma/Coins rewards |
| 4000 | REZ-marketing | Marketing campaigns |
| 4007 | REZ-ads-service | Ad serving |
| 4009 | REZ-ai-campaign-builder | AI campaign creation |
| 4018 | REZ-dooh-service | DOOH backend |
| 4027 | REZ-decision-service | Targeting/Decision |
| 4068 | adsqr | QR campaigns |
| 4069 | REZ-media-analytics | Media analytics |
| 4500 | unified-campaign-service | Campaign management |
| 4510 | tenant-registry | Multi-tenant |
| 4515 | inventory-classifier | Placement classification |
| 4520 | attribution-hub | Multi-touch attribution |
| 4530 | rez-ride-integration | ReZ Ride |
| 4535 | hospitality-integration | Airzy/StayOwn |
| 4540 | commerce-graph-service | Purchase intelligence |
| 4545 | buzzlocal-integration | BuzzLocal |
| 4550 | flywheel-analytics | Flywheel analytics |
| 4555 | corpperks-integration | CorpPerks |
| 4560 | hojai-ai-gateway | Hojai AI |
| 4570 | adBazaar-integration-hub | Integration hub |
| 4680 | REZ-workflow-builder | Visual automation |
| 4690 | REZ-post-queue | Post queue |
| 4700 | REZ-approval-workflow | Content approval |
| 4750 | REZ-auto-responder | Auto-replies |
| 4760 | REZ-content-syndication | RSS syndication |
| 4780 | REZ-twitter-integration | Twitter/X |
| 4785 | REZ-tiktok-integration | TikTok |
| 4786 | REZ-reddit-integration | Reddit |
| 4790 | REZ-linkedin-ads | LinkedIn |
| 4796 | REZ-zapier-connector | Zapier |
| 4798 | REZ-time-tracker | Time tracking |
| 4799 | REZ-version-history | Version control |
| 4800 | REZ-unified-calendar | Content calendar |
| 4801 | REZ-cross-analytics | Cross-platform analytics |
| 4802 | REZ-white-label-portal | White-label |
| 4810 | REZ-email-validator | Email verification |
| 4811 | REZ-fraud-detection | Fraud detection |
| 4812 | REZ-creative-ab-testing | A/B testing |
| 4813 | REZ-brand-safety | Brand safety |
| 4814 | REZ-viewability-tracker | Viewability |
| 4815 | REZ-attribution-modeling | MTA models |
| 4816 | REZ-audience-sync | DMP sync |
| 4817 | REZ-creative-rotation | Creative rotation |
| 4818 | REZ-frequency-capping | Frequency cap |
| 4819 | REZ-budget-allocator | Budget AI |
| 4900-4904 | REZ-churn-predictor, REZ-ltv-calculator, REZ-next-best-action, REZ-sentiment-analyzer, REZ-competitor-monitor | ML predictions |
| 4950 | data-clean-room-service | Privacy-preserving data matching |
| 4951 | privacy-preserving-compute | Federated learning, MPC |
| 4952 | identity-matching-engine | Identity matching |
| 4960 | openrtb-exchange-service | OpenRTB 2.6 exchange |
| 4961 | auction-engine-service | 1st/2nd price auctions |
| 4962 | seat-management-service | Seat management |
| 4963 | deal-id-service | Programmatic deals |
| 4970 | measurement-cloud-service | Measurement & attribution |
| 4971 | incrementality-testing-engine | A/B testing, lift |
| 4972 | lift-study-service | Brand/conversion lift |
| 4973 | geo-experiment-service | Geographic experiments |
| 4974 | media-mix-modeling | MMM analysis |
| 4975 | offline-conversion-tracker | Offline conversions |
| 4980 | yield-platform-service | Yield optimization |
| 4981 | fill-rate-optimizer | Fill rate optimization |
| 4982 | dynamic-floor-pricing | AI floor pricing |
| 4983 | pace-management-service | Campaign pacing |
| 4990 | retail-media-os-service | Retail media OS |
| 4991 | sponsored-brands-service | Brand advertising |
| 4992 | sponsored-videos-service | Video ads |
| 4993 | search-ads-service | Search advertising |
| 4994 | shelf-ads-service | Retail shelf ads |
| 4995 | retail-analytics-dashboard | Retail analytics |
| 4996 | identity-cloud-service | Cross-device identity |
| 4997 | device-graph-service | Device graph |
| 4998 | probabilistic-matching | Probabilistic matching |
| 4999 | consent-management | GDPR/CCPA |
| 5000 | publisher-os-service | Publisher OS |
| 5001 | publisher-dashboard-service | Publisher dashboard |
| 5002 | subscription-management | Publisher subscriptions |
| 5010 | agency-workspace-service | Agency workspace |
| 5011 | client-management-service | Client management |
| 5012 | white-label-portal | White label |
| 5013 | shared-budget-pool | Budget pools |
| 5020 | creative-os-service | Creative automation |
| 5030 | email-campaign-service | Email campaigns |
| 5031 | sms-campaign-service | SMS campaigns |
| 5032 | push-notification-service | Push notifications |
| 5033 | crm-service | CRM |
| 5034 | lead-scoring-service | Lead scoring |
| 5035 | journey-orchestrator | Journey automation |
| 5040 | webhook-service | Webhook management |
| 5041 | in-app-messaging | In-app messaging |
| 5042 | email-automation | Email automation |
| 5043 | sms-automation | SMS automation |
| 5044 | notification-preference-center | Notification preferences |
| 5045 | broadcast-service | Mass broadcasting |
| 5050 | social-post-scheduler | Social scheduling |
| 5051 | social-analytics-service | Social analytics |
| 5052 | social-listener | Social listening |
| 5053 | automation-workflow-engine | Workflow automation |
| 5054 | trigger-condition-engine | Triggers |
| 5055 | sequence-automation | Sequence automation |
| 5060-5112 | 53 NEW SERVICES | Full business operations |

---

## Test Coverage Summary

| Category | Total Services | With Tests | Coverage |
|----------|---------------|------------|----------|
| Core Infrastructure | 11 | 5 | 45% |
| Ecosystem Integration | 5 | 0 | 0% |
| Intelligence | 5 | 2 | 40% |
| Orchestration | 7 | 1 | 14% |
| Social Media | 6 | 2 | 33% |
| Unified Platform | 6 | 0 | 0% |
| Automation & Tools | 6 | 0 | 0% |
| Ad Tech & Intelligence | 15 | 0 | 0% |
| Analytics & Insights | 8 | 3 | 38% |
| CRM & Engagement | 6 | 2 | 33% |
| SDKs & Developer Tools | 7 | 5 | 71% |
| Rewards & Incentives | 5 | 1 | 20% |
| Commerce & Monetization | 15 | 4 | 27% |
| A/B Testing | 3 | 2 | 67% |
| Integrations | 5 | 1 | 20% |
| **TOTAL** | **110** | **28** | **25%** |

### Services WITH Tests (28)

```
REZ-marketing, REZ-dooh-service, REZ-decision-service, REZ-gamification-service,
REZ-media-analytics, REZ-realtime-dashboard, REZ-attribution-sdk, REZ-dooh-sdk,
REZ-partner-sdk, REZ-oem-sdk, REZ-checkout-sdk, REZ-live-chat-widget,
REZ-cohort-analysis, REZ-rfm-marketing-bridge, REZ-lead-intelligence,
REZ-merchant-onboarding, REZ-partner-portal, REZ-support-tools-hub,
REZ-consumer-kb, REZ-anniversary-rewards, REZ-economic-engine, REZ-ab-testing,
REZ-feature-flags, REZ-communications-platform, REZ-linkedin-ads, REZ-intelligence-bridge,
REZ-discovery-platform, REZ-ad-ai
```

### Services WITHOUT Tests (82)

```
tenant-registry, unified-campaign-service, inventory-classifier, attribution-hub-enhanced,
adsqr, REZ-ads-service, adBazaar-backend, hojai-ai-gateway, flywheel-analytics,
REZ-instagram-bridge, REZ-twitter-integration, REZ-tiktok-integration,
REZ-reddit-integration, REZ-meta-capi, REZ-unified-calendar, REZ-cross-analytics,
REZ-white-label-portal, REZ-workflow-builder, REZ-post-queue, REZ-media-library,
REZ-auto-responder, REZ-approval-workflow, REZ-content-syndication, REZ-zapier-connector,
REZ-time-tracker, REZ-version-history, REZ-email-validator, REZ-fraud-detection,
REZ-creative-ab-testing, REZ-brand-safety, REZ-viewability-tracker, REZ-attribution-modeling,
REZ-audience-sync, REZ-creative-rotation, REZ-frequency-capping, REZ-budget-allocator,
REZ-heatmaps, REZ-graph-api, REZ-crm-hub, REZ-engagement-platform, REZ-feedback-service,
REZ-journey-service, REZ-alerting, REZ-dsp-portal, REZ-programmatic-bidding, REZ-rtb-service,
REZ-pricing-engine, REZ-video-ads, REZ-abandonment-tracker, REZ-referral-graph,
REZ-referral-marketplace, REZ-cross-device, REZ-ads-api, REZ-media-integration,
REZ-unsplash-integration, REZ-birthday-rewards, REZ-shopify-connector, REZ-woocommerce-connector,
REZ-whatsapp-commerce, REZ-whatsapp-provisioning, REZ-whatsapp-store, REZ-whatsapp-store-ui,
REZ-voice-billing, REZ-voice-cart-recovery, REZ-merchant-whatsapp-manager, REZ-shelf-qr,
REZ-live-shopping, REZ-ad-campaigns, REZ-ads, REZ-admin-dashboard, REZ-owner-service,
REZ-business-ai, REZ-automation-service, REZ-viral-loop, REZ-audience-marketplace,
REZ-ad-exchange, REZ-dsp-bidder, REZ-header-bidding, REZ-ssp-adapter, REZ-google-enhanced,
REZ-payment-gateway, REZ-marketing-service, REZ-prompt-workflow-ai, REZ-buzzlocal-karma-bridge,
REZ-chatbot-builder-ui, REZ-crm-ui, REZ-deal-manager, REZ-support-service, REZ-media-intelligence,
REZ-marketing-dashboard, REZ-media-integration-service, REZ-instagram-sales-agent
```

---

## Documentation Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| WITH README | 0 | 0% |
| WITHOUT README | 110 | 100% |

**Action Required:** All 110 services need README documentation.

---

## Rate Limits

| Tenant Type | Requests/min | Campaigns/month |
|------------|-------------|----------------|
| REZ Internal | Unlimited | Unlimited |
| External Tier-0 | 1,000 | 200 |
| External Tier-1 | 500 | 50 |
| External Tier-2 | 100 | 10 |

---

## API Quick Reference

### Create Campaign
```bash
curl -X POST http://localhost:4500/api/campaigns \
  -H "x-adbazaar-tenant-id: rez_rez-ride" \
  -H "x-adbazaar-tenant-type: rez_internal" \
  -d '{
    "name": "Summer Campaign",
    "objective": "conversion",
    "inventory": {
      "categories": ["rez_app_home_feed", "dooh_public"],
      "platforms": ["app", "dooh"]
    },
    "budget": { "totalBudget": 100000, "model": "daily" }
  }'
```

### Record Attribution
```bash
curl -X POST http://localhost:4520/api/touchpoint \
  -d '{
    "sessionId": "sess_123",
    "source": "dooh",
    "campaignId": "camp_xyz"
  }'
```

### Get Flywheel Health
```bash
curl http://localhost:4550/api/health
```

### Get Audience
```bash
curl http://localhost:4530/api/audience/airport
curl http://localhost:4545/api/audience/hyperlocal?city=Mumbai
```

---

## Environment Variables

```bash
# Services
TENANT_SERVICE_URL=http://localhost:4510
CAMPAIGN_SERVICE_URL=http://localhost:4500
INVENTORY_SERVICE_URL=http://localhost:4515
ATTRIBUTION_SERVICE_URL=http://localhost:4520
RIDE_SERVICE_URL=http://localhost:4530
HOSPITALITY_SERVICE_URL=http://localhost:4535
BUZZLOCAL_SERVICE_URL=http://localhost:4545
CORPPERKS_SERVICE_URL=http://localhost:4555
COMMERCE_SERVICE_URL=http://localhost:4540
HOJAI_URL=http://localhost:4560
FLYWHEEL_SERVICE_URL=http://localhost:4550
INTEGRATION_HUB_URL=http://localhost:4570

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4011
```

---

## Documents

| Document | Purpose |
|----------|---------|
| `SOT.md` | This file - Source of Truth |
| `FEATURES.md` | Complete feature list |
| `ADBAZAAR-COMPLETE-AUDIT.md` | Full audit of all services |
| `ADBAZAAR-IMPLEMENTATION-GUIDE.md` | Phase 1-2 guide |
| `ADBAZAAR-PHASE3-5-IMPLEMENTATION.md` | Phase 3-5 guide |
| `ADBAZAAR-GAPS-FIXED.md` | All gaps addressed |

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Services with tenant awareness | 100% | 100% |
| Cross-platform campaigns | Yes | Yes |
| Multi-touch attribution | Yes | Yes |
| Ecosystem integrations | 5 companies | 5 companies |
| Flywheel tracking | Yes | Yes |
| Unified dashboard | Yes | Yes |
| Test coverage | 80% | 25% |
| Documentation coverage | 100% | 0% |

---

## Flywheel Loop

```
   AdsQR (Merchant Entry)
         ↓
      AdBazaar (Upsell to Campaigns)
         ↓
   REZ Ecosystem (User Acquisition)
         ↓
   User Behavior (Data Collection)
         ↓
   Hojai AI (Intelligence)
         ↓
   Better Targeting
         ↓
   Better Results
         ↓
   More Merchant Spend
         ↓
   More Inventory + More Data
         ↓
      Back to Top
```

---

## REZ Intelligence Integration

### Connected Services (via Hojai AI Gateway)

| Service | Port | Purpose | Status |
|--------|------|---------|--------|
| REZ Intent Graph | 4018 | User intent | Connected |
| REZ Predictive Engine | 4141 | Churn/LTV | Connected |
| REZ Identity Graph | 4050 | Identity resolution | Connected |
| REZ Signal Aggregator | 4142 | Behavioral signals | Connected |
| REZ Segmentation | 4126 | User segments | Connected |
| REZ Commerce Graph | 4129 | Purchase history | Connected |

### Circuit Breaker Pattern

```
5 failures = circuit opens
60 second reset timeout
Fallback to mock data
Automatic reconnection
```

### Health Check

```bash
# Check circuit breakers
curl http://localhost:4560/api/circuit-breakers
```

---

## Strategic Gaps - All Filled

| Gap | Priority | Status |
|-----|----------|--------|
| Event Bus | CRITICAL | Built |
| Unified Identity | CRITICAL | Built |
| Privacy & Governance | CRITICAL | Built |
| Merchant Intelligence | HIGH | Built |
| Autonomous AI | HIGH | Built |
| SDK Ecosystem | HIGH | Built |
| Yield Optimization | HIGH | Built |
| Cross-App Orchestration | HIGH | Built |

---

## Positioning

| Feature | Taboola | AdBazaar |
|---------|---------|----------|
| Commerce Integration | No | Yes |
| Offline Attribution | No | Yes |
| Hyperlocal | No | Yes |
| Incentive Ads | No | Yes |
| Creator Commerce | No | Yes |
| WhatsApp Ads | No | Yes |
| Event Commerce | No | Yes |
| Society Media | No | Yes |
| Event Bus | No | Yes |
| Unified Identity | No | Yes |
| Autonomous AI | No | Yes |
| SDK Ecosystem | No | Yes |

---

**Last Updated:** 2026-06-04
**Version:** 10.1
**Total Services:** 110
**Services with Tests:** 28 (25%)
**Services with Documentation:** 79 (72%)
