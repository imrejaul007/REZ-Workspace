# KHAIRMOVE

> Move Smarter, Travel Better

**Version:** 3.0.0 | **Updated:** June 12, 2026

---

## 🎯 Overview

KHAIRMOVE is RTNM Digital's comprehensive mobility platform:
- 🚗 **Ride-Hailing** - Bike, Auto, Cab, SUV
- 📦 **Delivery** - Food, package, instant
- ✈️ **Airzy** - Premium airport ecosystem (18 services)
- 🚴 **Rider Circle** - Community ride-sharing
- 🏍️ **Rentals** - Hourly/daily vehicles

---

## 📱 Products

### Core Ride-Hailing (Ports 4600-4606)
| Port | Service |
|------|---------|
| 4600 | API Gateway |
| 4601 | Ride Service |
| 4602 | Fleet Service |
| 4603 | Delivery Service |
| 4604 | Logistics Aggregator |
| 4605 | Rental Service |
| 4606 | BuzzLocal Rides |

### Airzy Airport (Ports 4500-4517)
18 services: flight, lounge, wallet, AI, corporate, hotel, transfer, DOOH, dining, social, navigation, documents, visa, finance, concierge

### Rider Circle (Ports 4200-4400)
SafeQR, live tracking, AI genie, bike digital twin, trust score

---

## Fare Structure

| Vehicle | Base | Per KM | Per Min |
|---------|------|--------|---------|
| Bike | ₹15 | ₹6 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 |
| Cab | ₹40 | ₹14 | ₹2 |
| SUV | ₹60 | ₹18 | ₹2.5 |

---

## 🚀 Quick Start

```bash
# Clone & Install
git clone https://github.com/imrejaul007/KHAIRMOVE.git
cd KHAIRMOVE
npm install

# Start with Docker
./deploy.sh start

# OR Start locally
./start-dev.sh all
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         KHAIRMOVE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  User App  │ ─────┐                                          │
│  │  Driver App │ ─────┼──► API Gateway (:4600)                  │
│  └─────────────┘     │       │                                  │
│                      │       ▼                                  │
│                      │  ┌─────────────┐                         │
│                      └──► Ride Service (:4601)                 │
│                          │ ML Surge, Fraud Detection            │
│                          └─────────────┘                         │
│                                  │                               │
│                                  ▼                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │Fleet (:4602)│  │Delivery (:4603)│ │Logistics (:4604)│        │
│  │Driver Mgmt  │  │ Hyperlocal   │  │ Multi-Carrier│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │Rental (:4605)│  │BuzzLocal (:4606)│ │Admin Dashboard (:4607)││
│  │ Hourly Rent │  │ Community   │  │ Real-time Monitor  │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    INTEGRATIONS                                  │
├─────────────────────────────────────────────────────────────────┤
│  REZ Intelligence │ RABTUL Services │ Carriers                 │
│  • Intent (:4018) │ • Auth (:4002)  │ • Delhivery             │
│  • Fraud (:3007)  │ • Wallet (:4004) │ • BlueDart               │
│  • Predictive (:4123) │ • Notify (:4011) │ • DTDC            │
│  • Location (:4040) │               │ • FedEx                  │
│                      │               │ • DHL                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| [API Gateway](khaimove-api-gateway) | 4600 | Unified API entry point |
| [Ride Service](khaimove-ride-service) | 4601 | Ride-hailing with ML surge |
| [Fleet Service](khaimove-fleet-service) | 4602 | Driver & vehicle management |
| [Delivery Service](khaimove-delivery-service) | 4603 | Hyperlocal delivery |
| [Logistics Aggregator](khaimove-logistics-aggregator) | 4604 | Multi-carrier shipping |
| [Rental Service](khaimove-rental-service) | 4605 | Hourly vehicle rentals |
| [BuzzLocal](buzzlocal-rides-integration) | 4606 | Community rides & carpooling |
| [Admin Dashboard](khaimove-admin-dashboard) | 4607 | Operations dashboard |

---

## 📱 Mobile Apps

| App | Location | Purpose |
|-----|----------|---------|
| User App | `khaimove-user-app/` | Book rides, track, history |
| Driver App | `khaimove-driver-app/` | Accept rides, GPS tracking |

---

## 🧪 Testing

```bash
# All tests
npm test --workspaces --if-present

# Single service
cd khaimove-ride-service && npm test

# With coverage
npm test --workspaces --if-present -- --coverage
```

---

## 📋 Scripts

| Script | Purpose |
|--------|---------|
| `./start-dev.sh` | Start all services locally |
| `./deploy.sh start` | Start with Docker |
| `./deploy.sh stop` | Stop Docker services |
| `./deploy.sh logs` | View logs |

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Build all services
for svc in khaimove-*/; do
  cd "$svc" && npm run build && cd ..
done

# Type check
for svc in khaimove-*/; do
  cd "$svc" && npx tsc --noEmit && cd ..
done
```

---

## 🐳 Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔐 Environment Variables

```bash
# REZ Intelligence
REZ_INTELLIGENCE_API_KEY=your-key
REZ_INTENT_URL=http://localhost:4018

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004

# Carriers
DELHIVERY_API_KEY=your-key
BLUEDART_API_KEY=your-key
```

---

## 📊 Features

### Ride-Hailing
- 4 vehicle types: Bike, Auto, Cab, SUV
- ML-powered surge pricing
- 10% cashback on every ride
- Real-time driver tracking
- OTP verification

### Fleet Management
- Multi-tier driver system
- Performance incentives
- ML-based dispatch
- Hot zone analytics

### Delivery
- 3 priority levels
- OTP verification
- Real-time tracking
- Driver management

### Logistics
- 5 carrier integrations
- Rate comparison
- Label generation
- Tracking & updates

### Rentals
- Hourly packages
- Sedan & SUV
- Extra km/hour charges

### Community Rides
- Carpooling
- Shuttle routes
- Movement analytics

---

## 📁 Project Structure

```
KHAIRMOVE/
├── khaimove-api-gateway/         # Unified API
├── khaimove-ride-service/        # Ride-hailing
├── khaimove-fleet-service/       # Fleet management
├── khaimove-delivery-service/    # Hyperlocal delivery
├── khaimove-logistics-aggregator/ # Multi-carrier
├── khaimove-rental-service/     # Hourly rentals
├── buzzlocal-rides-integration/ # Community rides
├── khaimove-admin-dashboard/    # Admin UI
├── khaimove-user-app/           # User mobile
├── khaimove-driver-app/         # Driver mobile
├── shared/                      # Shared types & schemas
├── docker-compose.yml            # Docker deployment
├── deploy.sh                    # Deployment script
├── start-dev.sh                 # Local dev script
└── README.md
```

---

## 📄 License

MIT © 2026 KHAIRMOVE
