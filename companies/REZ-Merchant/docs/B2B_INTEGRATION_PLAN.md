# ReZ Merchant B2B Integration Plan

**Date:** May 12, 2026
**Status:** Draft
**Priority:** High

---

## Executive Summary

This document outlines the plan to integrate B2B payment collection, supplier management, and reconciliation features from **NexTaBizz** into **ReZ Merchant**. The goal is to create a unified "ReZ Merchant OS" that serves both B2C (sales to consumers) and B2B (procurement from suppliers) needs.

---

## Current State Analysis

### ReZ Merchant (Current)
**Focus:** B2C commerce operations for merchants
- POS & Order Management
- Customer CRM & Loyalty
- Product/Inventory Management
- Payments (Customer → Merchant)
- Analytics & Intelligence
- Multi-location Stores

### NexTaBizz (B2B - to be integrated)
**Focus:** B2B procurement and supplier management
- Supplier RFQ & Catalog
- Purchase Orders
- Credit Lines / BNPL
- Payment Settlement
- Supplier Scoring

---

## Missing Features (Gap Analysis)

### Core B2B Procurement

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Supplier Management** | Manage supplier profiles, contacts, ratings | P0 | Medium |
| **Purchase Orders** | Create, track, manage POs to suppliers | P0 | High |
| **RFQ System** | Request for Quotes from suppliers | P0 | High |
| **Smart Reorder Engine** | Auto-suggest reorders based on signals | P1 | Medium |
| **Inventory Signals** | Low-stock alerts from integrated systems | P1 | Medium |
| **Supplier Catalog** | Browse supplier products & pricing | P1 | Medium |
| **Order Tracking** | Real-time PO status updates | P0 | Low |
| **Variance Alerts** | Received qty vs ordered qty | P2 | Low |

### Financial Operations

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Credit Lines** | BNPL for merchants to pay suppliers | P0 | High |
| **Net Terms** | Pay within agreed days (30/45/60) | P0 | Medium |
| **Partial Prepay** | Pay % upfront, balance on delivery | P0 | Medium |
| **Auto-Reconciliation** | Match UPI/payments to invoices | P0 | High |
| **Virtual Accounts** | Unique payment accounts per merchant | P1 | High |
| **Dunning Sequences** | Automated payment reminders | P1 | Medium |
| **Multi-Entity Support** | P&L per business entity | P2 | High |

### Integrations

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **WhatsApp Business** | Order updates, payment links | P1 | Medium |
| **Accounting Sync** | Export to Tally, QuickBooks | P1 | High |
| **Tally Integration** | Bi-directional sync | P2 | High |
| **GST Reconciliation** | Auto-match GST payments | P2 | High |

---

## Architecture Design

### Data Models

```
┌─────────────────────────────────────────────────────────────────┐
│                        REZ Merchant                             │
├─────────────────────────────────────────────────────────────────┤
│  Existing:                                                      │
│  ├── Merchant (profile, settings)                               │
│  ├── Store (locations)                                          │
│  ├── Product (catalog)                                          │
│  ├── Customer (CRM)                                            │
│  └── Order (sales orders)                                       │
│                                                                  │
│  NEW - B2B Procurement:                                          │
│  ├── Supplier (supplier profiles, contacts)                     │
│  ├── SupplierProduct (catalog items from suppliers)             │
│  ├── PurchaseOrder (POs to suppliers)                           │
│  ├── RFQ (requests for quotes)                                  │
│  ├── CreditLine (BNPL/credit limits)                           │
│  └── PaymentSettlement (outstanding tracking)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Service Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Merchant Mobile App (Expo)                     │
├──────────────────────────────────────────────────────────────────┤
│  Existing:   POS | Orders | Menu | Customers | Analytics        │
│  NEW B2B:     Procurement | Suppliers | POs | RFQs | Payments     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               ReZ Merchant Service (Port 4005)                    │
├──────────────────────────────────────────────────────────────────┤
│  Existing Modules:                                               │
│  ├── ProductModule (inventory management)                        │
│  ├── OrderModule (sales orders)                                  │
│  ├── CustomerModule (CRM)                                        │
│                                                                  │
│  NEW B2B Modules:                                               │
│  ├── SupplierModule (supplier CRUD, ratings)                     │
│  ├── PurchaseOrderModule (PO lifecycle)                         │
│  ├── RFQModule (quote requests)                                  │
│  └── SettlementModule (payables tracking)                       │
└──────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   NexTaBizz     │  │   Payment       │  │   WhatsApp      │
│   Services      │  │   Service       │  │   Business      │
│                 │  │   (BNPL)        │  │   API           │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - scoring-engine│  │ - Credit Lines  │  │ - Notifications  │
│ - reorder-engine│ │ - Net Terms     │  │ - Payment Links │
│ - auto-rfq     │  │ - Auto-Collect  │  │ - Order Updates │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Supplier Management Module
- [ ] Supplier entity & CRUD endpoints
- [ ] Supplier contact management
- [ ] Supplier rating/scoring system
- [ ] Supplier API endpoints in Merchant Service

#### 1.2 Data Models
- [ ] Create shared types in `@rez/shared-types`
- [ ] MongoDB schemas for Supplier, PurchaseOrder, RFQ
- [ ] Migration scripts

**Files to create/modify:**
```
packages/shared-types/src/entities/
├── supplier.ts          # NEW
├── purchase-order.ts    # NEW
├── rfq.ts              # NEW
└── credit-line.ts       # NEW
```

### Phase 2: Purchase Order System (Weeks 3-4)

#### 2.1 Purchase Order Module
- [ ] PO creation (manual + from RFQ)
- [ ] PO status workflow (draft → submitted → confirmed → shipped → received)
- [ ] PO line items management
- [ ] PO history & search

#### 2.2 Order Tracking
- [ ] Real-time status updates
- [ ] Variance tracking (ordered vs received)
- [ ] Delivery timeline

### Phase 3: RFQ & Smart Reorder (Weeks 5-6)

#### 3.1 RFQ System
- [ ] RFQ creation & submission
- [ ] Supplier quote collection
- [ ] Quote comparison & selection
- [ ] RFQ → PO conversion

#### 3.2 Smart Reorder Engine
- [ ] Integration with NexTaBizz reorder-engine
- [ ] Low-stock signal processing
- [ ] Automated reorder suggestions

### Phase 4: Financial Operations (Weeks 7-8)

#### 4.1 Credit Lines & Payment Terms
- [ ] Credit limit management
- [ ] Net Terms configuration (30/45/60 days)
- [ ] Partial/Full prepay logic

#### 4.2 Auto-Reconciliation
- [ ] UPI payment matching to invoices
- [ ] Virtual account generation
- [ ] Payment status tracking

#### 4.3 Dunning Sequences
- [ ] Payment reminder automation
- [ ] Escalation workflows
- [ ] WhatsApp notification integration

### Phase 5: Integrations (Weeks 9-10)

#### 5.1 WhatsApp Business
- [ ] Order update notifications
- [ ] Payment link sharing
- [ ] Invoice delivery

#### 5.2 Accounting Sync
- [ ] Tally export format
- [ ] Bi-directional sync (Phase 2)
- [ ] GST reconciliation

---

## API Endpoints Design

### Supplier Endpoints
```
POST   /api/suppliers                 # Create supplier
GET    /api/suppliers                 # List suppliers
GET    /api/suppliers/:id             # Get supplier
PUT    /api/suppliers/:id             # Update supplier
DELETE /api/suppliers/:id             # Delete supplier
GET    /api/suppliers/:id/products    # Supplier catalog
GET    /api/suppliers/:id/ratings     # Supplier ratings
POST   /api/suppliers/:id/rate        # Rate supplier
```

### Purchase Order Endpoints
```
POST   /api/purchase-orders           # Create PO
GET    /api/purchase-orders           # List POs
GET    /api/purchase-orders/:id       # Get PO
PUT    /api/purchase-orders/:id       # Update PO
POST   /api/purchase-orders/:id/submit # Submit PO
POST   /api/purchase-orders/:id/cancel # Cancel PO
POST   /api/purchase-orders/:id/receive # Mark received
```

### RFQ Endpoints
```
POST   /api/rfqs                      # Create RFQ
GET    /api/rfqs                       # List RFQs
GET    /api/rfqs/:id                  # Get RFQ
POST   /api/rfqs/:id/quotes           # Submit quote (supplier)
GET    /api/rfqs/:id/quotes           # Get quotes
POST   /api/rfqs/:id/accept/:quoteId  # Accept quote → PO
```

### Settlement Endpoints
```
GET    /api/settlements/outstanding   # Outstanding payables
GET    /api/settlements/history       # Payment history
POST   /api/settlements/pay           # Record payment
GET    /api/settlements/reconcile     # Auto-reconcile
```

---

## Mobile App Screens

### New B2B Screens (Expo Router)
```
app/
├── (tabs)/
│   ├── home/            # Existing dashboard
│   ├── procurement/     # NEW - B2B tab
│   │   ├── index.tsx   # Procurement overview
│   │   ├── suppliers.tsx
│   │   ├── orders.tsx   # Purchase orders
│   │   ├── rfqs.tsx
│   │   └── signals.tsx  # Inventory signals
│   ├── payments/        # NEW
│   │   ├── index.tsx
│   │   ├── outstanding.tsx
│   │   └── history.tsx
│   └── settings/
└── pos/
```

---

## Database Schemas

### Supplier Schema
```typescript
interface Supplier {
  _id: ObjectId;
  merchantId: ObjectId;
  name: string;
  email: string;
  phone: string;
  address: Address;
  gstin?: string;
  pan?: string;
  bankDetails?: BankDetails;
  category: string;
  rating: number; // 1-5
  ratingCount: number;
  creditLimit: number;
  paymentTerms: 'net15' | 'net30' | 'net45' | 'net60' | 'prepay';
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}
```

### PurchaseOrder Schema
```typescript
interface PurchaseOrder {
  _id: ObjectId;
  poNumber: string; // PO-2024-00001
  merchantId: ObjectId;
  supplierId: ObjectId;
  rfqId?: ObjectId;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'partial' | 'received' | 'cancelled';
  items: POLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentTerms: string;
  dueDate: Date;
  expectedDelivery: Date;
  actualDelivery?: Date;
  notes?: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface POLineItem {
  productId?: ObjectId;
  supplierProductId?: ObjectId;
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  receivedQty?: number;
  variance?: number;
}
```

---

## Migration Strategy

### Phase 1: Schema Extensions
1. Add B2B fields to existing schemas
2. Create new collections
3. Write migration scripts

### Phase 2: Service Integration
1. Expose new endpoints
2. Keep existing APIs compatible
3. Add feature flags

### Phase 3: UI Updates
1. Add B2B screens to mobile app
2. Update dashboard with procurement section
3. Test with pilot merchants

### Phase 4: NexTaBizz Integration
1. Connect to scoring-engine
2. Connect to reorder-engine
3. Connect to payment-settlement service

---

## Dependencies

### Internal Services
- ReZ Merchant Service (4005) - Core API
- ReZ Payment Service - For settlement
- ReZ Intent Graph - For analytics

### External Services
- WhatsApp Business API
- Tally API (if bi-directional)
- Razorpay - For payment collection

### Shared Packages
- @rez/shared-types - Data models
- @rez/ui - UI components

---

## Testing Plan

### Unit Tests
- [ ] Supplier CRUD operations
- [ ] PO status transitions
- [ ] Payment calculation logic
- [ ] Dunning trigger logic

### Integration Tests
- [ ] PO → Invoice flow
- [ ] Payment → Reconciliation flow
- [ ] WhatsApp notification delivery

### E2E Tests
- [ ] Full PO lifecycle
- [ ] Multi-supplier RFQ
- [ ] Payment settlement

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration complexity | High | Phased rollout, backup before migration |
| Payment reconciliation bugs | Critical | Extensive testing, feature flags |
| Supplier data privacy | High | Encryption, access controls |
| Performance at scale | Medium | Indexing, pagination |
| WhatsApp API rate limits | Low | Queue-based notifications |

---

## Success Metrics

- Time to create PO: < 2 minutes
- Payment reconciliation accuracy: > 99%
- Dunning recovery rate: > 30%
- Supplier onboarding: < 5 minutes
- Auto-reconciliation match rate: > 95%

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Set up development environment
3. [ ] Create shared types package
4. [ ] Build Supplier Management first
5. [ ] Iterate with pilot merchants
