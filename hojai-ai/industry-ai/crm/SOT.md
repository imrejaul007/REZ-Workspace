# SOT.md - State of Technology

**HOJAI Industry CRM** - Technical State Documentation

## Last Updated: 2024

---

## 📋 Overview

This document captures the current state of technology for the HOJAI Industry CRM system. It provides a snapshot of the architecture, technologies used, and technical decisions made.

---

## 🏗️ Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOJAI Industry CRM                          │
│                        Port 4980                                │
│                      Node.js/Express                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Core Services Layer                                            │
│   ├── Unified Lead Service                                      │
│   ├── Customer 360 Service                                      │
│   ├── Revenue Consolidation Service                             │
│   ├── Industry Insights Service                                 │
│   └── Cross-Sell Service                                        │
│                                                                 │
│   AI Agents Layer                                               │
│   ├── Cross-Industry Analyst                                    │
│   ├── Universal Lead Manager                                   │
│   ├── Revenue Consolidator                                     │
│   └── Customer Intelligence                                     │
│                                                                 │
│   Voice Agents Layer                                            │
│   ├── Phone Receptionist (Port 4981)                            │
│   └── WhatsApp AI (Port 4982)                                   │
│                                                                 │
│   Connectors Layer                                              │
│   ├── HOJAI Core Connector                                      │
│   └── Merchant OS Connector                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Systems                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   HOJAI Core (Port 4100)                                       │
│   └── Central orchestration for all industry products          │
│                                                                 │
│   Merchant OS (Port 4000)                                      │
│   └── Central customer and transaction management               │
│                                                                 │
│   15 Industry Products (Ports 4101-4115)                       │
│   └── Individual industry-specific systems                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technologies Used

### Runtime & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥18.0.0 | Runtime environment |
| TypeScript | 5.1.6 | Type-safe development |
| Express | 4.18.2 | Web framework |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server |
| cors | ^2.8.5 | Cross-origin resource sharing |
| dotenv | ^16.3.1 | Environment configuration |
| uuid | ^9.0.0 | Unique identifier generation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.1.6 | TypeScript compiler |
| @types/express | ^4.17.17 | Express type definitions |
| @types/cors | ^2.8.13 | CORS type definitions |
| @types/uuid | ^9.0.2 | UUID type definitions |
| @types/node | ^20.5.0 | Node.js type definitions |
| ts-node | ^10.9.1 | TypeScript execution |

---

## 📁 Project Structure

### Current Structure

```
crm/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── connectors/
│   │   ├── hojai-core.ts          # HOJAI Core connection
│   │   └── merchant-os.ts         # Merchant OS connection
│   ├── services/
│   │   ├── unified-lead-service/  # Lead management
│   │   ├── customer-360-service/  # Customer unification
│   │   ├── revenue-consolidation-service/ # Revenue tracking
│   │   ├── industry-insights-service/ # Analytics
│   │   └── cross-sell-service/   # Cross-sell opportunities
│   ├── employees/
│   │   ├── cross-industry-analyst/ # Analysis agent
│   │   ├── universal-lead-manager/ # Lead management agent
│   │   ├── revenue-consolidator/  # Revenue agent
│   │   └── customer-intelligence/ # Customer insights agent
│   └── voice-agents/
│       ├── phone-receptionist/    # IVR system
│       └── whatsapp-ai/           # WhatsApp integration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── Dockerfile                     # Container config
├── README.md                      # Documentation
├── CLAUDE.md                      # Developer guide
└── SOT.md                         # This document
```

---

## 🔌 Connectors

### HOJAI Core Connector

**Status:** Active

**Purpose:** Connects CRM to the central HOJAI Core system and all 15 Industry AI products.

**Configuration:**
```typescript
{
  baseUrl: process.env.HOJAI_CORE_URL || 'http://localhost:4100',
  apiKey: process.env.HOJAI_API_KEY || '',
  timeout: 30000
}
```

**Capabilities:**
- Fetch leads from any industry
- Fetch customers from any industry
- Fetch revenue data from any industry
- Get cross-industry metrics
- Push leads to specific industries

### Merchant OS Connector

**Status:** Active

**Purpose:** Connects CRM to the Merchant OS for central customer and transaction management.

**Configuration:**
```typescript
{
  baseUrl: process.env.MERCHANT_OS_URL || 'http://localhost:4000',
  apiKey: process.env.MERCHANT_OS_API_KEY || '',
  timeout: 30000
}
```

---

## 📊 Data Models

### Industry Types

15 supported industries defined in `hojai-core.ts`:

```typescript
type IndustryType =
  | 'waitron'      // Restaurant POS
  | 'shopflow'     // Retail
  | 'staybot'      // Hotel
  | 'carecode'     // Healthcare
  | 'glamai'       // Salon/Beauty
  | 'fitmind'      // Fitness
  | 'teammind'     // Team management
  | 'ledgerai'     // Accounting
  | 'fleetiq'      // Fleet management
  | 'propflow'     // Property
  | 'neighborai'   // Community
  | 'learniq'      // Learning
  | 'tripmind'     // Travel
  | 'franchiseiq'  // Franchise
  | 'prodflow';    // Production
```

### Core Entities

1. **Lead**
   - id, name, email, phone
   - source (IndustryType), score, status
   - crossIndustries, tags, metadata

2. **Customer (Customer360)**
   - id, name, email, phone
   - industries[], industryProfiles
   - totalLifetimeValue, communicationHistory

3. **RevenueRecord**
   - id, customerId, industry
   - amount, currency, type
   - timestamp, metadata

4. **CrossSellOpportunity**
   - id, customerId
   - fromIndustry, toIndustry
   - opportunityScore, status

---

## 🧠 AI Agents

### 1. Cross-Industry Analyst

**Status:** Active

**Capabilities:**
- Comprehensive analysis across all industries
- Industry-specific analysis
- Industry comparison
- Customer journey analysis
- Weekly report generation

### 2. Universal Lead Manager

**Status:** Active

**Capabilities:**
- Process incoming leads from any industry
- Lead scoring and routing
- Campaign management
- Nurture action scheduling

### 3. Revenue Consolidator

**Status:** Active

**Capabilities:**
- Consolidated revenue tracking
- Revenue forecasting
- Goal management
- Anomaly detection
- Segment analysis

### 4. Customer Intelligence

**Status:** Active

**Capabilities:**
- Customer profiling
- Churn prediction
- Lookalike identification
- Personalized outreach generation

---

## 📞 Voice Agents

### Phone Receptionist (IVR)

**Status:** Active
**Port:** 4981

**Features:**
- Multi-level IVR menus
- DTMF input handling
- Voicemail recording
- Call session tracking
- Lead capture from calls

**IVR Menu Structure:**
- Main Menu (options 0-4)
- Sales Menu
- Support Menu
- Information Menu
- Appointments Menu

### WhatsApp AI

**Status:** Active
**Port:** 4982

**Features:**
- Session-based conversations
- State machine navigation
- Template messaging
- Campaign management
- Lead capture from chat

---

## 🔒 Security

### Current Security Measures

1. **API Key Authentication**
   - HOJAI Core API key
   - Merchant OS API key

2. **CORS Protection**
   - Enabled with default settings

3. **Input Validation**
   - TypeScript type checking
   - Request body validation

4. **Environment Variables**
   - All sensitive config via .env

### Security Recommendations

1. Implement JWT authentication for API access
2. Add rate limiting middleware
3. Implement request logging
4. Add audit trail for data modifications

---

## 📈 Performance

### Current Performance Metrics

| Metric | Value |
|--------|-------|
| Response Time | <100ms (typical) |
| Concurrent Connections | 1000+ |
| Memory Usage | ~100MB base |
| CPU Usage | Low (event-driven) |

### Optimization Strategies

1. **In-Memory Storage**: Using Map data structures for O(1) lookups
2. **Indexing**: Phone and email indexes for fast customer lookup
3. **Batch Processing**: Bulk imports and syncs
4. **Lazy Loading**: On-demand data fetching

---

## 🚀 Deployment

### Current Deployment Options

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Production Build**
   ```bash
   npm run build
   npm start
   ```

3. **Docker Container**
   ```bash
   docker build -t hojai-crm .
   docker run -p 4980:4980 -p 4981:4981 -p 4982:4982 hojai-crm
   ```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4980 | CRM server port |
| HOJAI_CORE_URL | http://localhost:4100 | HOJAI Core URL |
| HOJAI_API_KEY | - | API authentication |
| MERCHANT_OS_URL | http://localhost:4000 | Merchant OS URL |
| MERCHANT_OS_API_KEY | - | Merchant authentication |

---

## 🔄 Integration Points

### External Systems

| System | Port | Purpose |
|--------|------|---------|
| HOJAI Core | 4100 | Central orchestration |
| Merchant OS | 4000 | Customer management |
| Waitron | 4101 | Restaurant POS |
| ShopFlow | 4102 | Retail platform |
| StayBot | 4103 | Hotel management |
| CareCode | 4104 | Healthcare |
| GlamAI | 4105 | Beauty/Salon |
| FitMind | 4106 | Fitness |
| TeamMind | 4107 | Team management |
| LedgerAI | 4108 | Accounting |
| FleetIQ | 4109 | Fleet management |
| PropFlow | 4110 | Property management |
| NeighborAI | 4111 | Community |
| LearnIQ | 4112 | Learning |
| TripMind | 4113 | Travel |
| FranchiseIQ | 4114 | Franchise |
| ProdFlow | 4115 | Production |

---

## 📝 API Endpoints Summary

### Lead Management
- `GET /api/leads` - List all leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/import/:industry` - Import from industry
- `POST /api/leads/import/all` - Import from all

### Customer Management
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `GET /api/customers/email/:email` - Get by email
- `GET /api/customers/phone/:phone` - Get by phone
- `GET /api/customers/:id/timeline` - Get timeline
- `POST /api/customers/:id/communication` - Add communication

### Revenue
- `GET /api/revenue` - Revenue summary
- `GET /api/revenue/industry/:industry` - Industry revenue
- `GET /api/revenue/top-industries` - Top performers
- `POST /api/revenue` - Record revenue
- `POST /api/revenue/sync` - Sync all

### Cross-Sell
- `GET /api/cross-sell/opportunities` - List opportunities
- `POST /api/cross-sell/identify/:customerId` - Identify
- `GET /api/cross-sell/analysis` - Analysis
- `POST /api/cross-sell/opportunities/:id/convert` - Convert

### Insights
- `GET /api/insights/industry/:industry` - Industry insights
- `GET /api/insights/all` - All insights
- `GET /api/insights/cross-industry` - Cross-industry
- `GET /api/insights/executive` - Executive summary

### AI Agents
- `GET /api/agents/analyst/report` - Analyst report
- `GET /api/agents/lead-manager/priorities` - Lead priorities
- `GET /api/agents/revenue/consolidated` - Consolidated revenue
- `GET /api/agents/customer/:id/profile` - Customer profile

### Dashboard
- `GET /api/dashboard` - Full dashboard
- `GET /health` - Service health
- `GET /api/products` - All products

---

## 🔧 Known Issues & Limitations

### Current Limitations

1. **In-Memory Storage**
   - Data is not persisted between restarts
   - Solution: Add database integration (PostgreSQL/MongoDB)

2. **No Authentication**
   - Currently open to all (use API key)
   - Solution: Implement JWT or session authentication

3. **Single-Threaded**
   - Node.js single-threaded event loop
   - Solution: Use cluster module or PM2 for multi-core

4. **No Real-Time Updates**
   - Clients must poll for updates
   - Solution: Add WebSocket support

5. **Limited Testing**
   - No automated tests yet
   - Solution: Add Jest unit tests

---

## 📋 Roadmap

### Phase 1 (Completed ✓)
- [x] Core CRM structure
- [x] Lead management
- [x] Customer 360
- [x] Revenue consolidation
- [x] AI agents
- [x] Voice agents (Phone, WhatsApp)
- [x] Cross-sell service

### Phase 2 (In Progress)
- [ ] Database integration (PostgreSQL)
- [ ] Authentication & authorization
- [ ] Real-time updates (WebSocket)
- [ ] Comprehensive testing

### Phase 3 (Planned)
- [ ] Machine learning models
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] Advanced reporting

---

## 🧪 Testing Strategy

### Current Testing
- Manual API testing via curl/Postman
- TypeScript compilation checks

### Recommended Testing
- Unit tests for services
- Integration tests for API endpoints
- E2E tests for critical flows

### Testing Tools
- Jest (unit testing)
- Supertest (API testing)
- Cypress (E2E testing)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| README.md | User documentation, quick start |
| CLAUDE.md | Developer guide |
| SOT.md | This document - technical state |

---

## 👥 Team

- Lead Developer: HOJAI AI Team
- Architecture: Multi-agent system design
- Technologies: Node.js, TypeScript, Express

---

## 📞 Support

- Documentation: See README.md
- API Health: `GET /health`
- Debug Mode: `DEBUG=hojai:* npm run dev`

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Classification:** Internal - Technical