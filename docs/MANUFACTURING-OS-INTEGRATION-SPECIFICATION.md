# Manufacturing Industry OS - Integration Specification

**Version:** 1.0
**Date:** June 12, 2026
**Industry:** Manufacturing & Production
**Key Integration Point:** REZ Inventory ↔ TwinOS (Plant Twin, Inventory Twin)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Industry Overview

The Manufacturing industry faces significant operational challenges that create substantial value opportunities when addressed through unified digital systems:

| Challenge | Impact | Current State |
|-----------|--------|---------------|
| Fragmented production data | 25-35% efficiency loss | Disconnected ERP, MES, SCADA systems |
| Reactive inventory management | 15-20% excess inventory costs | Manual reorder, no predictive intelligence |
| Equipment downtime | ₹5-15 lakhs per hour average loss | Preventive, not predictive maintenance |
| Quality control delays | 3-5% rework rate, recall risks | Post-production inspection, batch-based |
| Supplier coordination | 10-15 days procurement lead time | Email/phone-based communication |
| Production planning | 20-30% underutilization | Excel-based, intuition-driven scheduling |
| Compliance tracking | Manual audits, 15-20% audit failures | Paper-based, siloed documentation |
| Cost visibility | Limited real-time COGS tracking | Monthly cost closes, delayed insights |

### 1.2 Key Integration Opportunity

**Primary Integration Point:** REZ Inventory ↔ TwinOS (Plant Twin, Inventory Twin)

This integration enables:
- Real-time material flow synchronization across production stages
- Predictive reorder based on production schedules and consumption patterns
- Digital twin-based simulation of production scenarios
- Automated quality checkpoints triggered by inventory events
- Vendor performance tracking linked to incoming material quality

### 1.3 Expected Outcomes

| Outcome | Metric | Timeline |
|---------|--------|----------|
| Inventory optimization | 20-25% reduction in carrying costs | 3-6 months |
| Machine uptime improvement | 15-20% increase in OEE | 3-6 months |
| Quality defect detection | 40% faster defect identification | 1-3 months |
| Procurement cycle time | 25-30% reduction in lead time | 3-6 months |
| Production planning accuracy | 85-90% schedule adherence | 2-4 months |
| Cost visibility | Real-time COGS tracking | 1-2 months |

### 1.4 Manufacturing OS Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MANUFACTURING INDUSTRY OS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TWINOS LAYER                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │  Plant  │ │ Machine │ │Inventory│ │ Vendor  │ │ Product │      │   │
│  │  │  Twin   │ │  Twin   │ │  Twin   │ │  Twin   │ │  Twin   │      │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘      │   │
│  │       └───────────┴───────────┴───────────┴───────────┘             │   │
│  │                           │                                          │   │
│  │                    ┌──────┴──────┐                                   │   │
│  │                    │  Twin Hub   │                                   │   │
│  │                    │   (5250)    │                                   │   │
│  │                    └─────────────┘                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     PRODUCT LAYER                                      │   │
│  │                                                                        │   │
│  │   ┌─────────────────┐     ┌─────────────────┐     ┌────────────────┐  │   │
│  │   │  REZ Inventory  │◄────│   Kitchen AI    │────►│   REZ POS      │  │   │
│  │   │    (4010)       │     │    (4082)       │     │    (4013)      │  │   │
│  │   └────────┬────────┘     └─────────────────┘     └───────┬────────┘  │   │
│  │            │                                             │           │   │
│  │   ┌────────┴────────┐                           ┌───────┴────────┐  │   │
│  │   │  Distribution OS │                           │  REZ Dashboard │  │   │
│  │   │    (4300)        │                           │    (4060)      │  │   │
│  │   └────────┬────────┘                           └────────────────┘  │   │
│  │            │                                                       │   │
│  │   ┌────────┴────────┐     ┌────────────────────────────────────┐  │   │
│  │   │ Procurement OS   │────►│     REZ Manufacturing OS (4850)    │  │   │
│  │   │    (4320)        │     │  BOM │ Work Orders │ QC │ Machines │  │   │
│  │   └─────────────────┘     └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     INFRASTRUCTURE LAYER                             │   │
│  │                                                                        │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │   │   RABTUL   │  │    HOJAI    │  │  Business   │  │    REZ     │ │   │
│  │   │    Pay     │  │     AI      │  │   Copilot   │  │  Identity  │ │   │
│  │   │   (4001)   │  │  Intelligence│  │   (4022)    │  │    Hub     │ │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Product Capability Matrix

### 2.1 REZ Inventory

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4010, 4625 |
| **Core Capabilities** | Stock tracking, expiry alerts, reorder points, supplier management, waste logging, multi-location inventory |
| **Data Produced** | Stock levels, consumption patterns, waste reports, reorder alerts, inventory valuation, movement history |
| **Data Needed** | Product recipes/BOM, sales forecasts, supplier info, minimum stock levels, production schedules |
| **Current Integration** | REZ POS (sales deduction), REZ Manufacturing OS (production consumption), RABTUL Pay (purchases) |
| **API Base URL** | `http://localhost:4010` or `REZ_INVENTORY_SERVICE_URL` |

**Key Endpoints:**
```json
GET  /api/inventory/stock                    - Get current stock levels
GET  /api/inventory/stock/:productId        - Get specific product stock
POST /api/inventory/adjust                  - Adjust stock (+/-)
POST /api/inventory/transfer                - Transfer between locations
GET  /api/inventory/alerts                  - Get reorder alerts
GET  /api/inventory/alerts/reorder-points   - Items below reorder point
POST /api/inventory/waste                   - Log waste
GET  /api/inventory/expiring                - Get expiring items
POST /api/purchase-orders                   - Create purchase order
GET  /api/purchase-orders/:id               - Get purchase order
PATCH /api/purchase-orders/:id/receive     - Receive goods
GET  /api/inventory/valuation              - Current inventory value
GET  /api/inventory/movements              - Movement history
```

**Data Models:**
```typescript
// Stock Item
interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  locationId: string;
  locationName: string;
  unitCost: number;
  totalValue: number;
  expiryDate?: Date;
  lastUpdated: Date;
}

// Movement Record
interface InventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  referenceType: 'PURCHASE' | 'PRODUCTION' | 'SALE' | 'ADJUSTMENT';
  referenceId: string;
  fromLocation?: string;
  toLocation?: string;
  timestamp: Date;
  notes?: string;
}

// Reorder Alert
interface ReorderAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  suggestedOrderDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supplierId?: string;
  lastOrderedDate?: Date;
}
```

---

### 2.2 REZ POS (Point of Sale)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4013, 4081 |
| **Core Capabilities** | Order management, billing, multi-channel sales, production tracking, finished goods inventory |
| **Data Produced** | Orders, transactions, sales data, customer orders, production output tracking |
| **Data Needed** | Product catalog, inventory levels, pricing, customer profiles, production schedules |
| **Current Integration** | RABTUL Pay (payments), RABTUL Wallet (rewards), REZ Inventory (stock updates) |
| **API Base URL** | `http://localhost:4013` or `REZ_POS_SERVICE_URL` |

**Key Endpoints:**
```json
POST /api/orders                          - Create order
GET  /api/orders/:id                      - Get order
POST /api/orders/:id/pay                 - Process payment
GET  /api/orders/:id/bill                - Generate bill
GET  /api/production/output              - Log production output
POST /api/production/batch               - Create production batch
GET  /api/analytics/sales                - Sales analytics
GET  /api/finished-goods                 - FG inventory levels
```

---

### 2.3 Distribution OS

| Attribute | Details |
|-----------|---------|
| **Company** | Nexha |
| **Port** | 4300 |
| **Core Capabilities** | Distributor management, route optimization, last-mile delivery, inventory allocation, returns handling |
| **Data Produced** | Delivery status, inventory at distribution nodes, route data, demand signals, returns data |
| **Data Needed** | Production inventory, sales orders, delivery addresses, vehicle capacity, warehouse locations |
| **Current Integration** | RABTUL Pay (COD settlements), RABTUL Notification (delivery updates), Procurement OS (replenishment) |
| **API Base URL** | `http://localhost:4300` or `DISTRIBUTION_OS_URL` |

**Key Endpoints:**
```json
GET  /api/distributors                    - List distributors
GET  /api/distributors/:id/inventory     - Distributor stock
POST /api/shipments                       - Create shipment
GET  /api/shipments/:id                  - Track shipment
POST /api/shipments/:id/deliver         - Mark delivered
GET  /api/routes/optimize                - Get optimized routes
POST /api/returns                         - Process return
GET  /api/demand-signals                 - Get demand data
POST /api/replenishment-requests         - Request stock replenishment
```

**Data Models:**
```typescript
// Distributor
interface Distributor {
  id: string;
  name: string;
  type: 'REGIONAL' | 'LOCAL' | 'DIRECT';
  locations: DistributionPoint[];
  coverageAreas: string[];
  capacity: {
    maxInventory: number;
    currentInventory: number;
  };
  performance: {
    onTimeDeliveryRate: number;
    accuracyRate: number;
    returnsRate: number;
  };
  integrationStatus: 'CONNECTED' | 'PENDING' | 'DISCONNECTED';
}

// Shipment
interface Shipment {
  id: string;
  fromLocation: string;
  toLocation: string;
  items: ShipmentItem[];
  status: 'CREATED' | 'PICKED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  carrier: string;
  trackingNumber?: string;
  expectedDelivery: Date;
  actualDelivery?: Date;
  route?: GeoRoute;
}

interface ShipmentItem {
  productId: string;
  quantity: number;
  batchNumber: string;
  expiryDate?: Date;
}
```

---

### 2.4 Procurement OS

| Attribute | Details |
|-----------|---------|
| **Company** | Nexha |
| **Port** | 4320 |
| **Core Capabilities** | Supplier management, RFQ processing, purchase orders, procurement analytics, contract management |
| **Data Produced** | Purchase orders, supplier quotes, contract terms, procurement metrics, vendor performance data |
| **Data Needed** | Material requirements, approved supplier lists, budget constraints, delivery schedules |
| **Current Integration** | RABTUL Pay (payments), REZ Inventory (material requirements), Distribution OS (supply chain visibility) |
| **API Base URL** | `http://localhost:4320` or `PROCUREMENT_OS_URL` |

**Key Endpoints:**
```json
GET  /api/suppliers                        - List suppliers
GET  /api/suppliers/:id                   - Supplier details
POST /api/suppliers                       - Register supplier
GET  /api/suppliers/:id/performance      - Supplier scorecard
POST /api/rfq                             - Create RFQ
GET  /api/rfq/:id                         - Get RFQ
POST /api/rfq/:id/quote                  - Submit quote
GET  /api/orders                          - List purchase orders
POST /api/orders                          - Create purchase order
GET  /api/orders/:id                     - Get PO details
PATCH /api/orders/:id/status             - Update PO status
GET  /api/contracts                       - List contracts
GET  /api/material-requirements           - Get material needs
POST /api/supply-requests                - Create supply request
```

**Data Models:**
```typescript
// Supplier
interface Supplier {
  id: string;
  name: string;
  category: string[];
  contact: {
    email: string;
    phone: string;
    address: Address;
  };
  certifications: string[];
  rating: number;
  performance: SupplierPerformance;
  leadTime: {
    average: number;
    minimum: number;
    maximum: number;
  };
  minimumOrderValue: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

interface SupplierPerformance {
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  responsivenessScore: number;
  totalOrders: number;
  onTimeDeliveries: number;
  defectiveRate: number;
}

// Purchase Order
interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'IN_PRODUCTION' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  totalValue: number;
  currency: string;
  deliveryDate: Date;
  paymentTerms: string;
  createdAt: Date;
  updatedAt: Date;
}

interface POItem {
  productId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}
```

---

### 2.5 Kitchen AI

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4082 |
| **Core Capabilities** | Production optimization, workflow routing, prep time prediction, station load balancing, bottleneck detection, recipe intelligence |
| **Data Produced** | Routing decisions, predicted cook/production times, station utilization, workflow recommendations, quality predictions |
| **Data Needed** | Order details, recipe complexity scores, station capabilities, current load, material availability |
| **Current Integration** | REZ KDS (execution), REZ Inventory (ingredient availability), REZ Manufacturing OS (production orders) |
| **API Base URL** | `http://localhost:4082` or `KITCHEN_AI_SERVICE_URL` |

**Key Endpoints:**
```json
POST /api/route/production               - Get optimal routing for production
GET  /api/predictions/production-time/:recipeId - Predict production time
GET  /api/stations/utilization          - Get station/line load
POST /api/recommendations/optimize      - Get workflow optimization
POST /api/materials/check                - Check material availability
GET  /api/bottlenecks                   - Identify production bottlenecks
POST /api/schedule/optimize             - Optimize production schedule
GET  /api/quality/predict/:batchId      - Predict quality outcomes
```

**Data Models:**
```typescript
// Production Route Request
interface ProductionRouteRequest {
  recipeId: string;
  quantity: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  deadline?: Date;
  materialConstraints?: {
    productId: string;
    maxQuantity: number;
  }[];
}

// Station Utilization
interface StationUtilization {
  stationId: string;
  stationName: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercentage: number;
  activeOrders: number;
  avgCycleTime: number;
  nextAvailableTime: Date;
}

// Workflow Optimization
interface WorkflowRecommendation {
  type: 'REORDER' | 'RESCHEDULE' | 'REALLOCATE' | 'BATCH';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  expectedImpact: {
    timeSaved: number;
    costSaved: number;
    qualityImprovement: number;
  };
  actions: OptimizationAction[];
}
```

---

### 2.6 REZ Manufacturing OS

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4850 |
| **Core Capabilities** | BOM management, work order tracking, QC checks, machine monitoring, OEE calculation, preventive maintenance |
| **Data Produced** | BOM structures, work orders, QC results, machine status, production reports, maintenance logs |
| **Data Needed** | Product definitions, material specs, quality standards, machine capabilities, production schedules |
| **Current Integration** | REZ Inventory (material consumption), Kitchen AI (production optimization), RABTUL Pay (maintenance costs) |
| **API Base URL** | `http://localhost:4850` or `MFG_OS_URL` |

**Key Services & Endpoints:**

**BOM Service (4851):**
```json
POST /api/v1/bom                          - Create BOM
GET  /api/v1/bom                          - List BOMs
GET  /api/v1/bom/:id                     - Get BOM details
PUT  /api/v1/bom/:id                     - Update BOM
POST /api/v1/bom/:id/activate           - Activate BOM version
GET  /api/v1/bom/:id/cost               - Calculate BOM cost
```

**Work Order Service (4852):**
```json
POST /api/v1/work-orders                 - Create work order
GET  /api/v1/work-orders                 - List work orders
GET  /api/v1/work-orders/:id            - Get work order
PUT  /api/v1/work-orders/:id/start     - Start production
PUT  /api/v1/work-orders/:id/complete  - Complete production
PUT  /api/v1/work-orders/:id/cancel    - Cancel work order
GET  /api/v1/work-orders/:id/operations - Get operations
```

**QC Service (4853):**
```json
POST /api/v1/qc/checks                   - Record QC check
GET  /api/v1/qc/checks/:id              - Get QC check
GET  /api/v1/qc/batch/:batchId          - Batch QC results
GET  /api/v1/qc/defects                 - Defect analysis
POST /api/v1/qc/capa                    - Create CAPA
```

**Machine Service (4854):**
```json
GET  /api/v1/machines                    - List machines
GET  /api/v1/machines/:id               - Machine details
GET  /api/v1/machines/:id/oee           - OEE metrics
GET  /api/v1/machines/:id/status        - Current status
POST /api/v1/machines/:id/maintenance   - Schedule maintenance
GET  /api/v1/maintenance/schedule       - Maintenance calendar
```

---

## 3. Twin Architecture

### 3.1 Twin Overview

Digital Twins provide a real-time digital representation of physical manufacturing assets, enabling simulation, prediction, and optimization across the production lifecycle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIGITAL TWIN LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│    │  Plant  │◄──►│ Machine │◄──►│Inventory│◄──►│ Vendor  │              │
│    │  Twin   │    │  Twin   │    │  Twin   │    │  Twin   │              │
│    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘              │
│         │              │              │              │                    │
│         └──────────────┴──────────────┴──────────────┘                    │
│                               │                                            │
│                    ┌──────────┴──────────┐                                 │
│                    │    Product Twin     │                                 │
│                    │         ◄───────────┘                                 │
│                    │           │                                           │
│                    │    ┌─────┴─────┐                                      │
│                    │    │ Quality   │                                      │
│                    │    │   Twin    │                                      │
│                    │    └───────────┘                                      │
│                    │                                                        │
│                    └────────────┬─────────────────────────────────────    │
│                                 │                                           │
│                    ┌────────────┴────────────┐                              │
│                    │        TWIN HUB        │                              │
│                    │       (5250)           │                              │
│                    │  • State Management    │                              │
│                    │  • Relationship Graph  │                              │
│                    │  • Real-time Sync      │                              │
│                    │  • Event Propagation   │                              │
│                    └────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Plant Twin

The Plant Twin represents the entire manufacturing facility, including physical layout, zones, equipment placement, and operational parameters.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "PlantTwin",
  "id": "plant-{plantId}",
  "attributes": {
    "basicInfo": {
      "name": "string",
      "code": "string",
      "type": "ASSEMBLY | PROCESS | MIXING | FABRICATION | PACKAGING",
      "industry": "string",
      "size": {
        "area": "number (sq meters)",
        "builtUp": "number (sq meters)"
      },
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postalCode": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      },
      "certifications": ["ISO9001", "ISO14001", "ISO45001", "GMP", "CE"],
      "operatingHours": {
        "timezone": "string",
        "shifts": [
          {
            "name": "string",
            "startTime": "string",
            "endTime": "string",
            "workingDays": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
          }
        ]
      }
    },
    "capacity": {
      "maxProductionCapacity": "number (units/month)",
      "currentUtilization": "number (percentage)",
      "peakCapacity": "number (units/month)",
      "oeeTarget": "number (percentage)",
      "shiftCapacity": "number (hours per shift)"
    },
    "zones": [
      {
        "zoneId": "string",
        "name": "string",
        "type": "PRODUCTION | WAREHOUSE | QC_LAB | MAINTENANCE | OFFICE | UTILITY",
        "area": "number",
        "equipment": ["string"],
        "temperature": { "min": "number", "max": "number" },
        "humidity": { "min": "number", "max": "number" }
      }
    ],
    "utilities": {
      "power": { "connectedLoad": "number (kW)", "backupCapacity": "number (kW)" },
      "water": { "source": "MUNICIPAL | BOREWELL | TANKER", "capacity": "number (liters)" },
      "compressedAir": { "capacity": "number (CFM)", "pressure": "number (bar)" },
      "gas": { "type": "string", "capacity": "number (kg)" }
    },
    "sensors": [
      {
        "sensorId": "string",
        "type": "TEMPERATURE | HUMIDITY | POWER | VIBRATION | DUST",
        "location": "string",
        "status": "ONLINE | OFFLINE | MAINTENANCE"
      }
    ],
    "compliance": {
      "lastAuditDate": "ISO8601 Date",
      "nextAuditDate": "ISO8601 Date",
      "environmentalClearance": "string",
      "fireNOC": "string",
      "factoryLicense": "string"
    }
  },
  "relationships": {
    "manages": ["MachineTwin"],
    "contains": ["InventoryTwin"],
    "connectedTo": ["VendorTwin"],
    "produces": ["ProductTwin"],
    "ensures": ["QualityTwin"],
    "locatedIn": ["Region"]
  },
  "agents": ["PlantManagerAgent", "MaintenanceAgent", "SafetyAgent"],
  "metrics": {
    "dailyOutput": "number",
    "weeklyOutput": "number",
    "monthlyOutput": "number",
    "efficiency": "number",
    "downtime": "number (hours)",
    "qualityRate": "number (percentage)"
  },
  "telemetry": {
    "lastSync": "ISO8601 DateTime",
    "syncInterval": "number (seconds)",
    "connectionStatus": "CONNECTED | DISCONNECTED"
  }
}
```

**Machine Twin Relationships:**
```json
{
  "type": "RELATIONSHIP",
  "source": "PlantTwin:plant-001",
  "target": "MachineTwin:machine-101",
  "relationship": "CONTAINS",
  "properties": {
    "location": "Zone A - Assembly Line 1",
    "installedDate": "ISO8601 Date",
    "warrantyExpiry": "ISO8601 Date"
  }
}
```

---

### 3.3 Machine Twin

The Machine Twin represents individual production equipment with real-time status, performance metrics, and maintenance history.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "MachineTwin",
  "id": "machine-{machineId}",
  "attributes": {
    "basicInfo": {
      "machineId": "string",
      "name": "string",
      "model": "string",
      "manufacturer": "string",
      "serialNumber": "string",
      "assetTag": "string",
      "category": "CNC | LATHE | PRESS | ROBOT | CONVEYOR | PACKAGING | MIXER | FILLING",
      "status": "IDLE | RUNNING | MAINTENANCE | BREAKDOWN | STANDBY"
    },
    "specifications": {
      "ratedPower": "number (kW)",
      "voltage": "number (V)",
      "frequency": "number (Hz)",
      "weight": "number (kg)",
      "dimensions": { "length": "number", "width": "number", "height": "number" },
      "maxSpeed": "number (rpm)",
      "maxLoad": "number (kg)",
      "precision": "number (mm)"
    },
    "location": {
      "plantId": "string",
      "zone": "string",
      "line": "string",
      "position": "string"
    },
    "production": {
      "cycleTime": "number (seconds per unit)",
      "changeoverTime": "number (minutes)",
      "maxBatchSize": "number",
      "products": ["productId"],
      "capabilities": ["string"]
    },
    "oee": {
      "availability": "number (percentage)",
      "performance": "number (percentage)",
      "quality": "number (percentage)",
      "overall": "number (percentage)",
      "target": "number (percentage)",
      "lastCalculated": "ISO8601 DateTime"
    },
    "telemetry": {
      "powerConsumption": "number (kW)",
      "temperature": "number (C)",
      "vibration": "number (mm/s)",
      "runtime": "number (hours)",
      "cycleCount": "number",
      "outputCount": "number",
      "errorCount": "number",
      "lastUpdated": "ISO8601 DateTime"
    },
    "maintenance": {
      "status": "OPERATIONAL | SCHEDULED | OVERDUE",
      "lastMaintenanceDate": "ISO8601 Date",
      "nextScheduledDate": "ISO8601 Date",
      "totalMaintenanceHours": "number",
      "totalDowntimeHours": "number",
      "mtbf": "number (hours - Mean Time Between Failures)",
      "mttr": "number (hours - Mean Time To Repair)"
    },
    "cost": {
      "purchaseCost": "number",
      "currentValue": "number",
      "depreciationRate": "number (percentage)",
      "hourlyOperatingCost": "number",
      "maintenanceCostYTD": "number"
    }
  },
  "relationships": {
    "locatedAt": "PlantTwin",
    "produces": "ProductTwin",
    "monitoredBy": ["QualityTwin"],
    "maintainedBy": ["MaintenanceAgent"],
    "processes": ["InventoryTwin"]
  },
  "alerts": [
    {
      "alertId": "string",
      "type": "TEMPERATURE_HIGH | VIBRATION_HIGH | MAINTENANCE_DUE | BREAKDOWN",
      "severity": "INFO | WARNING | CRITICAL",
      "message": "string",
      "timestamp": "ISO8601 DateTime",
      "acknowledged": "boolean"
    }
  ],
  "predictions": {
    "failureProbability": "number (0-1)",
    "remainingUsefulLife": "number (hours)",
    "nextMaintenanceDate": "ISO8601 Date",
    "predictedDowntime": "number (hours)",
    "modelConfidence": "number (0-1)"
  },
  "agents": ["MaintenanceAgent", "ProductionAgent", "QualityAgent"]
}
```

**JSON Schema for Machine Twin:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MachineTwin",
  "type": "object",
  "required": ["id", "type", "attributes"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^machine-[a-zA-Z0-9]+$"
    },
    "type": {
      "type": "string",
      "const": "MachineTwin"
    },
    "attributes": {
      "type": "object",
      "required": ["basicInfo", "oee", "telemetry"],
      "properties": {
        "basicInfo": {
          "type": "object",
          "required": ["machineId", "name", "status"],
          "properties": {
            "machineId": { "type": "string" },
            "name": { "type": "string" },
            "status": {
              "type": "string",
              "enum": ["IDLE", "RUNNING", "MAINTENANCE", "BREAKDOWN", "STANDBY"]
            }
          }
        },
        "oee": {
          "type": "object",
          "properties": {
            "availability": { "type": "number", "minimum": 0, "maximum": 100 },
            "performance": { "type": "number", "minimum": 0, "maximum": 100 },
            "quality": { "type": "number", "minimum": 0, "maximum": 100 },
            "overall": { "type": "number", "minimum": 0, "maximum": 100 }
          }
        }
      }
    }
  }
}
```

---

### 3.4 Inventory Twin

The Inventory Twin represents materials, components, and finished goods with real-time stock levels and predictive analytics.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "InventoryTwin",
  "id": "inventory-{itemId}",
  "attributes": {
    "basicInfo": {
      "itemId": "string",
      "sku": "string",
      "name": "string",
      "description": "string",
      "category": "RAW_MATERIAL | COMPONENT | FINISHED_GOODS | CONSUMABLE | SPARE_PART",
      "type": "PRODUCTION | MAINTENANCE | QC",
      "hsnCode": "string",
      "barcode": "string"
    },
    "classification": {
      "abcClass": "A | B | C",
      "xyzClass": "X | Y | Z",
      "shelfLife": "number (days)",
      "hazardous": "boolean",
      "fragile": "boolean",
      "storageRequirements": {
        "temperature": { "min": "number", "max": "number", "unit": "C" },
        "humidity": { "min": "number", "max": "number", "unit": "%" },
        "light": "DARK | INDIRECT | DIRECT",
        "position": "UPRIGHT | FLAT | HORIZONTAL"
      }
    },
    "stock": {
      "quantity": "number",
      "unit": "KG | LITER | PIECE | METER | ROLL",
      "safetyStock": "number",
      "reorderPoint": "number",
      "reorderQuantity": "number",
      "maxStock": "number",
      "allocatedQuantity": "number",
      "availableQuantity": "number",
      "inTransitQuantity": "number",
      "quarantineQuantity": "number"
    },
    "location": {
      "plantId": "string",
      "warehouse": "string",
      "zone": "string",
      "rack": "string",
      "shelf": "string",
      "bin": "string",
      "lastCountDate": "ISO8601 Date"
    },
    "valuation": {
      "unitCost": "number",
      "totalValue": "number",
      "currency": "string",
      "costingMethod": "FIFO | LIFO | AVERAGE",
      "lastPurchasePrice": "number",
      "standardCost": "number"
    },
    "supplier": {
      "primarySupplierId": "string",
      "supplierName": "string",
      "leadTimeDays": "number",
      "moq": "number (Minimum Order Quantity)",
      "preferredVendor": "boolean"
    },
    "quality": {
      "shelfLifeRemaining": "number (percentage)",
      "expiryDate": "ISO8601 Date",
      "lastInspectedDate": "ISO8601 Date",
      "qualityStatus": "RELEASED | QUARANTINE | REJECTED | HOLD",
      "certificateAvailable": "boolean"
    },
    "consumption": {
      "avgDailyUsage": "number",
      "maxDailyUsage": "number",
      "last30DaysConsumption": "number",
      "lastUpdated": "ISO8601 DateTime"
    },
    "availability": {
      "inStock": "boolean",
      "stockOutRisk": "LOW | MEDIUM | HIGH | CRITICAL",
      "daysOfStock": "number",
      "nextExpectedDelivery": "ISO8601 Date"
    }
  },
  "relationships": {
    "storedAt": "PlantTwin",
    "consumedBy": ["MachineTwin", "ProductTwin"],
    "suppliedBy": "VendorTwin",
    "inspectedBy": "QualityTwin",
    "trackedIn": "REZInventory"
  },
  "alerts": [
    {
      "alertId": "string",
      "type": "LOW_STOCK | EXPIRY_WARNING | QUALITY_HOLD | OVERSTOCK",
      "severity": "INFO | WARNING | CRITICAL",
      "message": "string",
      "timestamp": "ISO8601 DateTime"
    }
  ],
  "predictions": {
    "demandForecast": {
      "next7Days": "number",
      "next30Days": "number",
      "confidence": "number"
    },
    "reorderRecommendation": {
      "recommendedQuantity": "number",
      "recommendedDate": "ISO8601 Date",
      "reason": "string"
    },
    "expiryRisk": {
      "probability": "number",
      "affectedQuantity": "number",
      "actionRequired": "string"
    }
  },
  "agents": ["InventoryAgent", "ProcurementAgent", "QualityAgent"]
}
```

---

### 3.5 Vendor Twin

The Vendor Twin represents suppliers with performance tracking, risk assessment, and relationship management.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "VendorTwin",
  "id": "vendor-{vendorId}",
  "attributes": {
    "basicInfo": {
      "vendorId": "string",
      "name": "string",
      "legalName": "string",
      "registrationNumber": "string",
      "type": "MANUFACTURER | DISTRIBUTOR | IMPORTER | AUTHORIZED_DEALER",
      "category": ["string"],
      "founded": "ISO8601 Date",
      "employeeCount": "number",
      "annualRevenue": "number"
    },
    "contact": {
      "primaryEmail": "string",
      "secondaryEmail": "string",
      "phone": "string",
      "mobile": "string",
      "website": "string",
      "address": {
        "billing": "Address",
        "shipping": "Address"
      }
    },
    "certifications": [
      {
        "type": "ISO9001 | ISO14001 | ISO45001 | GMP | CE | BIS",
        "issueDate": "ISO8601 Date",
        "expiryDate": "ISO8601 Date",
        "certificateNumber": "string"
      }
    ],
    "financial": {
      "paymentTerms": "NET30 | NET60 | NET90 | ADVANCE",
      "creditLimit": "number",
      "creditUsed": "number",
      "currency": "string",
      "taxId": "string",
      "bankDetails": "string (encrypted)"
    },
    "capabilities": {
      "productionCapacity": "number (units/month)",
      "leadTimeDays": { "min": "number", "max": "number", "avg": "number" },
      "moq": "number",
      "customizationAvailable": "boolean",
      "exportExperience": "boolean",
      "qualitySystems": ["string"]
    },
    "performance": {
      "overallScore": "number (0-100)",
      "qualityScore": "number (0-100)",
      "deliveryScore": "number (0-100)",
      "priceScore": "number (0-100)",
      "responsivenessScore": "number (0-100)",
      "totalOrders": "number",
      "onTimeDeliveries": "number",
      "onFullDeliveries": "number",
      "defectRate": "number (percentage)",
      "returnRate": "number (percentage)",
      "avgLeadTime": "number (days)",
      "priceStability": "number (percentage variance)"
    },
    "risk": {
      "riskScore": "number (0-100)",
      "financialStability": "STABLE | MODERATE | RISKY",
      "dependencyLevel": "LOW | MEDIUM | HIGH | CRITICAL",
      "lastAuditDate": "ISO8601 Date",
      "nextAuditDate": "ISO8601 Date",
      "riskFactors": ["string"]
    },
    "relationship": {
      "since": "ISO8601 Date",
      "status": "ACTIVE | INACTIVE | PROBATION | BLACKLISTED",
      "accountManager": "string",
      "contractExpiry": "ISO8601 Date",
      "preferredVendor": "boolean"
    }
  },
  "relationships": {
    "supplies": ["InventoryTwin"],
    "deliversTo": "PlantTwin",
    "connectedVia": ["DistributionOS", "ProcurementOS"],
    "evaluatedBy": "QualityTwin"
  },
  "transactions": {
    "totalOrdersValue": "number",
    "ordersYTD": "number",
    "deliveriesOnTime": "number",
    "deliveriesLate": "number",
    "deliveriesShort": "number",
    "lastOrderDate": "ISO8601 Date",
    "lastDeliveryDate": "ISO8601 Date"
  },
  "agents": ["ProcurementAgent", "QualityAgent", "RiskAgent"]
}
```

---

### 3.6 Product Twin

The Product Twin represents manufactured products with full lifecycle tracking from design to delivery.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "ProductTwin",
  "id": "product-{productId}",
  "attributes": {
    "basicInfo": {
      "productId": "string",
      "sku": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "productFamily": "string",
      "variant": "string",
      "version": "string",
      "status": "CONCEPT | DESIGN | PROTOTYPE | LAUNCHED | EOL"
    },
    "specifications": {
      "dimensions": { "length": "number", "width": "number", "height": "number", "unit": "mm" },
      "weight": { "value": "number", "unit": "kg" },
      "materials": [
        {
          "materialId": "string",
          "name": "string",
          "percentage": "number"
        }
      ],
      "colors": ["string"],
      "sizes": ["string"],
      "powerRequirements": "string",
      "warrantyPeriod": "number (months)"
    },
    "bom": {
      "bomId": "string",
      "version": "string",
      "status": "DRAFT | ACTIVE | OBSOLETE",
      "totalMaterialCost": "number",
      "totalLaborCost": "number",
      "overheadCost": "number",
      "totalCost": "number",
      "items": [
        {
          "itemId": "string",
          "materialId": "string",
          "quantity": "number",
          "unit": "string",
          "unitCost": "number",
          "isOptional": "boolean",
          "scrapPercentage": "number"
        }
      ],
      "operations": [
        {
          "operationId": "string",
          "name": "string",
          "machineType": "string",
          "cycleTime": "number (seconds)",
          "setupTime": "number (minutes)",
          "laborHours": "number",
          "sequence": "number"
        }
      ]
    },
    "production": {
      "cycleTime": "number (seconds per unit)",
      "batchSize": { "min": "number", "max": "number", "optimal": "number" },
      "yield": "number (percentage)",
      "reworkRate": "number (percentage)",
      "productionLines": ["string"],
      "avgProductionPerDay": "number"
    },
    "quality": {
      "qualityStandards": ["string"],
      "inspectionLevel": "NORMAL | REDUCED | TIGHTENED",
      "aql": "number",
      "defectTolerance": "number",
      "certifications": ["string"]
    },
    "cost": {
      "materialCost": "number",
      "laborCost": "number",
      "overheadCost": "number",
      "totalCost": "number",
      "margin": "number (percentage)",
      "sellingPrice": "number",
      "currency": "string"
    },
    "demand": {
      "monthlyDemand": "number",
      "peakDemand": "number",
      "seasonality": "string",
      "demandTrend": "GROWING | STABLE | DECLINING",
      "forecastConfidence": "number"
    }
  },
  "relationships": {
    "producedAt": "PlantTwin",
    "madeFrom": ["InventoryTwin"],
    "processedOn": ["MachineTwin"],
    "inspectedBy": "QualityTwin",
    "soldTo": "Customer",
    "componentOf": ["ProductTwin"]
  },
  "batchTracking": {
    "currentBatch": "string",
    "batchCountYTD": "number",
    "totalUnitsYTD": "number",
    "totalUnitsRejected": "number",
    "rejectionRate": "number"
  },
  "lifecycle": {
    "launchDate": "ISO8601 Date",
    "maturityDate": "ISO8601 Date",
    "endOfLifeDate": "ISO8601 Date",
    "replacedBy": "string",
    "replaces": "string"
  },
  "agents": ["ProductionAgent", "QualityAgent", "SalesAgent", "ProcurementAgent"]
}
```

---

### 3.7 Quality Twin

The Quality Twin represents quality management with inspection tracking, defect analysis, and compliance management.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "QualityTwin",
  "id": "quality-{inspectionId}",
  "attributes": {
    "basicInfo": {
      "inspectionId": "string",
      "type": "INCOMING | IN_PROCESS | FINAL | RE-INSPECTION",
      "stage": "RAW_MATERIAL | WIP | FINISHED_GOODS",
      "batchNumber": "string",
      "sampleSize": "number",
      "aqlLevel": "string",
      "status": "SCHEDULED | IN_PROGRESS | PASSED | FAILED | CONDITIONAL"
    },
    "product": {
      "productId": "string",
      "productName": "string",
      "batchSize": "number",
      "manufacturingDate": "ISO8601 Date"
    },
    "inspection": {
      "inspector": "string",
      "inspectionDate": "ISO8601 DateTime",
      "location": "string",
      "equipment": "string",
      "duration": "number (minutes)"
    },
    "parameters": [
      {
        "parameterId": "string",
        "name": "string",
        "specification": {
          "target": "number",
          "tolerance": { "lower": "number", "upper": "number" },
          "unit": "string"
        },
        "actual": "number",
        "result": "PASS | FAIL",
        "measurementMethod": "string"
      }
    ],
    "defects": [
      {
        "defectId": "string",
        "type": "CRITICAL | MAJOR | MINOR",
        "category": "string",
        "description": "string",
        "count": "number",
        "severity": "number (1-10)",
        "rootCause": "string",
        "correctiveAction": "string"
      }
    ],
    "results": {
      "totalInspected": "number",
      "totalDefective": "number",
      "defectRate": "number (percentage)",
      "aqlStatus": "ACCEPT | REJECT",
      "overallResult": "PASS | FAIL",
      "disposition": "ACCEPT | REJECT | REWORK |降级 | HOLD"
    },
    "compliance": {
      "standard": "string",
      "certificateNumber": "string",
      "regulatoryStatus": "COMPLIANT | NON_COMPLIANT | PENDING",
      "observations": ["string"]
    }
  },
  "capa": {
    "capaId": "string",
    "status": "OPEN | IN_PROGRESS | VERIFIED | CLOSED",
    "rootCause": "string",
    "containmentAction": "string",
    "correctiveAction": "string",
    "preventiveAction": "string",
    "effectivenessCheck": "string",
    "targetDate": "ISO8601 Date",
    "completedDate": "ISO8601 Date"
  },
  "trends": {
    "defectTrend": "IMPROVING | STABLE | WORSENING",
    "last30DaysDefectRate": "number",
    "last90DaysDefectRate": "number",
    "defectCategories": [
      { "category": "string", "count": "number", "percentage": "number" }
    ]
  },
  "relationships": {
    "inspects": ["ProductTwin", "InventoryTwin"],
    "monitoredOn": ["MachineTwin"],
    "evaluatedBy": ["QualityAgent"],
    "linkedTo": ["VendorTwin"],
    "locatedAt": "PlantTwin"
  },
  "agents": ["QualityAgent", "MaintenanceAgent"]
}
```

---

## 4. Integration Flows

### 4.1 Core Integration: REZ Inventory ↔ TwinOS

This is the primary integration point enabling bidirectional sync between inventory management and digital twin representations.

```
┌─────────────────────┐         ┌──────────────────────────────────────────┐
│   REZ INVENTORY     │         │              TWINOS LAYER                │
│      (4010)         │         │                                       │
│                     │         │  ┌─────────────────────────────────┐  │
│  ┌────────────────┐ │         │  │         Twin Hub (5250)         │  │
│  │ Stock Updates  │─┼─────────┼──│                                 │  │
│  └────────────────┘ │ Webhook │  │  • State synchronization        │  │
│                     │         │  │  • Event propagation            │  │
│  ┌────────────────┐ │         │  │  • Relationship updates         │  │
│  │ Alert Events  │─┼─────────┼──│  • Alert routing                │  │
│  └────────────────┘ │ Event   │  └─────────────────────────────────┘  │
│                     │         │           │       │       │            │
│  ┌────────────────┐ │         │     ┌─────┘       │       └─────┐      │
│  │ Query Requests │─┼─────────┼─────│             │             │      │
│  └────────────────┘ │   API   │     │             │             │      │
└─────────────────────┘         │     ▼             ▼             ▼      │
                                │  ┌────────┐  ┌────────┐  ┌────────┐    │
                                │  │ Plant  │  │Inventory│ │Machine│    │
                                │  │ Twin   │  │  Twin   │ │ Twin  │    │
                                │  └────────┘  └────────┘  └────────┘    │
                                │                                       │
                                │  ┌────────┐  ┌────────┐  ┌────────┐    │
                                │  │ Vendor │  │Product │  │Quality│    │
                                │  │ Twin   │  │ Twin   │  │ Twin  │    │
                                │  └────────┘  └────────┘  └────────┘    │
                                └──────────────────────────────────────┘
```

**Webhook Events from REZ Inventory:**

```typescript
// Stock Level Change
interface InventoryStockChangeEvent {
  eventType: 'STOCK_CHANGED';
  timestamp: string;
  payload: {
    itemId: string;
    productId: string;
    previousStock: number;
    currentStock: number;
    change: number;
    reason: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
    referenceId?: string;
    locationId: string;
  };
  twinUpdate: {
    twinId: string;      // e.g., "inventory-{itemId}"
    attribute: string;   // e.g., "attributes.stock.quantity"
    newValue: number;
    triggerAlerts: string[];
  };
}

// Reorder Alert
interface InventoryReorderAlertEvent {
  eventType: 'REORDER_ALERT';
  timestamp: string;
  payload: {
    itemId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    supplierId?: string;
    daysOfStock: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: string;
    triggerAgents: string[];  // e.g., ["ProcurementAgent"]
  };
}

// Expiry Warning
interface InventoryExpiryWarningEvent {
  eventType: 'EXPIRY_WARNING';
  timestamp: string;
  payload: {
    itemId: string;
    productName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    affectedQuantity: number;
    batchNumber: string;
    locationId: string;
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: string;
    triggerAgents: string[];
  };
}

// Stock Out
interface InventoryStockOutEvent {
  eventType: 'STOCK_OUT';
  timestamp: string;
  payload: {
    itemId: string;
    productName: string;
    lastStockLevel: number;
    affectedProductionOrders: string[];
    affectedProducts: string[];
    estimatedImpact: {
      productionDelay: number;  // hours
      revenueImpact: number;
    };
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: string;
    triggerAgents: string[];
    alertSeverity: 'CRITICAL';
  };
}
```

**API Endpoints for TwinOS Integration:**

```yaml
# TwinOS Inventory Sync Endpoints
POST /api/v1/twin/inventory/sync:
  description: Full synchronization of inventory data
  body:
    items: InventoryItem[]
    lastSyncTimestamp: string
  response:
    synced: number
    errors: SyncError[]
    newAlerts: Alert[]

POST /api/v1/twin/inventory/update:
  description: Update specific inventory attribute
  body:
    twinId: string
    attribute: string
    value: any
    reason: string
  response:
    updated: boolean
    triggeredEvents: Event[]

GET /api/v1/twin/inventory/:twinId:
  description: Get full inventory twin state
  response:
    twin: InventoryTwin

GET /api/v1/twin/inventory/:twinId/history:
  description: Get historical changes
  query:
    from: string
    to: string
    limit: number
  response:
    changes: ChangeRecord[]

POST /api/v1/twin/inventory/:twinId/alerts:
  description: Trigger alert for inventory twin
  body:
    alertType: string
    severity: string
    message: string
    actions: Action[]
  response:
    alertId: string
    dispatchedTo: Agent[]
```

---

### 4.2 Production Planning Integration Flow

```
┌─────────────────────┐     ┌─────────────────┐     ┌────────────────────┐
│   REZ Manufacturing│     │    Kitchen AI   │     │   TwinOS Layer      │
│        OS           │     │     (4082)      │     │                    │
│       (4850)        │     │                 │     │                    │
│                     │     │                 │     │                    │
│  ┌────────────────┐ │     │  ┌───────────┐  │     │  ┌──────────────┐  │
│  │   Work Order   │─┼────▶│  │ Production│  │     │  │  Plant Twin  │  │
│  │   Created      │ │     │  │ Optimizer │  │     │  │              │  │
│  └────────────────┘ │     │  └─────┬─────┘  │     │  │  oee: 85%    │  │
│                     │     │        │        │     │  │  output: 1200│  │
│  ┌────────────────┐ │     │        ▼        │     │  └──────┬───────┘  │
│  │   BOM Query   │─┼────▶│  ┌───────────┐  │     │         │          │
│  └────────────────┘ │     │  │Material   │  │     │  ┌──────┴───────┐  │
│                     │     │  │Check      │  │     │  │Machine Twin  │  │
│  ┌────────────────┐ │     │  └─────┬─────┘  │     │  │              │  │
│  │  QC Result     │─┼────▶│        │        │     │  │ station-1:  │  │
│  │  Recorded      │ │     │        ▼        │     │  │  utilization │  │
│  └────────────────┘ │     │  ┌───────────┐  │     │  │  78%         │  │
│                     │     │  │Route      │  │     │  └─────────────┘  │
└─────────────────────┘     │  │Decision   │  │     │         │          │
                           │  └─────┬─────┘  │     │         ▼          │
                           │        │        │     │  ┌──────────────┐  │
                           │        │        │     │  │Inventory Twin│  │
                           │        ▼        │     │  │              │  │
                           │  ┌───────────┐  │     │  │ raw-001:     │  │
                           │  │Schedule   │  │     │  │ qty: 500     │  │
                           │  │Optimize   │  │     │  │ safety: 100  │  │
                           │  └───────────┘  │     │  └─────────────┘  │
                           └─────────────────┘     └───────────────────┘
```

**Key Integration Points:**

```typescript
// 1. Work Order Creation → Production Optimization
interface WorkOrderCreatedIntegration {
  trigger: {
    system: 'REZ Manufacturing OS';
    event: 'WORK_ORDER_CREATED';
    payload: {
      workOrderId: string;
      productId: string;
      quantity: number;
      priority: string;
      dueDate: string;
      bomId: string;
    };
  };
  actions: [
    {
      system: 'Kitchen AI';
      endpoint: 'POST /api/route/production';
      payload: ProductionRouteRequest;
    },
    {
      system: 'REZ Inventory';
      endpoint: 'POST /api/inventory/check';
      payload: { items: MaterialRequirement[] };
    },
    {
      system: 'TwinOS';
      endpoint: 'POST /api/v1/twin/plant/{plantId}/schedule';
      payload: { workOrderId: string; startTime: string; estimatedDuration: number };
    }
  ];
}

// 2. Material Availability Check → Twin Update
interface MaterialCheckIntegration {
  trigger: {
    system: 'Kitchen AI';
    event: 'MATERIAL_CHECK_COMPLETE';
    payload: {
      workOrderId: string;
      availability: {
        itemId: string;
        available: boolean;
        availableQuantity: number;
        shortageQuantity: number;
      }[];
    };
  };
  actions: [
    {
      system: 'REZ Inventory';
      endpoint: 'POST /api/inventory/reserve';
      payload: { items: { itemId: string; quantity: number }[]; referenceType: 'WORK_ORDER'; referenceId: string };
    },
    {
      system: 'TwinOS';
      endpoint: 'POST /api/v1/twin/inventory/batch-reserve';
      payload: { reservations: InventoryReservation[] };
    },
    {
      system: 'Procurement OS';
      condition: 'if shortageQuantity > 0';
      endpoint: 'POST /api/purchase-orders';
      payload: PurchaseOrderRequest;
    }
  ];
}

// 3. QC Result Recording → Quality Twin Update
interface QCResultIntegration {
  trigger: {
    system: 'REZ Manufacturing OS';
    event: 'QC_CHECK_RECORDED';
    payload: {
      inspectionId: string;
      batchNumber: string;
      productId: string;
      result: 'PASS' | 'FAIL';
      defectCount?: number;
      defectType?: string[];
    };
  };
  actions: [
    {
      system: 'TwinOS';
      endpoint: 'POST /api/v1/twin/quality';
      payload: QualityTwinUpdate;
    },
    {
      system: 'Kitchen AI';
      condition: 'if result === FAIL';
      endpoint: 'POST /api/quality/analyze';
      payload: { inspectionId: string; defectData: DefectData };
    },
    {
      system: 'REZ Inventory';
      condition: 'if result === FAIL && disposition === HOLD';
      endpoint: 'PATCH /api/inventory/stock/{productId}/status';
      payload: { status: 'QUARANTINE'; quantity: number };
    }
  ];
}
```

---

### 4.3 Procurement-to-Distribution Integration Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│   Procurement OS    │     │     TwinOS Layer    │     │  Distribution OS   │
│       (4320)        │     │                     │     │      (4300)        │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  PO Created    │─┼────▶│  │ Vendor Twin  │  │     │  │ Distributor  │  │
│  └────────────────┘ │     │  │              │  │     │  │ Inventory    │  │
│                      │     │  │ performance: │  │     │  │ Updated      │  │
│  ┌────────────────┐ │     │  │  onTime: 95% │  │     │  └──────────────┘  │
│  │  Shipment      │─┼────▶│  │  quality: 98%│  │     │                    │
│  │  Dispatched    │ │     │  └──────┬───────┘  │     │  ┌──────────────┐  │
│  └────────────────┘ │     │         │          │     │  │ Demand       │  │
│                      │     │         ▼          │     │  │ Signals      │  │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  │ Generated    │  │
│  │  Delivery      │─┼────▶│  │Inventory Twin│ │     │  └──────────────┘  │
│  │  Confirmed     │ │     │  │              │  │     │                    │
│  └────────────────┘ │     │  │ qty: updated │  │     │  ┌──────────────┐  │
│                      │     │  │ location:    │  │     │  │ Route        │  │
└─────────────────────┘     │  │  warehouse-A │  │     │  │ Optimized    │  │
                           │  └──────────────┘  │     │  └──────────────┘  │
                           └─────────────────────┘     └────────────────────┘
```

**Data Flow Specifications:**

```typescript
// Procurement to TwinOS
interface PurchaseOrderFlow {
  orderCreated: {
    source: 'Procurement OS';
    target: 'TwinOS';
    data: {
      purchaseOrder: PurchaseOrder;
      vendorTwinId: string;
      expectedDeliveryDate: string;
    };
    twinUpdates: [
      { twinType: 'VendorTwin', attribute: 'transactions.pendingOrders', operation: 'INCREMENT' },
      { twinType: 'InventoryTwin', attribute: 'stock.inTransitQuantity', operation: 'INCREMENT' }
    ];
  };

  shipmentDispatched: {
    source: 'Procurement OS';
    target: 'TwinOS';
    data: {
      poId: string;
      trackingNumber: string;
      carrier: string;
      dispatchDate: string;
      expectedArrival: string;
    };
    twinUpdates: [
      { twinType: 'VendorTwin', attribute: 'performance.onTimeDeliveries', operation: 'INCREMENT_IF_ONTIME' },
      { twinType: 'InventoryTwin', attribute: 'availability.nextExpectedDelivery', operation: 'SET' }
    ];
  };

  goodsReceived: {
    source: 'Procurement OS';
    target: ['REZ Inventory', 'TwinOS'];
    data: {
      poId: string;
      receivedItems: {
        itemId: string;
        orderedQuantity: number;
        receivedQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity: number;
        rejectionReason?: string;
      }[];
      receivedDate: string;
      qualityStatus: 'PENDING_INSPECTION' | 'RELEASED' | 'HOLD';
    };
    twinUpdates: [
      { twinType: 'InventoryTwin', attribute: 'stock.quantity', operation: 'ADD' },
      { twinType: 'InventoryTwin', attribute: 'stock.inTransitQuantity', operation: 'SUBTRACT' },
      { twinType: 'VendorTwin', attribute: 'performance.defectRate', operation: 'UPDATE' }
    ];
  };
}

// Distribution to Procurement
interface DemandSignalFlow {
  lowStockDetected: {
    source: 'Distribution OS';
    target: ['Procurement OS', 'TwinOS'];
    data: {
      distributorId: string;
      itemId: string;
      currentStock: number;
      avgDailySales: number;
      daysUntilStockOut: number;
      reorderPoint: number;
      recommendedOrderQuantity: number;
    };
    actions: [
      { system: 'Procurement OS', action: 'CREATE_AUTO_PO', condition: 'daysUntilStockOut < 7' },
      { system: 'TwinOS', action: 'UPDATE_PREDICTIONS', data: { demandPattern: string } }
    ];
  };

  replenishmentTriggered: {
    source: 'Distribution OS';
    target: 'Procurement OS';
    data: {
      replenishmentId: string;
      distributorId: string;
      items: { itemId: string; quantity: number }[];
      priority: 'NORMAL' | 'URGENT';
      deliveryWindow: { from: string; to: string };
    };
  };
}
```

---

### 4.4 Quality Control Integration Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│   REZ Manufacturing│     │     TwinOS Layer    │     │   REZ Inventory    │
│        OS           │     │                     │     │      (4010)        │
│       (4850)        │     │                     │     │                    │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Batch         │─┼────▶│  │ Product Twin │  │     │  │ Material     │  │
│  │  Completed     │ │     │  │              │  │     │  │ Quarantine   │  │
│  └────────────────┘ │     │  │ batchCount:  │  │     │  └──────────────┘  │
│                     │     │  │  updated     │  │     │                    │
│  ┌────────────────┐ │     │  └──────┬───────┘  │     │                    │
│  │  QC Sample     │─┼────▶│         │          │     │                    │
│  │  Selected      │ │     │         ▼          │     │                    │
│  └────────────────┘ │     │  ┌──────────────┐  │     │                    │
│                     │     │  │ Quality Twin │  │     │                    │
│  ┌────────────────┐ │     │  │              │  │     │                    │
│  │  Defect Found  │─┼────▶│  │ defectCount: │  │     │                    │
│  │  (by Machine)  │ │     │  │  updated     │  │     │                    │
│  └────────────────┘ │     │  │ alerts: sent │  │     │                    │
│                     │     │  └──────────────┘  │     │                    │
│                     │     │                     │     │                    │
└─────────────────────┘     └─────────────────────┘     └────────────────────┘
```

---

## 5. Agent Architecture

### 5.1 Agent Overview

AI agents manage digital twins and orchestrate manufacturing operations with autonomous decision-making capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      PLANT MANAGER AGENT                                ││
│  │  Twins Managed: PlantTwin                                               ││
│  │  Primary Role: Overall plant operations, capacity planning              ││
│  │  Skills: Production Scheduling, Capacity Optimization, KPI Monitoring   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  PRODUCTION   │  │  MAINTENANCE  │  │  PROCUREMENT  │  │   QUALITY    │ │
│  │    AGENT      │  │    AGENT      │  │    AGENT      │  │    AGENT     │ │
│  │               │  │               │  │               │  │              │ │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:       │ │
│  │ • MachineTwin │  │ • MachineTwin │  │ • VendorTwin  │  │ • QualityTwin│ │
│  │ • ProductTwin │  │ • InventoryTwin│ │ • InventoryTwin│ │ • ProductTwin│ │
│  │ • InventoryTwin│ │               │  │               │  │ • InventoryTwin│ │
│  │               │  │               │  │               │  │              │ │
│  │ Skills:       │  │ Skills:       │  │ Skills:       │  │ Skills:      │ │
│  │ • Scheduling  │  │ • Predictive   │  │ • Supplier Mgmt│ │ • Inspection │ │
│  │ • Routing     │  │   Maintenance │  │ • Price Negot. │  │ • Defect     │ │
│  │ • Bottleneck  │  │ • Emergency    │  │ • Contract Mgmt│  │   Analysis   │ │
│  │   Detection   │  │   Repair      │  │ • Risk Assess. │  │ • CAPA Mgmt  │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  INVENTORY    │  │   SAFETY      │  │    COST       │  │   REPORT    │ │
│  │    AGENT      │  │    AGENT      │  │    AGENT      │  │   AGENT     │ │
│  │               │  │               │  │               │  │              │ │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:       │ │
│  │ • InventoryTwin│ │ • PlantTwin   │  │ • ProductTwin │  │ • All Twins  │ │
│  │ • VendorTwin  │  │ • MachineTwin │  │ • InventoryTwin│ │              │ │
│  │ • QualityTwin │  │               │  │ • VendorTwin  │  │ Skills:      │ │
│  │               │  │ Skills:       │  │               │  │ • Report Gen│ │
│  │ Skills:       │  │ • Risk Assess │  │ Skills:       │  │ • Dashboard │ │
│  │ • Stock Reorder│ │ • Compliance  │  │ • Cost Anal.  │  │ • Trend Anal│ │
│  │ • Expiry Mgmt │  │ • Incident Res│  │ • Variance Anal│ │ • Alert Summ│ │
│  │ • ABC Analysis│  │ • Training    │  │ • Budget Plan │  │              │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Agent Specifications

#### 5.2.1 Production Agent

```json
{
  "agentId": "production-agent-{plantId}",
  "name": "Production Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "PlantTwin:{plantId}",
    "MachineTwin:*",
    "ProductTwin:*",
    "InventoryTwin:RAW_MATERIAL,*"
  ],
  "role": "Manages production scheduling, work order execution, and production optimization",
  "capabilities": {
    "scheduling": {
      "description": "Optimize production schedules based on orders, capacity, and material availability",
      "inputs": ["workOrders", "machineAvailability", "materialStock", "demandForecast"],
      "outputs": ["optimizedSchedule", "resourceAllocation"],
      "autonomy": "SEMI-AUTONOMOUS"
    },
    "routing": {
      "description": "Determine optimal routing for each production order through machines and stations",
      "inputs": ["orderDetails", "machineCapabilities", "currentLoad", "bom"],
      "outputs": ["routingDecision", "estimatedTime", "requiredMaterials"],
      "autonomy": "AUTONOMOUS"
    },
    "bottleneckDetection": {
      "description": "Identify production bottlenecks and recommend solutions",
      "inputs": ["stationUtilization", "queueLengths", "cycleTimes", "downtimeData"],
      "outputs": ["bottleneckReport", "recommendations"],
      "autonomy": "AUTONOMOUS"
    },
    "yieldOptimization": {
      "description": "Monitor and improve production yield through process adjustments",
      "inputs": ["qualityData", "processParameters", "materialQuality"],
      "outputs": ["yieldReport", "processAdjustments"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "mfg-scheduling-v2",
      "name": "Production Scheduling",
      "version": "2.0",
      "confidence": 0.92,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "mfg-routing-v1",
      "name": "Production Routing",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "mfg-bottleneck-v1",
      "name": "Bottleneck Analysis",
      "version": "1.0",
      "confidence": 0.85,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "scheduleChange": {
      "threshold": 2,  // hours impact before human approval
      "type": "AUTOMATIC_BELOW"
    },
    "batchSizeChange": {
      "threshold": "20%",  // % change from standard
      "type": "RECOMMEND_ABOVE"
    },
    "emergencyProduction": {
      "threshold": "any",
      "type": "ALWAYS_RECOMMEND"
    }
  },
  "notifications": {
    "onScheduleChange": ["PlantManagerAgent"],
    "onBottleneckDetected": ["PlantManagerAgent", "MaintenanceAgent"],
    "onMaterialShortage": ["ProcurementAgent"],
    "onQualityIssue": ["QualityAgent"]
  }
}
```

#### 5.2.2 Maintenance Agent

```json
{
  "agentId": "maintenance-agent-{plantId}",
  "name": "Maintenance Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "MachineTwin:*",
    "InventoryTwin:SPARE_PART,*"
  ],
  "role": "Manages machine health, predictive maintenance, and emergency repairs",
  "capabilities": {
    "predictiveMaintenance": {
      "description": "Predict machine failures and schedule preventive maintenance",
      "inputs": ["machineTelemetry", "historicalData", "maintenanceHistory"],
      "outputs": ["maintenanceSchedule", "failurePredictions", "partsRequired"],
      "autonomy": "AUTONOMOUS"
    },
    "emergencyRepair": {
      "description": "Coordinate emergency repair responses and resource allocation",
      "inputs": ["breakdownData", "availableTechnicians", "spareParts"],
      "outputs": ["repairPlan", "estimatedDowntime", "resourceAssignment"],
      "autonomy": "COORDINATES"
    },
    "oeeOptimization": {
      "description": "Analyze and improve Overall Equipment Effectiveness",
      "inputs": ["oeeMetrics", "downtimeData", "qualityData"],
      "outputs": ["oeeAnalysis", "improvementRecommendations"],
      "autonomy": "RECOMMENDS_ONLY"
    },
    "sparePartsManagement": {
      "description": "Monitor and reorder spare parts based on usage and predictions",
      "inputs": ["partsInventory", "consumptionRate", "leadTimes"],
      "outputs": ["reorderRecommendations", "stockAlerts"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "maint-predictive-v2",
      "name": "Predictive Maintenance",
      "version": "2.0",
      "confidence": 0.90,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "maint-emergency-v1",
      "name": "Emergency Response",
      "version": "1.0",
      "confidence": 0.95,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "maint-oee-v1",
      "name": "OEE Analysis",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "scheduleMaintenance": {
      "threshold": "probability > 70%",
      "type": "AUTOMATIC"
    },
    "orderEmergencyParts": {
      "threshold": "stock < safety stock AND lead time > downtime risk",
      "type": "AUTOMATIC"
    },
    "emergencyStop": {
      "threshold": "any critical alert",
      "type": "ALWAYS_TRIGGER_ALERT"
    }
  },
  "notifications": {
    "onPredictiveAlert": ["PlantManagerAgent"],
    "onEmergencyBreakdown": ["PlantManagerAgent", "ProductionAgent"],
    "onMaintenanceScheduled": ["ProductionAgent"],
    "onPartsLow": ["InventoryAgent"]
  }
}
```

#### 5.2.3 Procurement Agent

```json
{
  "agentId": "procurement-agent-{plantId}",
  "name": "Procurement Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "VendorTwin:*",
    "InventoryTwin:RAW_MATERIAL,*",
    "QualityTwin:INCOMING,*"
  ],
  "role": "Manages vendor relationships, purchase orders, and supply chain optimization",
  "capabilities": {
    "autoReorder": {
      "description": "Automatically create purchase orders when inventory reaches reorder points",
      "inputs": ["stockLevels", "reorderPoints", "supplierInfo", "leadTimes"],
      "outputs": ["purchaseOrders", "vendorAssignments"],
      "autonomy": "AUTONOMOUS"
    },
    "vendorNegotiation": {
      "description": "Negotiate pricing and terms with vendors via RFQ process",
      "inputs": ["requirements", "vendorOffers", "marketPrices"],
      "outputs": ["negotiationResult", "selectedVendor"],
      "autonomy": "COORDINATES"
    },
    "supplierRiskAssessment": {
      "description": "Monitor and assess vendor performance and risk",
      "inputs": ["deliveryHistory", "qualityData", "financialIndicators"],
      "outputs": ["riskScores", "alerts", "recommendations"],
      "autonomy": "AUTONOMOUS"
    },
    "contractManagement": {
      "description": "Manage vendor contracts and ensure compliance",
      "inputs": ["contractTerms", "orderHistory", "performanceData"],
      "outputs": ["renewalRecommendations", "violationAlerts"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "proc-autoorder-v2",
      "name": "Auto Reordering",
      "version": "2.0",
      "confidence": 0.93,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "proc-rfq-v1",
      "name": "RFQ Processing",
      "version": "1.0",
      "confidence": 0.87,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "proc-negotiation-v1",
      "name": "Vendor Negotiation",
      "version": "1.0",
      "confidence": 0.82,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "autoPurchaseOrder": {
      "threshold": "stock <= reorderPoint",
      "type": "AUTOMATIC",
      "maxValue: "vendor credit limit"
    },
    "vendorBlacklist": {
      "threshold": "performance score < 40% OR defect rate > 10%",
      "type": "ALWAYS_RECOMMEND_SUSPENSION"
    },
    "priceApproval": {
      "threshold": "price variance > 10% from standard",
      "type": "ESCALATE"
    }
  },
  "notifications": {
    "onPurchaseOrderCreated": ["VendorTwin", "InventoryAgent"],
    "onVendorRiskAlert": ["PlantManagerAgent"],
    "onDeliveryDelay": ["ProductionAgent"],
    "onQualityIssue": ["QualityAgent"]
  }
}
```

#### 5.2.4 Quality Agent

```json
{
  "agentId": "quality-agent-{plantId}",
  "name": "Quality Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "QualityTwin:*",
    "ProductTwin:*",
    "InventoryTwin:RAW_MATERIAL,*",
    "MachineTwin:*"
  ],
  "role": "Manages quality control, defect analysis, and compliance",
  "capabilities": {
    "inspectionPlanning": {
      "description": "Determine optimal inspection sampling and parameters",
      "inputs": ["batchInfo", "historicalDefectRate", "aqlLevel"],
      "outputs": ["inspectionPlan", "sampleSize", "parameters"],
      "autonomy": "AUTONOMOUS"
    },
    "defectAnalysis": {
      "description": "Analyze defects to identify root causes and patterns",
      "inputs": ["defectData", "processParameters", "materialData", "machineData"],
      "outputs": ["rootCause", "defectPatterns", "recommendations"],
      "autonomy": "AUTONOMOUS"
    },
    "capaManagement": {
      "description": "Manage Corrective and Preventive Actions",
      "inputs": ["defectInfo", "rootCause", "historicalCapa"],
      "outputs": ["capaPlan", "actionItems"],
      "autonomy": "COORDINATES"
    },
    "complianceMonitoring": {
      "description": "Monitor compliance with quality standards and regulations",
      "inputs": ["standards", "inspectionResults", "certifications"],
      "outputs": ["complianceStatus", "gapAnalysis", "auditPrep"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "qual-inspection-v2",
      "name": "Inspection Planning",
      "version": "2.0",
      "confidence": 0.91,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "qual-rootcause-v1",
      "name": "Root Cause Analysis",
      "version": "1.0",
      "confidence": 0.89,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "qual-spc-v1",
      "name": "Statistical Process Control",
      "version": "1.0",
      "confidence": 0.86,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "batchRejection": {
      "threshold": "defect rate > AQL limit",
      "type": "AUTOMATIC"
    },
    "capaCreation": {
      "threshold": "same defect occurs 3+ times",
      "type": "AUTOMATIC"
    },
    "supplierHold": {
      "threshold": "defect rate > 5% on incoming inspection",
      "type": "AUTOMATIC"
    }
  },
  "notifications": {
    "onBatchFailure": ["PlantManagerAgent", "ProductionAgent"],
    "onCapaRequired": ["QualityManager"],
    "onComplianceIssue": ["PlantManagerAgent", "SafetyAgent"],
    "onSupplierIssue": ["ProcurementAgent"]
  }
}
```

#### 5.2.5 Inventory Agent

```json
{
  "agentId": "inventory-agent-{plantId}",
  "name": "Inventory Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "InventoryTwin:*",
    "VendorTwin:*"
  ],
  "role": "Manages inventory levels, stock movements, and storage optimization",
  "capabilities": {
    "stockOptimization": {
      "description": "Optimize inventory levels based on demand and supply patterns",
      "inputs": ["stockLevels", "demandForecast", "leadTimes", "costFactors"],
      "outputs": ["reorderPoints", "safetyStock", "maxStock"],
      "autonomy": "AUTONOMOUS"
    },
    "expiryManagement": {
      "description": "Manage expiring inventory and minimize waste",
      "inputs": ["expiryDates", "consumptionRate", "productionSchedule"],
      "outputs": ["usageRecommendations", "alertList"],
      "autonomy": "AUTONOMOUS"
    },
    "abcAnalysis": {
      "description": "Perform and update ABC classification based on usage patterns",
      "inputs": ["movementHistory", "valuationData"],
      "outputs": ["abcClassification", "controlPolicies"],
      "autonomy": "AUTONOMOUS"
    },
    "cycleCounting": {
      "description": "Plan and analyze cycle counts for inventory accuracy",
      "inputs": ["abcClass", "lastCountDate", "varianceHistory"],
      "outputs": ["countSchedule", "countPlan"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "inv-optimize-v2",
      "name": "Inventory Optimization",
      "version": "2.0",
      "confidence": 0.90,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "inv-expiry-v1",
      "name": "Expiry Management",
      "version": "1.0",
      "confidence": 0.93,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "inv-abc-v1",
      "name": "ABC Analysis",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "stockAdjustment": {
      "threshold: "variance > 5%",
      "type: "ESCALATE"
    },
    "emergencyReorder": {
      threshold: "stock < safetyStock",
      type: "AUTOMATIC"
    },
    "wasteWriteOff": {
      threshold: "expired items",
      type: "RECOMMEND"
    }
  },
  "notifications": {
    "onLowStock": ["ProcurementAgent", "ProductionAgent"],
    "onExpiryWarning": ["ProductionAgent"],
    "onStockOut": ["ProcurementAgent", "PlantManagerAgent"],
    "onDiscrepancy": ["QualityAgent"]
  }
}
```

---

## 6. Business Copilot Integration

### 6.1 Natural Language Query Capabilities

The Business Copilot provides manufacturing executives and operators with natural language access to operational data, insights, and actions.

```typescript
// Query Intent Definitions
interface ManufacturingQueries {
  // Production Queries
  "What is today's production output?": {
    intent: 'PRODUCTION_OUTPUT',
    response: {
      metrics: ['unitsProduced', 'target', 'variance', 'efficiency'],
      breakdown: ['byProduct', 'byShift', 'byLine']
    }
  },
  "Show me the production schedule for this week": {
    intent: 'PRODUCTION_SCHEDULE',
    response: {
      schedule: WorkOrder[],
      conflicts: Conflict[],
      recommendations: string[]
    }
  },
  "What is causing the bottleneck in Line 3?": {
    intent: 'BOTTLENECK_ANALYSIS',
    response: {
      rootCause: string,
      impact: ImpactMetrics,
      recommendations: Action[]
    }
  },

  // Inventory Queries
  "What materials are running low?": {
    intent: 'LOW_STOCK_ALERTS',
    response: {
      items: InventoryItem[],
      urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    }
  },
  "What is our inventory value?": {
    intent: 'INVENTORY_VALUATION',
    response: {
      totalValue: number,
      byCategory: CategoryBreakdown[],
      trend: 'INCREASING' | 'STABLE' | 'DECREASING'
    }
  },
  "When should we reorder raw material X?": {
    intent: 'REORDER_RECOMMENDATION',
    response: {
      recommendedDate: Date,
      quantity: number,
      reason: string,
      supplier: Vendor[]
    }
  },

  // Machine/Quality Queries
  "What is the OEE of Machine 101?": {
    intent: 'OEE_QUERY',
    response: {
      overall: number,
      availability: number,
      performance: number,
      quality: number,
      trend: TrendData
    }
  },
  "Show me quality issues this month": {
    intent: 'QUALITY_ISSUES',
    response: {
      totalDefects: number,
      defectCategories: CategoryBreakdown[],
      affectedProducts: Product[],
      capaStatus: CAPA[]
    }
  },

  // Cost/Financial Queries
  "What is our production cost this month?": {
    intent: 'PRODUCTION_COST',
    response: {
      totalCost: number,
      byCategory: CostBreakdown[],
      varianceFromBudget: number
    }
  },
  "Compare supplier performance": {
    intent: 'SUPPLIER_COMPARISON',
    response: {
      vendors: VendorPerformance[],
      rankings: Ranking[]
    }
  },

  // Action Intents
  "Create a purchase order for material X": {
    intent: 'CREATE_PO',
    entities: { material: string, quantity?: number },
    confirmation: true
  },
  "Schedule maintenance for Machine 101": {
    intent: 'SCHEDULE_MAINTENANCE',
    entities: { machine: string, type?: string },
    confirmation: true
  },
  "Raise a quality alert for batch Y": {
    intent: 'CREATE_QC_ALERT',
    entities: { batch: string, issue: string },
    confirmation: true
  }
}
```

### 6.2 Dashboard Widgets and Reports

```typescript
// Manufacturing Dashboard Widgets
interface DashboardWidgets {
  // Real-time KPIs
  productionKPI: {
    title: "Today's Production";
    metrics: ['actual', 'target', 'variance', 'efficiency'];
    refreshInterval: 60; // seconds
    charts: ['line', 'gauge'];
  };

  inventoryKPI: {
    title: "Inventory Health";
    metrics: ['turnover', 'daysOfStock', 'value', 'accuracy'];
    alerts: ['lowStock', 'expiry', 'overstock'];
  };

  qualityKPI: {
    title: "Quality Metrics";
    metrics: ['defectRate', 'rejectRate', 'fpy', 'capaOpen'];
    trends: ['weekly', 'monthly'];
  };

  machineKPI: {
    title: "Equipment Status";
    metrics: ['oee', 'uptime', 'downtime', 'mtbf'];
    statusBreakdown: ['running', 'idle', 'maintenance', 'breakdown'];
  };

  // Reports
  dailyProductionReport: {
    schedule: "daily 6:00 PM";
    recipients: ['plantManager', 'shiftSupervisors'];
    sections: ['summary', 'byLine', 'quality', 'issues'];
  };

  weeklyInventoryReport: {
    schedule: "weekly Monday 8:00 AM";
    recipients: ['inventoryManager', 'procurement'];
    sections: ['valuation', 'movements', 'expiry', 'reorders'];
  };

  monthlyQualityReport: {
    schedule: "monthly 1st 9:00 AM";
    recipients: ['qualityManager', 'plantManager'];
    sections: ['defectAnalysis', 'capa', 'compliance', 'trends'];
  };
}
```

### 6.3 Alert Routing to Copilot

```typescript
interface CopilotAlertRouting {
  rules: [
    {
      condition: {
        type: 'STOCK_OUT',
        severity: 'CRITICAL'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Critical: {item} out of stock' },
        { type: 'SUGGEST_ACTION', action: 'Create emergency PO' },
        { type: 'ESCALATE', to: 'PlantManager' }
      ];
    },
    {
      condition: {
        type: 'MACHINE_BREAKDOWN',
        severity: 'HIGH'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Machine {id} breakdown' },
        { type: 'SUGGEST_ACTION', action: 'Dispatch maintenance team' },
        { type: 'UPDATE_DASHBOARD', widget: 'machineKPI' }
      ];
    },
    {
      condition: {
        type: 'QUALITY_DEFECT',
        severity: 'CRITICAL',
        defectType: 'SAFETY_CRITICAL'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'CRITICAL: Safety defect in {batch}' },
        { type: 'SUGGEST_ACTION', action: 'Stop production' },
        { type: 'CREATE_CAPA', priority: 'HIGH' },
        { type: 'ESCALATE', to: 'QualityDirector' }
      ];
    },
    {
      condition: {
        type: 'DELIVERY_DELAY',
        severity: 'HIGH',
        impactOnProduction: true
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Delayed delivery affects {orders}' },
        { type: 'SUGGEST_ACTION', action: 'Contact alternative supplier' },
        { type: 'ANALYZE_IMPACT', onProductionSchedule: true }
      ];
    }
  ];
}
```

---

## 7. Economic Integration

### 7.1 Payment Flows

```typescript
interface ManufacturingPaymentFlows {
  // Material Purchase
  materialPurchase: {
    flow: [
      { step: 'PO_CREATED', system: 'Procurement OS', action: 'Record PO' },
      { step: 'GOODS_RECEIVED', system: 'REZ Inventory', action: 'Accept stock' },
      { step: 'INVOICE_RECEIVED', system: 'Procurement OS', action: 'Validate invoice' },
      { step: 'PAYMENT_INITIATED', system: 'RABTUL Pay', action: 'Process payment' },
      { step: 'PAYMENT_COMPLETED', system: 'RABTUL Wallet', action: 'Update balances' }
    ];
    triggers: {
      automaticPayment: true;
      paymentTerms: 'NET30' | 'NET60' | 'IMMEDIATE';
      approvalRequired: { threshold: 100000 }; // INR
    };
  };

  // Vendor Settlement
  vendorSettlement: {
    flow: [
      { step: 'DELIVERY_CONFIRMED', system: 'REZ Inventory' },
      { step: 'QUALITY_CHECK_PASSED', system: 'REZ Manufacturing OS' },
      { step: 'INVOICE_MATCHED', system: 'Procurement OS' },
      { step: 'PAYMENT_RELEASED', system: 'RABTUL Pay' }
    ];
    features: {
      partialPayment: true;
      earlyPaymentDiscount: { terms: '2/10 NET30' };
      retention: { percentage: 10, duration: 30 }; // days
    };
  };

  // Maintenance Cost Tracking
  maintenanceCost: {
    trackedCategories: [
      'PREVENTIVE',
      'CORRECTIVE',
      'EMERGENCY',
      'CONTRACTOR'
    ];
    costElements: [
      'PARTS',
      'LABOR',
      'CONTRACTOR_FEES',
      'DOWNTIME_COST'
    ];
    allocation: {
      byMachine: true;
      byDepartment: true;
      byProduct: true;
    };
  };

  // Production Costing
  productionCost: {
    costLayers: [
      { layer: 'MATERIAL', source: 'REZ Inventory' },
      { layer: 'LABOR', source: 'REZ Staff' },
      { layer: 'OVERHEAD', source: 'Manual' },
      { layer: 'MACHINE', source: 'REZ Manufacturing OS' }
    ];
    costingMethods: ['ACTUAL', 'STANDARD', 'NORMAL'];
    varianceTracking: {
      materialVariance: true;
      laborVariance: true;
      overheadVariance: true;
    };
  };
}
```

### 7.2 REZ Coins and Rewards Integration

```typescript
interface ManufacturingRewardsIntegration {
  // Employee Rewards
  employeeRewards: {
    categories: [
      {
        category: 'PRODUCTION_EXCELLENCE',
        actions: ['targetAchieved', 'qualityBonus', 'suggestionImplemented'],
        coinsPerAction: { min: 10, max: 500 }
      },
      {
        category: 'SAFETY',
        actions: ['incidentFree', 'hazardIdentified', 'safetySuggestion'],
        coinsPerAction: { min: 20, max: 1000 }
      },
      {
        category: 'INNOVATION',
        actions: ['processImprovement', 'costSaving', 'defectReduction'],
        coinsPerAction: { min: 50, max: 5000 }
      }
    ];
    redemption: {
      products: ['REZ Store', 'Gift Cards', 'Extra Leave'],
      conversionRate: 1; // coins to INR
    };
  };

  // Supplier Rewards
  supplierRewards: {
    tiers: [
      { tier: 'BRONZE', performanceThreshold: 70 },
      { tier: 'SILVER', performanceThreshold: 85 },
      { tier: 'GOLD', performanceThreshold: 95 }
    ];
    benefits: {
      BRONZE: ['Priority scheduling'],
      SILVER: ['Extended payment terms', 'Volume bonuses'],
      GOLD: ['Strategic partnership', 'Exclusive contracts', 'Early access to demand forecast']
    };
    rewardsPoints: {
      onTimeDelivery: 1,  // points per %
      qualityScore: 2,    // points per %
      priceCompetitiveness: 1
    };
  };

  // Customer Loyalty (for finished goods)
  customerLoyalty: {
    program: 'REZ Rewards',
    earnRules: [
      { action: 'PURCHASE', rate: '1 coin per 100 INR' },
      { action: 'REFERRAL', bonus: 500 },
      { action: 'REVIEW', bonus: 50 }
    ],
    redeemRules: [
      { type: 'DISCOUNT', conversion: '100 coins = 1 INR' },
      { type: 'FREE_PRODUCT', threshold: 1000 },
      { type: 'EARLY_ACCESS', threshold: 500 }
    ]
  };
}
```

### 7.3 Wallet Usage in Manufacturing

```typescript
interface ManufacturingWalletUsage {
  // Enterprise Wallet
  enterpriseWallet: {
    purposes: [
      'MATERIAL_PURCHASES',
      'MAINTENANCE_PAYMENTS',
      'UTILITY_PAYMENTS',
      'CONTRACTOR_PAYMENTS',
      'EMERGENCY_FUNDS'
    ];
    fundingSources: [
      'CORPORATE_ACCOUNT',
      'REVENUE_CLEARING',
      'CREDIT_LINE'
    ];
    controls: {
      maxTransactionValue: 5000000; // 50 lakhs
      dailyLimit: 20000000; // 2 crores
      dualApproval: { threshold: 1000000 };
    };
  };

  // Petty Cash for Factory
  pettyCash: {
    maxBalance: 50000;
    refills: ['DAILY', 'ON_DEMAND'];
    authorizedExpenses: [
      'EMERGENCY_REPAIRS',
      'SMALL_TOOLS',
      'CONSUMABLES'
    ];
  };

  // Worker Payments
  workerPayments: {
    types: [
      'SALARY',
      'INCENTIVE',
      'PIECE_RATE',
      'OVERTIME'
    ];
    disbursement: {
      method: 'WALLET_TRANSFER';
      frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      recordKeeping: true;
    };
  };
}
```

---

## 8. Implementation Roadmap

### Phase 1: Core Integration (Weeks 1-2)

**Objective:** Establish foundation for Manufacturing OS with core inventory-twin integration

#### Week 1: Foundation Setup

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| TwinOS Hub deployment | Infrastructure | Twin Hub running on port 5250 | - |
| Plant Twin schema design | Architecture | JSON schemas for Plant Twin | - |
| Inventory Twin schema design | Architecture | JSON schemas for Inventory Twin | - |
| REZ Inventory webhook setup | REZ Team | Webhooks for stock events | - |
| Basic API endpoints for twins | Development | CRUD endpoints for twins | - |

**Week 1 Deliverables:**
- TwinOS Hub deployed and accessible
- 2 twin types implemented (Plant, Inventory)
- Webhook integration with REZ Inventory
- Basic dashboard showing stock levels

**Technical Tasks:**
```bash
# Week 1 Infrastructure
1. Deploy TwinOS Hub (5250)
2. Create MongoDB collections for twins
3. Configure Redis for real-time state
4. Set up webhook receiver in REZ Inventory
5. Create API gateway routes for twin endpoints
```

#### Week 2: Core Agent Development

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Inventory Agent implementation | AI Team | Stock monitoring agent | - |
| Basic Copilot queries | AI Team | 20 common queries | - |
| Twin-state sync from REZ Inventory | Development | Real-time sync | - |
| Dashboard for plant operations | UI Team | Basic monitoring dashboard | - |
| Alert system for low stock | Development | Push notifications | - |

**Week 2 Deliverables:**
- Inventory Agent running and managing twins
- Business Copilot answering basic queries
- Real-time stock levels in dashboard
- Alert notifications for reorder points

**Technical Tasks:**
```bash
# Week 2 Development
1. Implement Inventory Agent with SkillNet
2. Create Copilot query handlers (20 queries)
3. Build WebSocket connection for real-time updates
4. Design React dashboard components
5. Implement push notification service
```

**Phase 1 Success Criteria:**
- [ ] Twin Hub operational with Plant and Inventory twins
- [ ] Real-time sync from REZ Inventory to twins (< 5 second delay)
- [ ] 90% accuracy in Copilot responses
- [ ] No critical alerts missed for low stock

---

### Phase 2: Advanced Features (Weeks 3-4)

**Objective:** Expand twin ecosystem and enable intelligent automation

#### Week 3: Machine and Quality Twins

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Machine Twin implementation | Architecture | Full Machine Twin schema | - |
| Quality Twin implementation | Architecture | Full Quality Twin schema | - |
| Maintenance Agent development | AI Team | Predictive maintenance | - |
| OEE monitoring integration | Development | Real-time OEE dashboard | - |
| QC results sync | Development | Quality Twin updates | - |

**Week 3 Deliverables:**
- Machine Twin capturing equipment telemetry
- Quality Twin with inspection tracking
- Maintenance Agent predicting failures
- OEE dashboard with trends

#### Week 4: Vendor and Product Twins

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Vendor Twin implementation | Architecture | Full Vendor Twin schema | - |
| Product Twin implementation | Architecture | Full Product Twin schema | - |
| Procurement Agent development | AI Team | Auto-reorder agent | - |
| Supplier performance tracking | Development | Vendor scorecards | - |
| BOM integration with twins | Development | Product-BOM linkages | - |

**Week 4 Deliverables:**
- Vendor Twin with performance metrics
- Product Twin with BOM relationships
- Procurement Agent managing reorders
- Supplier comparison dashboard

**Phase 2 Success Criteria:**
- [ ] All 6 twin types operational
- [ ] 4 agents (Inventory, Maintenance, Procurement, Production) active
- [ ] Predictive maintenance 70% accuracy
- [ ] Auto-reorder reducing stockouts by 80%

---

### Phase 3: Optimization (Weeks 5-6)

**Objective:** Fine-tune integrations and achieve production-ready state

#### Week 5: AI Model Training and Testing

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Demand forecasting model | AI Team | ML model for demand | - |
| Quality defect prediction | AI Team | ML model for defects | - |
| End-to-end integration testing | QA Team | Test scenarios | - |
| Performance optimization | Development | Response time < 200ms | - |
| Security audit | Security | Penetration testing | - |

**Week 5 Deliverables:**
- Trained ML models for demand and quality
- 95% test coverage
- Performance benchmarks met
- Security certification

#### Week 6: Production Launch Preparation

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Documentation and runbooks | All | Complete documentation | - |
| Monitoring and alerting setup | DevOps | 24/7 monitoring | - |
| Backup and recovery testing | DevOps | DR drills | - |
| User training sessions | Training | 3 sessions completed | - |
| Go-live preparation | All | Launch checklist | - |

**Phase 3 Success Criteria:**
- [ ] ML models achieving target accuracy (> 85%)
- [ ] All systems passing security audit
- [ ] Documentation complete
- [ ] Team trained and ready

---

### Phase 4: Production Deployment (Week 7+)

**Objective:** Live production deployment with monitoring

#### Deployment Checklist

```yaml
pre-deployment:
  - [ ] All unit tests passing (> 95%)
  - [ ] Integration tests passing
  - [ ] Performance benchmarks met
  - [ ] Security scan completed
  - [ ] Documentation approved
  - [ ] Team trained
  - [ ] Rollback plan documented

deployment:
  - [ ] Database migrations executed
  - [ ] TwinOS Hub deployed (staging first)
  - [ ] API endpoints configured
  - [ ] Webhook connections established
  - [ ] Agents deployed
  - [ ] Dashboard deployed
  - [ ] Monitoring configured

post-deployment:
  - [ ] Health checks passed
  - [ ] Real-time sync verified
  - [ ] Alert routing tested
  - [ ] Copilot queries validated
  - [ ] User acceptance testing
  - [ ] Go-live sign-off
```

#### Success Metrics Dashboard

| Metric | Baseline | Week 2 Target | Week 4 Target | Week 7 Target |
|--------|----------|--------------|--------------|--------------|
| Inventory Accuracy | 85% | 92% | 95% | 98% |
| Stockout Rate | 8% | 4% | 2% | <1% |
| OEE Improvement | 0% | 3% | 8% | 15% |
| Defect Detection Time | 24h | 4h | 1h | 15min |
| Copilot Query Accuracy | N/A | 85% | 92% | 95% |
| Auto-reorder Adoption | 0% | 50% | 80% | 95% |

---

### Resource Requirements

| Resource | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| Backend Developers | 3 | 3 | 2 | 1 |
| AI/ML Engineers | 1 | 2 | 2 | 1 |
| Frontend Developers | 1 | 2 | 2 | 1 |
| QA Engineers | 1 | 1 | 2 | 1 |
| DevOps | 1 | 1 | 1 | 2 |
| Project Manager | 1 | 1 | 1 | 1 |

---

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Webhook reliability | Medium | High | Implement retry queue with exponential backoff |
| Twin synchronization lag | Medium | Medium | Use Redis pub/sub with fallback polling |
| ML model accuracy | Medium | Medium | Start with rule-based, gradually add ML |
| Agent autonomy errors | Low | High | Set conservative thresholds, human-in-loop for critical |
| Vendor integration delays | High | Medium | Mock data mode for initial testing |

---

## Appendix A: API Reference

### TwinOS API Endpoints

```yaml
openapi: 3.0.0
info:
  title: TwinOS Manufacturing API
  version: 1.0.0
  description: API for Manufacturing Industry OS Digital Twins

servers:
  - url: http://localhost:5250/api/v1
    description: Development
  - url: https://api.rtnm.digital/twinos/v1
    description: Production

paths:
  /twins/{twinType}:
    get:
      summary: List twins by type
      parameters:
        - name: twinType
          in: path
          required: true
          schema:
            type: string
            enum: [plant, machine, inventory, vendor, product, quality]
      responses:
        '200':
          description: List of twins
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TwinBase'

    post:
      summary: Create a new twin
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TwinCreate'
      responses:
        '201':
          description: Twin created
        '400':
          description: Invalid input

  /twins/{twinType}/{twinId}:
    get:
      summary: Get twin by ID
      responses:
        '200':
          description: Twin details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Twin'
        '404':
          description: Twin not found

    patch:
      summary: Update twin attributes
      requestBody:
        content:
          application/json:
            schema:
              type: object
              additionalProperties: true
      responses:
        '200':
          description: Twin updated

  /twins/{twinType}/{twinId}/history:
    get:
      summary: Get twin change history
      parameters:
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: Change history

  /twins/{twinType}/{twinId}/relationships:
    get:
      summary: Get twin relationships
      responses:
        '200':
          description: Relationships

  /twins/search:
    post:
      summary: Search twins with filters
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TwinSearch'
      responses:
        '200':
          description: Search results

  /agents:
    get:
      summary: List all agents
      responses:
        '200':
          description: Agent list

  /agents/{agentId}/status:
    get:
      summary: Get agent status
      responses:
        '200':
          description: Agent status

  /agents/{agentId}/act:
    post:
      summary: Trigger agent action
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentAction'
      responses:
        '200':
          description: Action result
```

---

## Appendix B: Event Schemas

```typescript
// TwinOS Event Bus Events
interface TwinOSEvents {
  // Twin Lifecycle Events
  TWIN_CREATED: {
    twinId: string;
    twinType: TwinType;
    initialState: Twin;
    timestamp: string;
  };

  TWIN_UPDATED: {
    twinId: string;
    twinType: TwinType;
    changes: { field: string; oldValue: any; newValue: any }[];
    source: 'MANUAL' | 'WEBHOOK' | 'AGENT' | 'SYSTEM';
    timestamp: string;
  };

  TWIN_DELETED: {
    twinId: string;
    twinType: TwinType;
    reason: string;
    timestamp: string;
  };

  // Relationship Events
  RELATIONSHIP_CREATED: {
    sourceTwin: string;
    targetTwin: string;
    relationship: string;
    properties: Record<string, any>;
  };

  RELATIONSHIP_UPDATED: {
    sourceTwin: string;
    targetTwin: string;
    relationship: string;
    changes: Record<string, any>;
  };

  // Alert Events
  ALERT_TRIGGERED: {
    twinId: string;
    alertType: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    suggestedActions: string[];
  };

  // Agent Events
  AGENT_ACTION_COMPLETED: {
    agentId: string;
    action: string;
    result: any;
    duration: number;
  };

  AGENT_DECISION: {
    agentId: string;
    decision: string;
    confidence: number;
    reasoning: string;
    approved: boolean;
  };
}
```

---

## Appendix C: Configuration Reference

```typescript
// TwinOS Configuration
interface TwinOSConfig {
  // Server Configuration
  server: {
    port: number;           // Default: 5250
    host: string;           // Default: '0.0.0.0'
    corsOrigins: string[]; // Allowed CORS origins
  };

  // Database Configuration
  database: {
    mongodb: {
      uri: string;
      database: string;
      options: {
        maxPoolSize: number;
        retryWrites: boolean;
      };
    };
    redis: {
      url: string;
      password?: string;
    };
  };

  // Twin Configuration
  twins: {
    syncInterval: number;  // seconds
    maxHistoryDays: number;
    batchSize: number;
  };

  // Webhook Configuration
  webhooks: {
    retryAttempts: number;
    retryDelay: number;     // seconds
    timeout: number;        // milliseconds
  };

  // Agent Configuration
  agents: {
    decisionThreshold: number;
    escalationTimeout: number;
    maxConcurrentActions: number;
  };

  // Monitoring
  monitoring: {
    metricsEnabled: boolean;
    tracesEnabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Default Configuration
const defaultConfig: TwinOSConfig = {
  server: {
    port: 5250,
    host: '0.0.0.0',
    corsOrigins: ['http://localhost:3000', 'https://rtnm.digital']
  },
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/twinos',
      database: 'twinos',
      options: {
        maxPoolSize: 10,
        retryWrites: true
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  },
  twins: {
    syncInterval: 5,
    maxHistoryDays: 365,
    batchSize: 100
  },
  webhooks: {
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000
  },
  agents: {
    decisionThreshold: 0.8,
    escalationTimeout: 300,
    maxConcurrentActions: 10
  },
  monitoring: {
    metricsEnabled: true,
    tracesEnabled: true,
    logLevel: 'info'
  }
};
```

---

**Document Version:** 1.0
**Last Updated:** June 12, 2026
**Author:** RTNM Digital Architecture Team
**Status:** Ready for Implementation

---

*This integration specification defines the complete Manufacturing Industry OS architecture. All product integrations, digital twins, agents, and workflows are designed for the RTNM ecosystem.*
