# REZ-Merchant - Complete Feature Catalog

**Last Updated:** May 13, 2026
**Version:** 3.0.0

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [All Services (45+)](#all-services-45)
3. [API Routes (170+)](#api-routes-170)
4. [Mobile Apps](#mobile-apps)
5. [Web Dashboards](#web-dashboards)
6. [Industry Verticals](#industry-verticals)
7. [AI & Intelligence](#ai--intelligence)
8. [B2B Features](#b2b-features-nexTabizz)
9. [Security Features](#security-features)
10. [Integrations](#integrations)

---

## Repository Structure

```
REZ-Merchant/
│
├── rez-merchant-service/                    # Core API (Submodule)
│   └── 170+ routes
│
├── rez-merchant-intelligence-aggregator/   # Market Intelligence (Submodule)
│
├── rez-merchant-intelligence-service/      # Merchant AI analytics
├── rez-merchant-copilot/                 # AI Copilot
├── rez-merchant-integrations/             # Integration layer
│
├── rez-app-merchant/                     # Main Mobile App (Expo)
├── rez-merchant-app/                    # Lightweight Merchant App
├── REZ-dashboard/                       # Analytics Dashboard
├── rez-barcode-scanner-ui/              # Scanner UI
├── verify-qr-admin/                    # QR Admin Panel
│
├── docs/                                # Documentation
│   ├── FEATURE-CATALOG.md
│   ├── MERCHANT-INTELLIGENCE-PLATFORM.md
│   └── INTEGRATION_GUIDE.md
│
└── industry-os/                         # Industry Verticals
    ├── restauranthub/
    ├── hotel-ecosystem/
    ├── salon-ecosystem/
    └── healthcare-fitness-ecosystem/
```

---

## All Services (45+)

### Top Level Services

| Service | Type | Description |
|---------|------|-------------|
| `rez-merchant-service` | API | Core merchant API (170+ routes) |
| `rez-merchant-intelligence-aggregator` | Service | Cross-merchant benchmarking |
| `rez-merchant-intelligence-service` | Service | Merchant AI analytics |
| `rez-merchant-copilot` | Service | AI-powered merchant assistant |
| `rez-merchant-integrations` | Service | Aggregator integrations |

### Mobile & Web Apps

| Service | Type | Description |
|---------|------|-------------|
| `rez-app-merchant` | App (Expo) | Main merchant mobile app |
| `rez-merchant-app` | App (React Native) | Lightweight merchant app |
| `REZ-dashboard` | Web (Next.js) | Analytics dashboard |
| `rez-barcode-scanner-ui` | App | Barcode/QR scanner |
| `verify-qr-admin` | Web | QR verification admin |

---

## API Routes (170+)

### Authentication (`auth/`)

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/login` | POST | Login with phone/email |
| `/auth/verify-otp` | POST | OTP verification |
| `/auth/refresh` | POST | Refresh JWT token |
| `/auth/logout` | POST | Logout |
| `/auth/forgot-password` | POST | Password reset |
| `/auth/change-password` | POST | Change password |
| `/auth/resend-otp` | POST | Resend OTP |

### Products (`products.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/products` | GET | List products (pagination, filter) |
| `/products` | POST | Create product |
| `/products/:id` | GET | Get product |
| `/products/:id` | PUT | Update product |
| `/products/:id` | DELETE | Soft delete |
| `/products/bulk` | POST | Bulk operations |
| `/products/restore/:id` | POST | Restore deleted |
| `/products/variants` | GET/POST | Manage variants |
| `/products/search` | GET | Search products |

### Categories (`categories.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/categories` | GET | List categories |
| `/categories` | POST | Create category |
| `/categories/:id` | PUT | Update category |
| `/categories/:id` | DELETE | Delete category |

### Orders (`orders.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/orders` | GET | List orders (pagination, filter) |
| `/orders/:id` | GET | Order details |
| `/orders/:id/status` | PUT | Update status |
| `/orders/:id/refund` | POST | Process refund |
| `/orders/:id/cancel` | POST | Cancel order |
| `/orders/bulk-status` | PUT | Bulk status update |

### Stores (`stores.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/stores` | GET | List stores |
| `/stores` | POST | Create store |
| `/stores/:id` | GET/PUT | Get/Update store |
| `/stores/:id/gallery` | POST | Upload gallery |
| `/stores/:id/analytics` | GET | Store analytics |

### Multi-Location (`multiLocation.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/locations` | GET/POST | Locations CRUD |
| `/locations/inventory` | GET | Cross-location inventory |
| `/locations/transfer` | POST | Stock transfer |

### Wallet (`wallet.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/wallet/balance` | GET | Get balance |
| `/wallet/transactions` | GET | Transaction history |
| `/wallet/withdraw` | POST | Request withdrawal |
| `/wallet/bank-details` | GET/POST | Bank account |
| `/wallet/payouts` | GET | List payouts |
| `/wallet/payouts/:id` | GET | Payout details |

### Payouts (`payouts.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/payouts` | GET | List payouts |
| `/payouts/request` | POST | Request payout |
| `/payouts/:id` | GET | Payout details |
| `/payouts/:id/cancel` | POST | Cancel payout |

### Loyalty (`loyalty.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/loyalty/points` | GET | Points balance |
| `/loyalty/points/earn` | POST | Earn points |
| `/loyalty/points/redeem` | POST | Redeem points |
| `/loyalty/rewards` | GET/POST | Rewards CRUD |
| `/loyalty/tiers` | GET | Loyalty tiers |
| `/loyalty/stamps` | GET/POST | Stamp cards |
| `/loyalty/config` | GET/PUT | Loyalty config |

### Coins (`coins.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/coins/balance` | GET | Coin balance |
| `/coins/earn` | POST | Earn coins |
| `/coins/spend` | POST | Spend coins |
| `/coins/history` | GET | Transaction history |

### Cashback (`cashback.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/cashback/balance` | GET | Cashback balance |
| `/cashback/offers` | GET/POST | Offers CRUD |
| `/cashback/redemptions` | GET | Redemption history |

### Campaigns (`campaigns.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/campaigns` | GET/POST | List/Create campaigns |
| `/campaigns/:id` | GET/PUT | Campaign CRUD |
| `/campaigns/:id/activate` | POST | Activate campaign |
| `/campaigns/:id/pause` | POST | Pause campaign |
| `/campaigns/:id/roi` | GET | Campaign ROI |

### Broadcasts (`broadcasts.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/broadcasts` | GET/POST | List/Create broadcasts |
| `/broadcasts/:id/send` | POST | Send broadcast |
| `/broadcasts/:id/stats` | GET | Broadcast statistics |

### Deals (`deals.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/deals` | GET/POST | List/Create deals |
| `/deals/:id` | PUT | Update deal |
| `/deals/:id/toggle` | POST | Toggle deal |
| `/deals/redemptions` | GET | Redemption stats |

### Discounts (`discounts.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/discounts` | GET/POST | List/Create discounts |
| `/discounts/:id` | PUT/DELETE | Update/delete |

### Dynamic Pricing (`dynamicPricing.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/dynamic-pricing` | GET/POST | List/Create rules |
| `/dynamic-pricing/:id` | PUT/DELETE | Update/delete |

### Customers (`customers.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/customers` | GET | List customers |
| `/customers/:id` | GET/PUT | Customer CRUD |
| `/customers/:id/notes` | POST | Add note |
| `/customers/:id/segments` | GET | Customer segments |
| `/customers/:id/activity` | GET | Activity history |

### Customer Insights (`customerInsights.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/insights/customers` | GET | Customer insights |
| `/insights/segments` | GET | Segments |
| `/insights/churn` | GET | Churn analysis |
| `/insights/retention` | GET | Retention metrics |

### Customer 360 (`customer360.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/customer360/:id` | GET | Full customer view |
| `/customer360/:id/orders` | GET | Order history |
| `/customer360/:id/rewards` | GET | Rewards history |
| `/customer360/:id/interactions` | GET | All interactions |

### Appointments (`appointments.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/appointments` | GET/POST | List/Create |
| `/appointments/:id` | GET/PUT | Update |
| `/appointments/:id/cancel` | POST | Cancel |
| `/appointments/:id/reschedule` | POST | Reschedule |

### Class Schedules (`classSchedules.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/class-schedules` | GET/POST | List/Create schedules |
| `/class-schedules/:id` | PUT | Update schedule |
| `/class-schedules/:id/cancel` | POST | Cancel class |

### Attendance (`attendance.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/attendance` | GET | List attendance |
| `/attendance/check-in` | POST | Check in |
| `/attendance/check-out` | POST | Check out |
| `/attendance/members` | GET | Member attendance |

### Staff Shifts (`staffShifts.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/shifts` | GET/POST | List/Create shifts |
| `/shifts/:id` | PUT | Update shift |
| `/shifts/:id/assign` | POST | Assign staff |
| `/shifts/:id/complete` | POST | Complete shift |

### Payroll (`payroll.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/payroll` | GET | List payroll |
| `/payroll/generate` | POST | Generate payroll |
| `/payroll/:id/approve` | POST | Approve |

### Housekeeping (`housekeeping.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/housekeeping/tasks` | GET/POST | List/Create tasks |
| `/housekeeping/tasks/:id` | PUT | Update task |
| `/housekeeping/tasks/:id/complete` | POST | Complete task |

### Floor Plan (`floorPlan.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/floor-plan` | GET/PUT | Floor plan CRUD |
| `/floor-plan/tables` | GET/POST | Tables CRUD |

### POS (`pos.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/pos/orders` | POST | Create POS order |
| `/pos/orders/:id/pay` | POST | Process payment |
| `/pos/orders/:id/receipt` | GET | Generate receipt |

### QR Codes (`qrCode.ts`, `qrIntegration.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/qr/menu` | GET | Get menu QR |
| `/qr/order` | GET | Get order QR |
| `/qr/table` | GET | Get table QR |
| `/qr/verify` | POST | Verify QR code |
| `/qr/public/store/:slug` | GET | Public store data |
| `/qr/public/menu/:storeId` | GET | Public menu |
| `/qr/public/campaign/:campaignId` | GET | Campaign data |

### Analytics (`analytics.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/analytics/overview` | GET | Dashboard overview |
| `/analytics/revenue` | GET | Revenue analytics |
| `/analytics/orders` | GET | Order analytics |
| `/analytics/customers` | GET | Customer analytics |
| `/analytics/products` | GET | Product analytics |

### Store Analytics (`storeAnalytics.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/store-analytics/summary` | GET | Store summary |
| `/store-analytics/peak-hours` | GET | Peak hours |
| `/store-analytics/trends` | GET | Sales trends |

### Creator Analytics (`creatorAnalytics.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/creator/earnings` | GET | Creator earnings |
| `/creator/referrals` | GET | Referral stats |
| `/creator/performance` | GET | Performance metrics |

### Integrations (`integrations.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/integrations` | GET | List integrations |
| `/integrations/swiggy` | POST | Connect Swiggy |
| `/integrations/zomato` | POST | Connect Zomato |
| `/integrations/dunzo` | POST | Connect Dunzo |
| `/integrations/sync` | POST | Sync orders |

### Delivery (`deliveryTracking.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/delivery/track/:id` | GET | Track delivery |
| `/delivery/assign` | POST | Assign driver |
| `/delivery/update-status` | POST | Update status |

### Notifications (`notifications.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/notifications` | GET | List notifications |
| `/notifications/send` | POST | Send notification |
| `/notifications/templates` | GET | List templates |

### Gallery (`gallery.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/gallery` | GET | List images |
| `/gallery/upload` | POST | Upload image |
| `/gallery/:id` | DELETE | Delete image |

### Brands (`brands.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/brands` | GET/POST | List/Create brands |
| `/brands/:id` | PUT | Update brand |

### Automation (`automationRules.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/automation/rules` | GET/POST | List/Create rules |
| `/automation/rules/:id` | PUT | Update rule |
| `/automation/rules/:id/toggle` | POST | Toggle rule |

### Referral (`referral.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/referral/programs` | GET/POST | List/Create programs |
| `/referral/links` | GET | Get referral links |
| `/referral/stats` | GET | Referral stats |

### Gift Cards (`giftCards.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/gift-cards` | GET/POST | List/Create gift cards |
| `/gift-cards/:id/redeem` | POST | Redeem gift card |

### Stamp Cards (`stampCards.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/stamp-cards` | GET/POST | List/Create |
| `/stamp-cards/:id/stamp` | POST | Add stamp |

### Punch Cards (`punchCards.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/punch-cards` | GET/POST | List/Create |
| `/punch-cards/:id/punch` | POST | Add punch |

### Bundles (`bundles.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/bundles` | GET/POST | List/Create bundles |
| `/bundles/:id` | PUT | Update bundle |

### Corporate (`corporate.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/corporate/companies` | GET/POST | List/Create companies |
| `/corporate/employees` | GET | List employees |
| `/corporate/billing` | GET | Corporate billing |

### Exports (`exports.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/exports/orders` | POST | Export orders |
| `/exports/customers` | POST | Export customers |
| `/exports/products` | POST | Export products |

### Bulk Operations (`bulk.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/bulk/products` | POST | Bulk update products |
| `/bulk/prices` | POST | Bulk update prices |
| `/bulk/disable` | POST | Bulk disable |

### Audit (`audit.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/audit/logs` | GET | Audit logs |
| `/audit/:entity/:id` | GET | Entity history |

### Disputes (`disputes.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/disputes` | GET/POST | List/Create disputes |
| `/disputes/:id` | GET | Dispute details |
| `/disputes/:id/resolve` | POST | Resolve dispute |

### GST (`gst.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/gst/invoices` | GET/POST | List/Create invoices |
| `/gst/filing` | GET | Filing status |

### Expenses (`expenses.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/expenses` | GET/POST | List/Create expenses |
| `/expenses/categories` | GET | Expense categories |

### Goals (`goals.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/goals` | GET/POST | List/Create goals |
| `/goals/:id/progress` | GET | Goal progress |

### Commission (`commission.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/commission` | GET | Commission details |
| `/commission/transactions` | GET | Commission history |

### Concierge (`concierge.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/concierge/requests` | GET/POST | List/Create requests |
| `/concierge/requests/:id` | PUT | Update request |

### Health (`health.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/health/ready` | GET | Readiness check |

### B2B - Suppliers (`suppliers.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/suppliers` | GET/POST | List/Create suppliers |
| `/b2b/suppliers/:id` | GET/PUT | Supplier CRUD |
| `/b2b/suppliers/:id/kyc` | POST | Submit KYC |

### B2B - Purchase Orders (`purchaseOrders.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/purchase-orders` | GET/POST | List/Create POs |
| `/b2b/purchase-orders/:id` | GET/PUT | PO details |
| `/b2b/purchase-orders/:id/send` | POST | Send to supplier |
| `/b2b/purchase-orders/:id/acknowledge` | POST | Supplier ack |
| `/b2b/purchase-orders/:id/status` | PUT | Update status |

### B2B - RFQ (`rfq.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/rfq` | GET/POST | List/Create RFQs |
| `/b2b/rfq/:id` | GET/PUT | RFQ details |
| `/b2b/rfq/:id/invite` | POST | Invite suppliers |
| `/b2b/rfq/:id/close` | POST | Close RFQ |

### B2B - Quotes (`quotes.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/quotes` | GET/POST | List/Create quotes |
| `/b2b/quotes/:id` | GET/PUT | Quote details |
| `/b2b/quotes/:id/accept` | POST | Accept quote |
| `/b2b/quotes/:id/reject` | POST | Reject quote |

### B2B - Credit Lines (`creditLines.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/credit-lines` | GET/POST | List/Create credit lines |
| `/b2b/credit-lines/:id` | GET/PUT | Credit line details |
| `/b2b/credit-lines/:id/draw` | POST | Draw from credit |
| `/b2b/credit-lines/:id/repay` | POST | Repay |

### B2B - Reconciliation (`reconciliation.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/reconciliation` | GET | List transactions |
| `/b2b/reconciliation/import` | POST | Import bank statement |
| `/b2b/reconciliation/match` | POST | Match transactions |

### B2B - Khata (`khata.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/khata` | GET | Supplier ledger |
| `/b2b/khata/entries` | GET/POST | Ledger entries |
| `/b2b/khata/balance` | GET | Balance summary |

### B2B - Dunning (`dunning.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/dunning/sequences` | GET/POST | Dunning sequences |
| `/b2b/dunning/reminders` | POST | Send reminder |
| `/b2b/dunning/escalate` | POST | Escalate |

### B2B - WhatsApp (`whatsapp.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/whatsapp/send` | POST | Send message |
| `/b2b/whatsapp/templates` | GET | Message templates |

### B2B - Tally Sync (`tally.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/b2b/tally/sync` | POST | Trigger sync |
| `/b2b/tally/status` | GET | Sync status |

### Intelligence - Market (`intelligence.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/intelligence/market/heatmap/:city` | GET | Demand heatmap |
| `/intelligence/market/neighborhood` | GET | Neighborhood analysis |
| `/intelligence/market/trends/:locality` | GET | Demand trends |
| `/intelligence/market/benchmark` | GET | Industry benchmark |
| `/intelligence/market/opportunities` | GET | Expansion opportunities |
| `/intelligence/market/trending` | GET | Trending localities |
| `/intelligence/market/opt-in` | POST | Join program |
| `/intelligence/market/opt-out` | POST | Leave program |

### Intelligence - Insights (`intelligence.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/intelligence/insights` | GET | AI insights |
| `/intelligence/health-score` | GET | Merchant health |
| `/intelligence/recommendations` | GET | AI recommendations |

### Internal Routes (`internalRoutes.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/internal/orders/sync` | POST | Sync orders |
| `/internal/products/sync` | POST | Sync products |
| `/internal/customers/sync` | POST | Sync customers |

---

## Mobile Apps

### rez-app-merchant (Main App)

#### Screens
| Screen | Description |
|--------|-------------|
| Dashboard | KPIs, recent orders, quick actions |
| Orders | Order list, filters, details |
| POS | Point of sale checkout |
| Menu | Product/category management |
| Customers | CRM, profiles, history |
| Settings | Profile, integrations |
| Market | Market Intelligence |
| Khata | B2B ledger |
| Suppliers | Supplier management |
| RFQ | Request for quotes |
| Quotes | Quote management |
| Dunning | Payment reminders |

#### Features
- Real-time order notifications
- Order status updates
- Refund processing
- Bulk operations
- Product management
- Customer profiles
- Points/stamps/cashback
- Deal management
- Campaign viewing
- Sales analytics

### rez-merchant-app

Lightweight merchant app for basic operations.

### rez-barcode-scanner-ui

Barcode/QR scanning interface for:
- Product lookup
- Inventory scanning
- QR verification

---

## Web Dashboards

### REZ-dashboard (Next.js)

| Page | Description |
|------|-------------|
| `/market` | Market Intelligence view |
| `/analytics` | Comprehensive analytics |
| `/campaigns` | Campaign management |
| `/broadcast` | Message broadcasting |

### verify-qr-admin

QR verification admin panel for:
- QR code validation
- Redemption tracking
- Analytics

### Industry Admin Webs

| Dashboard | Description |
|-----------|-------------|
| `rez-restaurant-admin-web` | Restaurant operations |
| `rez-hotel-admin-web` | Hotel management |
| `rez-salon-admin-web` | Salon management |

---

## Industry Verticals

### Restaurant Hub

| Service | Description |
|---------|-------------|
| `rez-restaurant-admin-web` | Admin dashboard |
| `rez-restaurant-service` | Core API |
| `rez-restaurant-pos-service` | POS system |
| `rez-restaurant-analytics-service` | Analytics |
| `rez-restaurant-crm-service` | Customer management |
| `rez-restaurant-inventory-service` | Stock management |
| `rez-restaurant-loyalty-service` | Loyalty program |
| `rez-restaurant-reviews-service` | Reviews |
| `rez-ai-restaurant` | AI enhancements |
| `rez-mind-restaurant-service` | Restaurant AI brain |

### Hotel Ecosystem

| Service | Description |
|---------|-------------|
| `rez-hotel-admin-web` | Admin dashboard |
| `rez-hotel-service` | Core API |
| `rez-hotel-pos-service` | Hotel POS |
| `rez-mind-hotel-service` | Hotel AI brain |

### Salon Ecosystem

| Service | Description |
|---------|-------------|
| `rez-salon-admin-web` | Admin dashboard |
| `rez-salon-service` | Core API |
| `rez-salon-pos-service` | Salon POS |
| `rez-salon-crm-service` | Customer management |
| `rez-salon-inventory-service` | Stock management |
| `rez-salon-membership-service` | Memberships |
| `rez-salon-qr-service` | QR system |
| `rez-salon-whatsapp-service` | WhatsApp |
| `rez-ai-salon-fitness` | AI enhancements |
| `rez-mind-salon-service` | Salon AI brain |

### Fitness & Healthcare

| Service | Description |
|---------|-------------|
| `rez-fitness-service` | Gym/fitness management |
| `rez-healthcare-service` | Healthcare operations |
| `rez-pharmacy-service` | Pharmacy management |
| `rez-mind-fitness-service` | Fitness AI |
| `rez-mind-healthcare-service` | Healthcare AI |

---

## AI & Intelligence

### Merchant Copilot (`rez-merchant-copilot`)

- Natural language queries
- Business insights
- Automated recommendations
- Decision support

### Merchant Intelligence Service

- Health score (0-100)
- Growth metrics
- Competitive analysis
- Strategic recommendations

### Merchant Intelligence Aggregator

- Demand heatmaps
- Industry benchmarking
- Trend analysis
- Opportunity detection

### REZ Mind Services

| Service | Industry | Features |
|---------|---------|----------|
| `rez-mind-restaurant-service` | Restaurant | Demand forecasting, menu optimization |
| `rez-mind-hotel-service` | Hotel | Occupancy prediction, dynamic pricing |
| `rez-mind-salon-service` | Salon | Customer LTV, scheduling optimization |
| `rez-mind-fitness-service` | Fitness | Attendance prediction |
| `rez-mind-healthcare-service` | Healthcare | Patient insights |

### AI Services

| Service | Description |
|---------|-------------|
| `rez-ai-restaurant` | Restaurant AI |
| `rez-ai-salon-fitness` | Salon/Fitness AI |

---

## B2B Features (NexTaBizz)

**Last Updated:** May 16, 2026

### Core B2B Modules

| Module | Routes | Status |
|--------|--------|--------|
| Suppliers | `/api/v1/merchant/suppliers` | ✅ Complete |
| Purchase Orders | `/api/v1/merchant/purchase-orders` | ✅ Complete |
| RFQ System | `/api/v1/merchant/rfqs` | ✅ Complete |
| Quotes | `/api/v1/merchant/quotes` | ✅ Complete |
| Credit Lines | `/api/v1/merchant/credit-lines` | ✅ Complete |
| Challans | `/api/v1/merchant/challans` | ✅ Complete |
| Goods Receipt | `/api/v1/merchant/goods-receipt` | ✅ Complete |

### Advanced B2B Features

| Feature | Routes | Status |
|---------|--------|--------|
| Webhooks | `/api/v1/merchant/webhooks` | ✅ Complete |
| Forecasting | `/api/v1/merchant/forecasting` | ✅ Complete |
| Bulk Import | `/api/v1/merchant/bulk-b2b` | ✅ Complete |
| Data Export | `/api/v1/merchant/exports` | ✅ Complete |
| Audit Logs | `/api/v1/merchant/audit-logs` | ✅ Complete |
| In-App Notifications | `/api/v1/merchant/notifications` | ✅ Complete |
| Documents | `/api/v1/merchant/documents` | ✅ Complete |
| VA Reconciliation | `/api/v1/merchant/reconciliation` | ✅ Complete |

### Supplier Management
- Onboard suppliers with KYC tracking
- GST/PAN validation
- Credit limit management
- Performance metrics
- Bank details verification
- Multi-step onboarding workflow

### Purchase Orders
- PO creation with line items
- Multi-level approvals
- Partial goods receipt
- Quality check workflow
- Status tracking
- Digital delivery

### RFQ System
- Create RFQ
- Invite suppliers
- Quote comparison
- Accept/reject quotes
- Award PO from quote

### Credit Lines / BNPL
- Credit limit management
- Drawdown tracking
- Repayment schedules
- Interest calculation
- Utilization tracking

### Khata / Ledger
- Supplier payable ledger
- Complete transaction trail
- Aging analysis
- Balance verification

### Dunning
- Automated reminders
- Payment links via WhatsApp
- Escalation rules
- Custom sequences

### Webhooks
- Event subscriptions
- HMAC-SHA256 signature
- Automatic retry (5 attempts)
- Event deduplication
- Secret rotation

### Forecasting
- 90-day cash flow forecast
- Risk assessment
- Recommendations
- Aging analysis
- Short-term daily forecasts

### Bulk Import/Export
- CSV import for suppliers, POs
- CSV export for reports
- Template generation
- Duplicate handling

### Audit & Compliance
- Full change tracking
- Audit log queries
- Export audit trail
- Summary by action type

### Tally Sync
- Accounting sync
- Invoice sync

---

## Security Features

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| OTP Verification | ✅ |
| Rate Limiting | ✅ |
| CORS Protection | ✅ |
| Helmet Security Headers | ✅ |
| HSTS (production) | ✅ |
| MongoDB Sanitization | ✅ |
| Ownership Guards | ✅ |
| CSRF Protection | ✅ |
| Input Validation (Zod) | ✅ |
| Error Sanitization | ✅ |
| Audit Logging | ✅ |
| Refresh Token Rotation | ✅ |
| Weak Secret Detection | ✅ |
| **Input Sanitization** | ✅ (XSS, NoSQL injection) |

---

## Infrastructure & Quality

### Health Checks (Kubernetes-Ready)
- `GET /health` - Basic liveness
- `GET /health/ready` - Readiness with dependencies
- `GET /health/details` - Debug info

### Error Handling
- Centralized error handler middleware
- Custom error classes (AppError, ValidationError, etc.)
- Async handler wrapper
- 404 handler

### TypeScript
- Strict mode enabled
- Declaration files for SDK generation
- Type-safe API client (ReZMerchantClient.ts)

### Testing
- 200+ unit tests
- B2B feature coverage
- Integration tests

### API Documentation
- Swagger/OpenAPI 3.0
- Type-safe SDK client

---

## Integrations

### Aggregators
| Integration | Description |
|-------------|-------------|
| Swiggy | Restaurant aggregator |
| Zomato | Restaurant aggregator |

### Delivery Partners
| Integration | Description |
|-------------|-------------|
| Dunzo | Delivery service |

### Payments
| Integration | Description |
|-------------|-------------|
| Razorpay | Payment gateway |
| UPI | UPI payments |

### Other
| Integration | Description |
|-------------|-------------|
| WhatsApp | Business messaging |
| Tally | Accounting sync |

---

## Summary

| Category | Count |
|----------|-------|
| **Total Services** | 45+ |
| **API Routes** | 170+ |
| **Mobile Apps** | 4 |
| **Web Dashboards** | 6 |
| **Industry Verticals** | 4 |
| **AI Services** | 9 |

---

*This is the complete feature catalog for REZ-Merchant.*
