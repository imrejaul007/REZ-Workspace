# REZ Atlas - CLAUDE.md
**Version:** 1.0.0 | **Date:** June 6, 2026 | **Status:** COMPLETE

---

## 🎯 WHAT IS REZ ATLAS?

**REZ Atlas** is "The Merchant Intelligence Network for the Physical World."

**Positioning:** Map-First Sales Intelligence Platform

**Competitors:** ZoomInfo, Apollo.io, MapiLeads, Clearbit

**Unique Value:** Instead of list-based tools, REZ Atlas is built around geography:
- Where are my prospects?
- Which areas are underserved?
- Which businesses should I visit today?
- What is the most efficient route?
- Which competitor dominates this area?

---

## 🏗️ ARCHITECTURE

```
REZ ATLAS (The Merchant Intelligence Network)
├── REZ-atlas-gateway (5150)     ← Central API Gateway
├── REZ-atlas-discover (5151)     ← Map-First Merchant Discovery
├── REZ-atlas-maps (5152)         ← Geospatial Intelligence
├── REZ-atlas-twin (5153)         ← Merchant Digital Twin Engine
├── REZ-atlas-score (5154)        ← AI-Powered Lead Scoring
├── REZ-atlas-signals (5155)      ← AI Opportunity Detection
├── REZ-atlas-territory (5170)    ← Sales Territory Management
├── REZ-atlas-routes (5171)       ← Field Sales Route Optimization
├── REZ-atlas-copilot (5172)      ← AI Sales Assistant
├── REZ-atlas-graph (5173)        ← Merchant Network Graph
├── REZ-atlas-dashboard (5190)    ← Enterprise Dashboard
└── REZ-atlas-field-app (5191)   ← Mobile Field Sales App
```

---

## 📦 PRODUCT SUITE

### Core Intelligence (Ports 5150-5155)

| Service | Port | Purpose | Key Endpoints |
|---------|------|---------|----------------|
| `REZ-atlas-gateway` | 5150 | Central API, orchestration | `/api/search`, `/api/merchants`, `/api/dashboard/*` |
| `REZ-atlas-discover` | 5151 | Map-first discovery | `/api/search`, `/api/nearby`, `/api/categories`, `/api/sync/*` |
| `REZ-atlas-maps` | 5152 | Heat, cluster, territory maps | `/api/heat`, `/api/clusters`, `/api/territory/:id` |
| `REZ-atlas-twin` | 5153 | Merchant digital twins | `/api/merchants/:id`, `/api/dashboard/*`, `/api/merchants/:id/performance` |
| `REZ-atlas-score` | 5154 | Lead scoring engine | `/api/leads`, `/api/leads/:id/score`, `/api/stats` |
| `REZ-atlas-signals` | 5155 | Opportunity detection | `/api/opportunities`, `/api/competitors`, `/api/dashboard` |

### Sales Intelligence (Ports 5170-5173)

| Service | Port | Purpose | Key Endpoints |
|---------|------|---------|----------------|
| `REZ-atlas-territory` | 5170 | Territory management | `/api/territories`, `/api/territories/:id/performance`, `/api/territories/balance` |
| `REZ-atlas-routes` | 5171 | Route optimization | `/api/routes`, `/api/routes/optimize`, `/api/routes/:id/stops/:stopId` |
| `REZ-atlas-copilot` | 5172 | AI sales assistant | `/api/summarize`, `/api/pitch`, `/api/compare` |
| `REZ-atlas-graph` | 5173 | Merchant network | `/api/merchant/:id`, `/api/relationships`, `/api/connect` |

### UI Services (Ports 5190-5191)

| Service | Port | Purpose |
|---------|------|---------|
| `REZ-atlas-dashboard` | 5190 | Enterprise dashboard (Next.js) |
| `REZ-atlas-field-app` | 5191 | Mobile app (React Native/Expo) |

---

## 🔗 MERCHANT TWIN STRUCTURE

Every merchant has a digital twin with 5 components:

### 1. Identity Twin
```typescript
{
  merchantId: string
  name: string
  legalName?: string
  category: string
  subCategory?: string
  gstin?: string
  pan?: string
  email, phone, website
  address: { street, city, state, pincode, lat, lng }
}
```

### 2. Presence Twin
```typescript
{
  merchantId: string
  website: { url, techStack[], hasEcommerce, hasBooking }
  social: { facebook, instagram, twitter, linkedin, youtube }
  listings: [{ platform, url, verified, lastSynced }]
  presenceScore: number (0-100)
}
```

### 3. Reputation Twin
```typescript
{
  merchantId: string
  rating: { overall, count, max }
  reviews: [{ platform, rating, count, lastReview }]
  sentiment: { positive, negative, neutral, score }
  responseRate, avgResponseTime
}
```

### 4. Operations Twin
```typescript
{
  merchantId: string
  hours: [{ day, open, close, isClosed }]
  staffEstimate, staffRange
  tech: { hasPOS, posProvider, hasQR, hasOnlineOrdering, hasTableBooking, paymentMethods[] }
  size: { sqft, branches, type }
}
```

### 5. Growth Signals Twin
```typescript
{
  merchantId: string
  hiring: { active, positions, lastPosted }
  reviewVelocity: { weekly, monthly, trend }
  socialEngagement: { followers, engagementRate, postsPerWeek }
  expansion: { hasNewBranch, newLocations[], lastExpansion }
  growthScore: number (0-100)
}
```

---

## 📊 LEAD SCORING ALGORITHM

### Score Calculation (0-100)
```typescript
function calculateScore(lead: Partial<Lead>): number {
  let score = 0;
  
  // Basic info (+65 max)
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 20;
  if (lead.name) score += 10;
  
  // Category (+30 max)
  const categoryScores = {
    restaurant: 25, retail: 20, hotel: 25, salon: 15,
    healthcare: 20, ecommerce: 30, services: 15
  };
  if (lead.category) score += categoryScores[lead.category] || 15;
  
  // Source (+35 max)
  const sourceScores = {
    organic: 20, referral: 35, linkedin: 30,
    cold_email: 10, webinar: 20, paid_ads: 15,
    partnership: 25, event: 20, discovery: 30, twin: 25
  };
  if (lead.source) score += sourceScores[lead.source] || 15;
  
  // Metadata enrichment (+20 max)
  if (lead.metadata?.hasWebsite) score += 10;
  if (lead.metadata?.hasPOS) score += 15;
  if (lead.metadata?.hasReviews) score += 10;
  if (lead.metadata?.twinScore) score += Math.min(lead.metadata.twinScore, 20);
  
  return Math.min(score, 100);
}
```

### Grade Assignment
- **A** (80-100): Hot leads, prioritize immediately
- **B** (60-79): Warm leads, follow up within 24 hours
- **C** (40-59): Moderate interest, nurture campaign
- **D** (0-39): Cold leads, long-term nurturing

### Recommendation
- **Hot** (score ≥ 80): "Call today, high conversion probability"
- **Warm** (score 60-79): "Schedule demo within 48 hours"
- **Cold** (score < 60): "Add to nurture sequence"

---

## 🗺️ TERRITORY MANAGEMENT

### Territory Structure
```typescript
interface Territory {
  id: string
  name: string
  description?: string
  ownerId?: string
  bounds?: { north, south, east, west }
  regions?: [{ name, cities: string[] }]
  stats: {
    merchants: number
    leads: number
    revenue: number
    conversion: number
  }
  status: 'active' | 'inactive'
}
```

### Balance Metrics
- Revenue per merchant
- Lead conversion rate
- Average revenue per lead
- Deviation from average (should be <20%)

---

## 🛣️ ROUTE OPTIMIZATION

### Route Structure
```typescript
interface Route {
  id: string
  name: string
  userId: string
  territoryId: string
  date: string
  stops: [{
    id, merchantId, name, address, lat, lng
    priority: 1-3
    estimatedTime: number (minutes)
    status: 'pending' | 'visited' | 'skipped'
  }]
  totalDistance: number (km)
  totalDuration: number (minutes)
}
```

### Optimization Algorithm
- Nearest-neighbor heuristic
- Traffic-aware routing (when Google Maps API available)
- Priority-based ordering

---

## 🎯 OPPORTUNITY DETECTION

### Opportunity Types
```typescript
interface Opportunity {
  id: string
  merchantId: string
  type: 'no_qr' | 'no_loyalty' | 'poor_reviews' | 'competitor_gap' | 'growth_signal'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  suggestedProduct: string
  potentialRevenue: number
  status: 'open' | 'converted' | 'dismissed'
}
```

### Detection Rules
| Type | Detection | Suggested Product |
|------|-----------|-------------------|
| no_qr | Restaurant without QR menu | REZ Menu QR |
| no_loyalty | Business with >50 reviews but no loyalty | REZ Loyalty |
| poor_reviews | Rating <3.5 or response rate <50% | REZ Review Response |
| competitor_gap | Competitor POS but not ours | REZ Pay |
| growth_signal | New hiring or expansion | REZ Capital |

---

## 🤖 AI COPILOT

### Endpoints
- `POST /api/summarize` - Generate merchant summary
- `POST /api/pitch` - Create personalized pitch (email/WhatsApp/call)
- `POST /api/compare` - Competitor analysis

### Pitch Templates
```typescript
{
  email: { subject, body },
  whatsapp: { message },
  call: { script }
}
```

---

## 🔗 GRAPH RELATIONSHIPS

### Node Types
- `merchant` - Businesses
- `customer` - End consumers
- `supplier` - Supply chain
- `competitor` - Market rivals
- `brand` - Brand relationships

### Edge Types
- `competitor` - Market rivalry
- `supplier` - Supply relationship
- `customer` - Customer relationship
- `partner` - Partnership

---

## 📱 FIELD APP FEATURES

1. **Route View** - Today's stops with priority
2. **Navigation** - Google Maps integration
3. **Visit Logging** - Mark visited/skipped
4. **Merchant Info** - Twin data and recommendations
5. **Offline Mode** - Local caching

---

## 🔌 EXTERNAL INTEGRATIONS

### Google Services
- Google Places API - Merchant discovery
- Google Maps API - Route optimization
- Google Directions API - Navigation

### REZ Ecosystem
- `hojai-merchant-intelligence` (4751) → Atlas Twin
- `hojai-lead-service` (3001) → Atlas Score
- `hojai-knowledge-graph` (4786) → Atlas Graph
- `REZ-business-copilot` (4205) → Atlas Copilot

---

## 🚀 QUICK START

```bash
# Install all services
cd REZ-atlas-gateway && npm install && cd ..
cd REZ-atlas-discover && npm install && cd ..
cd REZ-atlas-twin && npm install && cd ..
cd REZ-atlas-score && npm install && cd ..
cd REZ-atlas-territory && npm install && cd ..
cd REZ-atlas-routes && npm install && cd ..
cd REZ-atlas-signals && npm install && cd ..
cd REZ-atlas-copilot && npm install && cd ..
cd REZ-atlas-graph && npm install && cd ..
cd REZ-atlas-maps && npm install && cd ..
cd REZ-atlas-dashboard && npm install && cd ..

# Or run the start script
./START-ATLAS.sh

# Health checks
curl http://localhost:5150/health
curl http://localhost:5151/health
curl http://localhost:5153/health
curl http://localhost:5154/health
curl http://localhost:5170/health
```

---

## 💰 TARGET CUSTOMERS

1. **Payment Providers** → REZ Pay adoption
2. **POS Companies** → NexTaBizz sales
3. **SaaS Companies** → REZ ecosystem adoption
4. **Marketing Agencies** → Local business intelligence
5. **Telecom Operators** → B2B sales teams
6. **Banks/Lenders** → RIDZA merchant finance leads
7. **Franchise Operators** → Franchisee discovery
8. **Enterprise Field Sales** → Territory management

---

## 📈 PRICING MODEL

| Tier | Price | Features |
|------|-------|----------|
| Starter | ₹4,999/mo | 100 merchants, basic maps |
| Professional | ₹19,999/mo | Unlimited, AI copilot, routes |
| Enterprise | Custom | API, agents, custom integrations |

---

**Last Updated:** June 6, 2026
**Status:** COMPLETE - Ready for deployment