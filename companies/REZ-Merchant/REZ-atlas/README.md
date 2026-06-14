# 🗺️ REZ Atlas
## The Merchant Intelligence Network for the Physical World

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](README.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🎯 What is REZ Atlas?

**REZ Atlas** is a map-first sales intelligence platform that helps you:

- **Discover** merchants using map-based search
- **Understand** every business through AI-powered Merchant Twins
- **Score** leads with intelligent prioritization
- **Acquire** merchants through optimized sales territories
- **Grow** revenue with AI-detected opportunities
- **Finance** businesses with credit intelligence
- **Retain** customers through relationship graphs

---

## 💡 The Problem We Solve

Most sales tools are built around **lists**.

REZ Atlas is built around **geography**.

| Question | List Tools | REZ Atlas |
|----------|------------|-----------|
| Where are my prospects? | Search in filters | **Visual map-first** |
| Which areas are underserved? | Manual analysis | **Heat map visualization** |
| Which business to visit today? | Excel spreadsheet | **Priority-ranked stops** |
| What's the best route? | Google Maps manually | **AI-optimized routes** |
| Who dominates this area? | Intuition | **Competitor intelligence** |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REZ ATLAS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                             │
│   │   Gateway    │  Port 5150                                  │
│   │  (Central)   │  Unified API Entry Point                     │
│   └──────┬───────┘                                             │
│          │                                                      │
│   ┌──────┴──────────────────────────────────────┐              │
│   │           Core Intelligence                   │              │
│   ├─────────────────────────────────────────────┤              │
│   │ 🗺️ Discover  │ 📊 Twin    │ 🎯 Score  │ 🔗 Graph │      │
│   │ Port 5151   │ Port 5153 │ Port 5154 │ Port 5173│      │
│   │              │            │           │          │      │
│   │ 🗺️ Maps     │ 📡 Signals │ 🎭 Copilot│ 🛣️ Routes│      │
│   │ Port 5152   │ Port 5155 │ Port 5172 │ Port 5171│      │
│   └──────────────────────────────────────────┘              │
│                                                                 │
│   ┌──────────────────────────────────────────────┐            │
│   │           Territory Management                │            │
│   │             Port 5170                        │            │
│   └──────────────────────────────────────────────┘            │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                   │
│   │   Dashboard     │  │   Field App     │                   │
│   │   Port 5190    │  │   Port 5191     │                   │
│   │   (Next.js)    │  │   (React Native)│                   │
│   └─────────────────┘  └─────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services Overview

### Core Intelligence

| Service | Port | Description |
|---------|------|-------------|
| **Gateway** | 5150 | Central API gateway, orchestrates all services |
| **Discover** | 5151 | Map-first merchant discovery from Google Maps |
| **Maps** | 5152 | Heat maps, cluster maps, territory visualization |
| **Twin** | 5153 | Merchant digital twins (Identity, Presence, Reputation, Operations, Growth) |
| **Score** | 5154 | AI-powered lead scoring (Hot/Warm/Cold, A/B/C/D grades) |
| **Signals** | 5155 | AI opportunity detection (no QR, no loyalty, competitor gaps) |

### Sales Intelligence

| Service | Port | Description |
|---------|------|-------------|
| **Territory** | 5170 | Sales territory management, balancing, performance |
| **Routes** | 5171 | Field sales route optimization |
| **Copilot** | 5172 | AI sales assistant (summaries, pitches, comparisons) |
| **Graph** | 5173 | Merchant network relationships |

### External Intelligence

| Service | Port | Description |
|---------|------|-------------|
| **Web Intelligence** | 4595 | HOJAI web scraping, news monitoring, competitor tracking |
| **Scraper** | 5160 | Direct scraping: websites, Google Reviews, Zomato, social media |

### UI

| Service | Port | Description |
|---------|------|-------------|
| **Dashboard** | 5190 | Enterprise dashboard (Next.js) |
| **Field App** | 5191 | Mobile app for field sales (React Native) |

---

## 🎯 Key Features

### 1. Map-First Discovery
- Search merchants by location, category, rating
- Google Places API integration
- Geo-filtering with radius support
- Business category analysis

### 2. Merchant Digital Twin
Every merchant has a comprehensive digital profile:

```
┌─────────────────────────────────────────────────┐
│              MERCHANT TWIN                     │
├─────────────────────────────────────────────────┤
│  👤 Identity    │ Name, GSTIN, PAN, Contact    │
│  🌐 Presence    │ Website, Social, Listings     │
│  ⭐ Reputation  │ Reviews, Ratings, Sentiment    │
│  ⚙️ Operations  │ Hours, Tech Stack, POS       │
│  📈 Growth     │ Hiring, Reviews, Expansion    │
└─────────────────────────────────────────────────┘
```

### 3. AI Lead Scoring
- Automatic scoring (0-100)
- Grade assignment (A/B/C/D)
- Hot/Warm/Cold recommendations
- Source attribution

### 4. Territory Management
- Create territories by geography
- Assign merchant ownership
- Balance workload across teams
- Performance analytics

### 5. Route Optimization
- Daily/weekly visit planning
- AI-optimized route sequencing
- Priority-based scheduling
- Traffic-aware routing

### 6. Opportunity Detection
AI automatically finds opportunities:

| Type | Detection | Product Suggestion |
|------|----------|-------------------|
| No QR | Restaurant without digital menu | REZ Menu QR |
| No Loyalty | >50 reviews, no loyalty | REZ Loyalty |
| Poor Response | <50% response rate | REZ Reviews |
| Competitor Gap | Uses rival POS | REZ Pay |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+

### Installation

```bash
# Clone the repository
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas

# Install all dependencies
for dir in REZ-atlas-*/; do
  cd "$dir" && npm install && cd ..
done

# Or use the start script
./START-ATLAS.sh
```

### Running Services

```bash
# Terminal 1 - Gateway
cd REZ-atlas-gateway && npm run dev

# Terminal 2 - Core Services
cd REZ-atlas-discover && npm run dev
cd REZ-atlas-twin && npm run dev
cd REZ-atlas-score && npm run dev

# Terminal 3 - Dashboard
cd REZ-atlas-dashboard && npm run dev
```

### Health Checks

```bash
curl http://localhost:5150/health  # Gateway
curl http://localhost:5151/health  # Discover
curl http://localhost:5153/health  # Twin
curl http://localhost:5154/health  # Score
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Developer documentation |
| [API-REFERENCE.md](API-REFERENCE.md) | Complete API documentation |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Production deployment guide |

---

## 🔗 API Examples

### Search Merchants
```bash
curl "http://localhost:5150/api/search?q=restaurant&lat=19.0&lng=72.8&radius=5000"
```

### Create Lead
```bash
curl -X POST http://localhost:5150/api/score/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurant ABC",
    "email": "contact@restaurant.com",
    "category": "restaurant",
    "source": "discovery"
  }'
```

### Get Territory Performance
```bash
curl http://localhost:5170/api/territories/123/performance
```

### Generate AI Pitch
```bash
curl -X POST http://localhost:5172/api/copilot/pitch \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "m123",
    "product": "REZ Menu QR",
    "channel": "email"
  }'
```

---

## 💰 Target Customers

1. **Payment Providers** → Find merchants for REZ Pay
2. **POS Companies** → Sell NexTaBizz
3. **SaaS Companies** → Merchant acquisition
4. **Marketing Agencies** → Local intelligence
5. **Telecom Operators** → B2B sales teams
6. **Banks/Lenders** → RIDZA merchant finance
7. **Franchise Operators** → Franchisee discovery
8. **Enterprise Field Sales** → Territory management

---

## 📊 Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | ₹4,999/mo | 100 merchants, basic maps |
| **Professional** | ₹19,999/mo | Unlimited, AI copilot, routes |
| **Enterprise** | Custom | API access, custom agents, integrations |

---

## 🔌 Integrations

### External
- Google Maps API
- Google Places API
- Google Directions API

### REZ Ecosystem
- `hojai-merchant-intelligence` → Atlas Twin
- `hojai-lead-service` → Atlas Score
- `hojai-knowledge-graph` → Atlas Graph
- `REZ-business-copilot` → Atlas Copilot
- **HOJAI Web Intelligence (4595)** → Atlas Signals, Twin enrichment, Competitor monitoring

---

## 🏆 Competitive Advantage

| Feature | ZoomInfo | Apollo.io | MapiLeads | REZ Atlas |
|---------|----------|-----------|-----------|-----------|
| Map-First UI | ❌ | ❌ | ✅ | ✅ **Enhanced** |
| Merchant Twins | ❌ | ❌ | ❌ | ✅ **AI-Powered** |
| Territory Management | ❌ | ❌ | ❌ | ✅ **Built-in** |
| Route Optimization | ❌ | ❌ | ❌ | ✅ **Native** |
| Opportunity Detection | ❌ | ❌ | ❌ | ✅ **AI-Driven** |
| Field Sales App | ❌ | ❌ | ❌ | ✅ **Mobile** |
| India-Focused | ❌ | ❌ | ✅ | ✅ **Local** |
| **Web Intelligence** | ❌ | ❌ | ❌ | ✅ **News + Competitors** |

---

## 📞 Contact

- **Website:** [atlas.rez.money](https://atlas.rez.money)
- **Email:** atlas@rez.money
- **Documentation:** [docs.atlas.rez.money](https://docs.atlas.rez.money)

---

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ by REZ Merchant Intelligence**

*"The Merchant Intelligence Network for the Physical World"*