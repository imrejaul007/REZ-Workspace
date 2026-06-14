# REZ-Merchant - Complete Feature Overview

**Version:** 4.0.0
**Updated:** May 15, 2026

---

## HOW TO UPDATE THIS DOCUMENT

### Step 1: Read from Source
```bash
# List ALL industry services
ls -1 industry-os/ | grep -v "README\|ARCHITECTURE\|DEPLOYMENT\|API\|render\|ecosystem\|\.yaml\|\.md"

# Current list (31 services):
restauranthub
rez-ai-restaurant
rez-ai-salon-fitness
rez-fitness-service
rez-healthcare-service
rez-hotel-admin-web
rez-hotel-pos-service
rez-hotel-service
rez-mind-fitness-service
rez-mind-healthcare-service
rez-mind-hotel-service
rez-mind-restaurant-service
rez-mind-salon-service
rez-pharmacy-service
rez-restaurant-admin-web
rez-restaurant-analytics-service
rez-restaurant-crm-service
rez-restaurant-inventory-service
rez-restaurant-loyalty-service
rez-restaurant-pos-service
rez-restaurant-reviews-service
rez-restaurant-service
rez-retail-pos
rez-salon-admin-web
rez-salon-crm-service
rez-salon-inventory-service
rez-salon-membership-service
rez-salon-pos-service
rez-salon-qr-service
rez-salon-service
rez-salon-whatsapp-service
```

### Step 2: Categorize by Industry
```
Restaurant (14):
- restauranthub
- rez-restaurant-service
- rez-restaurant-pos-service
- rez-restaurant-admin-web
- rez-restaurant-analytics-service
- rez-restaurant-crm-service
- rez-restaurant-inventory-service
- rez-restaurant-loyalty-service
- rez-restaurant-reviews-service
- rez-ai-restaurant
- rez-mind-restaurant-service
- rez-mind-hotel-service (shared)
- rez-mind-salon-service (shared)
- rez-mind-fitness-service (shared)

Hotel (4):
- rez-hotel-service
- rez-hotel-pos-service
- rez-hotel-admin-web
- hotel-ecosystem (parent)

Salon & Spa (10):
- rez-salon-service
- rez-salon-pos-service
- rez-salon-admin-web
- rez-salon-crm-service
- rez-salon-inventory-service
- rez-salon-membership-service
- rez-salon-qr-service
- rez-salon-whatsapp-service
- rez-ai-salon-fitness
- salon-ecosystem (parent)

Fitness (5):
- rez-fitness-service
- rez-mind-fitness-service
- fitness-ecosystem (parent)

Healthcare (5):
- rez-healthcare-service
- rez-mind-healthcare-service
- healthcare-fitness-ecosystem (parent)

Retail (1):
- rez-retail-pos
```

---

## Executive Summary

REZ-Merchant is a comprehensive merchant OS serving **5 industry verticals** with **31 industry-specific services**, **170+ API routes**, and **80+ mobile screens**.

---

## Industries We Serve

| Industry | Services | Key Modules |
|----------|----------|-------------|
| **Restaurant** | 14 | POS, Menu, Orders, Loyalty, CRM, Analytics |
| **Hotel** | 4 | Check-in, Housekeeping, Billing, POS |
| **Salon & Spa** | 10 | Appointments, Memberships, POS, CRM |
| **Fitness** | 5 | Classes, Memberships, Check-in |
| **Healthcare** | 5 | Appointments, Prescriptions, Lab |
| **Retail** | 1 | POS, Barcode scanning |
| **Pharmacy** | 1 | Prescription management |

---

## Complete Feature Map

### 1. Core Commerce

| Feature | Description | Routes |
|---------|-------------|--------|
| **Products** | Product CRUD, variants, categories, gallery | 15+ |
| **Inventory** | Stock tracking, low stock alerts, transfers | 10+ |
| **Orders** | Order management, status updates, refunds | 12+ |
| **POS** | Point of sale checkout, receipts | 8+ |
| **Multi-Location** | Multiple outlets, inventory sync | 6+ |
| **Categories** | Category management, nesting | 4+ |

### 2. Customer Management (CRM)

| Feature | Description | Routes |
|---------|-------------|--------|
| **Customer Profiles** | Full profiles, contact info, preferences | 8+ |
| **Customer 360** | Complete customer view | 6+ |
| **Segments** | Customer segmentation | 4+ |
| **Churn Analysis** | At-risk customer detection | 3+ |
| **Retention Metrics** | LTV, retention rates | 4+ |
| **Customer Notes** | Notes, tags, history | 4+ |

### 3. Loyalty & Rewards

| Feature | Description | Routes |
|---------|-------------|--------|
| **Points System** | Earn/redeem points | 8+ |
| **Stamp Cards** | Collect stamps, rewards | 4+ |
| **Punch Cards** | Punch-based rewards | 4+ |
| **Gift Cards** | Sell, redeem gift cards | 4+ |
| **Loyalty Tiers** | Bronze/Silver/Gold/Platinum | 4+ |
| **Cashback** | Cashback offers | 6+ |
| **Coins** | Coin rewards system | 4+ |

### 4. Marketing & Campaigns

| Feature | Description | Routes |
|---------|-------------|--------|
| **Campaigns** | Create, manage campaigns | 10+ |
| **Broadcasts** | Push/SMS/Email/WhatsApp | 8+ |
| **Deals** | Deal management | 6+ |
| **Discounts** | Percentage, flat, BOGO | 6+ |
| **Dynamic Pricing** | Time-based pricing rules | 4+ |
| **Referral System** | Referral programs | 6+ |
| **Bundles** | Product bundles | 4+ |
| **Offers** | Offer management | 6+ |

### 5. Finance & Payments

| Feature | Description | Routes |
|---------|-------------|--------|
| **Wallet** | Balance, transactions | 8+ |
| **Payouts** | Withdrawal requests | 6+ |
| **GST Invoices** | Invoice generation | 8+ |
| **Expenses** | Expense tracking | 6+ |
| **Commission** | Commission tracking | 4+ |
| **Goals** | Business goals | 4+ |
| **Cash Flow** | Cash flow forecasting | 4+ |
| **Multi-Bank** | Multiple bank accounts | 4+ |

### 6. Appointments & Scheduling

| Feature | Description | Routes |
|---------|-------------|--------|
| **Appointments** | Booking, reschedule, cancel | 8+ |
| **Class Schedules** | Class timing, capacity | 6+ |
| **Staff Shifts** | Shift management | 6+ |
| **Attendance** | Check-in/out, tracking | 4+ |
| **Room Bookings** | Hotel room reservations | 6+ |
| **Table Bookings** | Restaurant reservations | 4+ |

### 7. Staff & HR

| Feature | Description | Routes |
|---------|-------------|--------|
| **Team Management** | Add, remove staff | 6+ |
| **Payroll** | Salary calculation | 6+ |
| **Attendance** | Staff attendance | 4+ |
| **Shifts** | Shift scheduling | 6+ |
| **Performance** | Staff metrics | 4+ |

### 8. Operations

| Feature | Description | Routes |
|---------|-------------|--------|
| **Floor Plan** | Table/room layout | 4+ |
| **Housekeeping** | Task management | 4+ |
| **Audit Logs** | Activity tracking | 4+ |
| **Disputes** | Dispute resolution | 4+ |
| **Consultations** | Form management | 4+ |

### 9. B2B Platform (NexTaBizz)

| Feature | Description | Routes |
|---------|-------------|--------|
| **Suppliers** | Supplier management, KYC | 8+ |
| **Purchase Orders** | PO creation, tracking | 8+ |
| **RFQ** | Request for quotes | 6+ |
| **Quotes** | Quote management | 6+ |
| **Credit Lines** | BNPL financing | 6+ |
| **Khata/Ledger** | Supplier ledger | 4+ |
| **Dunning** | Payment reminders | 4+ |
| **Reconciliation** | Bank statement matching | 4+ |
| **Tally Sync** | Accounting sync | 4+ |

### 10. Integrations

| Feature | Description | Routes |
|---------|-------------|--------|
| **Swiggy** | Restaurant aggregator | 6+ |
| **Zomato** | Restaurant aggregator | 6+ |
| **Dunzo** | Delivery integration | 4+ |
| **WhatsApp** | Business messaging | 6+ |
| **Social Media** | Social posting | 4+ |
| **Gallery** | Image management | 4+ |

### 11. Analytics & Intelligence

| Feature | Description | Routes |
|---------|-------------|--------|
| **Dashboard** | Overview metrics | 8+ |
| **Revenue Analytics** | Revenue breakdown | 6+ |
| **Customer Insights** | Behavior analysis | 6+ |
| **Product Performance** | Top products | 4+ |
| **Creator Analytics** | Creator earnings | 4+ |
| **Campaign ROI** | Campaign metrics | 4+ |
| **Store Analytics** | Store performance | 6+ |

### 12. AI & Intelligence

| Feature | Description |
|---------|-------------|
| **Merchant Copilot** | Natural language insights |
| **Health Score** | 0-100 merchant health |
| **Demand Forecasting** | Predict orders, inventory |
| **Market Intelligence** | Demand heatmaps, trends |
| **Recommendations** | AI-powered suggestions |
| **Smart Inventory** | Auto-reorder suggestions |

### 13. QR & Digital

| Feature | Description | Routes |
|---------|-------------|--------|
| **Menu QR** | Digital menu | 4+ |
| **Order QR** | Scan to order | 4+ |
| **Payment QR** | UPI payments | 4+ |
| **Feedback QR** | Customer feedback | 4+ |
| **Table QR** | Table management | 4+ |

### 14. Healthcare (Special)

| Feature | Description | Routes |
|---------|-------------|--------|
| **Prescriptions** | Prescription management | 8+ |
| **Lab Integration** | Lab test orders | 4+ |
| **Nutrition Plans** | Diet planning | 4+ |
| **Patch Tests** | Allergy tracking | 4+ |
| **Consultation Forms** | Patient forms | 4+ |

### 15. Compliance

| Feature | Description | Routes |
|---------|-------------|--------|
| **E-Way Bill** | GST e-way bills | 4+ |
| **GSTR Filing** | Tax filing support | 4+ |
| **Audit Trail** | Compliance logs | 4+ |
| **Liability Tracking** | Tax liability | 4+ |

---

## Industry-Specific Services

### Restaurant Hub (14 services)

| Service | Description |
|---------|-------------|
| `restauranthub` | Parent package |
| `rez-restaurant-service` | Core API |
| `rez-restaurant-pos-service` | POS system |
| `rez-restaurant-admin-web` | Admin dashboard |
| `rez-restaurant-analytics-service` | Analytics |
| `rez-restaurant-crm-service` | Customer management |
| `rez-restaurant-inventory-service` | Stock management |
| `rez-restaurant-loyalty-service` | Loyalty program |
| `rez-restaurant-reviews-service` | Reviews |
| `rez-ai-restaurant` | AI enhancements |
| `rez-mind-restaurant-service` | Restaurant AI brain |

### Hotel Ecosystem (4 services)

| Service | Description |
|---------|-------------|
| `rez-hotel-service` | Core API |
| `rez-hotel-pos-service` | Hotel POS |
| `rez-hotel-admin-web` | Admin dashboard |
| `rez-mind-hotel-service` | Hotel AI brain |

### Salon & Spa (10 services)

| Service | Description |
|---------|-------------|
| `rez-salon-service` | Core API |
| `rez-salon-pos-service` | Salon POS |
| `rez-salon-admin-web` | Admin dashboard |
| `rez-salon-crm-service` | Customer management |
| `rez-salon-inventory-service` | Stock management |
| `rez-salon-membership-service` | Memberships |
| `rez-salon-qr-service` | QR system |
| `rez-salon-whatsapp-service` | WhatsApp |
| `rez-ai-salon-fitness` | AI enhancements |
| `rez-mind-salon-service` | Salon AI brain |

### Fitness (5 services)

| Service | Description |
|---------|-------------|
| `rez-fitness-service` | Core API |
| `rez-mind-fitness-service` | Fitness AI brain |
| `fitness-ecosystem` | Parent package |

### Healthcare (5 services)

| Service | Description |
|---------|-------------|
| `rez-healthcare-service` | Core API |
| `rez-mind-healthcare-service` | Healthcare AI brain |
| `healthcare-fitness-ecosystem` | Parent package |

### Retail (1 service)

| Service | Description |
|---------|-------------|
| `rez-retail-pos` | Retail POS |

### Pharmacy (1 service)

| Service | Description |
|---------|-------------|
| `rez-pharmacy-service` | Pharmacy management |

---

## Industry-Specific Features

### Restaurant

| Module | Features |
|--------|----------|
| **POS** | Quick checkout, split bills, table management |
| **Menu** | Items, variants, add-ons, combos |
| **Orders** | KDS, aggregator sync, delivery tracking |
| **Reservations** | Table booking, waitlist |
| **Reviews** | Review management, responses |
| **Kitchen Display** | Order queue, priority, bump |
| **Recipe Management** | Ingredients, costs |
| **Loyalty** | Restaurant-specific rewards |

### Hotel

| Module | Features |
|--------|----------|
| **Check-in/out** | Digital check-in, room assignment |
| **Housekeeping** | Room cleaning tasks, status |
| **Billing** | Folio management, extras |
| **POS** | Restaurant, spa, minibar |
| **Guest CRM** | Preferences, history |
| **Room Service** | Order to room |
| **Revenue** | Occupancy, ADR, RevPAR |

### Salon & Spa

| Module | Features |
|--------|----------|
| **Appointments** | Booking, walk-ins, waitlist |
| **Memberships** | Monthly/yearly packages |
| **POS** | Services, products |
| **CRM** | Client preferences, notes |
| **WhatsApp** | Reminders, confirmations |
| **Inventory** | Product stock |
| **Staff Performance** | Service tracking |

### Fitness

| Module | Features |
|--------|----------|
| **Classes** | Scheduled sessions, capacity |
| **Memberships** | Gym memberships |
| **Attendance** | Check-in tracking |
| **Health Metrics** | Weight, measurements |

### Healthcare

| Module | Features |
|--------|----------|
| **Appointments** | Doctor bookings |
| **Prescriptions** | Digital prescriptions |
| **Lab Integration** | Test orders |
| **Nutrition** | Meal plans |
| **Consultations** | Patient forms |

### Retail

| Module | Features |
|--------|----------|
| **POS** | Quick checkout, barcode scanning |
| **Inventory** | Stock tracking |
| **Multi-location** | Multiple stores |

### Pharmacy

| Module | Features |
|--------|----------|
| **Prescriptions** | Digital prescriptions |
| **Inventory** | Stock management |
| **Orders** | Order management |

---

## Merchant App Features

### Mobile App (rez-app-merchant)

| Screen | Features |
|--------|----------|
| **Dashboard** | KPIs, quick actions, charts |
| **Orders** | Real-time notifications, status |
| **POS** | Quick checkout, QR pay |
| **Menu** | Product management |
| **Customers** | CRM, history |
| **Market** | Intelligence insights |
| **Khata** | B2B ledger |
| **Suppliers** | Supplier management |
| **RFQ** | Quote requests |
| **Settings** | Profile, integrations |

### Web Dashboard (REZ-dashboard)

| Page | Features |
|------|----------|
| **Market** | Heatmaps, benchmarks |
| **Analytics** | Full analytics suite |
| **Campaigns** | Campaign builder |
| **Broadcast** | Multi-channel messaging |

---

## What Merchants Get

### For Free (Basic)

- Product management (up to 100)
- Order management
- Basic POS
- Customer profiles
- Wallet & payouts
- GST invoices
- Mobile app access
- Standard support

### For ₹499/month (Starter)

- All Basic features
- Unlimited products
- Loyalty program
- Basic analytics
- 2 staff accounts
- Email support

### For ₹1,999/month (Pro)

- All Starter features
- Multi-location
- Advanced analytics
- Campaign builder
- 10 staff accounts
- API access
- Priority support

### For ₹9,999/month (Enterprise)

- All Pro features
- B2B platform (NexTaBizz)
- AI insights
- Custom integrations
- Unlimited staff
- Dedicated support
- White-label options

---

## Market Intelligence (For Merchants)

### Demand Heatmaps
- Visual demand by locality
- Trending areas
- Expansion opportunities

### Benchmarks
- Compare vs competitors
- Industry averages
- Growth trends

### AI Recommendations
- Pricing suggestions
- Inventory tips
- Marketing ideas

---

## Summary

| Category | Count |
|----------|-------|
| Industry Verticals | 7 |
| Industry Services | 31 |
| Total API Routes | 170+ |
| Mobile Screens | 80+ |
| Web Dashboards | 6 |
| AI Services | 9 |
| B2B Features | 30+ |
| Integrations | 10+ |

---

## Architecture

```
REZ-Merchant
├── Core API (rez-merchant-service)
│   ├── 170+ routes
│   ├── MongoDB + Redis
│   └── RABTUL services
├── Intelligence (rez-merchant-intelligence-aggregator)
│   ├── Heatmaps
│   ├── Benchmarks
│   └── Trends
├── Copilot (rez-merchant-copilot)
│   └── AI insights
├── Integrations (rez-merchant-integrations)
│   ├── Swiggy
│   ├── Zomato
│   └── Dunzo
└── Industry Services
    ├── Restaurant (14)
    ├── Hotel (4)
    ├── Salon (10)
    ├── Fitness (5)
    ├── Healthcare (5)
    ├── Retail (1)
    └── Pharmacy (1)
```

---

*This document is the complete feature reference for REZ-Merchant.*
*Last updated from source: May 15, 2026*
