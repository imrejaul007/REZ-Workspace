# RisnaEstate

**AI-Powered Real Estate Commerce Platform** for India + UAE markets.

One platform for Consumers, Brokers, and Builders.

---

## 🚀 Quick Start

### Docker (Recommended)
```bash
docker-compose up -d
```

### Local Development
```bash
npm install
npm run dev
```

---

## 📁 Project Structure

```
RisnaEstate/
├── services/              # 30 backend microservices
│   ├── gateway/         # API Gateway (Port 3000)
│   ├── property/         # Property listings
│   ├── lead/            # Lead management
│   ├── visa/            # Visa eligibility
│   ├── referral/        # Referrals & commissions
│   ├── broker/          # Broker CRM
│   ├── crm/             # Follow-ups & visits
│   ├── media/           # Campaigns
│   ├── builder/         # Builder ERP
│   ├── notification/    # Push notifications
│   ├── payment/         # Payments & bookings
│   ├── intelligence/    # AI recommendations
│   ├── whatsapp/        # WhatsApp integration
│   ├── investment/     # Investment analysis
│   ├── distribution/    # Distribution network
│   ├── deal/            # Deal management
│   ├── agreement/       # Contract generation
│   ├── handover/        # Property handover
│   ├── booking/         # Booking system
│   ├── chatbot/         # AI chatbot
│   ├── email/           # Email campaigns
│   ├── document/       # Document management
│   ├── virtual-tour/   # 360° tours
│   ├── push/            # Push notifications
│   ├── realtime/        # Real-time updates
│   ├── ads-integration/ # AdBazaar integration
│   ├── corpperks-bridge/# CorpPerks integration
│   ├── property-intelligence/ # Property AI
│   ├── distribution-router/   # Lead routing
│   └── influencer-tracker/    # Influencer tracking
├── frontend/             # Next.js web app
│   └── src/pages/
│       ├── consumer/    # Consumer Portal
│       ├── broker/      # Broker Portal
│       └── admin/       # Admin Portal
├── mobile/              # React Native app
├── tests/               # Unit tests
├── docs/               # Architecture docs
├── monitoring/          # Prometheus + Grafana
├── migrations/          # Database migrations
└── seeds/              # Demo data
```

---

## 🔌 Services (30 Total)

### Core Services (7)
| Service | Port | Description |
|---------|------|-------------|
| Gateway | 3000 | API entry, auth |
| Property | 4100 | Listings, search |
| Lead | 4101 | AI scoring |
| Visa | 4102 | Golden Visa |
| Referral | 4103 | Commission |
| CRM | 4105 | Visits, follow-ups |
| Media | 4106 | Campaigns |

### Transaction Services (3)
| Service | Port | Description |
|---------|------|-------------|
| Deal | 4119 | Deal management |
| Agreement | 4127 | Contracts |
| Handover | 4129 | Property handover |

### Intelligence Services (4)
| Service | Port | Description |
|---------|------|-------------|
| Intelligence | 4110 | AI recommendations |
| WhatsApp | 4111 | WhatsApp integration |
| Investment | 4112 | Investment analysis |
| Distribution | 4113 | Distribution network |

### Platform Services (16)
| Service | Port | Description |
|---------|------|-------------|
| Notification | 4108 | Push notifications |
| Payment | 4109 | Payment processing |
| Builder | 4107 | Projects, inventory |
| Booking | 4120 | Bookings |
| + 12 more... | | |

---

## 🌐 ECOSYSTEM INTEGRATION

### Connected to RTNM Ecosystem

```
RTNM Digital (Parent)
├── HOJAI AI ──────────→ provides AI to everyone
├── RABTUL Technologies ─→ provides infrastructure
├── AdBazaar ───────────→ provides marketing
├── Nexha ──────────────→ provides commerce
├── CorpPerks ──────────→ provides HR
├── RisnaEstate ←──────── YOU ARE HERE
├── REZ Consumer ─────────→ provides consumer app
├── REZ Merchant ─────────→ provides merchant platform
├── KHAIRMOVE ──────────→ provides mobility
└── ... more companies
```

### RABTUL Services
| Service | Port | Usage |
|---------|------|-------|
| REZ Auth | 4002 | JWT, OTP |
| REZ Payment | 4001 | Razorpay |
| REZ Wallet | 4004 | REZ Coins |
| REZ Notifications | 4011 | Push, SMS |

### HOJAI AI Services
| Service | Port | Usage |
|---------|------|-------|
| HOJAI Intelligence | 4018 | NRI/HNI scoring |
| HOJAI Memory | 4520 | User preferences |
| HOJAI Agents | 4550 | Property AI |

---

## 📋 PRODUCTS & FEATURES

### Property Marketplace
- Property Search (Buy, Rent, Commercial)
- Advanced Filters
- Virtual Tours (360°)
- Mortgage Calculator
- Price Trends

### Property Intelligence
- AI-powered recommendations
- Price prediction
- Investment analysis
- Demand forecasting

### Lead Management
- Multi-source lead capture
- AI scoring (Hot/Warm/Cold)
- NRI/HNI Detection
- Smart routing

### Broker Network
- Broker Portal
- Team management
- Commission tracking
- Performance analytics

### Golden Visa
- Eligibility checker
- Document checklist
- Application tracking
- Agent coordination

### PropFlow AI (12 Agents)
1. Property Recommender
2. Price Predictor
3. Lead Qualifier
4. Tour Scheduler
5. Contract Drafter
6. Mortgage Advisor
7. Investment Advisor
8. Market Analyst
9. Negotiation Bot
10. Document Verifier
11. Follow-up Agent
12. Closing Coach

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `CLAUDE.md` | Comprehensive company overview with full ecosystem |
| `PRODUCTS-FEATURES.md` | Complete product & feature catalog |
| `SERVICE-REFERENCE.md` | All 30 services with API endpoints |
| `SOT.md` | Source of Truth |
| `DEPLOYMENT.md` | Production deployment guide |
| `docs/API.md` | API reference |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/SERVICE-CATALOG.md` | Service catalog |

---

## 🛠️ Development

### Start All Services
```bash
npm run dev
```

### Start Specific Service
```bash
cd services/risna-gateway && npm run dev
```

### Start Frontend
```bash
cd frontend && npm run dev
```

### Run Tests
```bash
npm test
```

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔒 Environment Variables

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key
INTERNAL_SERVICE_TOKEN=your-internal-token
MONGODB_URI=mongodb://localhost:27017/risnaestate
REDIS_URL=redis://localhost:6379

# RABTUL Services
REZ_AUTH_URL=http://localhost:4002
REZ_PAYMENT_URL=http://localhost:4001
REZ_WALLET_URL=http://localhost:4004
```

---

## 📊 Monitoring

```bash
# Health check all services
curl http://localhost:3000/health

# Prometheus metrics
curl http://localhost:3000/metrics
```

---

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

---

## License

Private - RTNM Digital

---

**Last Updated:** June 12, 2026
**Version:** 1.0.0
**Status:** PRODUCTION READY