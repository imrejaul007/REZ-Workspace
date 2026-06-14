# REZ Merchant Services Documentation

**Date:** May 22, 2026  
**Company:** REZ Merchant  
**Purpose:** Complete technical documentation for all merchant services

---

## Table of Contents

1. [Overview](#overview)
2. [KDS Service (Kitchen Display)](#kds-service)
3. [Restaurant POS](#restaurant-pos)
4. [Order Flow Service](#order-flow-service)
5. [Inventory Service](#inventory-service)
6. [Staff Service](#staff-service)
7. [Multi-Outlet Service](#multi-outlet-service)
8. [Aggregator Webhook Service](#aggregator-webhook-service)
9. [Delivery Tracking Service](#delivery-tracking-service)
10. [Printer Config Manager](#printer-config-manager)
11. [Merchant Dashboard](#merchant-dashboard)
12. [API Reference](#api-reference)
13. [Getting Started](#getting-started)

---

## Overview

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REZ MERCHANT ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │  KDS Mobile  │   │   POS App    │   │   Dashboard   │     │
│  │  (Expo)      │   │   (Expo)     │   │   (Next.js)  │     │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘     │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                          │                                   │
│         ┌────────────────┴────────────────┐               │
│         │         MERCHANT GATEWAY           │               │
│         │  (RABTUL Auth, Auth, Payments)   │               │
│         └────────────────┬────────────────┘               │
│                          │                                   │
│  ┌───────────────────────┼───────────────────────┐         │
│  │                       │                       │         │
│  ▼                       ▼                       ▼         │
│ ┌────────┐          ┌────────────┐          ┌────────────┐ │
│ │  KDS  │          │Restaurant │          │Aggregator │ │
│ │Service│          │   POS    │          │Integration│ │
│ │(4014) │          │ Service  │          │ Service   │ │
│ └────────┘          └────────────┘          └────────────┘ │
│                                                                 │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐          │
│  │ Printer   │   │ Merchant  │   │  CorpPerks │          │
│  │ Service   │   │Intelligence│  │  Bridge    │          │
│  └────────────┘   └────────────┘   └────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Port Registry

| Service | Port | Status | Location |
|---------|------|--------|----------|
| KDS Service | 4014 | **NEW** | `RABTUL-Technologies/REZ-kds-service/` |
| Merchant Service | 4003 | Existing | `REZ-Merchant/rez-merchant-service/` |
| Merchant Intelligence | 4122 | Existing | `REZ-Merchant/rez-merchant-intelligence-service/` |
| Restaurant POS | Internal | Partial | `REZ-Merchant/industry-os/rez-restaurant-pos-service/` |

---

## KDS Service

**Location:** `RABTUL-Technologies/REZ-kds-service/`  
**Port:** 4014  
**Status:** ✅ Fully Implemented

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Order Queue | ✅ | Display all active orders |
| Station Filtering | ✅ | Filter by kitchen station |
| Timer with Alerts | ✅ | Color-coded wait times |
| Item Bump Flow | ✅ | Mark items as ready |
| Order Bump | ✅ | Complete order for KDS |
| Voice Announcements | ✅ | TTS for new orders |
| Push Notifications | ✅ | Real-time alerts |
| Audio Feedback | ✅ | Sound effects |
| Offline Support | ✅ | Local caching + queue |
| WebSocket Updates | ✅ | Real-time sync |

### API Endpoints

```
GET    /api/v1/kds/orders                    # Get all orders
GET    /api/v1/kds/orders/:orderId          # Get single order
POST   /api/v1/kds/orders                    # Create order
PATCH  /api/v1/kds/orders/:orderId/items/:itemId/status  # Update item
POST   /api/v1/kds/orders/:orderId/bump      # Bump order (mark ready)
POST   /api/v1/kds/orders/:orderId/recall    # Recall order
POST   /api/v1/kds/orders/:orderId/complete   # Complete order
POST   /api/v1/kds/orders/:orderId/cancel    # Cancel order
POST   /api/v1/kds/orders/:orderId/notes     # Add note
GET    /api/v1/kds/stations/:station/orders  # Get by station
GET    /api/v1/kds/stats                     # Get KDS stats
GET    /api/v1/kds/sync                       # Sync orders
```

### Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/rez-kds
PORT=4014
LOG_LEVEL=info
```

---

## Restaurant POS

**Location:** `REZ-Merchant/industry-os/rez-restaurant-pos-service/`  
**Status:** ⚠️ Partial - Core billing complete, missing KDS/Printer integration

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Billing | ✅ | Full tax/discount calculation |
| Payments | ✅ | Cash/Card/UPI/Wallet via RABTUL |
| GST Invoice | ✅ | CGST/SGST/IGST |
| Bill Splitting | ✅ | By item, person, equal |
| Table Management | ✅ **NEW** | Full table service |
| KDS Integration | ✅ **NEW** | Kitchen display sync |
| Printer Service | ✅ **NEW** | ESC/POS receipts & KOT |

### Services Added

#### PrinterService

```typescript
import { printerService } from './services/PrinterService'

// Generate & print receipt
await printerService.printReceipt({
  restaurantName: 'My Restaurant',
  address: '123 Main St',
  phone: '+91 98765 43210',
  orderNumber: 'ORD001',
  date: new Date(),
  items: [...],
  subtotal: 500,
  tax: 45,
  total: 545,
  paymentMethod: 'UPI'
})

// Generate & print KOT
await printerService.printKOT({
  orderNumber: 'ORD001',
  tableNumber: 'T5',
  items: [...],
  priority: 'normal'
})

// Open cash drawer
await printerService.openDrawer()
```

#### TableService

```typescript
import { tableService } from './services/TableService'

// Seat guests
tableService.seatGuests('table-1', 4, 'order-123')

// Get available tables
const tables = tableService.getAvailableTables(4)

// Get stats
const stats = tableService.getStats()
// { total: 10, available: 6, occupied: 3, ... }
```

#### KDSIntegration

```typescript
import { createKDSIntegration } from './services/KDSIntegration'

const kds = createKDSIntegration(merchantId, storeId)
kds.connect()

// Listen for updates
kds.on('order:created', (order) => console.log('New order:', order))

// Create KDS order
await kds.createOrder({
  items: [{ name: 'Burger', quantity: 2, station: 'grill' }],
  tableNumber: 'T5'
})

// Bump when ready
await kds.bumpOrder(orderId)
```

---

## Order Flow Service

**Location:** `industry-os/rez-restaurant-pos-service/src/services/OrderFlowService.ts`  
**Purpose:** Complete POS → KDS → Kitchen → Payment flow

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Start Order | ✅ | Creates KDS order + prints KOT |
| Complete Order | ✅ | Bumps KDS + prints receipt |
| Cancel Order | ✅ | Cancels KDS order |
| Recall Order | ✅ | Puts back to kitchen |
| Duplicate Receipt | ✅ | Re-print receipt |

### Usage

```typescript
import { OrderFlowService } from './services/OrderFlowService'

const flow = new OrderFlowService({
  merchantId: 'merchant-123',
  storeId: 'store-456',
  autoPrintKOT: true,
  autoPrintReceipt: true
})

flow.connect()

// When bill is opened
const result = await flow.startOrder([
  { name: 'Burger', quantity: 2, station: 'grill', price: 250 }
])

// When payment received
await flow.completeOrder(
  result.kdsOrder.orderId,
  'UPI',
  { name: 'My Restaurant', address: '123 Main St', phone: '+91...' },
  [...items],
  { subtotal: 500, tax: 45, discount: 0, total: 545 }
)
```

---

## Inventory Service

**Location:** `industry-os/rez-restaurant-pos-service/src/services/InventoryService.ts`  
**Purpose:** Stock tracking, alerts, and reorder management

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Ingredients | ✅ | Track stock levels |
| Stock Movements | ✅ | Purchase, usage, waste |
| Low Stock Alerts | ✅ | Automatic alerts |
| Recipes | ✅ | Cost per portion |
| Purchase Suggestions | ✅ | Reorder recommendations |

### Usage

```typescript
import { inventoryService } from './services/InventoryService'

// Get inventory stats
const stats = inventoryService.getStats()
// { totalItems: 50, lowStock: 5, critical: 2, ... }

// Adjust stock
inventoryService.adjustStock(
  'ing-abc123',
  10, // quantity
  'purchase', // type
  'staff-123',
  'Supplier delivery'
)

// Get purchase suggestions
const suggestions = inventoryService.getPurchaseSuggestions()
// [{ ingredient: {...}, suggested: 25 }]
```

---

## Staff Service

**Location:** `industry-os/rez-restaurant-pos-service/src/services/StaffService.ts`  
**Purpose:** Staff management, shifts, attendance, payroll

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Staff Management | ✅ | Add, update, deactivate |
| Shift Scheduling | ✅ | Daily/weekly schedules |
| Check In/Out | ✅ | PIN-based attendance |
| Attendance Tracking | ✅ | Daily attendance records |
| Payroll Calculation | ✅ | Salary, overtime, bonuses |

### Roles

- `owner` - Full access
- `manager` - Manage staff, shifts
- `captain` - Manage orders
- `server` - View orders
- `chef` / `kitchen` - View KDS
- `cashier` - POS access
- `helper` - Basic access

### Usage

```typescript
import { staffService } from './services/StaffService'

// Add staff
const staff = staffService.addStaff({
  name: 'John Doe',
  phone: '+919876543210',
  role: 'chef',
  salary: 25000
})

// Schedule shift
staffService.scheduleShift({
  staffId: staff.id,
  date: new Date(),
  startTime: '09:00',
  endTime: '18:00'
})

// Check in/out
const shift = staffService.scheduleShift(...)
staffService.checkIn(shift.id)
staffService.checkOut(shift.id)

// Calculate payroll
const payroll = staffService.calculatePayroll(
  staff.id,
  new Date('2026-05-01'),
  new Date('2026-05-15')
)
```

---

## Merchant Dashboard

**Location:** `REZ-Merchant/REZ-dashboard/`  
**Status:** ⚠️ UI works, API routes now use deterministic data

### Features

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | ✅ | Metrics, charts |
| Revenue Chart | ✅ | 30-day trend |
| Campaign Performance | ✅ | Bar chart + metrics |
| Real-time Updates | ✅ | 5-second polling |
| Market Intelligence | ⚠️ | **Fixed** - UI components added |
| Sidebar Navigation | ⚠️ | Links now working |
| Date Filters | ⏳ | Not implemented |
| Export | ⏳ | Not implemented |

### API Routes

```
GET  /api/analytics     # Key metrics + funnel
GET  /api/revenue      # Revenue history
GET  /api/realtime     # Live metrics
GET  /api/campaigns    # Campaign performance
```

### UI Components Added

```typescript
// Fixed missing imports in market/page.tsx
import { Card, Badge, Button, Tabs, Skeleton, Progress } from '@/components/ui'
```

---

## Aggregator Integration

**Location:** `REZ-Merchant/rez-merchant-integrations/`  
**Status:** ⚠️ Adapters work, Reconciliation **NEW**

### Adapters

| Adapter | Status | Features |
|---------|--------|----------|
| Swiggy | ✅ | Orders, Status, Menu |
| Zomato | ✅ | Orders, Status, Menu |

### Features Fixed

| Feature | Status | Before |
|---------|--------|--------|
| updateItemAvailability | ✅ Fixed | ❌ Threw "Not implemented" |
| bulkUpdateAvailability | ✅ Added | ❌ Not available |
| Reconciliation | ✅ Added | ❌ Missing |
| Commission Tracking | ✅ Added | ❌ Missing |

### Reconciliation Service

```typescript
import { reconciliationService } from './services/reconciliation'

// Reconcile a period
const result = await reconciliationService.reconcile(
  merchantId,
  storeId,
  'swiggy',
  startDate,
  endDate,
  localOrders,    // From local POS
  aggregatorOrders // From Swiggy API
)

// Result
{
  reconciliationId: 'RECON-abc123',
  status: 'discrepancies_found',
  discrepancies: [
    { type: 'missing_local', aggregatorOrderId: '...', amount: 350 },
    { type: 'amount_mismatch', localOrderId: '...', amount: 15 }
  ],
  settlement: {
    totalLocalRevenue: 50000,
    totalPayout: 48500,
    netDiscrepancy: 1500
  }
}

// Get analytics
const analytics = await reconciliationService.getCommissionAnalytics(
  merchantId, storeId, startDate, endDate
)
// { byAggregator: { swiggy: {...}, zomato: {...} }, total: {...} }
```

---

## Merchant Intelligence

**Location:** `REZ-Merchant/rez-merchant-intelligence-service/`  
**Status:** Existing

### Services

| Service | Description |
|---------|-------------|
| Merchant Intelligence Aggregator | Market data aggregation |
| Merchant Copilot | AI assistant for merchants |
| Competitive Intelligence | Competitor analysis |

---

## API Reference

### KDS Service API

#### Create Order

```http
POST /api/v1/kds/orders
Content-Type: application/json

{
  "merchantId": "merchant-123",
  "storeId": "store-456",
  "items": [
    { "name": "Burger", "quantity": 2, "station": "grill" }
  ],
  "tableNumber": "T5",
  "customerName": "John",
  "orderType": "dine_in",
  "priority": "normal"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": "KDS-123456789-abc123",
    "orderNumber": "ORD1ABC2D",
    "status": "new",
    "items": [...],
    "createdAt": "2026-05-22T12:00:00Z"
  }
}
```

#### Update Item Status

```http
PATCH /api/v1/kds/orders/:orderId/items/:itemId/status
Content-Type: application/json

{ "status": "preparing" }
```

### Printer Service API

#### Print Receipt

```typescript
const job = await printerService.printReceipt({
  restaurantName: 'My Restaurant',
  orderNumber: 'ORD001',
  items: [
    { name: 'Burger', quantity: 2, price: 250 }
  ],
  subtotal: 500,
  tax: 45,
  total: 545,
  paymentMethod: 'UPI'
})
// job.status === 'completed'
```

### Table Service API

```typescript
// Get stats
const stats = tableService.getStats()
// {
//   total: 10,
//   available: 6,
//   occupied: 3,
//   reserved: 1,
//   cleaning: 0,
//   avgTurnTime: 45,
//   currentOccupancy: 30
// }

// Find best table
const table = tableService.findBestTable(4)
// Seats 4 guests at closest capacity match
```

---

## Getting Started

### 1. Start KDS Service

```bash
cd RABTUL-Technologies/REZ-kds-service
npm install
npm run dev
# Runs on port 4014
```

### 2. Connect Mobile App

Update `REZ-kds-mobile/src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_KDS_API_URL || 'http://YOUR_IP:4014'
```

### 3. Add Printers

```typescript
import { printerService } from './services/PrinterService'

printerService.addPrinter({
  id: 'receipt-printer',
  name: 'EPSON TM-T82',
  type: 'receipt',
  ip: '192.168.1.100',
  port: 9100,
  isDefault: true
})
```

---

## Testing

### Test KDS API

```bash
# Create order
curl -X POST http://localhost:4014/api/v1/kds/orders \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "test-merchant",
    "storeId": "test-store",
    "items": [{"name": "Test", "quantity": 1, "station": "grill"}]
  }'

# Get orders
curl http://localhost:4014/api/v1/kds/orders?storeId=test-store

# Bump order
curl -X POST http://localhost:4014/api/v1/kds/orders/KDS-xxx/bump
```

---

## Troubleshooting

### KDS Mobile Can't Connect

1. Check KDS service is running: `curl http://localhost:4014/health`
2. Verify IP address in mobile app
3. Check firewall allows port 4014

### Printers Not Working

1. Verify printer IP/port in PrinterService config
2. Check network connectivity to printer
3. Test with: `printerService.getQueueStatus()`

### Reconciliation Showing Discrepancies

1. Check order sync between POS and aggregator
2. Verify commission rates match
3. Review timeline: some orders may be in different periods

---

## Next Steps

1. **Production Database:** Replace in-memory storage with MongoDB
2. **WebSocket SSL:** Configure for production HTTPS
3. **Printer Pool:** Support multiple printers
4. **Analytics Dashboard:** Connect to Merchant Intelligence
5. **POS Integration:** Wire up full order flow

---

## Multi-Outlet Service

**Location:** `industry-os/.../MultiOutletService.ts`  
**Purpose:** Chain management, franchise controls, regional pricing

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Outlet Management | ✅ | Add, update, deactivate outlets |
| Regional Pricing | ✅ | Different pricing by region |
| Menu Overrides | ✅ | Outlet-specific menu changes |
| Chain Analytics | ✅ | Performance across all outlets |
| Campaign Targeting | ✅ | Select outlets for campaigns |

### Usage

```typescript
import { multiOutletService } from './services/MultiOutletService'

// Get chain analytics
const analytics = multiOutletService.getChainAnalytics(
  'merchant-001',
  new Date('2026-05-01'),
  new Date('2026-05-22')
)

// Set regional pricing
multiOutletService.setRegionalPricing({
  region: 'South',
  minOrder: 200,
  deliveryFee: 30,
  freeDeliveryThreshold: 500,
  taxRate: 0.18,
  currency: 'INR'
})

// Menu override for specific outlet
multiOutletService.setMenuOverride({
  outletId: 'outlet-blr',
  itemId: 'item-biryani',
  price: 249 // Lower than base price
})
```

---

## Aggregator Webhook Service

**Location:** `industry-os/.../AggregatorWebhookService.ts`  
**Purpose:** Handle push notifications from Swiggy/Zomato

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Webhook Receipt | ✅ | Receive push notifications |
| Event Handlers | ✅ | order.created, status_changed, cancelled |
| Signature Verification | ✅ | HMAC-SHA256 validation |
| Retry Logic | ✅ | Failed handler retry |
| Webhook Logs | ✅ | Full audit trail |

### Usage

```typescript
import { aggregatorWebhookService } from './services/AggregatorWebhookService'

// Register custom handler
aggregatorWebhookService.registerHandler({
  aggregator: 'swiggy',
  eventType: 'order.created',
  callback: async (payload) => {
    // Create local order
    await createLocalOrder(payload.data)
    // Send to KDS
    await sendToKDS(payload.data)
  }
})

// Set secret for verification
aggregatorWebhookService.setSecretKey('swiggy', 'your-webhook-secret')

// Health check
const health = aggregatorWebhookService.getHealth()
// { handlers: { total: 6, enabled: 6 }, logs: {...} }
```

---

## Delivery Tracking Service

**Location:** `industry-os/.../DeliveryTrackingService.ts`  
**Purpose:** Track orders from kitchen to customer

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Order Tracking | ✅ | Real-time delivery status |
| Partner Assignment | ✅ | Assign delivery partners |
| Location Updates | ✅ | Live GPS tracking |
| ETA Calculation | ✅ | Automatic ETA updates |
| Aggregator Sync | ✅ | Sync with Swiggy/Zomato |
| Customer Tracking | ✅ | Shareable tracking URL |

### Usage

```typescript
import { deliveryTrackingService } from './services/DeliveryTrackingService'

// Create delivery
const delivery = deliveryTrackingService.createDelivery({
  orderId: 'order-123',
  aggregator: 'swiggy',
  customerName: 'John',
  customerPhone: '+919876543210',
  deliveryAddress: '123 Main St, Bangalore',
  pickupLocation: { lat: 12.97, lng: 77.59 },
  dropoffLocation: { lat: 12.95, lng: 77.60 }
})

// Assign partner
deliveryTrackingService.assignPartner(
  delivery.id,
  'partner-456',
  'Ramesh Kumar',
  '+919876543211'
)

// Update location
deliveryTrackingService.updatePartnerLocation(delivery.id, {
  lat: 12.96,
  lng: 77.595,
  timestamp: new Date()
})

// Customer tracking URL
const trackingUrl = deliveryTrackingService.generateTrackingUrl(delivery.id)
// https://rez.money/track/del-abc123
```

---

## Printer Config Manager

**Location:** `industry-os/.../PrinterConfigManager.ts`  
**Purpose:** Manage printer network with real IPs

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| Printer Management | ✅ | Add, update, remove printers |
| Network Discovery | ✅ | Auto-scan for printers |
| Connection Testing | ✅ | TCP connection check |
| Auto Failover | ✅ | Secondary printer on failure |
| Print Groups | ✅ | Group printers for routing |
| Job Queue | ✅ | Manage print jobs |

### Usage

```typescript
import { printerConfigManager } from './services/PrinterConfigManager'

// Add printer with real IP
printerConfigManager.addPrinter({
  name: 'Kitchen KOT Printer',
  type: 'kot',
  model: 'epson-tm82',
  ip: '192.168.1.101',
  port: 9100,
  station: 'grill',
  isDefault: true,
  settings: {
    encoding: 'utf8',
    paperWidth: 80,
    cutAfterPrint: false,
    openDrawerOnPrint: false,
    soundOnPrint: true
  }
})

// Test connection
const isOnline = await printerConfigManager.testConnection('printer-abc')

// Scan network for printers
const discovered = await printerConfigManager.scanNetwork()

// Create print group
const group = printerConfigManager.createGroup('Kitchen', [
  'printer-kot-1',
  'printer-kot-2'
], true) // Auto failover

// Print with failover
const job = await printerConfigManager.print('printer-kot-1', kotContent)
```

### Network Discovery

```typescript
// Scan common IP range for printers
const printers = await printerConfigManager.scanNetwork()
// Returns discovered printers with IP addresses
```

### Printer Models Supported

- `epson-tm82` - Epson TM-T82
- `epson-tm88` - Epson TM-T88
- `epson-t20` - Epson T20
- `pos-80` - Generic 80mm POS printer
- `custom` - Custom printer

---

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REZ RESTAURANT OS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Mobile   │     │     POS     │     │ Dashboard   │       │
│  │  (KDS)     │     │  (Billing) │     │  (Admin)   │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                    │                    │                │
│         └────────────────────┼────────────────────┘                │
│                              │                                      │
│         ┌────────────────────▼────────────────────┐               │
│         │           ORDER FLOW SERVICE              │               │
│         │  POS → KDS → Kitchen → Payment          │               │
│         └────────────────────┬────────────────────┘               │
│                              │                                      │
│  ┌──────────────────────────┼──────────────────────────┐         │
│  │                          │                          │         │
│  ▼                          ▼                          ▼         │
│ ┌────────┐          ┌────────────┐          ┌────────────┐     │
│ │  KDS   │          │  Printer   │          │ Aggregator │     │
│ │Service │          │  Manager   │          │ Webhooks   │     │
│ │ (4014) │          │  (Network)│          │            │     │
│ └────────┘          └────────────┘          └────────────┘     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐         │
│  │                  CORE SERVICES                         │         │
│  │  Inventory │ Staff │ MultiOutlet │ Delivery │ Table │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐         │
│  │                  RABTUL SERVICES                      │         │
│  │  Auth │ Payment │ Wallet │ Notifications │ Analytics │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Matrix

| Service | Port | Status | Production Ready |
|---------|------|--------|-----------------|
| KDS Backend | 4014 | ✅ | ⏳ Needs MongoDB |
| POS Billing | - | ✅ | ✅ |
| Aggregator | - | ✅ | ⏳ Needs keys |
| Inventory | - | ✅ | ⏳ Needs DB |
| Staff | - | ✅ | ⏳ Needs DB |
| Multi-Outlet | - | ✅ | ⏳ Needs DB |
| Delivery | - | ✅ | ⏳ Needs GPS |
| Printer Network | - | ✅ | ✅ |

---

## Quick Start Commands

```bash
# Start KDS Service
cd RABTUL-Technologies/REZ-kds-service && npm run dev

# Start POS
cd industry-os/rez-restaurant-pos-service && npm run dev

# Start Dashboard
cd REZ-Merchant/REZ-dashboard && npm run dev

# Test Printer Connection
curl -X POST http://localhost:4000/api/printers/test \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.100","port":9100}'

# Simulate Aggregator Order
curl -X POST http://localhost:4000/api/webhooks/swiggy \
  -H "Content-Type: application/json" \
  -d '{"event_type":"order.created","order_id":"SW-123"}'
```
