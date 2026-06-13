# Restaurant & Food Services Industry OS - Integration Specification

**Version:** 1.0  
**Date:** June 12, 2026  
**Industry:** Restaurant & Food Services  
**Key Integration Point:** REZ POS ↔ REZ Business Copilot (Natural Language Analytics)

---

## Table of Contents

1. [Industry Overview](#1-industry-overview)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Industry Overview

### 1.1 Industry Challenges

| Challenge | Impact | Current State |
|-----------|--------|---------------|
| Fragmented point solutions | High operational complexity | 8+ disconnected systems |
| Manual inventory tracking | 15-25% food waste | Reactive, not predictive |
| Kitchen-bypass coordination | 10-20 min average wait time | Siloed KDS and POS |
| Customer data silos | Lost personalization opportunities | No unified customer view |
| Real-time decision making | Missed revenue opportunities | Batch reporting, delayed insights |
| Staff scheduling complexity | 20-30% overstaffing costs | Excel-based, intuition-driven |
| Multi-channel ordering | Order accuracy issues | Separate workflows per channel |

### 1.2 Current Product Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESTAURANT & FOOD SERVICES OS                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Consumer Facing                    Merchant Facing                       │
│  ┌─────────────┐                   ┌─────────────────────────────────┐│
│  │ REZ QR Cloud│                   │ REZ POS (4013)                  ││
│  │ REZ Loyalty │                   │ REZ KDS (4014)                  ││
│  │ REZ Consumer│                   │ Kitchen AI (4082)               ││
│  └─────────────┘                   │ REZ Inventory (4010)           ││
│                                     │ REZ Dashboard (4060)            ││
│                                     │ REZ Staff (4091)                ││
│                                     │ REZ Business Copilot (4022)    ││
│                                     └─────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Integration Opportunity

| Opportunity | Value Driver | Integration Complexity |
|-------------|--------------|----------------------|
| Unified order-to-kitchen flow | 30% reduction in wait times | Medium |
| Predictive inventory | 20% reduction in waste | High |
| Real-time customer recognition | 15% increase in repeat visits | Medium |
| Natural language analytics | 50% faster insights access | Low |
| Cross-channel loyalty | 25% increase in loyalty engagement | Medium |
| AI-powered menu optimization | 10% increase in average order value | High |

---

## 2. Product Capability Matrix

### 2.1 REZ POS (Point of Sale)

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4013, 4081 |
| **Core Capabilities** | Order management, billing, table management, split bills, multi-payment, GST invoicing |
| **Data Produced** | Orders, transactions, payments, bills, customer orders history, item sales data, table turn times |
| **Data Needed** | Menu items, customer profiles, loyalty points, inventory levels, staff schedules |
| **Current Integration** | RABTUL Pay (payments), RABTUL Wallet (rewards), KDS (order routing) |
| **API Base URL** | `http://localhost:4013` or `REZ_POS_SERVICE_URL` |

**Key Endpoints:**
```
POST /api/orders                 - Create order
GET  /api/orders/:id            - Get order
POST /api/orders/:id/pay        - Process payment
GET  /api/orders/:id/bill       - Generate bill
POST /api/tables/:id/status     - Update table status
GET  /api/analytics/sales       - Sales analytics
```

### 2.2 REZ KDS (Kitchen Display System)

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4014, 4080 |
| **Core Capabilities** | Real-time order display, station routing, bump management, timing alerts, priority ordering |
| **Data Produced** | Kitchen timestamps, order completion times, station performance, item cook times |
| **Data Needed** | Orders from POS, menu item cook times, station configurations, staff assignments |
| **Current Integration** | REZ POS (order intake), Kitchen AI (routing optimization) |
| **API Base URL** | `http://localhost:4014` or `REZ_KDS_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/kds/orders            - Get active kitchen orders
POST /api/kds/:id/bump          - Bump completed order
GET  /api/kds/stations          - Get station configurations
POST /api/kds/stations/:id/assign - Assign station
GET  /api/kds/stats/performance - Station performance metrics
```

### 2.3 REZ QR Cloud

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4058, 4063 |
| **Core Capabilities** | Table QR generation, digital menu, contactless ordering, payment integration |
| **Data Produced** | QR scans, session data, order items, customer preferences |
| **Data Needed** | Menu data, pricing, table configurations, available items |
| **Current Integration** | REZ POS (order sync), REZ Menu (catalog display) |
| **API Base URL** | `http://localhost:4058` or `REZ_QR_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/tables/:id/qr          - Generate table QR
GET  /api/qr/:tableId/session   - Start QR session
GET  /api/qr/:tableId/menu       - Get menu for table
POST /api/qr/:tableId/order      - Create QR order
GET  /api/qr/orders/:id          - Get order status
```

### 2.4 Kitchen AI

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4082 |
| **Core Capabilities** | Order routing optimization, prep time prediction, station load balancing, bottleneck detection |
| **Data Produced** | Routing decisions, predicted cook times, station utilization, workflow recommendations |
| **Data Needed** | Order details, menu item complexity scores, station capabilities, current load |
| **Current Integration** | REZ KDS (execution), REZ Inventory (ingredient availability) |
| **API Base URL** | `http://localhost:4082` or `KITCHEN_AI_SERVICE_URL` |

**Key Endpoints:**
```
POST /api/route/order            - Get optimal routing for order
GET  /api/predictions/cook-time/:itemId - Predict cook time
GET  /api/stations/utilization   - Get station load
POST /api/recommendations/optimize - Get workflow optimization
```

### 2.5 REZ Inventory

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4010, 4625 |
| **Core Capabilities** | Stock tracking, expiry alerts, reorder points, supplier management, waste logging |
| **Data Produced** | Stock levels, consumption patterns, waste reports, reorder alerts |
| **Data Needed** | Menu item recipes (BOM), sales data, supplier info, expiry dates |
| **Current Integration** | REZ POS (sales deduction), REZ Procurement (reorders), RABTUL (payments) |
| **API Base URL** | `http://localhost:4010` or `REZ_INVENTORY_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/inventory/stock        - Get current stock levels
POST /api/inventory/adjust      - Adjust stock
GET  /api/inventory/alerts       - Get reorder alerts
POST /api/inventory/waste        - Log waste
GET  /api/inventory/expiring     - Get expiring items
POST /api/purchase-orders       - Create purchase order
```

### 2.6 REZ Dashboard

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4060 |
| **Core Capabilities** | Real-time analytics, revenue tracking, customer insights, operational metrics |
| **Data Produced** | Aggregated metrics, reports, trend analysis, forecasts |
| **Data Needed** | Orders, payments, inventory, staff data, customer data from all sources |
| **Current Integration** | All services (data aggregation), REZ Business Copilot (insights) |
| **API Base URL** | `http://localhost:4060` or `REZ_DASHBOARD_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/dashboard/realtime     - Get real-time metrics
GET  /api/dashboard/revenue      - Revenue analytics
GET  /api/dashboard/customers    - Customer analytics
GET  /api/dashboard/operations   - Operational metrics
GET  /api/reports/:type          - Generate specific reports
```

### 2.7 REZ Loyalty

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4037, 4071 |
| **Core Capabilities** | Points accumulation, tier management, rewards redemption, multi-brand loyalty |
| **Data Produced** | Points transactions, tier changes, reward redemptions, engagement metrics |
| **Data Needed** | Customer identification, purchase amounts, available rewards |
| **Current Integration** | RABTUL Wallet (points storage), REZ POS (redemption), REZ Consumer (app) |
| **API Base URL** | `http://localhost:4037` or `REZ_LOYALTY_SERVICE_URL` |

**Key Endpoints:**
```
POST /api/loyalty/points/earn    - Earn points
POST /api/loyalty/points/redeem - Redeem points
GET  /api/loyalty/tiers          - Get tier info
GET  /api/loyalty/rewards        - Get available rewards
POST /api/loyalty/members        - Register member
GET  /api/loyalty/members/:id    - Get member details
```

### 2.8 REZ Staff

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4091 |
| **Core Capabilities** | Staff management, shift scheduling, attendance tracking, role management |
| **Data Produced** | Schedules, attendance records, performance metrics, labor costs |
| **Data Needed** | Shift templates, role configurations, inventory alerts (staffing recommendations) |
| **Current Integration** | REZ Payroll (salary processing), REZ KDS (station assignment) |
| **API Base URL** | `http://localhost:4091` or `REZ_STAFF_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/staff                  - List staff
POST /api/staff/checkin          - Staff check-in
POST /api/staff/checkout         - Staff check-out
GET  /api/schedule               - Get schedule
POST /api/schedule               - Create schedule
GET  /api/attendance/summary     - Attendance summary
```

### 2.9 REZ Business Copilot

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4022 |
| **Core Capabilities** | Natural language analytics, AI-powered insights, anomaly detection, predictive recommendations |
| **Data Produced** | Natural language responses, insights summaries, trend alerts, recommendations |
| **Data Needed** | Data from all other REZ services (orders, inventory, staff, customers, loyalty) |
| **Current Integration** | All REZ services (data ingestion), HOJAI AI (intelligence layer) |
| **API Base URL** | `http://localhost:4022` or `REZ_COPILOT_SERVICE_URL` |

**Key Endpoints:**
```
POST /api/copilot/query          - Natural language query
GET  /api/copilot/insights       - Get current insights
GET  /api/copilot/anomalies       - Get detected anomalies
POST /api/copilot/recommend      - Get recommendations
GET  /api/copilot/forecast        - Get forecasts
```

---

## 3. Twin Architecture

### 3.1 Restaurant Twin (Enterprise Twin)

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Enterprise Digital Twin |
| **Twin ID Pattern** | `restaurant:{merchantId}:{locationId}` |
| **Data Model** | `{ merchantId, locationId, name, cuisine, capacity, operatingHours, features, status, metrics }` |

**Attributes:**
```typescript
interface RestaurantTwin {
  id: string;
  merchantId: string;
  locationId: string;
  name: string;
  cuisineType: string[];
  totalTables: number;
  totalSeats: number;
  operatingHours: { day: string; open: string; close: string }[];
  features: {
    delivery: boolean;
    takeaway: boolean;
    dineIn: boolean;
    driveThru: boolean;
    qrOrdering: boolean;
    selfKiosk: boolean;
  };
  currentMetrics: {
    currentCovers: number;
    pendingOrders: number;
    avgWaitTime: number;
    tableTurnover: number;
  };
  status: 'open' | 'closed' | 'busy' | 'slow';
  lastUpdated: Date;
}
```

**Relationships:**
- Owns → Table Twins (1:N)
- Owns → Menu Twins (1:N)
- Has → Kitchen Twin (1:1)
- Employs → Staff Twins (N:M)
- Hosts → Customer Twins (N:M)
- Manages → Inventory Twin (1:1)

**Agents Interacting:**
- Waitron Agent (restaurant AI)
- Kitchen Agent
- Inventory Agent
- Business Copilot Agent

### 3.2 Table Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Asset Twin |
| **Twin ID Pattern** | `table:{restaurantId}:{tableNumber}` |
| **Data Model** | `{ tableId, seats, zone, status, currentOrder, turnTimes }` |

**Attributes:**
```typescript
interface TableTwin {
  id: string;
  restaurantId: string;
  tableNumber: number;
  seats: number;
  zone: string;
  status: 'available' | 'seated' | 'ordering' | 'eating' | 'billing' | 'cleaning';
  currentSessionId?: string;
  currentOrderId?: string;
  turnTimes: {
    seatedAt?: Date;
    orderPlacedAt?: Date;
    billRequestedAt?: Date;
    clearedAt?: Date;
  };
  todayMetrics: {
    covers: number;
    avgTurnTime: number;
    revenue: number;
  };
}
```

**Relationships:**
- Belongs to → Restaurant Twin
- Hosts → Customer Twins (N:M)
- Generates → Order Twins (1:N)

### 3.3 Order Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Transaction Twin |
| **Twin ID Pattern** | `order:{restaurantId}:{orderId}` |
| **Data Model** | `{ orderId, type, status, items, timing, payments, customer }` |

**Attributes:**
```typescript
interface OrderTwin {
  id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr' | 'kiosk';
  source: 'pos' | 'qr' | 'kiosk' | 'whatsapp' | 'delivery_app';
  status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  tableId?: string;
  customerId?: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers: string[];
    status: 'pending' | 'preparing' | 'ready' | 'served';
    stationId?: string;
    startedAt?: Date;
    completedAt?: Date;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  timing: {
    createdAt: Date;
    confirmedAt?: Date;
    startedAt?: Date;
    readyAt?: Date;
    servedAt?: Date;
    completedAt?: Date;
  };
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethods: { method: string; amount: number }[];
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
}
```

**Relationships:**
- Placed at → Table Twin
- Placed by → Customer Twin
- Routed to → Kitchen Twin
- Triggers → Inventory updates
- Generates → Payment Twin

### 3.4 Kitchen Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Operational Twin |
| **Twin ID Pattern** | `kitchen:{restaurantId}` |
| **Data Model** | `{ kitchenId, stations[], orders[], performance }` |

**Attributes:**
```typescript
interface KitchenTwin {
  id: string;
  restaurantId: string;
  stations: {
    stationId: string;
    name: string;
    type: 'grill' | 'fry' | 'saute' | 'prep' | 'salad' | 'dessert' | 'beverage';
    assignedItems: string[];
    currentOrders: string[];
    capacity: number;
    status: 'open' | 'busy' | 'overloaded' | 'maintenance';
    avgCookTime: number;
  }[];
  activeOrders: OrderTwin[];
  pendingOrders: number;
  avgOrderCompletionTime: number;
  peakHourThroughput: number;
  currentUtilization: number;
  alerts: { type: string; message: string; timestamp: Date }[];
}
```

**Relationships:**
- Part of → Restaurant Twin
- Manages → Station Twins
- Receives → Order Twins
- Updates → Inventory Twin

### 3.5 Inventory Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Asset Twin |
| **Twin ID Pattern** | `inventory:{restaurantId}` |
| **Data Model** | `{ inventoryId, items[], alerts[], suppliers }` |

**Attributes:**
```typescript
interface InventoryTwin {
  id: string;
  restaurantId: string;
  items: {
    itemId: string;
    name: string;
    category: string;
    currentStock: number;
    unit: string;
    reorderPoint: number;
    reorderQuantity: number;
    costPerUnit: number;
    expiryDate?: Date;
    location: string;
    suppliers: { supplierId: string; leadTimeDays: number; cost: number }[];
    consumptionRate: number; // units per day
    daysUntilStockout: number;
  }[];
  wasteLog: { date: Date; itemId: string; quantity: number; reason: string }[];
  totalValue: number;
  reorderAlerts: { itemId: string; urgency: 'low' | 'medium' | 'high' | 'critical' }[];
  expiringAlerts: { itemId: string; daysUntilExpiry: number }[];
}
```

**Relationships:**
- Belongs to → Restaurant Twin
- Consumed by → Order Twins (recipe deduction)
- Replenished by → Procurement Twin

### 3.6 Customer Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Person Twin |
| **Twin ID Pattern** | `customer:{customerId}` |
| **Data Model** | `{ customerId, profile, preferences, history, loyalty }` |

**Attributes:**
```typescript
interface CustomerTwin {
  id: string;
  customerId: string;
  profile: {
    name: string;
    phone: string;
    email?: string;
    firstVisit?: Date;
    preferences: {
      dietaryRestrictions: string[];
      allergies: string[];
      favoriteItems: string[];
      preferredPayment: string;
    };
  };
  visitHistory: {
    restaurantId: string;
    visitCount: number;
    lastVisit: Date;
    avgOrderValue: number;
    favoriteItems: string[];
  }[];
  loyalty: {
    currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    pointsBalance: number;
    lifetimePoints: number;
    pointsValue: number; // in currency
  };
  sentiment: {
    lastRating?: number;
    avgRating: number;
    feedbackCount: number;
  };
}
```

**Relationships:**
- Visits → Restaurant Twins
- Places → Order Twins
- Accumulates → Loyalty Points
- Has → Payment Twins

### 3.7 Staff Twin

| Attribute | Details |
|-----------|--------|
| **Twin Type** | Person Twin |
| **Twin ID Pattern** | `staff:{staffId}` |
| **Data Model** | `{ staffId, profile, schedule, performance }` |

**Attributes:**
```typescript
interface StaffTwin {
  id: string;
  staffId: string;
  restaurantId: string;
  profile: {
    name: string;
    phone: string;
    role: 'manager' | 'server' | 'chef' | 'prep' | 'host' | 'cashier' | 'delivery';
    certifications: string[];
    hireDate: Date;
  };
  schedule: {
    regularShift: { start: string; end: string; days: string[] };
    thisWeek: { date: Date; shift: { start: string; end: string } }[];
  };
  currentStatus: {
    status: 'clocked_in' | 'clocked_out' | 'on_break' | 'off_duty';
    currentStation?: string;
    currentTable?: string;
    clockInTime?: Date;
  };
  performance: {
    avgOrderTime: number;
    tableTurnover: number;
    customerRating: number;
    ordersHandled: number;
    errorRate: number;
  };
}
```

**Relationships:**
- Employed by → Restaurant Twin
- Assigned to → Station Twins
- Takes → Orders
- Has → Attendance Records

---

## 4. Integration Flows

### 4.1 Core Order-to-Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORDER-TO-PAYMENT INTEGRATION FLOW                    │
└─────────────────────────────────────────────────────────────────────────┘

Customer          QR Cloud         POS            KDS           Kitchen AI
   │                 │              │              │                │
   │  1. Scan QR      │              │              │                │
   │────────────────►│              │              │                │
   │                 │  2. Session  │              │                │
   │                 │─────────────►│              │                │
   │                 │              │              │                │
   │  3. View Menu    │              │              │                │
   │◄────────────────│              │              │                │
   │                 │              │              │                │
   │  4. Place Order │              │              │                │
   │────────────────►│  5. Create   │              │                │
   │                 │─────────────►│              │                │
   │                 │              │              │                │
   │                 │              │  6. Route to │                │
   │                 │              │─────────────►│                │
   │                 │              │              │                │
   │                 │              │              │  7. Optimize   │
   │                 │              │              │◄───────────────│
   │                 │              │              │                │
   │                 │              │  8. Assign   │                │
   │                 │              │─────────────►│                │
   │                 │              │              │                │
   │  9. Order Conf  │              │              │                │
   │◄────────────────│              │              │                │
   │                 │              │              │                │
   │                 │              │  10. Bump    │                │
   │                 │              │◄─────────────│                │
   │                 │              │              │                │
   │                 │              │  11. Ready   │                │
   │                 │              │─────────────►│                │
   │                 │              │              │                │
   │  12. Serve      │              │              │                │
   │◄─────────────────────────────────────────────│                │
   │                 │              │              │                │
   │  13. Pay        │              │              │                │
   │────────────────►│  14. Process│              │                │
   │                 │─────────────►│              │                │
   │                 │              │  15. Deduct  │                │
   │                 │              │─────────────►│ Inventory      │
   │                 │              │              │                │
   │                 │              │  16. RABTUL  │                │
   │                 │              │─────────────►│ Payment        │
   │                 │              │              │                │
   │  17. Receipt    │              │              │                │
   │◄────────────────│              │              │                │
   │                 │              │              │                │
   │  18. Loyalty    │              │              │                │
   │◄──────────────────────────────────────────────│ RABTUL        │
   │                 │              │              │   Wallet       │
```

**API Endpoints Involved:**

| Step | Source | Target | Endpoint | Data |
|------|--------|--------|----------|------|
| 2 | QR Cloud | POS | `POST /api/sessions` | `{ tableId, customerId }` |
| 5 | QR Cloud | POS | `POST /api/orders` | `{ items, sessionId }` |
| 6 | POS | KDS | `POST /api/kds/orders` | `{ orderId, items }` |
| 7 | KDS | Kitchen AI | `POST /api/route/order` | `{ orderId }` |
| 8 | POS | KDS | `PATCH /api/kds/stations/:id` | `{ orderId }` |
| 10 | KDS | POS | `POST /api/kds/:id/bump` | `{ orderId }` |
| 11 | POS | QR Cloud | `POST /api/qr/orders/:id/ready` | `{ orderId }` |
| 14 | POS | RABTUL | `POST /api/payments/initiate` | `{ amount, orderId }` |
| 15 | POS | Inventory | `POST /api/inventory/deduct` | `{ orderId, items }` |
| 16 | POS | RABTUL | `POST /api/wallet/points/earn` | `{ customerId, points }` |

**Event Messages:**

```typescript
// Order Created Event
{
  event: 'ORDER_CREATED',
  source: 'POS',
  target: ['KDS', 'QR_CLOUD'],
  payload: {
    orderId: string,
    tableId: string,
    items: OrderItem[],
    priority: 'normal' | 'rush',
    notes: string
  },
  timestamp: Date,
  correlationId: string
}

// Kitchen Order Ready Event
{
  event: 'ORDER_READY',
  source: 'KDS',
  target: ['POS', 'QR_CLOUD'],
  payload: {
    orderId: string,
    tableId: string,
    readyItems: string[]
  },
  timestamp: Date
}

// Payment Completed Event
{
  event: 'PAYMENT_COMPLETED',
  source: 'RABTUL_PAY',
  target: ['POS', 'LOYALTY'],
  payload: {
    orderId: string,
    transactionId: string,
    amount: number,
    paymentMethod: string,
    customerId?: string
  },
  timestamp: Date
}
```

**Error Handling:**

| Error Type | Handling Strategy | Retry Policy |
|------------|-------------------|--------------|
| POS unavailable | Queue order locally, sync when restored | 3 retries, exponential backoff |
| KDS routing failure | Default to round-robin assignment | 2 retries |
| Payment failure | Show error, allow retry or alternative | User-initiated retry |
| Inventory sync failure | Log inconsistency, reconcile nightly | Daily batch reconciliation |
| Network timeout | Client-side retry with idempotency key | 2 retries, 5s delay |

### 4.2 Inventory Replenishment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  INVENTORY REPLENISHMENT FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

Inventory          Kitchen AI         POS           Staff          Suppliers
   │                   │                │              │                │
   │  1. Low Stock     │                │              │                │
   │──────────────────►│                │              │                │
   │                   │  2. Forecast   │              │                │
   │                   │◄───────────────│                │                │
   │                   │                │              │                │
   │  3. Reorder Alert │                │              │                │
   │────────────────────────────────────►│                │                │
   │                   │                │              │                │
   │  4. Create PO     │                │              │                │
   │────────────────────────────────────────────────►│                │
   │                   │                │              │                │
   │  5. PO Approval   │                │              │                │
   │◄─────────────────────────────────────│                │                │
   │                   │                │              │                │
   │  6. Confirm Order │                │              │                │
   │───────────────────────────────────────────────────────────────────►│
   │                   │                │              │                │
   │                   │                │              │     7. Delivery│
   │◄───────────────────────────────────────────────────────────────────│
   │                   │                │              │                │
   │  8. Stock Update  │                │              │                │
   │◄─────────────────────────────────────│              │                │
   │                   │                │              │                │
   │  9. Quality Check │                │              │                │
   │◄─────────────────────────────────────│              │                │
```

### 4.3 Customer Recognition & Loyalty Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  CUSTOMER RECOGNITION & LOYALTY FLOW                   │
└─────────────────────────────────────────────────────────────────────────┘

POS              Business Copilot       Loyalty        RABTUL        Dashboard
  │                    │                  │              │               │
  │  1. Customer ID    │                  │              │               │
  │───────────────────►│                  │              │               │
  │                    │  2. Lookup       │              │               │
  │                    │────────────────►│              │               │
  │                    │                  │              │               │
  │                    │  3. Profile     │              │               │
  │◄───────────────────│                  │              │               │
  │                    │                  │              │               │
  │  4. Personalized  │                  │              │               │
  │    Recommendations│                  │              │               │
  │◄───────────────────│                  │              │               │
  │                    │                  │              │               │
  │  5. Order Complete│                  │              │               │
  │───────────────────►│  6. Calculate  │              │               │
  │                    │────────────────►│              │               │
  │                    │                  │              │               │
  │                    │  7. Points      │              │               │
  │                    │────────────────►│────────────►│               │
  │                    │                  │              │               │
  │  8. Points Confirm│                  │              │               │
  │◄───────────────────│◄────────────────│◄────────────│               │
  │                    │                  │              │               │
  │  9. Offer Upgrade │                  │              │               │
  │◄───────────────────│                  │              │               │
  │                    │                  │              │               │
  │  10. Sync Analytics│                  │              │               │
  │───────────────────────────────────────│────────────►│               │
```

### 4.4 Staff Scheduling & Optimization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  STAFF SCHEDULING & OPTIMIZATION FLOW                  │
└─────────────────────────────────────────────────────────────────────────┘

Dashboard         Business Copilot       Staff         Inventory       KDS
    │                    │                  │              │               │
    │  1. Forecast        │                  │              │               │
    │───────────────────►│                  │              │               │
    │                    │  2. Predict      │              │               │
    │                    │    Staff Needs   │              │               │
    │◄───────────────────│                  │              │               │
    │                    │                  │              │               │
    │  3. Create Schedule│                  │              │               │
    │──────────────────────────────────────►│              │               │
    │                    │                  │              │               │
    │  4. Staff Notified │                  │              │               │
    │◄───────────────────────────────────────│              │               │
    │                    │                  │              │               │
    │  5. Staff Check-in │                  │              │               │
    │◄───────────────────────────────────────│              │               │
    │                    │                  │              │               │
    │  6. Station Assign │                  │              │               │
    │────────────────────────────────────────────────────►│               │
    │                    │                  │              │               │
    │  7. Real-time Load │                  │              │               │
    │◄───────────────────────────────────────│◄─────────────│               │
    │                    │                  │              │               │
    │  8. Rebalance      │                  │              │               │
    │───────────────────────────────────────│────────────►│               │
```

---

## 5. Agent Architecture

### 5.1 Waitron Agent (Restaurant AI Employee)

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `waitron:{merchantId}` |
| **Role** | Restaurant Operations AI |
| **Twins Managed** | Restaurant Twin, Table Twin, Order Twin, Customer Twin |
| **Port** | 4820 |

**Capabilities:**
```typescript
interface WaitronCapabilities {
  // Order Management
  takeOrder: (tableId: string, items: OrderItem[]) => Promise<Order>;
  modifyOrder: (orderId: string, modifications: Modification[]) => Promise<Order>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  
  // Table Management
  seatGuests: (tableId: string, guestCount: number) => Promise<void>;
  clearTable: (tableId: string) => Promise<void>;
  mergeTables: (sourceId: string, targetId: string) => Promise<void>;
  
  // Customer Service
  greetCustomer: (tableId: string) => Promise<string>;
  recommendItems: (customerId: string, context: OrderContext) => Promise<MenuItem[]>;
  handleComplaint: (tableId: string, issue: string) => Promise<Resolution>;
  
  // Reservations
  makeReservation: (details: ReservationDetails) => Promise<Reservation>;
  sendReminders: (reservationId: string) => Promise<void>;
}
```

**Skills Required:**
- Menu knowledge
- Customer preference recognition
- Upselling techniques
- Conflict resolution
- Multi-language support

### 5.2 Kitchen Agent

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `kitchen:{restaurantId}` |
| **Role** | Kitchen Operations AI |
| **Twins Managed** | Kitchen Twin, Order Twin, Inventory Twin |
| **Port** | 4821 |

**Capabilities:**
```typescript
interface KitchenCapabilities {
  // Order Routing
  routeOrder: (orderId: string) => Promise<StationAssignment[]>;
  prioritizeOrders: (stationId: string) => Promise<Order[]>;
  
  // Station Management
  balanceLoad: (stationIds: string[]) => Promise<LoadBalancingResult>;
  detectBottleneck: () => Promise<BottleneckAnalysis>;
  
  // Timing Optimization
  predictCookTime: (orderId: string) => Promise<CookTimePrediction>;
  syncCourses: (orderId: string) => Promise<CourseTiming>;
  
  // Quality Control
  verifyPortion: (orderId: string, itemId: string) => Promise<QCResult>;
  alertQualityIssue: (orderId: string, issue: string) => Promise<void>;
}
```

### 5.3 Inventory Agent

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `inventory:{restaurantId}` |
| **Role** | Inventory Management AI |
| **Twins Managed** | Inventory Twin, Supplier Twin |
| **Port** | 4822 |

**Capabilities:**
```typescript
interface InventoryCapabilities {
  // Stock Management
  trackStock: (itemId: string) => Promise<StockStatus>;
  deductStock: (orderId: string) => Promise<void>;
  adjustStock: (itemId: string, quantity: number, reason: string) => Promise<void>;
  
  // Forecasting
  predictDemand: (itemId: string, horizon: number) => Promise<DemandForecast>;
  calculateOptimalOrder: (itemId: string) => Promise<OrderRecommendation>;
  
  // Alerts
  monitorExpiry: () => Promise<ExpiryAlert[]>;
  checkReorderPoints: () => Promise<ReorderAlert[]>;
  detectAnomalies: () => Promise<InventoryAnomaly[]>;
  
  // Waste Management
  logWaste: (itemId: string, quantity: number, reason: string) => Promise<void>;
  analyzeWaste: (period: DateRange) => Promise<WasteAnalysis>;
}
```

### 5.4 Loyalty Agent

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `loyalty:{merchantId}` |
| **Role** | Customer Engagement AI |
| **Twins Managed** | Customer Twin, Restaurant Twin |
| **Port** | 4823 |

**Capabilities:**
```typescript
interface LoyaltyCapabilities {
  // Points Management
  calculatePoints: (customerId: string, amount: number) => Promise<PointsCalculation>;
  redeemPoints: (customerId: string, points: number) => Promise<RedemptionResult>;
  
  // Tier Management
  evaluateTierUpgrade: (customerId: string) => Promise<TierUpgradeDecision>;
  applyTierBenefits: (customerId: string) => Promise<void>;
  
  // Engagement
  sendOffer: (customerId: string, offerType: string) => Promise<void>;
  celebrateMilestone: (customerId: string, milestone: string) => Promise<void>;
  
  // Analytics
  predictChurn: () => Promise<ChurnPrediction[]>;
  identifyVIPs: () => Promise<VIPCustomer[]>;
  recommendSegmentation: () => Promise<SegmentRecommendations>;
}
```

### 5.5 Staff Agent

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `staff:{restaurantId}` |
| **Role** | Workforce Management AI |
| **Twins Managed** | Staff Twin, Restaurant Twin |
| **Port** | 4824 |

**Capabilities:**
```typescript
interface StaffCapabilities {
  // Scheduling
  generateSchedule: (week: DateRange) => Promise<Schedule>;
  optimizeShift: (date: Date) => Promise<ShiftOptimization>;
  handleSwapRequest: (staffId1: string, staffId2: string) => Promise<SwapResult>;
  
  // Attendance
  trackAttendance: (staffId: string) => Promise<AttendanceRecord>;
  calculateOvertime: (staffId: string, period: DateRange) => Promise<OvertimeCalculation>;
  
  // Performance
  ratePerformance: (staffId: string, shift: string) => Promise<PerformanceRating>;
  identifyTrainingNeeds: (staffId: string) => Promise<TrainingRecommendation[]>;
  
  // Communication
  notifyShiftChange: (staffId: string, message: string) => Promise<void>;
  collectFeedback: (staffId: string) => Promise<Feedback>;
}
```

### 5.6 Analytics Agent

| Attribute | Details |
|-----------|--------|
| **Agent ID** | `analytics:{restaurantId}` |
| **Role** | Business Intelligence AI |
| **Twins Managed** | All restaurant twins |
| **Port** | 4825 |

**Capabilities:**
```typescript
interface AnalyticsCapabilities {
  // Reporting
  generateDailyReport: () => Promise<DailyReport>;
  createCustomReport: (query: string) => Promise<Report>;
  
  // Trend Analysis
  identifyTrends: (metric: string, period: DateRange) => Promise<Trend[]>;
  detectAnomalies: (metric: string) => Promise<Anomaly[]>;
  
  // Forecasting
  forecastRevenue: (horizon: number) => Promise<RevenueForecast>;
  predictFootfall: (date: Date) => Promise<FootfallPrediction>;
  
  // Recommendations
  suggestMenuChanges: () => Promise<MenuRecommendation[]>;
  recommendPricing: () => Promise<PricingRecommendation[]>;
  identifyOpportunities: () => Promise<Opportunity[]>;
}
```

---

## 6. Business Copilot Integration

### 6.1 Natural Language Query Engine

The Business Copilot serves as the unified analytics interface for the Restaurant OS, allowing operators to query all data through natural language.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS COPILOT ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

User Query (NL)
      │
      ▼
┌─────────────────┐
│ Query Parser     │  - Intent detection
│ (NLU Engine)    │  - Entity extraction
└────────┬────────┘  - Context identification
         │
         ▼
┌─────────────────┐
│ Context Builder │  - Load relevant twins
│ (Twin Aggregator)│  - Join related data
└────────┬────────┘  - Apply permissions
         │
         ▼
┌─────────────────┐
│ Query Executor │  - Generate data queries
│ (Data Engine)  │  - Execute in parallel
└────────┬────────┘  - Aggregate results
         │
         ▼
┌─────────────────┐
│ Response Engine │  - Generate NL response
│ (NLG Engine)   │  - Add visualizations
└────────┬────────┘  - Include recommendations
         │
         ▼
Response (NL + Charts)
```

### 6.2 Supported Natural Language Queries

**Revenue & Sales Queries:**
```
Query Examples:
- "What was our revenue today compared to yesterday?"
- "Show me the top 10 selling items this week"
- "How much did online orders contribute to sales in Q2?"
- "What's our average order value by order type?"
- "Compare table service vs QR ordering revenue"
```

**Customer Queries:**
```
Query Examples:
- "How many new customers did we get this month?"
- "What's the customer retention rate for repeat visits?"
- "Show me the customer sentiment trend over the past 30 days"
- "Which customers are at risk of not returning?"
- "What's our most valuable customer segment?"
```

**Operational Queries:**
```
Query Examples:
- "What's the average table turn time during peak hours?"
- "How many orders did we miss our SLA on today?"
- "Which station is causing the most delays?"
- "Show me the kitchen throughput by hour"
- "What's our current table availability?"
```

**Inventory Queries:**
```
Query Examples:
- "What items are running low and need reorder?"
- "How much food waste did we have this week?"
- "What's our food cost percentage for the past month?"
- "Which menu items have the highest ingredient cost?"
- "Show me the expiry alerts for the next 3 days"
```

**Staff Queries:**
```
Query Examples:
- "How many staff hours did we use today vs budget?"
- "What's the overtime trend for the kitchen team?"
- "Show me staff productivity by shift"
- "Are we over or understaffed for tonight's dinner?"
- "Which staff members need additional training?"
```

**Loyalty & Marketing Queries:**
```
Query Examples:
- "How many loyalty points were redeemed this month?"
- "What's the redemption rate by customer tier?"
- "Which promotions drove the most new customer visits?"
- "Show me the loyalty program ROI"
- "What's the effectiveness of our birthday campaign?"
```

### 6.3 Dashboard Views

**Real-Time Operations Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME OPERATIONS DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Revenue      │  │ Orders       │  │ Avg Wait     │  │ Tables       │ │
│  │ ₹45,230      │  │ 127          │  │ 12 min       │  │ 18/24 Full   │ │
│  │ ↑12% vs LY   │  │ ↑8 vs Yest   │  │ ↓2 min       │  │ 4 Available  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐│
│  │ KITCHEN STATUS                  │  │ ORDER FLOW                      ││
│  │                                 │  │                                 ││
│  │ Station 1: ████████░░ 80%       │  │ ●────●────●────●────●          ││
│  │ Station 2: ██████░░░░ 60%       │  │ RCVD  CONF  PREP  READY  SERV  ││
│  │ Station 3: ████░░░░░░ 40%       │  │  5     8     12     6     96    ││
│  │                                 │  │                                 ││
│  └─────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ LIVE ORDERS                                                         ││
│  │ #1234 | Table 5 | 3 items | ⏱️ 8 min | Grill | [Rush]               ││
│  │ #1235 | QR T12 | 5 items | ⏱️ 3 min | Fry | Normal                  ││
│  │ #1236 | Delivery | 2 items | ⏱️ 1 min | Prep | [Priority]           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Business Intelligence Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS INTELLIGENCE DASHBOARD                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ REVENUE TREND (Last 30 Days)                                       ││
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                     ││
│  │         ╱╲    ╱╲                                                      ││
│  │    ▓▓▓╱  ╲▓▓╱  ╲▓▓▓▓▓▓    ╱╲                                       ││
│  │ ─────────────────────────────────────────                           ││
│  │ Mon  Tue  Wed  Thu  Fri  Sat  Sun  Mon  Tue  Wed  Thu              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐│
│  │ TOP SELLING         │  │ CUSTOMER METRICS     │  │ INVENTORY        ││
│  │ 1. Butter Chicken   │  │ New: 234             │  │ Low Stock: 12    ││
│  │ 2. Naan (Garlic)    │  │ Returning: 567       │  │ Expiring: 5      ││
│  │ 3. Dal Makhani      │  │ LTV: ₹1,234          │  │ Waste: 2.3%      ││
│  │ 4. Biryani          │  │ Churn Risk: 23       │  │ Food Cost: 28%   ││
│  │ 5. Lassi            │  │ NPS: 72              │  │ Target: 25%      ││
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 API Integration

**Copilot Query Endpoint:**
```typescript
// POST /api/copilot/query
interface CopilotQueryRequest {
  query: string;                    // Natural language query
  context?: {
    restaurantId?: string;
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
  };
  responseFormat?: 'text' | 'json' | 'chart' | 'all';
  language?: 'en' | 'hi' | 'mixed';
}

interface CopilotQueryResponse {
  success: boolean;
  query: string;
  intent: string;
  entities: {
    type: string;
    value: any;
    confidence: number;
  }[];
  answer: {
    text: string;
    data?: any;
    chartType?: 'bar' | 'line' | 'pie' | 'table' | 'metric';
    chartData?: any;
  };
  recommendations?: {
    type: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }[];
  sources: {
    twins: string[];
    services: string[];
    confidence: number;
  }[];
  metadata: {
    processingTimeMs: number;
    modelVersion: string;
  };
}
```

**WebSocket for Real-time Insights:**
```typescript
// ws://localhost:4022/ws/copilot
interface CopilotWebSocketEvents {
  // Subscribe to insights
  subscribe: {
    topics: ('revenue' | 'orders' | 'customers' | 'inventory' | 'alerts')[];
    restaurantId: string;
  };
  
  // Push insights
  insight: {
    topic: string;
    type: 'anomaly' | 'trend' | 'alert' | 'recommendation';
    data: any;
    timestamp: Date;
  };
  
  // Ask follow-up
  followUp: {
    conversationId: string;
    query: string;
  };
}
```

---

## 7. Economic Integration

### 7.1 Payment Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

Customer           POS           RABTUL            RABTUL         Merchant
 (App)                              Pay             Wallet          Account
    │              │                │                │                │
    │  1. Select   │                │                │                │
    │     Payment  │                │                │                │
    │─────────────►│                │                │                │
    │              │                │                │                │
    │  2. Initiate │                │                │                │
    │     Payment  │                │                │                │
    │─────────────►│  3. Process   │                │                │
    │              │───────────────►│                │                │
    │              │                │                │                │
    │  4. Auth/    │                │                │                │
    │     Confirm  │◄───────────────│                │                │
    │◄─────────────│                │                │                │
    │              │                │                │                │
    │  5. Complete │  6. Deduct    │                │                │
    │     (QR/UPI) │───────────────►│                │                │
    │              │                │  7. Transfer  │                │
    │              │                │───────────────►│                │
    │              │                │                │  8. Settle    │
    │              │                │                │───────────────►│
    │              │                │                │                │
    │  9. Receipt  │                │                │                │
    │◄─────────────│  10. Confirm  │                │                │
    │              │◄───────────────│                │                │
```

**Payment Methods Supported:**
| Method | Integration | Processing Time | Fees |
|--------|-------------|-----------------|------|
| UPI (QR/Normal) | RABTUL Pay | Instant | 0.5-1% |
| Cards (Credit/Debit) | RABTUL Pay | Instant | 1.5-2% |
| RABTUL Wallet | RABTUL Wallet | Instant | 0% |
| Loyalty Points | RABTUL Wallet | Instant | 0% |
| Cash | POS Direct | N/A | 0% |
| BNPL | RABTUL Lending | Instant | As per terms |

### 7.2 Rewards & Loyalty Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LOYALTY POINTS FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

Order Complete         POS             Loyalty           RABTUL          Customer
     │                   │               Service          Wallet           App
     │                   │                 │                │                │
     │  1. Order Data    │                 │                │                │
     │──────────────────►│                 │                │                │
     │                   │                 │                │                │
     │                   │  2. Calculate  │                │                │
     │                   │     Points     │                │                │
     │                   │───────────────►│                │                │
     │                   │                 │                │                │
     │                   │  3. Earn Points│                │                │
     │                   │────────────────►│                │                │
     │                   │                 │  4. Credit     │                │
     │                   │                 │───────────────►│                │
     │                   │                 │                │                │
     │                   │  5. Confirm    │                │                │
     │                   │◄────────────────│◄──────────────│                │
     │                   │                 │                │                │
     │  6. Points Offer  │                 │                │                │
     │◄─────────────────│                 │                │                │
     │                   │                 │                │                │
     │                   │  7. Update Tier│                │                │
     │                   │───────────────►│                │                │
     │                   │                 │                │                │
     │                   │  8. Send Offer │                │                │
     │                   │───────────────────────────────────────────────►│
```

**Tier System:**
| Tier | Points Required | Benefits | Earn Rate | Redeem Rate |
|------|-----------------|----------|-----------|-------------|
| Bronze | 0-999 | Basic rewards | 1x | 100 points = ₹1 |
| Silver | 1,000-4,999 | +5% bonus points | 1.1x | 100 points = ₹1.10 |
| Gold | 5,000-19,999 | +10% bonus, priority | 1.2x | 100 points = ₹1.20 |
| Platinum | 20,000+ | +20% bonus, VIP perks | 1.5x | 100 points = ₹1.50 |

### 7.3 Wallet Integration

**RABTUL Wallet Features:**
- Multi-currency support
- Instant peer-to-peer transfers
- QR code payments
- Auto-topup from bank
- Loyalty points integration
- Gift card purchase/redemption
- Split bill functionality

**API Integration:**
```typescript
// Wallet Endpoints
interface WalletIntegration {
  // Balance
  getBalance(customerId: string): Promise<{ balance: number; currency: string }>;
  
  // Top-up
  topUp(customerId: string, amount: number, source: string): Promise<Transaction>;
  
  // Payments
  pay(orderId: string, amount: number, method: 'wallet' | 'card' | 'upi'): Promise<PaymentResult>;
  
  // Loyalty
  earnPoints(customerId: string, amount: number): Promise<PointsResult>;
  redeemPoints(customerId: string, points: number): Promise<RedemptionResult>;
  
  // History
  getTransactionHistory(customerId: string, limit: number): Promise<Transaction[]>;
}
```

---

## 8. Implementation Roadmap

### 8.1 Phase 1: Core Integration (Weeks 1-2)

**Objective:** Establish foundational integrations between core systems.

**Sprint 1.1: POS-KDS-Kitchen AI Integration (Days 1-5)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Implement real-time order sync between POS and KDS | Backend | 3 days | |
| Integrate Kitchen AI for order routing optimization | AI/ML | 2 days | |
| Add WebSocket support for live updates | Backend | 2 days | |
| Implement station assignment logic | Backend | 1 day | |
| End-to-end testing of order flow | QA | 2 days | |

**Sprint 1.2: POS-Business Copilot Integration (Days 6-10)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Design data model for analytics queries | Data | 2 days | |
| Implement query parser for NL queries | AI/ML | 3 days | |
| Build response engine with visualizations | Frontend | 2 days | |
| Connect to all data sources | Backend | 2 days | |
| User acceptance testing | QA | 1 day | |

**Phase 1 Deliverables:**
```
✅ POS ↔ KDS real-time sync
✅ Kitchen AI routing integration
✅ Business Copilot NL query interface
✅ Basic dashboard views
```

### 8.2 Phase 2: Advanced Features (Weeks 3-4)

**Objective:** Enable predictive capabilities and advanced integrations.

**Sprint 2.1: Inventory Intelligence (Days 11-15)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Implement demand forecasting model | AI/ML | 3 days | |
| Build reorder point automation | Backend | 2 days | |
| Add expiry tracking and alerts | Backend | 2 days | |
| Integrate with supplier marketplace | Integration | 2 days | |
| Dashboard for inventory metrics | Frontend | 1 day | |

**Sprint 2.2: Customer Recognition (Days 16-20)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Implement customer profile unification | Data | 2 days | |
| Build preference recognition engine | AI/ML | 3 days | |
| Connect loyalty system with RABTUL | Integration | 2 days | |
| Add personalized recommendations | AI/ML | 2 days | |
| Test and validate recognition accuracy | QA | 1 day | |

**Sprint 2.3: Staff Optimization (Days 21-25)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Implement AI-powered scheduling | AI/ML | 3 days | |
| Add real-time shift balancing | Backend | 2 days | |
| Connect with KDS for station assignment | Integration | 2 days | |
| Build performance analytics | Data | 2 days | |
| Mobile app for staff notifications | Mobile | 2 days | |

**Phase 2 Deliverables:**
```
✅ Predictive inventory management
✅ Unified customer profiles with recognition
✅ AI-powered staff scheduling
✅ Personalized recommendations
```

### 8.3 Phase 3: Optimization (Weeks 5-6)

**Objective:** Fine-tune integrations and add advanced analytics.

**Sprint 3.1: Advanced Analytics (Days 26-30)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Implement anomaly detection | AI/ML | 3 days | |
| Build trend analysis engine | Data | 2 days | |
| Add forecasting models (revenue, demand) | AI/ML | 3 days | |
| Create executive dashboard | Frontend | 2 days | |
| Implement self-service reporting | Frontend | 1 day | |

**Sprint 3.2: Multi-Channel Optimization (Days 31-35)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Optimize QR ordering flow | Frontend | 2 days | |
| Add delivery aggregator integration | Integration | 3 days | |
| Implement dynamic pricing | AI/ML | 3 days | |
| Build campaign management | Backend | 2 days | |
| Add A/B testing framework | Data | 1 day | |

**Sprint 3.3: Performance & Scale (Days 36-42)**

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Optimize query performance | Backend | 3 days | |
| Implement caching strategy | Backend | 2 days | |
| Load testing and tuning | DevOps | 2 days | |
| Add monitoring and alerting | DevOps | 2 days | |
| Documentation and training | All | 2 days | |

**Phase 3 Deliverables:**
```
✅ Advanced anomaly detection
✅ Revenue and demand forecasting
✅ Executive dashboards
✅ Dynamic pricing engine
✅ Performance-optimized system
```

### 8.4 Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                             │
└─────────────────────────────────────────────────────────────────────────┘

Week 1    Week 2    Week 3    Week 4    Week 5    Week 6
─────────�─────────�─────────�─────────�─────────�─────────
Phase 1   Phase 2   Phase 3
│         │         │
├─────────┼─────────┤
│ Core    │ Advanced│
│ POS-KDS │ Inventory│
│ KDS-KAI │ Customer│
│ POS-CP  │ Staff   │
│         │         │
│ Sprint  │ Sprint  │
│ 1.1-1.2 │ 2.1-2.3 │
│         │         │
│         ├─────────┤
│         │ Analytics│
│         │ Multi-  │
│         │ Channel │
│         │ Perf    │
│         │         │
│ Sprint  │ Sprint  │
│ 3.1-3.3 │         │
│         │         │
├─────────┼─────────┼─────────┐
│ Alpha   │ Beta    │ GA      │
│ Release │ Release │ Release │
└─────────┴─────────┴─────────┘
```

### 8.5 Success Metrics

| Metric | Baseline | Week 2 Target | Week 4 Target | Week 6 Target |
|--------|----------|---------------|---------------|---------------|
| Order-to-kitchen time | 45 sec | 20 sec | 15 sec | 10 sec |
| KDS accuracy | 95% | 98% | 99% | 99.5% |
| Query response time | N/A | <2s | <1s | <500ms |
| Inventory accuracy | 85% | 92% | 96% | 98% |
| Customer recognition | 40% | 60% | 75% | 85% |
| Staff scheduling efficiency | 70% | 80% | 88% | 92% |
| Dashboard adoption | N/A | 30% | 50% | 70% |
| System availability | 99% | 99.5% | 99.7% | 99.9% |

---

## Appendix A: API Endpoint Registry

### Core Services

| Service | Base URL | Port | Auth Required |
|---------|----------|------|---------------|
| REZ POS | `REZ_POS_SERVICE_URL` | 4013, 4081 | Yes (JWT) |
| REZ KDS | `REZ_KDS_SERVICE_URL` | 4014, 4080 | Yes (JWT) |
| REZ QR Cloud | `REZ_QR_SERVICE_URL` | 4058, 4063 | Yes (JWT) |
| Kitchen AI | `KITCHEN_AI_SERVICE_URL` | 4082 | Yes (Internal) |
| REZ Inventory | `REZ_INVENTORY_SERVICE_URL` | 4010, 4625 | Yes (JWT) |
| REZ Dashboard | `REZ_DASHBOARD_SERVICE_URL` | 4060 | Yes (JWT) |
| REZ Loyalty | `REZ_LOYALTY_SERVICE_URL` | 4037, 4071 | Yes (JWT) |
| REZ Staff | `REZ_STAFF_SERVICE_URL` | 4091 | Yes (JWT) |
| Business Copilot | `REZ_COPILOT_SERVICE_URL` | 4022 | Yes (JWT) |

### External Services

| Service | Base URL | Purpose |
|---------|----------|---------|
| RABTUL Auth | `AUTH_SERVICE_URL` | Authentication |
| RABTUL Pay | `PAYMENT_SERVICE_URL` | Payment processing |
| RABTUL Wallet | `WALLET_SERVICE_URL` | Points and wallet |
| HOJAI AI | `HOJAI_SERVICE_URL` | AI intelligence layer |

---

## Appendix B: Event Schema Registry

### Domain Events

```typescript
// Restaurant Domain Events
type RestaurantEvent = 
  | OrderCreated
  | OrderUpdated
  | OrderCompleted
  | PaymentReceived
  | CustomerVisited
  | LoyaltyPointsEarned
  | LoyaltyPointsRedeemed
  | InventoryLow
  | InventoryReordered
  | StaffCheckedIn
  | StaffCheckedOut
  | TableSeated
  | TableCleared;

// Event Schema
interface DomainEvent<T> {
  id: string;
  type: string;
  version: string;
  source: string;
  target?: string[];
  payload: T;
  metadata: {
    correlationId: string;
    causationId?: string;
    timestamp: Date;
    userId?: string;
  };
}
```

---

## Appendix C: Error Codes

| Code | Category | Description | Resolution |
|------|----------|-------------|------------|
| `POS-001` | Order | Order creation failed | Retry with idempotency key |
| `POS-002` | Payment | Payment processing failed | Show error, allow retry |
| `KDS-001` | Routing | Order routing failed | Use default routing |
| `KDS-002` | Station | Station assignment failed | Manual assignment |
| `INV-001` | Stock | Stock deduction failed | Reconcile inventory |
| `INV-002` | Expiry | Expiry check failed | Log and continue |
| `LOY-001` | Points | Points calculation failed | Default to base rate |
| `LOY-002` | Tier | Tier update failed | Skip tier check |
| `STAFF-001` | Schedule | Schedule generation failed | Use basic scheduling |
| `COPILOT-001` | Query | Query parsing failed | Return clarification prompt |
| `COPILOT-002` | Data | Data fetch failed | Return partial data with warning |

---

**Document Version:** 1.0  
**Last Updated:** June 12, 2026  
**Author:** REZ Merchant Team  
**Status:** Ready for Implementation
