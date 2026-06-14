# REZ-CONSUMER - SERVICE STATUS

**Date:** June 4, 2026
**Version:** 2.0.0
**Status:** ALL SERVICES COMPLETE

---

## STATUS SUMMARY

| Category | Count | Notes |
|----------|-------|-------|
| COMPLETE | 23 | All services with docs and ports |
| PARTIAL | 0 | No partial services |
| STUB | 0 | All stubs converted to complete |

---

## COMPLETE SERVICES (23)

### Mobile Apps (4)

| Service | Platform | SDK | Screens | Files | Status |
|---------|----------|-----|--------|-------|--------|
| **rez-app** | Expo | SDK 53 | 738+ | 3,236 | COMPLETE |
| **do** | Expo | SDK 53 | 20+ | 154+ | COMPLETE |
| **verify-qr-mobile** | Expo | SDK 53 | 7 | 12 | COMPLETE |
| **rez-driver** | Expo | SDK 52 | 8 | 30+ | COMPLETE |

### Web Apps (2)

| Service | Platform | Coverage | Files | Status |
|---------|----------|----------|-------|--------|
| **rez-now** | Next.js 16 | 95% | 393 | COMPLETE |
| **verify-qr-dashboard** | Next.js 14 | 70% | 19+ | COMPLETE |

### Backend Services (8)

| Service | Platform | Port | Database | Dependencies | Status |
|---------|----------|------|----------|--------------|--------|
| **safe-qr-service** | Express | 4001 | MongoDB | RABTUL | COMPLETE |
| **verify-qr-service** | Express | 4003 | MongoDB | RABTUL | COMPLETE |
| **go4food-api** | Express | 3002 | MongoDB | RABTUL | COMPLETE |
| **REZ-inbox** | Express | 3003 | In-memory | Claude AI, RABTUL | COMPLETE |
| **REZ-assistant** | Express | 3011 | In-memory | Claude AI, RABTUL | COMPLETE |
| **REZ-bills** | Express | 3012 | MongoDB | RABTUL, Verify-QR | COMPLETE |
| **REZ-expense** | Express | 3013 | MongoDB | RABTUL, Intelligence | COMPLETE |
| **REZ-nearby** | Express | 3015 | In-memory | RABTUL | COMPLETE |

### REZ-* Backend Services (4)

| Service | Platform | Port | Database | Dependencies | Status |
|---------|----------|------|----------|--------------|--------|
| **REZ-menu-qr** | Express | 3014 | In-memory | RABTUL | COMPLETE |
| **REZ-save** | Express | 3016 | MongoDB | RABTUL, Intelligence | COMPLETE |
| **REZ-scan** | Express | 3017 | MongoDB | RABTUL, Intent-Graph | COMPLETE |
| **corpild-shield-app** | Express | 4716 | MongoDB | RABTUL | COMPLETE |

### UI Apps (5)

| Service | Platform | Port | Connects To | Status |
|---------|----------|------|-------------|--------|
| **REZ-inbox-ui** | Next.js 14 | 3010 | REZ-inbox:3003 | COMPLETE |
| **REZ-assistant-ui** | Next.js 14 | 3011 | REZ-assistant:3011 | COMPLETE |
| **REZ-expense-ui** | Next.js 14 | 3013 | REZ-expense:3013 | COMPLETE |
| **REZ-nearby-ui** | Next.js 14 | 3015 | REZ-nearby:3015 | COMPLETE |
| **REZ-scan-ui** | Next.js 14 | 3017 | REZ-scan:3017 | COMPLETE |

---

## SERVICE DETAILS

### REZ-inbox (Port 3003)

**Description:** Smart Inbox - Email receipt import for travel, food, invoices, subscriptions

**Features:**
- Email parsing with AI (Claude)
- Category detection (travel, food, invoice, subscription)
- Receipt extraction
- Message threading
- Tax record generation
- Webhook integration

**API Endpoints:**
- `GET /api/messages` - List messages
- `GET /api/threads` - List threads
- `POST /api/import/email` - Import email
- `POST /webhook/email` - Email webhook

**Last Updated:** June 4, 2026

---

### REZ-assistant (Port 3011)

**Description:** AI Chat Assistant - Intent tracking, preference learning, need prediction

**Features:**
- AI chat with context (Claude)
- Intent detection
- Personalized recommendations
- Preference learning
- Rate limiting

**API Endpoints:**
- `POST /api/chat/message` - Send message
- `GET /api/chat/history/:userId` - Get history
- `GET /api/intents/:userId` - Get intents
- `GET /api/recommendations/:userId` - Get recommendations

**Last Updated:** June 4, 2026

---

### REZ-bills (Port 3012)

**Description:** Smart Receipt Scanner - Scan bills, extract warranties, generate tax records, earn cashback

**Features:**
- Receipt scanning
- Warranty extraction
- Tax record generation
- Cashback system

**Cashback Rates:**
- Restaurant: 2%
- Shopping: 1.5%
- Grocery: 1%
- Electronics: 1%
- Default: 0.5%

**API Endpoints:**
- `POST /api/bills/scan` - Scan receipt
- `GET /api/bills/:userId` - Get bills
- `POST /api/bills/:id/claim-cashback` - Claim cashback
- `GET /api/tax/:userId` - Get tax records

**Last Updated:** June 4, 2026

---

### REZ-expense (Port 3013)

**Description:** Expense Tracking - Receipt scanner and expense tracking service

**Features:**
- Expense tracking
- Category management
- Spending analysis
- Receipt storage
- Location tracking

**Categories:**
- food, travel, shopping, entertainment, utilities, healthcare, education, other

**API Endpoints:**
- `POST /api/expense/add` - Add expense
- `GET /api/expense/history/:userId` - Get history
- `GET /api/expense/summary/:userId` - Get summary

**Last Updated:** June 4, 2026

---

### REZ-menu-qr (Port 3014)

**Description:** Restaurant Menu QR - Table management, menu display, order placement via QR

**Features:**
- QR code generation
- Table management
- Menu display
- Order placement

**API Endpoints:**
- `POST /api/menu/generate-qr` - Generate QR
- `GET /api/menu/:restaurantId` - Get menu
- `GET /api/menu/:restaurantId/tables` - Get tables
- `POST /api/menu/order` - Place order

**Last Updated:** June 4, 2026

---

### REZ-nearby (Port 3015)

**Description:** Location-based Discovery - Nearby places discovery and location-based recommendations

**Features:**
- Places search
- Category filtering
- Distance-based sorting
- Location services

**API Endpoints:**
- `GET /api/places/nearby` - Get nearby places
- `GET /api/search` - Search places
- `GET /api/categories` - List categories

**Last Updated:** June 4, 2026

---

### REZ-save (Port 3016)

**Description:** Wishlist/Commerce Layer - Wishlist management, collections, price alerts

**Features:**
- Save items to wishlist
- Collections management
- Price drop alerts
- Purchase intent tracking

**Item Types:**
- restaurant, product, hotel, event, service

**API Endpoints:**
- `POST /api/save` - Add to wishlist
- `GET /api/save/:userId` - Get wishlist
- `DELETE /api/save/:itemId` - Remove item
- `POST /api/save/collection` - Create collection

**Last Updated:** June 4, 2026

---

### REZ-scan (Port 3017)

**Description:** Universal QR Scanner - QR parsing, scan history, intent tracking

**Features:**
- QR code parsing
- QR type detection
- Scan history
- Statistics tracking

**QR Types:**
- payment, restaurant, product, event, loyalty, creator, verify, smart_link

**API Endpoints:**
- `POST /api/scan` - Scan QR
- `GET /api/scan/history/:userId` - Get history
- `GET /api/scan/stats/:userId` - Get stats

**Last Updated:** June 4, 2026

---

## UI SERVICES

### REZ-inbox-ui (Port 3010)

**Description:** Smart Inbox UI - Mobile-first interface for managing email receipts

**Features:**
- Category filtering (travel, food, invoices, subscriptions)
- Message preview
- Real-time updates
- RABTUL integration

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React

**Last Updated:** June 4, 2026

---

### REZ-assistant-ui (Port 3011)

**Description:** AI Chat UI - Conversational interface for REZ Assistant

**Features:**
- Real-time chat messaging
- Quick actions
- Product recommendations
- Conversation history
- Context-aware suggestions

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React, date-fns

**Last Updated:** June 4, 2026

---

### REZ-expense-ui (Port 3013)

**Description:** Expense Tracking UI - Mobile-first interface for expense management

**Features:**
- Receipt photo capture
- Manual expense entry
- Category breakdown (pie charts)
- Monthly summaries
- Merchant insights
- Expense history

**Tech Stack:** Next.js 14, Tailwind CSS, Recharts

**Last Updated:** June 4, 2026

---

### REZ-nearby-ui (Port 3015)

**Description:** Location Discovery UI - Interface for discovering nearby places

**Features:**
- Category filtering
- Distance display
- Rating display
- GPS location support
- Real-time updates

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React

**Last Updated:** June 4, 2026

---

### REZ-scan-ui (Port 3017)

**Description:** QR Scanner UI - Web interface for scanning QR codes

**Features:**
- Scanner interface
- Scan history
- Type detection display
- Bottom navigation
- PWA support

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React, PWA

**Last Updated:** June 4, 2026

---

## DEPENDENCIES MATRIX

### RABTUL Services Used

| Service | Uses | Purpose |
|---------|------|---------|
| All services | AUTH_SERVICE_URL | User authentication |
| REZ-bills | WALLET_SERVICE_URL | Cashback transfers |
| REZ-expense | ANALYTICS_SERVICE_URL | Spending analytics |
| REZ-assistant | NOTIFICATION_SERVICE_URL | Push notifications |
| All services | EVENT_BUS_URL | Event publishing |

### REZ Intelligence Services Used

| Service | Uses | Purpose |
|---------|------|---------|
| REZ-assistant | INTENT_SERVICE_URL | Intent tracking |
| REZ-save | INTELLIGENCE_API | Purchase intent |
| REZ-scan | INTENT_API | QR intent tracking |
| REZ-expense | INTELLIGENCE_API | Spending patterns |

### Internal REZ Services

| Service | Uses | Purpose |
|---------|------|---------|
| REZ-bills | VERIFY_API | Warranty registration |
| REZ-scan | VERIFY_API | Warranty QR verification |
| REZ-bills | ANALYTICS_API | Event tracking |
| REZ-expense | ANALYTICS_API | Event tracking |

---

## ENVIRONMENT VARIABLES

### Backend Services

```bash
# Service
PORT=3003  # (varies by service)

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
ANALYTICS_SERVICE_URL=http://localhost:4016
EVENT_BUS_URL=http://localhost:4025

# MongoDB (if using)
MONGODB_URI=mongodb://localhost:27017/service-db

# Internal
INTERNAL_SERVICE_TOKEN=your-token-here
```

### UI Services

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3003

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
# ... (same as backend)
```

---

## BUILD COMMANDS

### Backend Services

```bash
# All use similar pattern
cd <service>
npm install
npm run dev      # Development
npm run build    # Production build
npm start        # Production
```

### UI Services

```bash
# All use similar pattern
cd <service>
npm install
npm run dev      # Development (http://localhost:PORT)
npm run build    # Production build
npm start        # Production
```

---

## TESTING STATUS

| Service | Coverage | Target |
|---------|----------|--------|
| rez-app | 20% | 50% |
| do | 15% | 50% |
| rez-now | 30% | 70% |
| safe-qr-service | 15% | 50% |
| verify-qr-service | 25% | 50% |
| REZ-inbox | 0% | 50% |
| REZ-assistant | 0% | 50% |
| REZ-bills | 0% | 50% |

---

## DOCUMENTATION

Each service includes:
- Comprehensive README.md
- Environment variables in .env.example
- Port configuration
- API documentation
- RABTUL integration details

---

**Last Updated:** June 4, 2026
**Version:** 2.0.0
