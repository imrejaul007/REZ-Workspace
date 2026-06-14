# REZ Merchant - Source of Truth (SOT)

**Last Updated:** June 8, 2026
**Version:** 8.2.0

> **100% Paysaathi/Takkada Feature Parity Achieved** - All Tier 1-3 features implemented

---

## IMPORTANT: Product Relationships

| Product | Company | Description |
|---------|---------|-------------|
| **REZ Merchant** | REZ Ecosystem | This repo - Merchant OS, apps, dashboards |
| **nextaBizz** | CorpPerks | B2B procurement platform (separate company) |
| **NexTaBizz** | REZ Merchant | QR ordering platform (same company, different product) |

> ⚠️ **Do NOT confuse nextaBizz (CorpPerks) with REZ Merchant.** nextaBizz is a separate B2B procurement platform. NexTaBizz is REZ Merchant's QR ordering product.

---

## 15 INDUSTRY VERTICALS

REZ Merchant provides industry-specific solutions for 15 verticals:

| # | Industry | Key Services | Description |
|---|---------|-------------|-------------|
| 1 | **Restaurant** | POS, KDS, Menu, Reservations, CRM, Loyalty | Full restaurant OS |
| 2 | **Hotel** | PMS, POS, Housekeeping, Maintenance, Messaging, Reviews | Hotel management |
| 3 | **Salon/Spa** | POS, Membership, Appointments, CRM | Beauty & wellness |
| 4 | **Fitness/Gym** | Access control, Fitness tracking, Mind fitness | Gym management |
| 5 | **Healthcare** | Pharmacy, Appointments, Records, Mind healthcare | Healthcare ops |
| 6 | **Retail** | POS, Inventory, Loyalty | Retail stores |
| 7 | **Grocery** | Products, Inventory, Expiry tracking | Quick commerce |
| 8 | **Education** | LMS, Scheduling, Attendance | Schools & training |
| 9 | **Events** | Booking, Ticketing, Scheduling | Event management |
| 10 | **Pharmacy** | Inventory, Prescriptions, Orders | Medicine retail |
| 11 | **Automotive** | Vehicle inventory, Service records, Spare parts | Auto service |
| 12 | **Fashion** | Collections, Style profiles, Inventory | Apparel retail |
| 13 | **Drive-thru** | KDS, Order management | Quick service restaurants |
| 14 | **Self-Kiosk** | Self-service | Self-ordering kiosks |
| 15 | **Travel** | Bookings, Itineraries | Travel agencies |

### Industry Services Breakdown

#### 1. Restaurant Industry

| Service | Description |
|---------|-------------|
| `rez-restaurant-service` | Core restaurant API |
| `rez-restaurant-pos-service` | Restaurant POS system |
| `rez-restaurant-admin-web` | Restaurant admin dashboard |
| `rez-restaurant-reservations` | Table reservations |
| `rez-restaurant-crm-service` | Restaurant CRM |
| `rez-restaurant-loyalty-service` | Restaurant loyalty |
| `rez-restaurant-analytics-service` | Analytics |
| `rez-drive-thru-kds` | Drive-thru KDS |

#### 2. Hotel Industry

| Service | Description |
|---------|-------------|
| `rez-hotel-service` | Core hotel API |
| `rez-hotel-pos-service` | Hotel POS |
| `rez-hotel-admin-web` | Hotel admin dashboard |
| `rez-hotel-housekeeping-service` | Housekeeping management |
| `rez-hotel-maintenance-service` | Maintenance tracking |
| `rez-hotel-messaging-service` | Guest messaging |
| `rez-hotel-reviews-service` | Review management |

#### 3. Salon/Spa Industry

| Service | Description |
|---------|-------------|
| `rez-salon-service` | Core salon API |
| `rez-salon-pos-service` | Salon POS |
| `rez-salon-admin-web` | Salon admin dashboard |
| `rez-salon-membership-service` | Membership management |
| `rez-salon-whatsapp-service` | WhatsApp integration |
| `rez-salon-crm-service` | Salon CRM |
| `rez-salon-inventory-service` | Inventory |
| `rez-salon-qr-service` | Salon QR codes |

#### 4. Fitness/Gym Industry

| Service | Description |
|---------|-------------|
| `rez-fitness-service` | Core fitness API |
| `rez-fitness-access-service` | Access control |
| `healthcare-fitness-ecosystem` | Fitness ecosystem |
| `rez-mind-fitness-service` | Mind fitness AI |

#### 5. Healthcare Industry

| Service | Description |
|---------|-------------|
| `rez-healthcare-service` | Core healthcare API |
| `rez-pharmacy-service` | Pharmacy management |
| `rez-mind-healthcare-service` | Healthcare AI |

#### 6. Retail Industry

| Service | Description |
|---------|-------------|
| `rez-retail-multistore-service` | Multi-store retail management (POS, inventory, multi-location) |
| `rez-mind-retail-service` (Port 4056) | AI retail brain - recommendations, pricing, demand forecasting |
| `rez-retail-pos` | Retail POS system |
| `rez-retail-expert` (Port 3004) | AI agent for product search, recommendations |

#### 7. Grocery Industry

| Service | Description |
|---------|-------------|
| `rez-grocery-service` (Port 4052) | Grocery merchant service - products, inventory, expiry tracking, supplier orders |

#### 8. Spa & Wellness Industry

| Service | Description |
|---------|-------------|
| `rez-spa-service` (Port 4049) | Spa bookings, therapist scheduling, wellness packages, memberships |
| `rez-mind-spa-service` (Port 4051) | AI spa brain - treatment recommendations, customer preferences, pricing |

#### 9. Education Industry

| Service | Description |
|---------|-------------|
| `rez-education-service` (Port 4054) | Educational institution management - courses, batches, students, attendance, fees |
| `rez-education-expert` (Port 3006) | AI agent for course recommendations, learning paths |

#### 10. Events Industry

| Service | Description |
|---------|-------------|
| `rez-events-service` (Port 4055) | Event management - weddings, corporate events, exhibitions, ticketing |
| `Z-Events/` | Events platform (api, app, web) |

#### 11. Pharmacy Industry

| Service | Description |
|---------|-------------|
| `rez-pharmacy-service` (Port 4008) | Medicine inventory, prescriptions, order management |

#### 12. Drive-thru

| Service | Description |
|---------|-------------|
| `rez-drive-thru-kds` | Drive-thru KDS |

#### 13. Self-Kiosk

| Service | Description |
|---------|-------------|
| `rez-self-kiosk` | Self-service kiosks |

#### 14. Automotive

| Service | Port | Description |
|---------|------|-------------|
| `rez-automotive-service` | 4060 | Vehicle inventory, service records, appointments, spare parts |
| `rez-mind-automotive-service` | 4061 | AI pricing, service prediction, lead scoring |

#### 15. Fashion

| Service | Port | Description |
|---------|------|-------------|
| `rez-fashion-service` | 4062 | Apparel retail, collections, style profiles, inventory |
| `rez-mind-fashion-service` | 4063 | AI trend analysis, style matching, inventory optimization |

### Industry OS Port Registry (Complete - June 2026)

| Industry | Merchant Service | AI Mind Service | Status |
|----------|-----------------|-----------------|--------|
| Restaurant | `rez-restaurant-service` | `rez-mind-restaurant-service` | ✅ |
| Hotel | `rez-hotel-service` | `rez-mind-hotel-service` | ✅ |
| Salon | `rez-salon-service` (ecosystem) | `rez-mind-salon-service` | ✅ |
| Spa | `rez-spa-service` (4049) | `rez-mind-spa-service` (4051) | ✅ Complete |
| Retail | `rez-retail-multistore-service` (4053) | `rez-mind-retail-service` (4056) | ✅ Complete |
| Grocery | `rez-grocery-service` (4052) | `rez-mind-grocery-service` (4057) | ✅ Complete |
| Education | `rez-education-service` (4054) | `rez-mind-education-service` (4058) | ✅ Complete |
| Events | `rez-events-service` (4055) | `rez-mind-events-service` (4059) | ✅ Complete |
| Healthcare | `rez-healthcare-service` | `rez-mind-healthcare-service` | ✅ |
| Fitness/Gym | `rez-fitness-service` | `rez-mind-fitness-service` | ✅ |
| Pharmacy | `rez-pharmacy-service` (4008) | `rez-mind-pharmacy-service` (4070) | ✅ Complete |
| Automotive | `rez-automotive-service` (4060) | `rez-mind-automotive-service` (4061) | ✅ Complete |
| Fashion | `rez-fashion-service` (4062) | `rez-mind-fashion-service` (4063) | ✅ Complete |

### Newly Created Services (June 2026)

**Phase 1 - Core Industry Services:**
| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| `rez-mind-spa-service` | 4051 | `industry-os/rez-mind-spa-service/` | AI brain for spa |
| `rez-grocery-service` | 4052 | `industry-os/rez-grocery-service/` | Grocery merchant |
| `rez-retail-multistore-service` | 4053 | `REZ-Commerce/industry-os/` | Multi-store retail |
| `rez-education-service` | 4054 | `industry-os/rez-education-service/` | Education management |
| `rez-events-service` | 4055 | `industry-os/rez-events-service/` | Event management |
| `rez-mind-retail-service` | 4056 | `REZ-Intelligence/rez-mind-retail-service/` | AI retail brain |

**Phase 2 - AI Mind Services:**
| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| `rez-mind-grocery-service` | 4057 | `REZ-Intelligence/rez-mind-grocery-service/` | AI grocery - expiry prediction, demand forecasting |
| `rez-mind-education-service` | 4058 | `REZ-Intelligence/rez-mind-education-service/` | AI education - performance prediction, dropout detection |
| `rez-mind-events-service` | 4059 | `REZ-Intelligence/rez-mind-events-service/` | AI events - attendance prediction, pricing optimization |

**Phase 3 - New Verticals:**
| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| `rez-automotive-service` | 4060 | `industry-os/rez-automotive-service/` | Vehicle inventory, service, appointments, spare parts |
| `rez-mind-automotive-service` | 4061 | `REZ-Intelligence/rez-mind-automotive-service/` | AI automotive - pricing, service prediction, leads |
| `rez-fashion-service` | 4062 | `industry-os/rez-fashion-service/` | Apparel retail, collections, style profiles |
| `rez-mind-fashion-service` | 4063 | `REZ-Intelligence/rez-mind-fashion-service/` | AI fashion - trends, style matching, inventory |

### Cross-Industry Services (v8.2.0)

| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| `rez-cross-industry-loyalty-service` | 4071 | `industry-os/rez-cross-industry-loyalty-service/` | Unified loyalty points across all 15 verticals, cross-industry redemption, tier management |
| `rez-unified-booking-service` | 4072 | `industry-os/rez-unified-booking-service/` | Single booking API for all verticals, availability search, waitlist, calendar sync |

### Shared SDK

| SDK | Location | Purpose |
|-----|----------|---------|
| `@rez/connector-sdk` | `RABTUL-Technologies/REZ-connector-sdk/` | Unified RABTUL service client (Auth, Wallet, Payment, Notification, Intent, EventBus) |

### HOJAI REZ Connectors

| Connector | Connects To | Status |
|-----------|-------------|--------|
| `restaurant-connector.ts` | `restauranthub` (3001) | ✅ Fixed |
| `salon-connector.ts` | `rez-salon-service` (4009) | ✅ Fixed |
| `hotel-connector.ts` | `rez-hotel-service` (4010) | ✅ Fixed |
| `fitness-connector.ts` | `rez-fitness-service` (4011) | ✅ Fixed |
| `retail-connector.ts` | `rez-retail-multistore` (4053) | ✅ Fixed |
| `healthcare-connector.ts` | `rez-healthcare-service` (4012) | ✅ Fixed |
| `spa-connector.ts` | `rez-spa-service` (4049) | ✅ NEW |
| `education-connector.ts` | `rez-education-service` (4054) | ✅ NEW |
| `events-connector.ts` | `rez-events-service` (4055) | ✅ NEW |
| `automotive-connector.ts` | `rez-automotive-service` (4060) | ✅ NEW |
| `fashion-connector.ts` | `rez-fashion-service` (4062) | ✅ NEW |

### All Service Ports (4008-4072)

```
Core Platform:
Port 4008  - rez-pharmacy-service
Port 4049  - rez-spa-service

Phase 1 - Core Industry (2026):
Port 4051  - rez-mind-spa-service            ⭐
Port 4052  - rez-grocery-service              ⭐
Port 4053  - rez-retail-multistore             ⭐
Port 4054  - rez-education-service             ⭐
Port 4055  - rez-events-service              ⭐
Port 4056  - rez-mind-retail-service         ⭐

Phase 2 - AI Mind Services:
Port 4057  - rez-mind-grocery-service        ⭐ AI
Port 4058  - rez-mind-education-service       ⭐ AI
Port 4059  - rez-mind-events-service         ⭐ AI

Phase 3 - New Verticals:
Port 4060  - rez-automotive-service           ⭐ NEW
Port 4061  - rez-mind-automotive-service      ⭐ NEW AI
Port 4062  - rez-fashion-service              ⭐ NEW
Port 4063  - rez-mind-fashion-service        ⭐ NEW AI

Phase 4 - Cross-Industry:
Port 4070  - rez-mind-pharmacy-service       ⭐ AI PHARMACY
Port 4071  - rez-cross-industry-loyalty        ⭐ UNIFIED LOYALTY
Port 4072  - rez-unified-booking-service      ⭐ UNIFIED BOOKING
```

⭐ = Created in this session
| `rez-events-service` | 4055 | `industry-os/rez-events-service/` | Events - weddings, corporate, ticketing |
| `rez-mind-retail-service` | 4056 | `REZ-Intelligence/rez-mind-retail-service/` | AI retail brain - recommendations, pricing, forecasting |

### Cross-Industry Services

| Service | Description |
|---------|-------------|
| `rez-booking-engine` | Unified booking engine |
| `rez-guest-mobile-app` | Guest mobile app |
| `rez-room-service` | Room service |
| `rez-pms-service` | Property management |
| `rez-payment-gateway-service` | Payment gateway |
| `rez-staff-app-offline-service` | Offline staff app |
| `rez-staff-scheduling-service` | Staff scheduling |
| `rez-survey-service` | Survey management |
| `rez-virtual-concierge-service` | AI concierge |
| `rez-smart-lock-service` | Smart lock integration |
| `rez-google-hotel-ads-service` | Google Hotel Ads |
| `rez-dynamic-pricing-service` | Dynamic pricing |
| `rez-rate-shopping-service` | Rate shopping |
| `rez-multi-property-dashboard` | Multi-property |

---

## Repository Structure

| Repository | Purpose | Remote |
|------------|---------|--------|
| `REZ-Merchant` | Merchant OS, apps, dashboards | `imrejaul007/REZ-Merchant` |
| `rez-merchant-service` | Core API (170+ routes) | `imrejaul007/rez-merchant-service` |
| `rez-merchant-intelligence-aggregator` | Market Intelligence | `imrejaul007/rez-merchant-intelligence-aggregator` |
| `rez-merchant-intelligence-service` | Merchant AI | - |
| `rez-merchant-copilot` | AI Copilot | - |
| `rez-merchant-integrations` | Integrations | - |

---

## Complete Service List (80+ Services)

### Top Level Apps

| Service | Type | Description |
|---------|------|-------------|
| `rez-app-merchant` | App (Expo) | Main mobile app |
| `rez-merchant-app` | App (React Native) | Lightweight app |
| `REZ-dashboard` | Web (Next.js) | Analytics dashboard |
| `rez-barcode-scanner-ui` | App | Scanner UI |
| `verify-qr-admin` | Web | QR admin panel |

### Industry Services (by vertical)

See **12 INDUSTRY VERTICALS** section above.

---

## RABTUL Services Used

| Service | Status | Files |
|---------|--------|-------|
| Auth | ✅ Connected | `auth.service.ts` |
| Payment | ✅ Connected | `payment.service.ts` |
| Notifications | ✅ Connected | `notification.service.ts` |
| Order | ✅ Connected | |

---

## B2B Platform Overview

REZ Merchant is a comprehensive business-to-business commerce platform enabling merchants to manage their supplier relationships, procurement, and trade financing.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Supplier Management** | Onboard, verify, and manage supplier relationships with KYC tracking and performance metrics |
| **Purchase Orders** | Create, track, and manage POs with approval workflows and status tracking |
| **RFQ System** | Request for Quotes workflow for price negotiation and supplier comparison |
| **Credit Lines / BNPL** | Buy Now Pay Later financing with configurable credit limits and repayment terms |
| **Auto-Reconciliation** | Bank statement import with intelligent transaction matching against POs and invoices |
| **WhatsApp Business Integration** | Order updates, payment reminders, and supplier communication via WhatsApp |
| **Tally Sync** | Bidirectional synchronization with Tally accounting software |
| **Dunning / Reminders** | Automated payment reminder sequences with configurable templates |
| **Bank Statement Parser** | HDFC, ICICI, SBI, Axis bank CSV parsing with auto-categorization |
| **E-waybill Integration** | Generate and manage e-waybills with vehicle updates and cancellation |
| **GSTR Filing Prep** | GSTR-1, GSTR-2, GSTR-3B generation and export |
| **TDS/TCS Management** | Calculate, deduct, deposit, and certificate generation for all TDS sections |
| **Vendor Self-Service Portal** | Supplier portal for orders, payments, and document downloads |
| **Cash Flow Forecasting** | ML-based 30/60/90 day cash flow prediction with alerts |
| **Multi-Bank Aggregation** | Connect multiple bank accounts, sync, and pool funds |
| **Employee Disbursements** | Salary, incentive, expense payouts with batch processing |

### Architecture

```
REZ-Merchant (B2B)
├── Supplier Management
├── Purchase Order Engine
├── RFQ / Quote System
├── Credit Line Manager
├── Bank Reconciliation Engine
├── WhatsApp Business Service
├── Tally Sync Service
├── Dunning Scheduler
├── Bank Statement Parser
├── E-waybill Service
├── GSTR Filing Engine
├── TDS/TCS Calculator
├── Vendor Portal Service
├── Cash Flow Forecaster
├── Multi-Bank Aggregator
└── Employee Payout Engine
```

---

## Service URLs

### Production
```
AUTH_SERVICE=https://rez-auth-service.onrender.com
WALLET_SERVICE=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE=https://rez-payment-service.onrender.com
ORDER_SERVICE=https://rez-order-service.onrender.com
MERCHANT_SERVICE=https://rez-merchant-service.onrender.com
INTENT_SERVICE=https://rez-intent-graph.onrender.com
EVENT_BUS=https://rez-event-bus.onrender.com
IDENTITY_BRIDGE=https://rez-identity-bridge.onrender.com
```

### Development (Local)
```
AUTH_SERVICE=http://localhost:4002
WALLET_SERVICE=http://localhost:4001
PAYMENT_SERVICE=http://localhost:4003
ORDER_SERVICE=http://localhost:4006
MERCHANT_SERVICE=http://localhost:4005
INTENT_SERVICE=http://localhost:4050
EVENT_BUS=http://localhost:4051
IDENTITY_BRIDGE=http://localhost:4092
```

---

## Security Configuration

### Internal Service Tokens

All services use **scoped tokens** via `INTERNAL_SERVICE_TOKENS_JSON`:

```json
{
  "auth-service": "<hex-token>",
  "wallet-service": "<hex-token>",
  "payment-service": "<hex-token>",
  "order-service": "<hex-token>",
  "merchant-service": "<hex-token>",
  "intent-service": "<hex-token>",
  "event-bus": "<hex-token>",
  "identity-bridge": "<hex-token>",
  "api-gateway": "<hex-token>"
}
```

**Generate tokens:**
```bash
openssl rand -hex 32
```

### Request Headers

#### Internal Service Calls
```
X-Internal-Token: <service-token>
X-Internal-Service: <service-name>
Content-Type: application/json
X-Request-Id: <uuid>
```

#### User Context
```
X-User-Id: <user-id>
X-User-Role: <role>
Authorization: Bearer <jwt>
```

### Webhook Signatures
```
X-Signature: <hmac-sha256-hex>
```

---

## Security Standards

### Must Have (Production)

- [x] `JWT_SECRET` - 64+ characters
- [x] `ENCRYPTION_KEY` - 64 hex characters or 32 bytes
- [x] `INTERNAL_SERVICE_TOKENS_JSON` - Scoped per-service tokens
- [x] `OTP_PEPPER` - Server-side OTP security
- [x] `INTERNAL_WEBHOOK_SECRET` - HMAC signing
- [x] Weak secret detection at startup
- [x] HSTS headers in production
- [x] CORS restricted to known origins
- [x] Rate limiting enabled
- [x] Redis-backed distributed rate limits

### Implemented Fixes

| Fix | Status | Repository |
|-----|--------|------------|
| CORS localhost in production | ✅ | rez-merchant-service |
| Refresh token 30-day expiry | ✅ | rez-merchant-service |
| Distributed withdrawal lock | ✅ | rez-merchant-service |
| HMAC webhook signatures | ✅ | rez-merchant-service |
| OTP pepper hashing | ✅ | rez-merchant-service |
| Weak secret detection | ✅ | All services |
| Auth middleware | ✅ | REZ-Intelligence |
| Rate limiting | ✅ | REZ-Intelligence |
| HSTS headers | ✅ | RABTUL-Technologies |

---

## Database Schemas

### Merchant (MongoDB)
```typescript
interface Merchant {
  _id: ObjectId;
  businessName: string;
  email: string;
  phone: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  refreshTokenHash?: string;
  refreshTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### UnifiedIdentity (MongoDB)
```typescript
interface UnifiedIdentity {
  _id: ObjectId;
  unifiedId: string;
  primaryIdentifier: 'phone' | 'email';
  linkedAccounts: [{
    appId: string;
    userId: string;
    linkedAt: Date;
    confidence: number;
  }];
  profile: { phone?: string; email?: string; name?: string };
  status: 'active' | 'merged' | 'flagged';
}
```

---

## B2B Data Models

All B2B collections are stored in the same MongoDB instance as the main merchant data.

### MongoDB Collections

| Collection | Description |
|------------|-------------|
| `suppliers` | Supplier master data including KYC, contact info, bank details, and performance ratings |
| `purchaseOrders` | Purchase orders with line items, delivery schedules, and approval status |
| `rfqs` | Request for Quotes with requirements, deadlines, and supplier invitations |
| `quotes` | Supplier quotes responding to RFQs with pricing and terms |
| `creditLines` | Credit/BNPL line definitions with limits, tenure, and interest rates |
| `bankTransactions` | Imported bank statement transactions for reconciliation |
| `reconciliationRules` | Auto-match rules defining how transactions are paired with POs/invoices |
| `reminderTemplates` | Dunning message templates with customizable text and timing |
| `reminderSequences` | Active reminder sequences tracking sent messages and next scheduled send |
| `ewaybills` | E-waybill records with vehicle, distance, and GST details |
| `tdsRecords` | TDS deduction records with challan and certificate info |
| `gstrRecords` | GSTR filing data (B2B, B2CL, export, CDN) |
| `vendorPortalAccess` | Vendor self-service portal access tokens |
| `cashFlowForecasts` | Cash flow forecast history with daily projections |
| `bankAccounts` | Multi-bank aggregation account records |
| `employees` | Employee records for disbursement management |
| `disbursements` | Salary, incentive, expense disbursement records |
| `disbursementBatches` | Batch disbursement tracking |

### Data Models

```typescript
interface Supplier {
  _id: ObjectId;
  supplierId: string;
  businessName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: {
    billing: Address;
    shipping: Address;
  };
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    accountHolder: string;
  };
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments: string[];
  rating: number;
  paymentTerms: number; // days
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PurchaseOrder {
  _id: ObjectId;
  poId: string;
  supplierId: string;
  merchantId: string;
  items: [{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'sent' | 'acknowledged' | 'partial' | 'completed' | 'cancelled';
  deliveryDate: Date;
  paymentTerms: number;
  notes: string;
  tallySynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreditLine {
  _id: ObjectId;
  creditLineId: string;
  supplierId: string;
  merchantId: string;
  limit: number;
  utilized: number;
  available: number;
  interestRate: number; // annual percentage
  tenureDays: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface BankTransaction {
  _id: ObjectId;
  transactionId: string;
  merchantId: string;
  bankAccount: string;
  transactionDate: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference: string;
  reconciled: boolean;
  matchedOrderId: string;
  matchedPaymentId: string;
  createdAt: Date;
}

interface ReconciliationRule {
  _id: ObjectId;
  ruleId: string;
  merchantId: string;
  name: string;
  pattern: string; // regex pattern for matching
  matchField: 'amount' | 'reference' | 'description';
  tolerance: number; // amount matching tolerance
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

interface ReminderTemplate {
  _id: ObjectId;
  templateId: string;
  type: 'payment' | 'acknowledgment' | 'delivery' | 'custom';
  name: string;
  channel: 'whatsapp' | 'sms' | 'email';
  templateBody: string;
  variables: string[]; // placeholder variables
  isActive: boolean;
  createdAt: Date;
}

interface ReminderSequence {
  _id: ObjectId;
  sequenceId: string;
  entityType: 'purchaseOrder' | 'invoice' | 'creditLine';
  entityId: string;
  templateId: string;
  scheduledAt: Date;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  channel: 'whatsapp' | 'sms' | 'email';
  createdAt: Date;
}
```

---

## Environment Variables

### Required for All Services

| Variable | Description | Format |
|----------|-------------|--------|
| `NODE_ENV` | Environment | `development` \| `staging` \| `production` |
| `PORT` | Service port | number |
| `MONGODB_URI` | MongoDB connection | mongodb://... |
| `REDIS_URL` | Redis connection | redis://... |
| `JWT_SECRET` | JWT signing secret | 64+ chars |
| `ENCRYPTION_KEY` | Data encryption key | 64 hex or 32 bytes |
| `INTERNAL_SERVICE_TOKENS_JSON` | Service tokens | JSON object |

### Service-Specific

| Service | Additional Required |
|---------|-------------------|
| Merchant | `JWT_MERCHANT_SECRET`, `OTP_PEPPER`, `INTERNAL_WEBHOOK_SECRET` |
| B2B Platform | `WHATSAPP_BUSINESS_API_URL`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `TALLY_API_URL`, `TALLY_ACCESS_TOKEN`, `TALLY_COMPANY_NAME` |
| Auth | `JWT_ADMIN_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HMAC_SECRET` |
| Payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |

### B2B Platform Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_BUSINESS_API_URL` | WhatsApp Business API base URL | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID | Yes |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business API access token | Yes |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token for WhatsApp webhook verification | Yes |
| `TALLY_API_URL` | Tally API base URL (usually `https://tallyapi.dev`) | Yes |
| `TALLY_ACCESS_TOKEN` | Tally API access token | Yes |
| `TALLY_COMPANY_NAME` | Default Tally company name | Yes |
| `RECONCILIATION_BATCH_SIZE` | Bank transaction batch size (default: 100) | No |
| `DUNNING_SCHEDULE_CRON` | Cron for dunning job (default: `0 9 * * *`) | No |
| `DEFAULT_PAYMENT_TERMS_DAYS` | Default PO payment terms (default: 30) | No |
| `MAX_RFQ_SUPPLIERS` | Max suppliers per RFQ (default: 10) | No |

---

## API Endpoints

### Auth Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/refresh` | Public | Refresh token |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/health` | None | Health check |

### Merchant Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/merchant/auth/login` | Public | Merchant login |
| POST | `/api/v1/merchant/auth/verify-otp` | Public | Verify OTP |
| GET | `/api/v1/merchant/orders` | JWT | List orders |
| POST | `/api/v1/merchant/wallet/withdraw` | JWT | Withdrawal |
| GET | `/health` | None | Health check |

### Event Bus
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/publish` | Internal | Publish event |
| GET | `/api/events/history` | Internal | Event history |
| GET | `/api/health` | None | Health check |

---

## B2B API Endpoints

### Supplier Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/suppliers` | JWT | List all suppliers |
| POST | `/api/b2b/suppliers` | JWT | Create new supplier |
| GET | `/api/b2b/suppliers/:id` | JWT | Get supplier details |
| PUT | `/api/b2b/suppliers/:id` | JWT | Update supplier |
| DELETE | `/api/b2b/suppliers/:id` | JWT | Deactivate supplier |
| POST | `/api/b2b/suppliers/:id/kyc` | JWT | Submit KYC documents |

### Purchase Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/purchase-orders` | JWT | List POs with filters |
| POST | `/api/b2b/purchase-orders` | JWT | Create new PO |
| GET | `/api/b2b/purchase-orders/:id` | JWT | Get PO details |
| PUT | `/api/b2b/purchase-orders/:id` | JWT | Update PO |
| POST | `/api/b2b/purchase-orders/:id/send` | JWT | Send PO to supplier |
| POST | `/api/b2b/purchase-orders/:id/acknowledge` | JWT | Supplier acknowledgment |
| PUT | `/api/b2b/purchase-orders/:id/status` | JWT | Update PO status |

### RFQ System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/rfq` | JWT | List RFQs |
| POST | `/api/b2b/rfq` | JWT | Create new RFQ |
| GET | `/api/b2b/rfq/:id` | JWT | Get RFQ details |
| PUT | `/api/b2b/rfq/:id` | JWT | Update RFQ |
| POST | `/api/b2b/rfq/:id/invite` | JWT | Invite suppliers |
| POST | `/api/b2b/rfq/:id/close` | JWT | Close RFQ for quotes |

### Quotes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/quotes` | JWT | List quotes |
| POST | `/api/b2b/quotes` | JWT | Submit quote (supplier) |
| GET | `/api/b2b/quotes/:id` | JWT | Get quote details |
| PUT | `/api/b2b/quotes/:id` | JWT | Update quote |
| POST | `/api/b2b/quotes/:id/accept` | JWT | Accept quote |
| POST | `/api/b2b/quotes/:id/reject` | JWT | Reject quote |

### Credit Lines / BNPL

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/credit-lines` | JWT | List credit lines |
| POST | `/api/b2b/credit-lines` | JWT | Create credit line |
| GET | `/api/b2b/credit-lines/:id` | JWT | Get credit line details |
| PUT | `/api/b2b/credit-lines/:id` | JWT | Update credit line |
| POST | `/api/b2b/credit-lines/:id/draw` | JWT | Draw from credit line |
| POST | `/api/b2b/credit-lines/:id/repay` | JWT | Repay credit line |

### Reconciliation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/b2b/reconciliation/import` | JWT | Import bank statement |
| GET | `/api/b2b/reconciliation/transactions` | JWT | List bank transactions |
| POST | `/api/b2b/reconciliation/match` | JWT | Manual match transaction |
| POST | `/api/b2b/reconciliation/auto-match` | JWT | Run auto-matching |
| GET | `/api/b2b/reconciliation/rules` | JWT | List reconciliation rules |
| POST | `/api/b2b/reconciliation/rules` | JWT | Create matching rule |
| GET | `/api/b2b/reconciliation/report` | JWT | Get reconciliation report |

### WhatsApp Business

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/b2b/whatsapp/send` | JWT | Send WhatsApp message |
| GET | `/api/b2b/whatsapp/templates` | JWT | List approved templates |
| POST | `/api/b2b/whatsapp/webhook` | HMAC | Receive delivery reports |
| GET | `/api/b2b/whatsapp/messages` | JWT | Message history |

### Tally Sync

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/b2b/tally-sync/connect` | JWT | Connect Tally account |
| GET | `/api/b2b/tally-sync/status` | JWT | Check sync status |
| POST | `/api/b2b/tally-sync/push` | JWT | Push POs to Tally |
| POST | `/api/b2b/tally-sync/pull` | JWT | Pull from Tally |
| GET | `/api/b2b/tally-sync/logs` | JWT | Sync activity logs |

### Dunning / Reminders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/b2b/dunning/templates` | JWT | List reminder templates |
| POST | `/api/b2b/dunning/templates` | JWT | Create template |
| PUT | `/api/b2b/dunning/templates/:id` | JWT | Update template |
| GET | `/api/b2b/dunning/sequences` | JWT | List active sequences |
| POST | `/api/b2b/dunning/schedule` | JWT | Schedule reminder |
| POST | `/api/b2b/dunning/cancel` | JWT | Cancel reminder |

### Bank Statements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/merchant/bank-statements/parse` | JWT | Parse bank CSV |
| POST | `/api/merchant/bank-statements/upload` | JWT | Upload statement |
| POST | `/api/merchant/bank-statements/reconcile` | JWT | Reconcile transactions |
| GET | `/api/merchant/bank-statements/import-history` | JWT | Import history |

### Reconciliation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/merchant/reconciliation/run` | JWT | Run full reconciliation |
| GET | `/api/merchant/reconciliation/summary` | JWT | Get summary |
| POST | `/api/merchant/reconciliation/manual` | JWT | Manual match |
| POST | `/api/merchant/reconciliation/dispute` | JWT | Raise dispute |
| POST | `/api/merchant/reconciliation/resolve` | JWT | Resolve dispute |

### E-waybill

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/ewaybill` | JWT | List e-waybills |
| POST | `/api/merchant/ewaybill` | JWT | Generate e-waybill |
| GET | `/api/merchant/ewaybill/:number` | JWT | Get e-waybill |
| POST | `/api/merchant/ewaybill/:number/cancel` | JWT | Cancel e-waybill |
| POST | `/api/merchant/ewaybill/:number/vehicle` | JWT | Update vehicle |

### GSTR (GST Returns)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/gstr/gstr1` | JWT | GSTR-1 data |
| GET | `/api/merchant/gstr/gstr2` | JWT | GSTR-2 data |
| GET | `/api/merchant/gstr/gstr3b` | JWT | GSTR-3B summary |
| GET | `/api/merchant/gstr/export/gstr1` | JWT | Export GSTR-1 |

### TDS/TCS

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/tds/calculate` | JWT | Calculate TDS |
| GET | `/api/merchant/tds/records` | JWT | List TDS records |
| POST | `/api/merchant/tds/deposit` | JWT | Deposit TDS |
| POST | `/api/merchant/tds/certificate` | JWT | Generate certificate |
| GET | `/api/merchant/tds/quarterly/:quarter` | JWT | Quarterly summary |

### Vendor Portal

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/merchant/vendor-portal/login` | Token | Vendor login |
| POST | `/api/merchant/vendor-portal/access` | JWT | Generate access |
| GET | `/api/merchant/vendor-portal/dashboard` | Token | Vendor dashboard |
| GET | `/api/merchant/vendor-portal/orders` | Token | Vendor orders |
| GET | `/api/merchant/vendor-portal/payments` | Token | Payment history |
| GET | `/api/merchant/vendor-portal/documents` | Token | Download docs |

### Cash Flow Forecasting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/cash-flow/forecast` | JWT | Generate forecast |
| GET | `/api/merchant/cash-flow/trends` | JWT | Get trends |
| GET | `/api/merchant/cash-flow/compare` | JWT | Forecast vs actual |

### Multi-Bank Aggregation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/multi-bank/accounts` | JWT | List accounts |
| POST | `/api/merchant/multi-bank/accounts` | JWT | Add account |
| DELETE | `/api/merchant/multi-bank/accounts/:id` | JWT | Remove account |
| POST | `/api/merchant/multi-bank/accounts/:id/primary` | JWT | Set primary |
| POST | `/api/merchant/multi-bank/sync-all` | JWT | Sync all |
| GET | `/api/merchant/multi-bank/balance` | JWT | Aggregated balance |
| GET | `/api/merchant/multi-bank/transactions` | JWT | All transactions |
| GET | `/api/merchant/multi-bank/cash-pool` | JWT | Cash pool balance |
| POST | `/api/merchant/multi-bank/allocate` | JWT | Allocate funds |

### Employee Disbursements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchant/employee-payouts/employees` | JWT | List employees |
| POST | `/api/merchant/employee-payouts/employees` | JWT | Add employee |
| GET | `/api/merchant/employee-payouts` | JWT | List disbursements |
| POST | `/api/merchant/employee-payouts` | JWT | Create disbursement |
| POST | `/api/merchant/employee-payouts/batch` | JWT | Bulk disbursement |
| POST | `/api/merchant/employee-payouts/salary-batch` | JWT | Salary batch |
| POST | `/api/merchant/employee-payouts/:id/approve` | JWT | Approve |
| POST | `/api/merchant/employee-payouts/:id/process` | JWT | Process payout |
| GET | `/api/merchant/employee-payouts/batches/list` | JWT | List batches |

---

## Monitoring & Health

### Health Endpoints
All services expose:
- `/health` - Basic liveness
- `/ready` - Readiness (checks dependencies)
- `/health/detailed` - Full status

### Prometheus Metrics
All services expose `/metrics` for Prometheus scraping.

---

## B2B Event Bus Topics

The B2B platform publishes and consumes events via the centralized Event Bus service.

### Published Topics

| Topic | Trigger | Payload |
|-------|---------|---------|
| `b2b.supplier.created` | New supplier onboarded | `{ supplierId, businessName, kycStatus, timestamp }` |
| `b2b.supplier.updated` | Supplier details changed | `{ supplierId, changes, timestamp }` |
| `b2b.supplier.kyc_verified` | KYC verification completed | `{ supplierId, status, verifiedAt }` |
| `b2b.order.created` | New purchase order created | `{ poId, supplierId, totalAmount, status, timestamp }` |
| `b2b.order.sent` | PO sent to supplier | `{ poId, supplierId, sentAt }` |
| `b2b.order.acknowledged` | Supplier acknowledged PO | `{ poId, acknowledgedAt }` |
| `b2b.order.status_changed` | PO status transition | `{ poId, previousStatus, newStatus, changedAt }` |
| `b2b.payment.received` | Payment against PO received | `{ poId, amount, paymentRef, receivedAt }` |
| `b2b.payment.reminder_sent` | Dunning reminder sent | `{ poId, templateId, channel, sentAt }` |
| `b2b.reconciliation.completed` | Bank reconciliation done | `{ matchedCount, unmatchedCount, completedAt }` |
| `b2b.reconciliation.partial_match` | Partial transaction match | `{ transactionId, poId, matchedAmount, remainingAmount }` |
| `b2b.tally.sync_started` | Tally sync job started | `{ companyName, syncType, startedAt }` |
| `b2b.tally.sync_completed` | Tally sync job completed | `{ companyName, recordsSynced, completedAt }` |
| `b2b.tally.sync_failed` | Tally sync job failed | `{ companyName, error, failedAt }` |
| `b2b.credit_line.drawn` | Credit drawn from BNPL | `{ creditLineId, amount, newBalance, drawnAt }` |
| `b2b.credit_line.repaid` | Credit line repayment | `{ creditLineId, amount, newBalance, repaidAt }` |

### Consumed Topics

| Topic | Handler | Action |
|-------|---------|--------|
| `payment.transfer.completed` | B2B Reconciliation | Auto-match payment to PO |
| `wallet.transaction.created` | B2B Dunning | Update reminder status |
| `merchant.settings.updated` | B2B Platform | Refresh merchant configuration |

### Event Schema

All B2B events follow this envelope:

```typescript
interface B2BEvent {
  eventId: string;
  topic: string;
  source: 'b2b-platform';
  timestamp: Date;
  version: '1.0';
  data: Record<string, unknown>;
}
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Generate production secrets (`openssl rand -hex 64`)
- [ ] Verify `.env.example` has placeholder values only
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm test` - all pass
- [ ] Security scan: `npm run security-scan`

### Post-Deployment
- [ ] Verify health endpoint returns `200`
- [ ] Check logs for startup errors
- [ ] Test authentication flow
- [ ] Verify rate limiting works
- [ ] Monitor error rates

---

## Troubleshooting

### Authentication Failures
1. Check `JWT_SECRET` matches across services
2. Verify `INTERNAL_SERVICE_TOKENS_JSON` format is valid JSON
3. Check token expiry hasn't passed

### Database Connection Issues
1. Verify `MONGODB_URI` is correct
2. Check network connectivity to MongoDB
3. Verify credentials if auth enabled

### Rate Limiting
1. Redis must be reachable
2. Check `X-RateLimit-*` headers in response
3. Adjust limits in environment if needed

---

## Contact

For issues or questions, refer to:
- Security: `security@rez.money`
- Platform: `platform@rez.money`
- Documentation: See individual service README.md

---

## Merchant Intelligence Platform

**Cross-merchant analytics and benchmarking service**

### Overview

The Merchant Intelligence Platform enables merchants to:
- Compare performance against industry benchmarks
- View demand heatmaps by locality
- Track trends and patterns
- Discover expansion opportunities

### Repository Structure

| Repository | Type | Purpose |
|-----------|------|---------|
| `REZ-Merchant` | Main | Merchant OS, apps, dashboards |
| `rez-merchant-service` | Submodule | Core API with intelligence routes |
| `rez-merchant-intelligence-aggregator` | Submodule | Aggregation, benchmarking, heatmaps |

### Service URLs

```
# Development
INTELLIGENCE_AGGREGATOR_URL=http://localhost:4011

# Production
INTELLIGENCE_AGGREGATOR_URL=https://rez-merchant-intelligence-aggregator.onrender.com
```

### Architecture

```
Merchant App/Dashboard
        │
        ▼
  Merchant Service
  (Intelligence Routes)
        │
        ▼
  Intelligence Aggregator
  ┌─────────────────────────┐
  │ Aggregation Engine      │
  │ Benchmark Engine       │
  │ Heatmap Service        │
  │ Trends Service        │
  │ Monitoring Service     │
  └─────────────────────────┘
        │
        ▼
  MongoDB + Redis
```

### API Endpoints

#### Market Intelligence (Merchant Service)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/merchant/intelligence/market/heatmap/:city` | JWT | Demand heatmap |
| GET | `/api/v1/merchant/intelligence/market/neighborhood` | JWT | Neighborhood analysis |
| GET | `/api/v1/merchant/intelligence/market/trends/:locality` | JWT | Demand trends |
| GET | `/api/v1/merchant/intelligence/market/benchmark` | JWT | Industry benchmarks |
| GET | `/api/v1/merchant/intelligence/market/opportunities` | JWT | Expansion opportunities |
| GET | `/api/v1/merchant/intelligence/market/trending` | JWT | Trending localities |
| POST | `/api/v1/merchant/intelligence/market/opt-in` | JWT | Join program |
| POST | `/api/v1/merchant/intelligence/market/opt-out` | JWT | Leave program |

#### Intelligence Aggregator - Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/benchmark/industry/:industry` | Industry benchmarks |
| GET | `/api/v1/heatmap/demand/:city` | Demand heatmap |
| GET | `/api/v1/heatmap/neighborhood` | Neighborhood analysis |
| GET | `/api/v1/heatmap/trending` | Trending localities |
| GET | `/api/v1/heatmap/opportunities` | Opportunity areas |
| GET | `/api/v1/trends/demand/:locality` | Demand trends |

#### Intelligence Aggregator - Internal

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/internal/aggregate` | Internal | Submit merchant metrics |
| POST | `/internal/consent` | Internal | Update consent |
| POST | `/internal/run-aggregation` | Internal | Trigger aggregation |

#### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health |
| GET | `/health/ready` | Readiness check |
| GET | `/api/v1/monitoring/metrics` | Full metrics |
| GET | `/api/v1/monitoring/health-score` | Health score (0-100) |
| GET | `/api/v1/monitoring/alerts` | Active alerts |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Intelligence Aggregator** | `rez-merchant-intelligence-aggregator/` | Core service |
| **Market View UI** | `REZ-dashboard/src/app/market/` | Web dashboard |
| **Mobile Market View** | `rez-app-merchant/app/market/` | Mobile app |
| **Consent Flow** | `rez-app-merchant/app/settings/` | GDPR consent |
| **Data Pipeline** | `rez-merchant-service/src/services/` | Order sync |

### Privacy Features

- [x] GDPR-compliant consent management
- [x] Minimum 3 merchants for aggregation
- [x] Differential privacy noise
- [x] No PII in aggregated data
- [x] Opt-in/opt-out controls

### Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic analytics |
| Pro | $49/mo | Benchmarks, trends |
| Business | $199/mo | AI recommendations |
| Enterprise | $999/mo | Full API access |

### Documentation

| Document | Description |
|----------|-------------|
| [docs/FEATURE-CATALOG.md](docs/FEATURE-CATALOG.md) | Complete feature list (45+ services) |
| [docs/MERCHANT-INTELLIGENCE-PLATFORM.md](docs/MERCHANT-INTELLIGENCE-PLATFORM.md) | MI Platform guide |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | API reference |
| [docs/B2B_INTEGRATION_PLAN.md](docs/B2B_INTEGRATION_PLAN.md) | B2B setup guide |
| [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) | Integration guide |
| [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) | Operations guide |
| [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) | Data models |

### Testing

| Type | Location | Coverage |
|------|----------|----------|
| Unit Tests | `tests/unit/` | Auth, Payments, Orders, Loyalty |
| Run Tests | `npm test` | Node.js test runner |

### Security

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Rate Limiting | ✅ |
| Helmet Security Headers | ✅ |
| CORS Protection | ✅ |
| Mongo Sanitization | ✅ |
| Ownership Guards | ✅ |
| Error Sanitization | ✅ |
| Graceful Shutdown | ✅ |

### Recent Updates (v2.1.0)

- Unit tests for critical services
- Security fixes applied
- TypeScript syntax errors fixed
- Graceful shutdown handlers added
- Logger utility created
- Security constants added

---

## Documentation Status (Updated 2026-06-04)

| Metric | Count | Percentage |
|--------|-------|------------|
| Services with README.md | 35 | ~70% |
| Services with Tests | 16 | ~32% |
| Core Industry Services | 100% documented | - |

**Last Updated:** 2026-06-04
**Version:** 8.1.0
