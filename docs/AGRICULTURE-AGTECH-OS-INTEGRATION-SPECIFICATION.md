# Agriculture & AgTech Industry OS - Integration Specification

**Version:** 1.0
**Date:** June 12, 2026
**Industry:** Agriculture & AgTech
**Key Integration Point:** REZ Inventory ↔ Farm Twin

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

The Agriculture & AgTech sector faces unique operational challenges that create substantial value opportunities when addressed through unified digital systems:

| Challenge | Impact | Current State |
|-----------|--------|---------------|
| Fragmented farm data | 30-40% productivity loss | Disconnected IoT, weather stations, market data |
| Reactive inventory management | 20-25% input waste | Manual tracking, no predictive intelligence |
| Price volatility | 15-30% revenue uncertainty | No real-time market intelligence |
| Equipment downtime | ₹2,000-15,000 per hour loss | Preventive, not predictive maintenance |
| Supply chain opacity | 10-20% post-harvest losses | Manual tracking, no traceability |
| Credit access | 70% farmers unbanked | Limited formal credit history |
| Weather dependency | 40% yield variability | Reactive planning, limited forecasting |
| Market access | 20-30% price discovery gap | Middlemen-dominated, opaque pricing |

### 1.2 Key Integration Opportunity

**Primary Integration Point:** REZ Inventory ↔ Farm Twin

This integration enables:
- Real-time crop and input tracking across farm operations
- Predictive input requirements based on crop growth stages and weather
- Digital twin-based simulation of farming scenarios
- Automated harvest planning triggered by crop maturity signals
- Market intelligence linking to inventory and pricing decisions
- Farmer credit scoring based on farm performance data

### 1.3 Expected Outcomes

| Outcome | Metric | Timeline |
|---------|--------|----------|
| Input optimization | 20-30% reduction in fertilizer/pesticide waste | 3-6 months |
| Yield improvement | 15-25% increase through precision farming | 6-12 months |
| Post-harvest loss reduction | 30-40% reduction | 3-6 months |
| Market price realization | 10-20% better prices via direct market access | 2-4 months |
| Equipment uptime | 15-20% increase | 3-6 months |
| Credit access | 40% improvement in approval rates | 6-12 months |

### 1.4 Agriculture OS Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AGRICULTURE & AGTECH INDUSTRY OS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TWINOS LAYER                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │  Farm   │ │  Crop   │ │Equipment│ │ Market  │ │ Farmer  │      │   │
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
│  │   │  REZ Inventory  │◄────│  Farm Twin AI  │────►│  REZ QR Cloud  │  │   │
│  │   │    (4010)       │     │                 │     │    (4058)      │  │   │
│  │   └────────┬────────┘     └─────────────────┘     └───────┬────────┘  │   │
│  │            │                                             │           │   │
│  │   ┌────────┴────────┐                           ┌───────┴────────┐  │   │
│  │   │  Distribution OS │                           │ Procurement OS │  │   │
│  │   │    (4300)        │                           │    (4320)     │  │   │
│  │   └────────┬────────┘                           └───────┬────────┘  │   │
│  │            │                                         │             │   │
│  │            └──────────────┬───────────────────────────┘             │   │
│  │                           │                                       │   │
│  │                    ┌──────┴──────────────────────────────────┐    │   │
│  │                    │   AGRI OS - Farm Management (4860)      │    │   │
│  │                    │  Seeds │ Inputs │ Harvest │ Logistics   │    │   │
│  │                    └──────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     INFRASTRUCTURE LAYER                             │   │
│  │                                                                        │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │   │   RABTUL   │  │    HOJAI    │  │  Business   │  │    REZ     │ │   │
│  │   │  Lending   │  │     AI      │  │   Copilot   │  │  Identity  │ │   │
│  │   │   (4008)   │  │ Intelligence│  │   (4022)    │  │    Hub     │ │   │
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
| **Core Capabilities** | Stock tracking, expiry alerts, reorder points, supplier management, batch tracking, multi-location inventory |
| **Data Produced** | Stock levels, consumption patterns, waste reports, reorder alerts, inventory valuation, movement history, batch traceability |
| **Data Needed** | Crop requirements, seasonal patterns, supplier info, minimum stock levels, growth stage data |
| **Current Integration** | REZ POS (sales deduction), Agri OS (input consumption), RABTUL Pay (purchases) |
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
GET  /api/inventory/batches/:batchId       - Get batch traceability
```

**Data Models:**
```typescript
// Agri Input Item
interface AgriInventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'HERBICIDE' | 'EQUIPMENT' | 'FUEL' | 'PACKAGING';
  sku: string;
  currentStock: number;
  unit: 'KG' | 'LITER' | 'PIECE' | 'TONNE' | 'BAG';
  reorderPoint: number;
  reorderQuantity: number;
  locationId: string;
  locationName: string;
  unitCost: number;
  totalValue: number;
  batchNumber?: string;
  manufactureDate?: Date;
  expiryDate?: Date;
  applicationSeason?: string[];
  cropTypes?: string[];
  lastUpdated: Date;
}

// Movement Record
interface AgriInventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER' | 'APPLICATION';
  quantity: number;
  referenceType: 'PURCHASE' | 'HARVEST' | 'FIELD_APPLICATION' | 'SALE' | 'ADJUSTMENT';
  referenceId: string;
  farmId?: string;
  fieldId?: string;
  cropId?: string;
  fromLocation?: string;
  toLocation?: string;
  timestamp: Date;
  notes?: string;
}

// Reorder Alert
interface AgriReorderAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  suggestedOrderDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cropInProgress?: string[];
  seasonUrgency: 'PRE_SOWING' | 'GROWING' | 'PRE_HARVEST';
  supplierId?: string;
  lastOrderedDate?: Date;
}
```

---

### 2.2 Distribution OS

| Attribute | Details |
|-----------|---------|
| **Company** | Nexha |
| **Port** | 4300 |
| **Core Capabilities** | Agri distribution management, cold chain logistics, last-mile delivery, inventory allocation, quality tracking, lot traceability |
| **Data Produced** | Delivery status, inventory at distribution nodes, route data, demand signals, returns data, cold chain monitoring |
| **Data Needed** | Production inventory, harvest data, delivery addresses, vehicle capacity, warehouse locations, quality parameters |
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
GET  /api/cold-chain/:shipmentId         - Cold chain monitoring
POST /api/quality/check                  - Quality checkpoint
GET  /api/traceability/:lotId           - Lot traceability
```

**Data Models:**
```typescript
// Agri Distributor
interface AgriDistributor {
  id: string;
  name: string;
  type: 'REGIONAL_WAREHOUSE' | 'COLD_STORAGE' | 'RETAIL_OUTLET' | 'DIRECT';
  locations: DistributionPoint[];
  coverageAreas: string[];
  capabilities: {
    coldStorage: boolean;
    maxCapacity: number;
    currentInventory: number;
    certifications: string[];
  };
  performance: {
    onTimeDeliveryRate: number;
    qualityRetentionRate: number;
    coldChainCompliance: number;
  };
  integrationStatus: 'CONNECTED' | 'PENDING' | 'DISCONNECTED';
}

// Agri Shipment
interface AgriShipment {
  id: string;
  shipmentType: 'INPUT_DELIVERY' | 'HARVEST_COLLECTION' | 'PROCESSED_GOODS' | 'SEEDS';
  fromLocation: string;
  toLocation: string;
  items: ShipmentItem[];
  status: 'CREATED' | 'PICKED' | 'IN_TRANSIT' | 'AT_COLD_STORAGE' | 'DELIVERED' | 'RETURNED';
  carrier: string;
  trackingNumber?: string;
  expectedDelivery: Date;
  actualDelivery?: Date;
  route?: GeoRoute;
  coldChainData: {
    temperature: number;
    humidity: number;
    recordedAt: Date;
  }[];
  qualityCheckpoints: QualityCheckpoint[];
}

interface ShipmentItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  harvestDate?: Date;
  expiryDate?: Date;
  qualityGrade?: 'A' | 'B' | 'C';
  farmOrigin?: string;
}

interface QualityCheckpoint {
  checkpointId: string;
  location: string;
  timestamp: Date;
  result: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
  inspector?: string;
}
```

---

### 2.3 Procurement OS

| Attribute | Details |
|-----------|---------|
| **Company** | Nexha |
| **Port** | 4320 |
| **Core Capabilities** | Agri supplier management, input procurement, RFQ processing, purchase orders, contract farming, quality certification tracking |
| **Data Produced** | Purchase orders, supplier quotes, contract terms, procurement metrics, vendor performance data, contract farming agreements |
| **Data Needed** | Input requirements, approved supplier lists, budget constraints, delivery schedules, quality specifications |
| **Current Integration** | RABTUL Pay (payments), REZ Inventory (input requirements), Distribution OS (supply chain visibility), RABTUL Lending (credit linkage) |
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
GET  /api/contract-farming               - Contract farming agreements
POST /api/contract-farming               - Create contract farming agreement
GET  /api/material-requirements           - Get material/input needs
POST /api/supply-requests                - Create supply request
```

**Data Models:**
```typescript
// Agri Supplier
interface AgriSupplier {
  id: string;
  name: string;
  category: 'SEED_COMPANY' | 'FERTILIZER_MFR' | 'PESTICIDE_MFR' | 'EQUIPMENT_DEALER' | 'COLD_STORAGE' | 'PROCESSING_PLANT';
  contact: {
    email: string;
    phone: string;
    address: Address;
  };
  certifications: {
    type: 'ISO' | 'NPOP' | 'NOP' | 'FSSAI' | 'AGMARK';
    issueDate: Date;
    expiryDate: Date;
    certificateNumber: string;
  }[];
  productCategories: string[];
  performance: {
    qualityScore: number;
    deliveryScore: number;
    priceScore: number;
    responsivenessScore: number;
    totalOrders: number;
    onTimeDeliveries: number;
    qualityComplaints: number;
  };
  financialTerms: {
    paymentTerms: 'ADVANCE' | 'COD' | 'NET15' | 'NET30';
    minOrderValue: number;
    creditLimit: number;
  };
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

// Contract Farming Agreement
interface ContractFarmingAgreement {
  id: string;
  agreementNumber: string;
  farmerId: string;
  buyerCompanyId: string;
  cropType: string;
  variety: string;
  areaInAcres: number;
  estimatedProduction: number;
  unit: string;
  priceTerms: {
    basePrice: number;
    premiumQualityBonus: number;
    marketPriceLinkage: 'FIXED' | 'MSP_PLUS' | 'MARKET_RATE';
  };
  inputSupport: {
    seeds: boolean;
    fertilizer: boolean;
    pesticides: boolean;
    technicalGuidance: boolean;
  };
  qualityStandards: {
    moistureContent: number;
    foreignMatter: number;
    damagedGrains: number;
    otherSpecifications: string;
  };
  deliverySchedule: {
    expectedHarvestDate: Date;
    deliveryLocation: string;
    quantityPerDelivery: number;
  };
  paymentTerms: string;
  status: 'DRAFT' | 'ACTIVE' | 'HARVESTED' | 'COMPLETED' | 'DISPUTED';
  farmerCreditScore?: number;
  buyer'sCreditLine?: string;
}
```

---

### 2.4 REZ QR Cloud

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4058, 4063 |
| **Core Capabilities** | Farm traceability QR, input tracking, harvest logging, farmer registration, certification display, consumer engagement |
| **Data Produced** | QR scans, traceability events, farmer registrations, input application records, harvest data |
| **Data Needed** | Farm data, crop information, input data, harvest records, certification status |
| **Current Integration** | REZ Inventory (input tracking), Farm Twin (traceability), REZ Consumer (farm-to-fork visibility) |
| **API Base URL** | `http://localhost:4058` or `REZ_QR_SERVICE_URL` |

**Key Endpoints:**
```json
GET  /api/farms/:farmId/qr                - Generate farm QR code
GET  /api/farms/:farmId/traceability      - Get farm traceability data
POST /api/farmers                        - Register farmer
GET  /api/farmers/:id                    - Get farmer profile
POST /api/inputs/apply                   - Log input application
GET  /api/inputs/:lotId/record           - Get input record
POST /api/harvests                       - Log harvest
GET  /api/harvests/:id                  - Get harvest details
POST /api/certifications                - Upload certification
GET  /api/certifications/:id            - Get certification
GET  /api/trace/:qrCode                 - Consumer traceability view
```

**Data Models:**
```typescript
// Farm QR Record
interface FarmQRRecord {
  qrCode: string;
  farmId: string;
  farmName: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    village: string;
    district: string;
    state: string;
  };
  farmSize: {
    totalAcres: number;
    cultivatedAcres: number;
    irrigatedAcres: number;
  };
  crops: {
    currentCrop: string;
    variety: string;
    sowingDate: Date;
    expectedHarvest: Date;
  }[];
  traceabilityChain: TraceabilityEvent[];
  certifications: {
    type: string;
    validUntil: Date;
    certificateNumber: string;
  }[];
  createdAt: Date;
  lastUpdated: Date;
}

interface TraceabilityEvent {
  eventId: string;
  eventType: 'SOWING' | 'FERTILIZER_APPLICATION' | 'PESTICIDE_APPLICATION' | 'IRRIGATION' | 'WEEDING' | 'HARVEST' | 'STORAGE' | 'TRANSPORT';
  timestamp: Date;
  details: {
    cropStage?: string;
    inputUsed?: {
      name: string;
      quantity: number;
      unit: string;
      batchNumber?: string;
    };
    weatherConditions?: {
      temperature: number;
      humidity: number;
    };
    notes?: string;
  };
  recordedBy: string;
  verified: boolean;
}
```

---

### 2.5 RABTUL Lending

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL |
| **Port** | 4008 |
| **Core Capabilities** | Agricultural credit, crop loans, equipment financing, insurance linkage, input credit, warehouse receipt financing |
| **Data Produced** | Credit applications, loan disbursements, repayment records, credit scores, insurance claims |
| **Data Needed** | Farm data, crop history, land records, farmer KYC, historical yields, market prices |
| **Current Integration** | REZ Inventory (input credit), Farm Twin (farm performance), Procurement OS (contract farming), Distribution OS (warehouse receipts) |
| **API Base URL** | `http://localhost:4008` or `RABTUL_LENDING_URL` |

**Key Endpoints:**
```json
POST /api/loans/apply                     - Apply for crop/term loan
GET  /api/loans/:id                      - Get loan details
GET  /api/loans/eligibility             - Check eligibility
POST /api/loans/:id/disburse             - Disburse loan
POST /api/loans/:id/repay                - Record repayment
GET  /api/credit-score/:farmerId         - Get farmer credit score
POST /api/insurance/apply                - Apply for crop insurance
GET  /api/insurance/:id                  - Get insurance status
POST /api/insurance/:id/claim            - File claim
GET  /api/warehouse-receipts            - List warehouse receipts
POST /api/warehouse-receipts            - Create warehouse receipt
POST /api/warehouse-receipts/:id/finance - Finance against receipt
```

**Data Models:**
```typescript
// Agri Loan Application
interface AgriLoanApplication {
  applicationId: string;
  farmerId: string;
  farmId: string;
  loanType: 'CROP_LOAN' | 'TERM_LOAN_EQUIPMENT' | 'TERM_LOAN_LAND' | 'INPUT_CREDIT' | 'WAREHOUSE_RECEIPT';
  purpose: string;
  requestedAmount: number;
  requestedTenure: number;
  farmDetails: {
    totalLand: number;
    irrigatedLand: number;
    soilType: string;
    waterSource: string;
    cropsGrown: string[];
    previousYield: { crop: string; quantity: number; year: number }[];
  };
  collateral?: {
    type: 'LAND' | 'EQUIPMENT' | 'WAREHOUSE_RECEIPT' | 'GUARANTOR';
    value: number;
    documentUrl: string;
  };
  farmTwinScore?: number;
  contractFarmingLinkage?: string;
  insuranceCoverage?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
  riskAssessment: {
    creditScore: number;
    farmPerformanceScore: number;
    marketLinkageScore: number;
    overallRiskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

// Farmer Credit Profile
interface FarmerCreditProfile {
  farmerId: string;
  farmTwinId: string;
  creditScore: number;
  creditLimit: number;
  utilizedCredit: number;
  repaymentHistory: {
    loanId: string;
    disbursementDate: Date;
    amount: number;
    repaidAmount: number;
    onTimeRepayments: number;
    latePayments: number;
    status: 'ACTIVE' | 'CLOSED' | 'DEFAULT';
  }[];
  farmPerformanceMetrics: {
    avgYieldLast3Years: number;
    yieldTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    cropDiversity: number;
    marketLinkageScore: number;
  };
  landRecords: {
    khataNumber: string;
    areaAcres: number;
    verified: boolean;
  }[];
  loanRecommendations: {
    eligibleProducts: string[];
    recommendedAmount: number;
    interestRateEstimate: number;
  };
}
```

---

### 2.6 REZ Agri OS (Farm Management - 4860)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4860 |
| **Core Capabilities** | Crop planning, field management, input tracking, harvest forecasting, labor management, weather integration |
| **Data Produced** | Crop plans, field activities, growth stages, harvest predictions, labor records |
| **Data Needed** | Farm boundaries, soil data, weather forecasts, market prices, input inventory |
| **Current Integration** | REZ Inventory (input usage), Farm Twin (farm state), Market Twin (price data), REZ QR Cloud (traceability) |
| **API Base URL** | `http://localhost:4860` or `AGRI_OS_URL` |

**Key Endpoints:**
```json
GET  /api/farms                          - List farms
POST /api/farms                          - Register farm
GET  /api/farms/:id                     - Get farm details
GET  /api/farms/:id/fields              - List fields
POST /api/farms/:id/fields              - Add field
GET  /api/crops                          - List crop plans
POST /api/crops                          - Create crop plan
GET  /api/crops/:id                     - Get crop details
PUT  /api/crops/:id/growth-stage        - Update growth stage
GET  /api/activities                    - List field activities
POST /api/activities                    - Log field activity
GET  /api/harvest-forecasts             - Get harvest predictions
GET  /api/labor                          - Labor management
POST /api/labor                          - Add labor record
GET  /api/weather/:farmId               - Get weather data
```

---

## 3. Twin Architecture

### 3.1 Twin Overview

Digital Twins provide a real-time digital representation of agricultural assets, enabling prediction, optimization, and traceability across the farming lifecycle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DIGITAL TWIN LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│    │  Farm   │◄──►│  Crop   │◄──►│Equipment│◄──►│ Market  │              │
│    │  Twin   │    │  Twin   │    │  Twin   │    │  Twin   │              │
│    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘              │
│         │              │              │              │                    │
│         └──────────────┴──────────────┴──────────────┘                    │
│                               │                                            │
│                    ┌──────────┴──────────┐                                 │
│                    │      Farmer Twin    │                                 │
│                    │         ◄───────────┘                                 │
│                    │           │                                           │
│                    │    ┌─────┴─────┐                                      │
│                    │    │  Crop     │                                      │
│                    │    │  Quality  │                                      │
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
│                    │  • Event Propagation  │                              │
│                    └────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Farm Twin

The Farm Twin represents the agricultural land with soil characteristics, irrigation systems, and operational parameters.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "FarmTwin",
  "id": "farm-{farmId}",
  "attributes": {
    "basicInfo": {
      "farmId": "string",
      "name": "string",
      "ownerId": "string",
      "type": "OWNED | LEASED | CONTRACT_FARMING | SHARED",
      "totalArea": { "value": "number", "unit": "ACRE | HECTARE" },
      "cultivatedArea": { "value": "number", "unit": "ACRE | HECTARE" },
      "irrigatedArea": { "value": "number", "unit": "ACRE | HECTARE" }
    },
    "location": {
      "address": "string",
      "village": "string",
      "district": "string",
      "state": "string",
      "pincode": "string",
      "coordinates": {
        "latitude": "number",
        "longitude": "number"
      },
      "elevation": "number (meters)",
      "climateZone": "string"
    },
    "soil": {
      "type": "string",
      "ph": { "min": "number", "max": "number", "current": "number" },
      "organicCarbon": { "value": "number", "unit": "percentage" },
      "nitrogen": { "value": "number", "unit": "kg/hectare" },
      "phosphorus": { "value": "number", "unit": "kg/hectare" },
      "potassium": { "value": "number", "unit": "kg/hectare" },
      "lastSoilTestDate": "ISO8601 Date"
    },
    "irrigation": {
      "source": "WELL | BOREWELL | CANAL | RAINWATER | RIVER | TANK",
      "system": "DRIP | SPRINKLER | FLOOD | FURROW | RAINFED",
      "capacity": { "flowRate": "number", "unit": "LPM", "hoursPerDay": "number" },
      "waterAvailability": { "status": "SUFFICIENT | MODERATE | SCARCE", "remaining": "number (liters)" }
    },
    "infrastructure": {
      "borewellCount": "number",
      "pumpCapacity": "number (HP)",
      "storageCapacity": { "value": "number", "unit": "TONNES" },
      "coldStorage": { "available": "boolean", "capacity": "number" },
      "farmEquipment": ["string"],
      "godownArea": { "value": "number", "unit": "sqft" }
    },
    "certifications": [
      {
        "type": "NPOP | NOP | FSSAI | AGMARK | GI_TAG",
        "status": "CERTIFIED | IN_TRANSITION | NOT_CERTIFIED",
        "validUntil": "ISO8601 Date",
        "certificateNumber": "string"
      }
    ],
    "currentSeason": {
      "cropsPlanted": [
        {
          "cropId": "string",
          "cropType": "string",
          "variety": "string",
          "area": "number",
          "sowingDate": "ISO8601 Date",
          "expectedHarvestDate": "ISO8601 Date",
          "growthStage": "GERMINATION | SEEDLING | VEGETATIVE | FLOWERING | FRUITING | MATURITY | HARVEST_READY"
        }
      ],
      "seasonName": "RABI | KHARIF | ZAID | PERENNIAL",
      "year": "number"
    }
  },
  "relationships": {
    "owns": ["CropTwin"],
    "has": ["EquipmentTwin"],
    "managedBy": "FarmerTwin",
    "linkedTo": ["MarketTwin", "DistributionOS"],
    "suppliesTo": ["ContractFarmingAgreement"],
    "inspectedBy": ["QualityTwin"]
  },
  "metrics": {
    "productivityScore": "number (0-100)",
    "waterEfficiency": "number (percentage)",
    "inputEfficiency": "number (percentage)",
    "yieldLastSeason": "number",
    "totalProductionYTD": "number"
  },
  "telemetry": {
    "soilMoisture": { "current": "number", "unit": "percentage" },
    "temperature": { "current": "number", "unit": "C" },
    "humidity": { "current": "number", "unit": "percentage" },
    "lastSync": "ISO8601 DateTime",
    "connectionStatus": "CONNECTED | DISCONNECTED"
  },
  "agents": ["FarmManagerAgent", "CropAgent", "IrrigationAgent"]
}
```

---

### 3.3 Crop Twin

The Crop Twin represents individual crops with growth stages, health monitoring, and yield predictions.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "CropTwin",
  "id": "crop-{cropId}",
  "attributes": {
    "basicInfo": {
      "cropId": "string",
      "farmId": "string",
      "fieldId": "string",
      "cropType": "string",
      "variety": "string",
      "category": "CEREAL | PULSE | OILSEED | VEGETABLE | FRUIT | FIBER | COMMERCIAL",
      "season": "RABI | KHARIF | ZAID",
      "year": "number"
    },
    "planting": {
      "sowingDate": "ISO8601 Date",
      "method": "DIRECT_SOWING | TRANSPLANTING | INTERCROPPING",
      "seedRate": { "quantity": "number", "unit": "KG/ACRE" },
      "seedSource": "string",
      "seedLotNumber": "string",
      "seedTreatment": "string"
    },
    "growth": {
      "currentStage": "GERMINATION | SEEDLING | VEGETATIVE | BOOTING | FLOWERING | GRAIN_FILLING | MATURITY | HARVEST_READY",
      "stageHistory": [
        {
          "stage": "string",
          "enteredOn": "ISO8601 Date",
          "expectedDuration": "number (days)",
          "actualDuration": "number (days)",
          "notes": "string"
        }
      ],
      "daysToMaturity": "number",
      "daysSinceSowing": "number",
      "healthScore": "number (0-100)",
      "ndviReading": "number (-1 to 1)"
    },
    "weather": {
      "temperature": { "min": "number", "max": "number", "avg": "number", "unit": "C" },
      "humidity": { "avg": "number", "unit": "percentage" },
      "rainfall": { "total": "number", "unit": "mm" },
      "heatStress": "boolean",
      "frostRisk": "boolean",
      "weatherAlerts": ["string"]
    },
    "inputs": {
      "fertilizerApplied": [
        {
          "type": "string",
          "quantity": "number",
          "unit": "KG",
          "applicationDate": "ISO8601 Date",
          "method": "BROADCAST | FERTIGATION | FOLIAR | DRIP",
          "costPerUnit": "number"
        }
      ],
      "pesticidesApplied": [
        {
          "type": "string",
          "activeIngredient": "string",
          "quantity": "number",
          "unit": "ML | G",
          "applicationDate": "ISO8601 Date",
          "targetPest": "string",
          "waitingPeriod": "number (days)"
        }
      ],
      "waterIrrigated": { "total": "number", "unit": "LITERS", "lastIrrigation": "ISO8601 Date" }
    },
    "production": {
      "estimatedYield": { "quantity": "number", "unit": "KG/ACRE", "confidence": "number" },
      "actualYield": { "quantity": "number", "unit": "KG" },
      "harvestDate": "ISO8601 Date",
      "harvestQuality": { "grade": "A | B | C", "moistureContent": "number", "foreignMatter": "number" },
      "marketValue": { "estimated": "number", "actual": "number", "marketPrice": "number" }
    },
    "economics": {
      "totalInputCost": "number",
      "laborCost": "number",
      "totalCost": "number",
      "revenue": "number",
      "profit": "number",
      "profitPerAcre": "number"
    }
  },
  "relationships": {
    "grownAt": "FarmTwin",
    "monitoredBy": ["FarmerTwin", "CropAgent"],
    "inspectedBy": "QualityTwin",
    "linkedToMarket": "MarketTwin",
    "trackedBy": "REZInventory",
    "financedBy": "RABTULLending"
  },
  "predictions": {
    "yieldForecast": {
      "optimistic": "number",
      "expected": "number",
      "pessimistic": "number",
      "confidence": "number",
      "modelType": "string"
    },
    "harvestWindow": { "start": "ISO8601 Date", "end": "ISO8601 Date" },
    "diseaseRisk": { "probability": "number", "factors": ["string"] },
    "priceForecast": { "expectedPrice": "number", "priceRange": { "min": "number", "max": "number" } }
  },
  "agents": ["CropAgent", "MarketAgent", "QualityAgent", "FarmManagerAgent"]
}
```

---

### 3.4 Equipment Twin

The Equipment Twin represents farm machinery and equipment with maintenance tracking and operational metrics.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "EquipmentTwin",
  "id": "equipment-{equipmentId}",
  "attributes": {
    "basicInfo": {
      "equipmentId": "string",
      "farmId": "string",
      "name": "string",
      "category": "TRACTOR | HARVESTER | SPRAYER | SEEDER | PLANTER | THRESHER | PUMP | CULTIVATOR | OTHER",
      "make": "string",
      "model": "string",
      "serialNumber": "string",
      "yearOfPurchase": "number",
      "status": "OPERATIONAL | IDLE | MAINTENANCE | BROKEN_DOWN"
    },
    "specifications": {
      "horsepower": "number (HP)",
      "fuelType": "DIESEL | PETROL | ELECTRIC | SOLAR",
      "fuelCapacity": { "value": "number", "unit": "LITERS" },
      "operationalSpeed": { "value": "number", "unit": "km/hr" },
      "fieldCapacity": { "value": "number", "unit": "ACRE/HOUR" }
    },
    "ownership": {
      "type": "OWNED | LEASED | SHARED | CUSTOM_HIRING",
      "ownerId": "string",
      "purchaseDate": "ISO8601 Date",
      "purchasePrice": "number",
      "currentValue": "number",
      "depreciation": "number (percentage)"
    },
    "usage": {
      "totalHours": "number",
      "hoursThisSeason": "number",
      "fuelConsumed": { "total": "number", "unit": "LITERS", "avgPerHour": "number" },
      "lastUsedDate": "ISO8601 Date",
      "commonOperations": ["string"]
    },
    "maintenance": {
      "status": "UP_TO_DATE | DUE_SOON | OVERDUE",
      "lastServiceDate": "ISO8601 Date",
      "nextServiceDue": { "date": "ISO8601 Date", "type": "ROUTINE | OIL_CHANGE | MAJOR" },
      "totalMaintenanceCost": "number",
      "maintenanceHistory": [
        {
          "serviceDate": "ISO8601 Date",
          "type": "string",
          "description": "string",
          "cost": "number",
          "serviceProvider": "string"
        }
      ],
      "warrantyExpiry": "ISO8601 Date"
    },
    "telemetry": {
      "engineHours": "number",
      "fuelLevel": "number (percentage)",
      "oilPressure": "number (PSI)",
      "engineTemperature": "number (C)",
      "lastUpdated": "ISO8601 DateTime"
    },
    "utilization": {
      "plannedHoursThisMonth": "number",
      "actualHoursThisMonth": "number",
      "efficiencyRating": "number (percentage)",
      "downtimeHours": "number",
      "breakdownCount": "number"
    }
  },
  "relationships": {
    "ownedBy": "FarmTwin",
    "operatedBy": "FarmerTwin",
    "maintainedBy": ["MaintenanceAgent"],
    "usedFor": ["CropTwin"],
    "trackedIn": "REZInventory (spare parts)"
  },
  "predictions": {
    "failureProbability": "number (0-1)",
    "remainingUsefulLife": "number (hours)",
    "maintenanceRecommendation": "string",
    "replacementRecommendation": { "recommended": "boolean", "reason": "string", "estimatedCost": "number" }
  },
  "agents": ["MaintenanceAgent", "FarmManagerAgent"]
}
```

---

### 3.5 Market Twin

The Market Twin represents agricultural markets with real-time prices, demand signals, and supply chain visibility.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "MarketTwin",
  "id": "market-{marketId}",
  "attributes": {
    "basicInfo": {
      "marketId": "string",
      "name": "string",
      "type": "APMC | PRIVATE | COOPERATIVE | DIRECT_FARMER | ONLINE | EXPORT",
      "location": {
        "address": "string",
        "city": "string",
        "district": "string",
        "state": "string",
        "coordinates": { "latitude": "number", "longitude": "number" }
      },
      "license": "string",
      "operatingHours": "string"
    },
    "commodities": [
      {
        "commodityId": "string",
        "name": "string",
        "category": "CEREAL | PULSE | OILSEED | VEGETABLE | FRUIT | SPICE | FIBER | OTHER",
        "varieties": ["string"],
        "units": ["string"]
      }
    ],
    "pricing": {
      "currentPrices": [
        {
          "commodityId": "string",
          "variety": "string",
          "modalPrice": "number",
          "minPrice": "number",
          "maxPrice": "number",
          "priceUnit": "QUINTAL | KG",
          "arrivals": "number",
          "trades": "number",
          "priceChange": { "value": "number", "direction": "UP | DOWN | STABLE", "percentage": "number" },
          "updatedAt": "ISO8601 DateTime"
        }
      ],
      "priceTrends": [
        {
          "commodityId": "string",
          "period": "7_DAYS | 30_DAYS | 90_DAYS | 1_YEAR",
          "trend": "INCREASING | DECREASING | STABLE",
          "changePercentage": "number",
          "volatilityIndex": "number"
        }
      ]
    },
    "demand": {
      "activeDemand": [
        {
          "commodityId": "string",
          "quantity": "number",
          "unit": "string",
          "qualityRequired": "string",
          "deliveryLocation": "string",
          "validUntil": "ISO8601 Date",
          "buyerType": "WHOLESALER | RETAILER | EXPORTER | PROCESSOR | INSTITUTION"
        }
      ],
      "demandForecast": { "commodityId": "string", "forecast": "number", "confidence": "number" }
    },
    "supply": {
      "todayArrivals": [
        {
          "commodityId": "string",
          "quantity": "number",
          "qualityBreakdown": { "A": "number", "B": "number", "C": "number" },
          "sourceRegions": ["string"]
        }
      ],
      "supplyForecast": "number"
    },
    "quality": {
      "gradeStandards": ["string"],
      "mandatoryTests": ["string"],
      "averageQualityScore": "number"
    },
    "logistics": {
      "coldStorageAvailable": "boolean",
      "transportCostPerKm": "number",
      "avgTransitTime": "number (hours)"
    }
  },
  "relationships": {
    "pricesFeed": ["CropTwin", "FarmerTwin"],
    "connectsTo": ["DistributionOS"],
    "suppliesTo": ["MarketTwin"],
    "regulatedBy": "RegulatoryBody"
  },
  "predictions": {
    "pricePrediction": {
      "commodityId": "string",
      "predictedPrice": "number",
      "predictionWindow": "7_DAYS | 14_DAYS | 30_DAYS",
      "confidence": "number",
      "factors": ["string"]
    },
    "demandForecast": { "commodityId": "string", "forecast": "number", "period": "string" }
  },
  "agents": ["MarketAgent", "PriceIntelligenceAgent"]
}
```

---

### 3.6 Farmer Twin

The Farmer Twin represents agricultural producers with credit profiles, land records, and performance history.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "FarmerTwin",
  "id": "farmer-{farmerId}",
  "attributes": {
    "basicInfo": {
      "farmerId": "string",
      "name": "string",
      "phone": "string",
      "alternatePhone": "string",
      "email": "string",
      "aadhaarNumber": "string (encrypted)",
      "panNumber": "string (encrypted)",
      "profilePhoto": "string (URL)",
      "language": "string",
      "registrationDate": "ISO8601 Date"
    },
    "landRecords": [
      {
        "recordId": "string",
        "khataNumber": "string",
        "khesraNumber": "string",
        "area": { "value": "number", "unit": "ACRE | DECIMAL" },
        "landType": "AGRICULTURAL | ORCHARD | FALLOW",
        "irrigationType": "IRRIGATED | RAINFED | PARTIALLY_IRRIGATED",
        "ownershipProof": "string (URL)",
        "verified": "boolean",
        "verifiedAt": "ISO8601 Date"
      }
    ],
    "farmingProfile": {
      "totalLand": { "value": "number", "unit": "ACRE" },
      "cultivatedLand": { "value": "number", "unit": "ACRE" },
      "primaryCrops": ["string"],
      "farmingExperience": "number (years)",
      "farmingMethod": "CONVENTIONAL | ORGANIC | INTEGRATED | PRECISION",
      "memberOfFPO": "boolean",
      "fpoName": "string"
    },
    "financial": {
      "bankAccount": {
        "bankName": "string",
        "accountNumber": "string (masked)",
        "ifsc": "string",
        "verified": "boolean"
      },
      "creditScore": "number",
      "creditHistory": {
        "totalLoansTaken": "number",
        "activeLoans": "number",
        "totalOutstanding": "number",
        "repaymentRate": "number (percentage)",
        "defaultRate": "number (percentage)"
      },
      "transactionHistory": [
        {
          "type": "SALE | PURCHASE | LOAN_REPAYMENT | INPUT_PURCHASE",
          "amount": "number",
          "date": "ISO8601 Date",
          "counterparty": "string"
        }
      ]
    },
    "performanceHistory": {
      "totalYieldHistory": [
        {
          "cropType": "string",
          "year": "number",
          "season": "string",
          "area": "number",
          "yield": { "quantity": "number", "unit": "QUINTAL" },
          "productivity": { "value": "number", "unit": "QUINTAL/ACRE" },
          "qualityGrade": "A | B | C",
          "marketSold": "number",
          "avgSellingPrice": "number"
        }
      ],
      "avgProductivityScore": "number (0-100)",
      "yieldTrend": "IMPROVING | STABLE | DECLINING",
      "bestCrop": "string",
      "improvementAreas": ["string"]
    },
    "technology": {
      "smartphoneUser": "boolean",
      "appUsage": { "daysActive": "number", "lastUsed": "ISO8601 Date" },
      "iotDevices": "number",
      "digitalPayments": "number (percentage of transactions)"
    }
  },
  "relationships": {
    "manages": ["FarmTwin"],
    "purchasesFrom": ["ProcurementOS"],
    "sellsTo": ["DistributionOS", "MarketTwin"],
    "financedBy": "RABTULLending",
    "memberOf": "FPO (optional)",
    "receivesAdvisoryFrom": "CropAgent"
  },
  "trustScore": {
    "overallScore": "number (0-100)",
    "components": {
      "transactionReliability": "number",
      "qualityConsistency": "number",
      "paymentHistory": "number",
      "complianceRecord": "number"
    },
    "verified": {
      "identity": "boolean",
      "landRecords": "boolean",
      "bankAccount": "boolean",
      "kycComplete": "boolean"
    }
  },
  "agents": ["FarmerAgent", "CropAgent", "CreditAgent", "MarketAgent"]
}
```

---

## 4. Integration Flows

### 4.1 Core Integration: REZ Inventory ↔ Farm Twin

This is the primary integration point enabling bidirectional sync between input inventory management and farm digital twin representations.

```
┌─────────────────────┐         ┌──────────────────────────────────────────┐
│   REZ INVENTORY     │         │              TWINOS LAYER                │
│      (4010)         │         │                                       │
│                     │         │  ┌─────────────────────────────────┐  │
│  ┌────────────────┐ │         │  │         Twin Hub (5250)          │  │
│  │ Stock Updates  │─┼─────────┼──│                                 │  │
│  └────────────────┘ │ Webhook │  │  • State synchronization         │  │
│                     │         │  │  • Event propagation             │  │
│  ┌────────────────┐ │         │  │  • Relationship updates          │  │
│  │ Input Usage    │─┼─────────┼──│  • Alert routing                │  │
│  │ Tracking       │ │ Event   │  └─────────────────────────────────┘  │
│  └────────────────┘ │         │           │       │       │            │
│                     │         │     ┌─────┘       │       └─────┐      │
│  ┌────────────────┐ │         │     │             │             │      │
│  │ Reorder Alerts │─┼─────────┼─────│             │             │      │
│  └────────────────┘ │   API   │     │             │             │      │
└─────────────────────┘         │     ▼             ▼             ▼      │
                                │  ┌────────┐  ┌────────┐  ┌────────┐    │
                                │  │  Farm  │  │  Crop  │  │Equipment│    │
                                │  │  Twin  │  │  Twin  │  │  Twin  │    │
                                │  └────────┘  └────────┘  └────────┘    │
                                │                                       │
                                │  ┌────────┐  ┌────────┐  ┌────────┐    │
                                │  │ Market │  │Farmer  │  │ Quality │    │
                                │  │  Twin  │  │  Twin  │  │  Twin  │    │
                                │  └────────┘  └────────┘  └────────┘    │
                                └──────────────────────────────────────┘
```

**Webhook Events from REZ Inventory:**

```typescript
// Input Stock Change (for Agri Inputs)
interface AgriInputStockChangeEvent {
  eventType: 'AGRI_INPUT_STOCK_CHANGED';
  timestamp: string;
  payload: {
    itemId: string;
    productId: string;
    productName: string;
    category: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'HERBICIDE' | 'FUEL' | 'EQUIPMENT';
    previousStock: number;
    currentStock: number;
    change: number;
    reason: 'RECEIPT' | 'APPLICATION' | 'ISSUE' | 'ADJUSTMENT' | 'WASTE';
    referenceId?: string;
    farmId?: string;
    fieldId?: string;
    cropId?: string;
    locationId: string;
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: number;
    triggerAlerts: string[];
  };
}

// Seed/Input Reorder Alert
interface AgriInputReorderAlertEvent {
  eventType: 'AGRI_INPUT_REORDER_ALERT';
  timestamp: string;
  payload: {
    itemId: string;
    productName: string;
    category: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    supplierId?: string;
    recommendedOrderDate: string;
    daysUntilStockOut: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    relevantCrops: string[];
    seasonContext: 'PRE_SOWING' | 'GROWING' | 'PRE_HARVEST';
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: string;
    triggerAgents: string[];
  };
}

// Input Expiry Warning
interface AgriInputExpiryWarningEvent {
  eventType: 'AGRI_INPUT_EXPIRY_WARNING';
  timestamp: string;
  payload: {
    itemId: string;
    productName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    affectedQuantity: number;
    batchNumber: string;
    category: string;
    recommendation: 'USE_IMMEDIATELY' | 'EXTEND_IF_POSSIBLE' | 'DISPOSE_SAFELY';
    alternativeProducts?: string[];
  };
  twinUpdate: {
    twinId: string;
    attribute: string;
    newValue: string;
    triggerAgents: string[];
  };
}

// Harvest Inventory Update (when produce comes in)
interface HarvestInventoryEvent {
  eventType: 'HARVEST_RECEIVED';
  timestamp: string;
  payload: {
    harvestId: string;
    farmId: string;
    cropId: string;
    cropType: string;
    quantity: number;
    unit: 'KG' | 'QUINTAL' | 'TONNE';
    qualityGrade: 'A' | 'B' | 'C';
    moistureContent: number;
    harvestDate: string;
    storageLocation: string;
    expectedShelfLife: number;
    marketValue: number;
  };
  twinUpdate: {
    twinIds: string[];
    actions: 'UPDATE_CROP_TWIN' | 'UPDATE_FARM_TWIN' | 'TRIGGER_MARKET_LISTING' | 'UPDATE_MARKET_TWIN';
  };
}
```

**API Endpoints for TwinOS Integration:**

```yaml
# TwinOS Farm Inventory Sync Endpoints
POST /api/v1/twin/farm/inventory/sync:
  description: Full synchronization of farm input inventory data
  body:
    items: AgriInventoryItem[]
    farmId: string
    lastSyncTimestamp: string
  response:
    synced: number
    errors: SyncError[]
    newAlerts: Alert[]

POST /api/v1/twin/farm/input/application:
  description: Record input application to field
  body:
    farmId: string
    fieldId: string
    cropId: string
    inputItemId: string
    quantity: number
    applicationDate: string
    applicationMethod: string
    weatherConditions: object
  response:
    success: boolean
    updatedStock: number
    triggeredEvents: Event[]

GET /api/v1/twin/farm/:farmId:
  description: Get full farm twin state with all related twins
  response:
    farm: FarmTwin
    crops: CropTwin[]
    equipment: EquipmentTwin[]
    alerts: Alert[]

POST /api/v1/twin/farm/:farmId/alerts:
  description: Trigger alert for farm twin
  body:
    alertType: string
    severity: string
    message: string
    actions: Action[]
  response:
    alertId: string
    dispatchedTo: Agent[]

GET /api/v1/twin/farm/:farmId/recommendations:
  description: Get AI-powered farm recommendations
  query:
    type: 'INPUT' | 'IRRIGATION' | 'HARVEST' | 'MARKET'
  response:
    recommendations: Recommendation[]
```

---

### 4.2 Crop Planning to Harvest Integration Flow

```
┌─────────────────────┐     ┌─────────────────┐     ┌────────────────────┐
│    REZ Agri OS     │     │  Farm Twin      │     │   Market Twin       │
│       (4860)       │     │     (5250)      │     │                    │
│                    │     │                 │     │                    │
│  ┌────────────────┐ │     │  ┌──────────┐ │     │  ┌──────────────┐  │
│  │  Crop Plan     │─┼────▶│  │ Farm     │ │     │  │ Market       │  │
│  │  Created       │ │     │  │ Twin     │ │     │  │ Prices       │  │
│  └────────────────┘ │     │  └────┬─────┘ │     │  │ Updated      │  │
│                     │     │       │       │     │  └──────┬───────┘  │
│  ┌────────────────┐ │     │       ▼       │     │         │          │
│  │ Growth Stage   │─┼────▶│  ┌──────────┐ │     │         ▼          │
│  │ Updated        │ │     │  │ Crop     │ │     │  ┌──────────────┐  │
│  └────────────────┘ │     │  │ Twin     │ │     │  │ Demand       │  │
│                     │     │  │          │ │     │  │ Signals      │  │
│  ┌────────────────┐ │     │  └────┬─────┘ │     │  └──────────────┘  │
│  │ Input Required │─┼────▶│       │       │     │                    │
│  │ (from Crop)    │ │     │       ▼       │     │                    │
│  └────────────────┘ │     │  ┌──────────┐ │     │                    │
│                     │     │  │Input Req  │ │     │                    │
│  ┌────────────────┐ │     │  │ Updated   │ │     │                    │
│  │ Harvest Ready  │─┼────▶│  └────┬─────┘ │     │                    │
│  │ Signal         │ │     │       │       │     │                    │
│  └────────────────┘ │     │       ▼       │     │                    │
│                     │     │  ┌──────────┐ │     │                    │
└─────────────────────┘     │  │Market    │ │     │                    │
                           │  │ Listing  │ │     │                    │
                           │  │ Ready    │ │     │                    │
                           │  └──────────┘ │     │                    │
                           └───────────────┘     └────────────────────┘
```

**Key Integration Points:**

```typescript
// 1. Crop Plan Creation → Farm & Crop Twin Update
interface CropPlanIntegration {
  trigger: {
    system: 'REZ Agri OS';
    event: 'CROP_PLAN_CREATED';
    payload: {
      cropPlanId: string;
      farmId: string;
      fieldId: string;
      cropType: string;
      variety: string;
      sowingDate: string;
      expectedHarvestDate: string;
      estimatedYield: number;
    };
  };
  actions: [
    {
      system: 'Farm Twin';
      action: 'UPDATE_CURRENT_CROPS';
      payload: { crops: CropInfo[] };
    },
    {
      system: 'Crop Twin';
      action: 'CREATE_CROP_TWIN';
      payload: { cropId: string; growthStage: 'SOWING' };
    },
    {
      system: 'REZ Inventory';
      action: 'CALCULATE_INPUT_REQUIREMENTS';
      payload: { cropId: string; cropType: string; area: number };
    },
    {
      system: 'RABTUL Lending';
      condition: 'if loanRequired === true';
      action: 'CHECK_CREDIT_ELIGIBILITY';
      payload: { farmerId: string; cropPlanId: string; estimatedCost: number };
    }
  ];
}

// 2. Input Application → Inventory + Crop Twin Update
interface InputApplicationIntegration {
  trigger: {
    system: 'REZ Agri OS';
    event: 'INPUT_APPLICATION_RECORDED';
    payload: {
      applicationId: string;
      farmId: string;
      cropId: string;
      inputType: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'HERBICIDE';
      inputProductId: string;
      quantity: number;
      applicationDate: string;
      applicationMethod: string;
      cost: number;
    };
  };
  actions: [
    {
      system: 'REZ Inventory';
      action: 'DEDUCT_STOCK';
      payload: { itemId: string; quantity: number; referenceType: 'FIELD_APPLICATION' };
    },
    {
      system: 'Crop Twin';
      action: 'UPDATE_INPUT_HISTORY';
      payload: { cropId: string; inputApplied: InputRecord[] };
    },
    {
      system: 'Crop Twin';
      condition: 'if inputType === FERTILIZER';
      action: 'UPDATE_GROWTH_PREDICTION';
      payload: { expectedYieldAdjustment: number };
    },
    {
      system: 'Farmer Twin';
      action: 'UPDATE_EXPENSE_RECORD';
      payload: { farmerId: string; expense: ExpenseRecord };
    }
  ];
}

// 3. Harvest Ready → Market Listing
interface HarvestMarketIntegration {
  trigger: {
    system: 'Crop Twin';
    event: 'CROP_HARVEST_READY';
    payload: {
      cropId: string;
      farmId: string;
      harvestId: string;
      quantity: number;
      qualityGrade: string;
      moistureContent: number;
      expectedPrice: number;
      farmerPreference: 'SELL_NOW' | 'STORE' | 'CONTRACT';
    };
  };
  actions: [
    {
      system: 'REZ Inventory';
      action: 'ADD_HARVEST_STOCK';
      payload: { harvestId: string; quantity: number; storageLocation: string };
    },
    {
      system: 'Market Twin';
      condition: 'if farmerPreference === SELL_NOW';
      action: 'CREATE_SELL_LISTING';
      payload: { harvestId: string; askingPrice: number; quantity: number };
    },
    {
      system: 'Market Twin';
      condition: 'if farmerPreference === STORE';
      action: 'CHECK_STORAGE_AVAILABILITY';
      payload: { location: string; capacity: number };
    },
    {
      system: 'Distribution OS';
      condition: 'if contractFarming === true';
      action: 'TRIGGER_CONTRACT_DELIVERY';
      payload: { agreementId: string; quantity: number };
    },
    {
      system: 'RABTUL Lending';
      condition: 'if warehouseReceiptFinancing === true';
      action: 'CREATE_WAREHOUSE_RECEIPT';
      payload: { harvestId: string; warehouseId: string; estimatedValue: number };
    }
  ];
}
```

---

### 4.3 Procurement-to-Farm Input Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│   Procurement OS    │     │     TwinOS Layer    │     │  REZ Inventory     │
│       (4320)        │     │                     │     │      (4010)        │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  PO Created     │─┼────▶│  │ Farmer Twin  │  │     │  │ Stock        │  │
│  └────────────────┘ │     │  │              │  │     │  │ Updated      │  │
│                      │     │  │ credit: upd  │  │     │  └──────────────┘  │
│  ┌────────────────┐ │     │  └──────┬───────┘  │     │                    │
│  │  Shipment      │─┼────▶│         │          │     │                    │
│  │  Dispatched    │ │     │         ▼          │     │                    │
│  └────────────────┘ │     │  ┌──────────────┐  │     │                    │
│                      │     │  │ Farm Twin    │ │     │                    │
│  ┌────────────────┐ │     │  │              │ │     │                    │
│  │  Delivery      │─┼────▶│  │ input sched  │ │     │                    │
│  │  Confirmed     │ │     │  │ updated      │ │     │                    │
│  └────────────────┘ │     │  └──────────────┘ │     │                    │
│                      │     │                     │     │                    │
└─────────────────────┘     └─────────────────────┘     └────────────────────┘
```

**Data Flow Specifications:**

```typescript
// Procurement to Farm
interface AgriProcurementFlow {
  orderCreated: {
    source: 'Procurement OS';
    target: ['Farm Twin', 'Farmer Twin'];
    data: {
      purchaseOrder: AgriPurchaseOrder;
      farmerTwinId: string;
      farmTwinId: string;
      expectedDeliveryDate: string;
    };
    twinUpdates: [
      { twinType: 'FarmerTwin', attribute: 'financial.pendingOrders', operation: 'INCREMENT' },
      { twinType: 'FarmTwin', attribute: 'pendingInputDeliveries', operation: 'ADD' }
    ];
  };

  shipmentDispatched: {
    source: 'Procurement OS';
    target: 'Farm Twin';
    data: {
      poId: string;
      trackingNumber: string;
      carrier: string;
      dispatchDate: string;
      expectedArrival: string;
      inputDetails: { name: string; quantity: number; batchNumber: string }[];
    };
    twinUpdates: [
      { twinType: 'FarmTwin', attribute: 'incomingShipments', operation: 'ADD' },
      { twinType: 'FarmerTwin', attribute: 'notifications', operation: 'ADD' }
    ];
  };

  goodsReceived: {
    source: 'Procurement OS';
    target: ['REZ Inventory', 'Farm Twin'];
    data: {
      poId: string;
      receivedItems: {
        itemId: string;
        orderedQuantity: number;
        receivedQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity: number;
        rejectionReason?: string;
        batchNumber: string;
      }[];
      receivedDate: string;
      receivedBy: string;
      qualityCheckResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
    };
    twinUpdates: [
      { twinType: 'REZ Inventory', attribute: 'stock.quantity', operation: 'ADD' },
      { twinType: 'FarmTwin', attribute: 'incomingShipments', operation: 'REMOVE' },
      { twinType: 'FarmTwin', attribute: 'inputInventory', operation: 'UPDATE' },
      { twinType: 'FarmerTwin', attribute: 'financial.purchaseHistory', operation: 'ADD' }
    ];
  };
}

// Credit-Linked Procurement Flow
interface CreditLinkedProcurement {
  farmerRequestsCredit: {
    source: 'Farmer Twin';
    target: 'RABTUL Lending';
    data: {
      farmerId: string;
      requestedAmount: number;
      purpose: string;
      inputsRequired: { itemId: string; quantity: number; estimatedCost: number }[];
      collateral: { type: string; value: number };
      farmTwinScore: number;
    };
    actions: [
      { system: 'RABTUL Lending', action: 'CREDIT_DECISION' },
      { system: 'Procurement OS', condition: 'if approved', action: 'CREATE_CREDIT_PO' },
      { system: 'REZ Inventory', condition: 'if approved', action: 'ALLOCATE_STOCK' }
    ];
  };

  creditRepayment: {
    source: 'Market Twin';
    target: ['Farmer Twin', 'RABTUL Lending'];
    data: {
      saleId: string;
      saleAmount: number;
      cropId: string;
      buyerPaymentReceived: boolean;
    };
    actions: [
      { system: 'RABTUL Lending', action: 'DEDUCT_REPAYMENT', percentage: 30 },
      { system: 'Farmer Twin', action: 'UPDATE_CREDIT_PROFILE' },
      { system: 'Farmer Twin', action: 'UPDATE_TRANSACTION_HISTORY' }
    ];
  };
}
```

---

## 5. Agent Architecture

### 5.1 Agent Overview

AI agents manage digital twins and orchestrate agricultural operations with autonomous decision-making capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      FARM MANAGER AGENT                                 ││
│  │  Twins Managed: FarmTwin                                                ││
│  │  Primary Role: Overall farm operations, resource allocation             ││
│  │  Skills: Crop Planning, Resource Optimization, Season Management         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │   CROP        │  │   MARKET      │  │  EQUIPMENT    │  │   CREDIT    │ │
│  │   AGENT       │  │   AGENT       │  │   AGENT       │  │   AGENT     │ │
│  │               │  │               │  │               │  │              │ │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:       │ │
│  │ • CropTwin    │  │ • MarketTwin  │  │ • Equipment   │  │ • FarmerTwin │ │
│  │ • FarmTwin    │  │ • CropTwin    │  │   Twin       │  │ • FarmTwin   │ │
│  │               │  │               │  │ • FarmTwin   │  │              │ │
│  │ Skills:       │  │ Skills:       │  │ Skills:       │  │ Skills:      │ │
│  │ • Growth Pred │  │ • Price Fore  │  │ • Predictive  │  │ • Credit Sc  │ │
│  │ • Disease ID  │  │ • Demand Ana  │  │   Maintenance │  │ • Loan Opt   │ │
│  │ • Yield Est   │  │ • Bargaining  │  │ • Emergency  │  │ • Insurance  │ │
│  │ • Advisory    │  │ • Contract   │  │   Repair     │  │   Adv        │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  IRRIGATION   │  │   QUALITY     │  │   LOGISTICS   │  │   REPORT    │ │
│  │   AGENT       │  │   AGENT       │  │   AGENT       │  │   AGENT     │ │
│  │               │  │               │  │               │  │              │ │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:       │ │
│  │ • FarmTwin    │  │ • CropTwin    │  │ • MarketTwin  │  │ • All Twins │ │
│  │ • CropTwin    │  │ • FarmTwin    │  │ • FarmTwin   │  │              │ │
│  │               │  │               │  │               │  │ Skills:      │ │
│  │ Skills:       │  │ Skills:       │  │ Skills:       │  │ • Report Gen│ │
│  │ • Water Mgmt  │  │ • Grading     │  │ • Route Opt   │  │ • Dashboard  │ │
│  │ • Sched Optim │  │ • Cert Mgmt   │  │ • Cold Chain  │  │ • Trend Anal │ │
│  │ • Wastewater  │  │ • Traceability│  │ • Timeliness  │  │ • Alert Summ │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Agent Specifications

#### 5.2.1 Farm Manager Agent

```json
{
  "agentId": "farm-manager-agent-{farmId}",
  "name": "Farm Manager Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "FarmTwin:{farmId}",
    "CropTwin:*",
    "FarmerTwin:*"
  ],
  "role": "Manages overall farm operations, resource allocation, and seasonal planning",
  "capabilities": {
    "cropPlanning": {
      "description": "Create optimal crop plans based on soil, water, market conditions",
      "inputs": ["soilData", "waterAvailability", "marketPrices", "farmerPreferences", "climate"],
      "outputs": ["cropPlan", "inputRequirements", "expectedRevenue"],
      "autonomy": "SEMI-AUTONOMOUS"
    },
    "resourceOptimization": {
      "description": "Optimize allocation of labor, water, inputs across fields",
      "inputs": ["fieldStatus", "cropRequirements", "resourceAvailability", "weatherForecast"],
      "outputs": ["resourceAllocation", "schedule", "costEstimate"],
      "autonomy": "AUTONOMOUS"
    },
    "seasonalManagement": {
      "description": "Coordinate activities across the farming season",
      "inputs": ["seasonType", "cropPlans", "historicalData"],
      "outputs": ["activityCalendar", "milestones", "riskMitigation"],
      "autonomy": "COORDINATES"
    },
    "advisoryGeneration": {
      "description": "Generate personalized advisory for farmers",
      "inputs": ["farmData", "cropStatus", "weatherData", "marketTrends"],
      "outputs": ["advisoryMessages", "alerts", "recommendations"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "agri-crop-planning-v2",
      "name": "Crop Planning & Rotation",
      "version": "2.0",
      "confidence": 0.90,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-resource-opt-v1",
      "name": "Resource Optimization",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-advisory-v2",
      "name": "Agricultural Advisory",
      "version": "2.0",
      "confidence": 0.92,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "activityApproval": {
      "threshold": "cost > 10000 INR",
      "type": "ESCALATE"
    },
    "cropChange": {
      "threshold": "yield improvement > 15%",
      "type": "RECOMMEND"
    },
    "emergencyAction": {
      "threshold": "any weather/crop emergency",
      "type": "AUTOMATIC_WITH_NOTIFICATION"
    }
  },
  "notifications": {
    "onCropStageChange": ["FarmerAgent"],
    "onResourceShortage": ["IrrigationAgent", "InputAgent"],
    "onWeatherAlert": ["CropAgent", "FarmerAgent"],
    "onMarketOpportunity": ["MarketAgent"]
  }
}
```

#### 5.2.2 Crop Agent

```json
{
  "agentId": "crop-agent-{farmId}",
  "name": "Crop Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "CropTwin:*",
    "FarmTwin:{farmId}"
  ],
  "role": "Monitors crop growth, predicts yields, and provides crop-specific recommendations",
  "capabilities": {
    "growthMonitoring": {
      "description": "Track and predict crop growth stages",
      "inputs": ["cropImages", "sensorData", "weatherData", "historicalGrowth"],
      "outputs": ["growthStage", "healthScore", "daysToMaturity"],
      "autonomy": "AUTONOMOUS"
    },
    "diseaseDetection": {
      "description": "Identify diseases and pests from symptoms",
      "inputs": ["cropImages", "symptomData", "pestDatabase", "environmentalConditions"],
      "outputs": ["diseaseIdentification", "severity", "treatmentRecommendations"],
      "autonomy": "AUTONOMOUS"
    },
    "yieldPrediction": {
      "description": "Predict harvest yields based on current conditions",
      "inputs": ["cropData", "weatherHistory", "inputUsage", "soilData", "historicalYields"],
      "outputs": ["yieldEstimate", "confidence", "comparisonToBenchmark"],
      "autonomy": "AUTONOMOUS"
    },
    "harvestTiming": {
      "description": "Determine optimal harvest time",
      "inputs": ["cropStage", "weatherForecast", "marketPrices", "laborAvailability"],
      "outputs": ["recommendedHarvestDate", "qualityPrediction", "riskAssessment"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "agri-crop-monitor-v2",
      "name": "Crop Growth Monitoring",
      "version": "2.0",
      "confidence": 0.91,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-disease-id-v1",
      "name": "Disease & Pest Identification",
      "version": "1.0",
      "confidence": 0.87,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-yield-prediction-v1",
      "name": "Yield Prediction",
      "version": "1.0",
      "confidence": 0.85,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-harvest-timing-v1",
      "name": "Harvest Timing Optimization",
      "version": "1.0",
      "confidence": 0.89,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "diseaseAlert": {
      "threshold": "confidence > 70% AND severity > MEDIUM",
      "type": "AUTOMATIC_WITH_FARMER_NOTIFICATION"
    },
    "harvestRecommendation": {
      "threshold": "optimal conditions met",
      "type": "RECOMMEND"
    },
    "yieldWarning": {
      "threshold": "yield < 70% of expected",
      "type": "ESCALATE"
    }
  },
  "notifications": {
    "onGrowthStageChange": ["FarmManagerAgent", "FarmerAgent"],
    "onDiseaseDetected": ["FarmManagerAgent", "FarmerAgent"],
    "onHarvestReady": ["FarmManagerAgent", "MarketAgent"],
    "onYieldEstimateUpdate": ["CreditAgent"]
  }
}
```

#### 5.2.3 Market Agent

```json
{
  "agentId": "market-agent",
  "name": "Market Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "MarketTwin:*",
    "CropTwin:*"
  ],
  "role": "Analyzes markets, forecasts prices, and optimizes selling strategies",
  "capabilities": {
    "priceForecasting": {
      "description": "Predict commodity prices based on supply, demand, and trends",
      "inputs": ["historicalPrices", "currentArrivals", "weatherData", "demandSignals", "importExport"],
      "outputs": ["priceForecast", "confidence", "priceRange", "optimalSellingWindow"],
      "autonomy": "AUTONOMOUS"
    },
    "demandAnalysis": {
      "description": "Analyze market demand for crops",
      "inputs": ["buyerInquiries", "historicalTrade", "seasonalPatterns", "exportDemand"],
      "outputs": ["demandScore", "activeBuyers", "preferredQuality"],
      "autonomy": "AUTONOMOUS"
    },
    "sellingOptimization": {
      "description": "Optimize selling strategy for harvested produce",
      "inputs": ["harvestQuantity", "qualityGrade", "storageCapacity", "currentPrices", "priceTrends"],
      "outputs": ["sellingStrategy", "recommendedPrices", "marketRouting"],
      "autonomy": "COORDINATES"
    },
    "contractNegotiation": {
      "description": "Assist in contract farming negotiations",
      "inputs": ["farmerRequirements", "buyerOffers", "marketRates", "historicalPerformance"],
      "outputs": ["negotiationStrategy", "recommendedTerms", "fairPriceRange"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "agri-price-forecast-v2",
      "name": "Agricultural Price Forecasting",
      "version": "2.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-demand-analysis-v1",
      "name": "Market Demand Analysis",
      "version": "1.0",
      "confidence": 0.85,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-selling-strategy-v1",
      "name": "Selling Strategy Optimization",
      "version": "1.0",
      "confidence": 0.86,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "priceAlert": {
      "threshold": "priceChange > 10% OR reaching seasonal high/low",
      "type": "AUTOMATIC_NOTIFICATION"
    },
    "sellingRecommendation": {
      "threshold": "current price > expected future price OR storage cost > price appreciation",
      "type": "RECOMMEND_SELL"
    },
    "contractReview": {
      "threshold": "any contract terms variance > 15% from market",
      "type": "ESCALATE"
    }
  },
  "notifications": {
    "onPriceAlert": ["FarmerAgent", "CropAgent"],
    "onMarketOpportunity": ["FarmManagerAgent"],
    "onSellingRecommendation": ["FarmerAgent"],
    "onContractTermsChange": ["CreditAgent"]
  }
}
```

#### 5.2.4 Equipment Agent

```json
{
  "agentId": "equipment-agent-{farmId}",
  "name": "Equipment Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "EquipmentTwin:*",
    "FarmTwin:{farmId}"
  ],
  "role": "Manages farm equipment health, predictive maintenance, and operational optimization",
  "capabilities": {
    "predictiveMaintenance": {
      "description": "Predict equipment failures and schedule maintenance",
      "inputs": ["equipmentTelemetry", "usageHistory", "maintenanceHistory", "manufacturerData"],
      "outputs": ["maintenanceSchedule", "failurePredictions", "partsRequired"],
      "autonomy": "AUTONOMOUS"
    },
    "usageOptimization": {
      "description": "Optimize equipment usage across farm operations",
      "inputs": ["operationSchedule", "equipmentAvailability", "fuelEfficiency", "labor"],
      "outputs": ["equipmentAssignment", "optimalRouting", "fuelEstimate"],
      "autonomy": "AUTONOMOUS"
    },
    "emergencyRepair": {
      "description": "Coordinate emergency repair responses",
      "inputs": ["breakdownData", "availableMechanics", "spareParts"],
      "outputs": ["repairPlan", "estimatedDowntime", "costEstimate"],
      "autonomy": "COORDINATES"
    },
    "costTracking": {
      "description": "Track and report equipment operating costs",
      "inputs": ["fuelConsumption", "repairCosts", "depreciation", "laborHours"],
      "outputs": ["costPerHour", "costPerAcre", "costReport"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "agri-equip-maint-v2",
      "name": "Predictive Equipment Maintenance",
      "version": "2.0",
      "confidence": 0.89,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-equip-opt-v1",
      "name": "Equipment Usage Optimization",
      "version": "1.0",
      "confidence": 0.84,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-fuel-mgmt-v1",
      "name": "Fuel Management",
      "version": "1.0",
      "confidence": 0.91,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "maintenanceSchedule": {
      "threshold": "hoursSinceLastService >= serviceInterval OR failure probability > 60%",
      "type": "AUTOMATIC"
    },
    "emergencyStop": {
      "threshold": "any critical equipment alert",
      "type": "ALWAYS_TRIGGER_ALERT"
    },
    "replacementRecommendation": {
      "threshold": "repairCost > 60% of equipment value OR downtime > 20% of operational time",
      "type": "RECOMMEND"
    }
  },
  "notifications": {
    "onMaintenanceDue": ["FarmManagerAgent"],
    "onEquipmentBreakdown": ["FarmManagerAgent"],
    "onSparePartLow": ["InventoryAgent"],
    "onCostAnomaly": ["FarmManagerAgent"]
  }
}
```

#### 5.2.5 Credit Agent

```json
{
  "agentId": "credit-agent",
  "name": "Credit Agent",
  "type": "FINANCIAL",
  "managedTwins": [
    "FarmerTwin:*",
    "FarmTwin:*"
  ],
  "role": "Manages farmer credit, loan optimization, and financial planning",
  "capabilities": {
    "creditScoring": {
      "description": "Calculate credit scores based on farm and farmer data",
      "inputs": ["farmPerformance", "yieldHistory", "repaymentHistory", "marketLinkage"],
      "outputs": ["creditScore", "creditLimit", "riskRating"],
      "autonomy": "AUTONOMOUS"
    },
    "loanOptimization": {
      "description": "Recommend optimal loan products for farmer needs",
      "inputs": ["farmerRequirements", "creditProfile", "availableProducts", "seasonalTiming"],
      "outputs": ["loanRecommendations", "amount", "tenure", "interestRate"],
      "autonomy": "RECOMMENDS_ONLY"
    },
    "insuranceAdvice": {
      "description": "Recommend appropriate insurance coverage",
      "inputs": ["farmProfile", "cropTypes", "riskExposure", "existingCoverage"],
      "outputs": ["insuranceRecommendations", "coverageGaps", "premiumEstimate"],
      "autonomy": "RECOMMENDS_ONLY"
    },
    "repaymentPlanning": {
      "description": "Optimize loan repayment based on harvest timing",
      "inputs": ["loanDetails", "harvestForecast", "marketPrices", "cashFlow"],
      "outputs": ["repaymentSchedule", "advanceRepaymentRecommendation"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "agri-credit-score-v2",
      "name": "Agricultural Credit Scoring",
      "version": "2.0",
      "confidence": 0.87,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-loan-opt-v1",
      "name": "Loan Optimization",
      "version": "1.0",
      "confidence": 0.85,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "agri-insurance-v1",
      "name": "Crop Insurance Advisory",
      "version": "1.0",
      "confidence": 0.83,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "creditApproval": {
      "threshold": "creditScore >= minimum AND riskRating <= MEDIUM",
      "type": "AUTOMATIC"
    },
    "creditLimitChange": {
      "threshold": "performance improvement > 20%",
      "type": "RECOMMEND"
    },
    "defaultRisk": {
      "threshold": "repayment overdue > 30 days OR yield < 50% expected",
      "type": "ESCALATE"
    }
  },
  "notifications": {
    "onCreditScoreUpdate": ["FarmerAgent"],
    "onLoanApproval": ["FarmerAgent", "RABTULLending"],
    "onRepaymentDue": ["FarmerAgent"],
    "onDefaultRisk": ["FarmManagerAgent", "RiskAgent"]
  }
}
```

---

## 6. Business Copilot Integration

### 6.1 Natural Language Query Capabilities

The Business Copilot provides farmers, aggregators, and agricultural businesses with natural language access to farm data, market intelligence, and operational recommendations.

```typescript
// Query Intent Definitions
interface AgriQueries {
  // Farm Status Queries
  "What's happening in my farm today?": {
    intent: 'FARM_STATUS',
    response: {
      summary: string,
      activities: Activity[],
      alerts: Alert[],
      weather: WeatherSummary
    }
  },
  "Show me all my crops and their status": {
    intent: 'CROP_STATUS_LIST',
    response: {
      crops: CropStatus[],
      overallHealth: string,
      actionItems: string[]
    }
  },
  "When should I harvest my wheat?": {
    intent: 'HARVEST_RECOMMENDATION',
    response: {
      recommendedDate: Date,
      reason: string,
      qualityPrediction: string,
      priceForecast: PriceData
    }
  },
  "What inputs do I need for the next week?": {
    intent: 'INPUT_REQUIREMENTS',
    response: {
      inputs: InputRequirement[],
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      estimatedCost: number,
      suppliers: Supplier[]
    }
  },

  // Market Queries
  "What are today's wheat prices in my area?": {
    intent: 'MARKET_PRICES',
    response: {
      prices: MarketPrice[],
      trend: string,
      comparison: string
    }
  },
  "Should I sell my tomato crop now or wait?": {
    intent: 'SELLING_DECISION',
    response: {
      recommendation: 'SELL_NOW' | 'WAIT' | 'STORE',
      reasoning: string,
      priceForecast: PriceForecast,
      alternativeOptions: string[]
    }
  },
  "Show me the best markets for my rice": {
    intent: 'MARKET_MATCHING',
    response: {
      markets: MarketMatch[],
      distance: number,
      expectedPrice: number,
      logisticsCost: number
    }
  },

  // Financial Queries
  "What's my credit score?": {
    intent: 'CREDIT_STATUS',
    response: {
      score: number,
      rating: string,
      eligibleAmount: number,
      factors: string[]
    }
  },
  "Can I get a loan for buying fertilizer?": {
    intent: 'LOAN_ELIGIBILITY',
    response: {
      eligible: boolean,
      amount: number,
      interestRate: number,
      documents: string[],
      processTime: string
    }
  },
  "Show me my farming costs this season": {
    intent: 'COST_ANALYSIS',
    response: {
      totalCost: number,
      breakdown: CostItem[],
      comparison: string,
      costPerAcre: number
    }
  },

  // Equipment Queries
  "What equipment maintenance is due?": {
    intent: 'MAINTENANCE_DUE',
    response: {
      equipment: MaintenanceItem[],
      urgency: string,
      estimatedCost: number
    }
  },
  "How much fuel did my tractor use last month?": {
    intent: 'FUEL_USAGE',
    response: {
      totalFuel: number,
      cost: number,
      usageByOperation: Record<string, number>,
      efficiency: number
    }
  },

  // Action Intents
  "Log that I applied fertilizer to Field 3": {
    intent: 'LOG_INPUT_APPLICATION',
    entities: { field: string, input: string, quantity?: number },
    confirmation: true
  },
  "Create a purchase order for DAP fertilizer": {
    intent: 'CREATE_PURCHASE_ORDER',
    entities: { item: string, quantity?: number },
    confirmation: true
  },
  "Send harvest details to the market": {
    intent: 'MARKET_LISTING',
    entities: { crop: string, quantity: number, price?: number },
    confirmation: true
  }
}
```

### 6.2 Dashboard Widgets and Reports

```typescript
// Agriculture Dashboard Widgets
interface AgriDashboardWidgets {
  // Real-time Farm KPIs
  farmKPIs: {
    title: "Farm Overview";
    metrics: ['activeCrops', 'totalArea', 'productivity', 'healthScore'];
    alerts: ['cropAlert', 'weather', 'market'];
    refreshInterval: 300; // seconds
    charts: ['map', 'pie'];
  };

  cropMonitor: {
    title: "Crop Health Monitor";
    metrics: ['healthy', 'stressed', 'atRisk'];
    charts: ['ndvi', 'growthStage'];
    alerts: ['disease', 'pest', 'nutrient'];
  };

  marketWatch: {
    title: "Market Intelligence";
    metrics: ['trackedPrices', 'priceChange', 'bestMarket'];
    charts: ['priceTrend', 'demandIndex'];
    alerts: ['priceSpike', 'demandSurge'];
  };

  financialHealth: {
    title: "Financial Overview";
    metrics: ['creditScore', 'activeLoans', 'outstanding', 'repaymentDue'];
    alerts: ['paymentDue', 'creditLimit', 'newOpportunity'];
  };

  // Reports
  dailyFarmReport: {
    schedule: "daily 6:00 PM";
    recipients: ['farmer', 'farmManager'];
    sections: ['summary', 'activities', 'weather', 'alerts', 'marketUpdate'];
  };

  weeklyInputReport: {
    schedule: "weekly Sunday 8:00 AM";
    recipients: ['farmManager', 'inventoryManager'];
    sections: ['inputUsage', 'stockLevels', 'reorderAlerts', 'costs'];
  };

  monthlyFinancialReport: {
    schedule: "monthly 1st 9:00 AM";
    recipients: ['farmer', 'creditAgent'];
    sections: ['costs', 'revenue', 'profit', 'creditStatus', 'recommendations'];
  };

  harvestForecastReport: {
    schedule: "bi-weekly during harvest season";
    recipients: ['farmer', 'marketAgent', 'creditAgent'];
    sections: ['yieldEstimate', 'qualityPrediction', 'marketTiming', 'logistics'];
  };
}
```

### 6.3 Alert Routing to Copilot

```typescript
interface AgriCopilotAlertRouting {
  rules: [
    {
      condition: {
        type: 'CROP_DISEASE_DETECTED',
        severity: 'HIGH' | 'CRITICAL'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Disease detected in {crop}: {disease}' },
        { type: 'SUGGEST_ACTION', action: 'View treatment options' },
        { type: 'CREATE_TASK', task: 'Apply treatment', priority: 'HIGH' },
        { type: 'ESCALATE', to: 'Agricultural Expert' }
      ];
    },
    {
      condition: {
        type: 'WEATHER_ALERT',
        severity: 'HIGH',
        type: 'HEATWAVE' | 'HEAVY_RAIN' | 'FROST'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Weather alert: {type} expected on {date}' },
        { type: 'SUGGEST_ACTION', action: 'View protective measures' },
        { type: 'UPDATE_CROP_STATUS', affectedCrops: ['string'] }
      ];
    },
    {
      condition: {
        type: 'INPUT_STOCK_LOW',
        priority: 'CRITICAL'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Critical: {input} out of stock' },
        { type: 'SUGGEST_ACTION', action: 'Create emergency order' },
        { type: 'CHECK_CREDIT', condition: 'if eligible for credit' }
      ];
    },
    {
      condition: {
        type: 'PRICE_OPPORTUNITY',
        priceChange: '> 15% increase in 24 hours'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Price alert: {crop} up {percentage}%' },
        { type: 'SUGGEST_ACTION', action: 'Review selling decision' },
        { type: 'ANALYZE_IMPACT', onHarvestPlan: true }
      ];
    },
    {
      condition: {
        type: 'EQUIPMENT_BREAKDOWN',
        severity: 'HIGH'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Equipment breakdown: {equipment}' },
        { type: 'SUGGEST_ACTION', action: 'View repair options' },
        { type: 'ESTIMATE_IMPACT', onSchedule: true }
      ];
    },
    {
      condition: {
        type: 'HARVEST_READY',
        cropType: 'any'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: '{crop} is ready for harvest' },
        { type: 'SUGGEST_ACTION', action: 'View harvest recommendations' },
        { type: 'CHECK_MARKET', forCrop: '{crop}' }
      ];
    }
  ];
}
```

---

## 7. Economic Integration

### 7.1 Payment Flows

```typescript
interface AgriPaymentFlows {
  // Input Purchase
  inputPurchase: {
    flow: [
      { step: 'ORDER_CREATED', system: 'Procurement OS', action: 'Record PO' },
      { step: 'GOODS_RECEIVED', system: 'REZ Inventory', action: 'Accept stock' },
      { step: 'INVOICE_RECEIVED', system: 'Procurement OS', action: 'Validate invoice' },
      { step: 'PAYMENT_INITIATED', system: 'RABTUL Pay', action: 'Process payment' },
      { step: 'PAYMENT_COMPLETED', system: 'RABTUL Wallet', action: 'Update balances' }
    ];
    triggers: {
      automaticPayment: true;
      paymentTerms: 'COD' | 'ADVANCE' | 'NET15';
      approvalRequired: { threshold: 50000 }; // INR
      creditLinkage: 'RABTUL_LENDING';
    };
  };

  // Harvest Sale
  harvestSale: {
    flow: [
      { step: 'LISTING_CREATED', system: 'Market Twin', action: 'Create listing' },
      { step: 'BUYER_MATCHED', system: 'Market Twin', action: 'Match buyer' },
      { step: 'QUALITY_CHECK', system: 'Quality Agent', action: 'Grade produce' },
      { step: 'PRICE_NEGOTIATED', system: 'Market Agent', action: 'Finalize price' },
      { step: 'PAYMENT_RECEIVED', system: 'RABTUL Pay', action: 'Collect payment' },
      { step: 'LOAN_REPAYMENT', condition: 'if credit outstanding', system: 'RABTUL Lending', action: 'Auto-deduct repayment' },
      { step: 'NET_PROCEEDS', system: 'RABTUL Wallet', action: 'Credit farmer account' }
    ];
    features: {
      priceLock: true;
      qualityBonus: { criteria: 'grade' };
      marketLinkageDeduction: { percentage: 2 };
    };
  };

  // Credit Repayment
  creditRepayment: {
    flow: [
      { step: 'HARVEST_COMPLETED', system: 'Crop Twin', action: 'Record harvest' },
      { step: 'MARKET_SALE', system: 'Market Twin', action: 'Complete sale' },
      { step: 'REPAYMENT_CALCULATED', system: 'Credit Agent', action: 'Calculate amount' },
      { step: 'AUTO_DEDUCTION', system: 'RABTUL Lending', action: 'Deduct from proceeds' },
      { step: 'RECEIPT_GENERATED', system: 'RABTUL Lending', action: 'Generate receipt' }
    ];
    features: {
      automaticSweep: true;
      partialRepayment: true;
      prepaymentDiscount: { terms: '2/10 NET30 equivalent' };
      lateFeePolicy: { percentage: 2, graceDays: 7 };
    };
  };

  // Contract Farming Settlement
  contractFarmingSettlement: {
    flow: [
      { step: 'DELIVERY_CONFIRMED', system: 'Distribution OS', action: 'Accept delivery' },
      { step: 'QUALITY_GRADING', system: 'Quality Agent', action: 'Grade produce' },
      { step: 'PRICE_CALCULATED', system: 'Procurement OS', action: 'Calculate with premium' },
      { step: 'PAYMENT_RELEASED', system: 'RABTUL Pay', action: 'Process to farmer' },
      { step: 'CONTRACT_CLOSED', system: 'Procurement OS', action: 'Update status' }
    ];
    features: {
      qualityBonus: true;
      volumeIncentive: true;
      timelyDeliveryBonus: true;
      advancePayment: { percentage: 30, timing: 'at harvest' };
    };
  };
}
```

### 7.2 REZ Coins and Rewards Integration

```typescript
interface AgriRewardsIntegration {
  // Farmer Rewards
  farmerRewards: {
    categories: [
      {
        category: 'YIELD_EXCELLENCE',
        actions: ['targetAchieved', 'qualityBonus', 'yieldImprovement'],
        coinsPerAction: { min: 50, max: 5000 }
      },
      {
        category: 'SUSTAINABLE_FARMING',
        actions: ['organicCertified', 'waterConservation', 'soilHealthImprovement'],
        coinsPerAction: { min: 100, max: 10000 }
      },
      {
        category: 'MARKET_PARTICIPATION',
        actions: ['directMarketSale', 'priceNegotiation', 'contractCompliance'],
        coinsPerAction: { min: 25, max: 2000 }
      },
      {
        category: 'TECHNOLOGY_ADOPTION',
        actions: ['appUsage', 'iotDevice', 'digitalPayment'],
        coinsPerAction: { min: 10, max: 500 }
      }
    ],
    redemption: {
      products: ['REZ Store', 'Input Vouchers', 'Equipment Rentals', 'Insurance Premium'],
      conversionRate: 1; // coins to INR
    };
  };

  // FPO (Farmer Producer Organization) Rewards
  fpoRewards: {
    tiers: [
      { tier: 'BRONZE', memberThreshold: 100, transactionVolume: 1000000 },
      { tier: 'SILVER', memberThreshold: 500, transactionVolume: 5000000 },
      { tier: 'GOLD', memberThreshold: 1000, transactionVolume: 10000000 }
    ],
    benefits: {
      BRONZE: ['Bulk purchase discounts', 'Market access'],
      SILVER: ['Priority credit', 'Technology support', 'Training programs'],
      GOLD: ['Premium market linkages', 'Export opportunities', 'Capacity building grants']
    },
    rewardsPoints: {
      memberOnboarding: 50,
      volumeTransaction: 1, // per 1000 INR
      qualityCertification: 500,
      digitalAdoption: 200
    };
  };

  // Buyer/Processor Rewards
  buyerRewards: {
    program: 'Quality Procurement Rewards',
    earnRules: [
      { action: 'QUALITY_PRODUCE', bonus: '2% above market price' },
      { action: 'DIRECT_FARMER', bonus: '1 coin per 100 INR' },
      { action: 'TIMELY_PAYMENT', bonus: '0.5% discount on next purchase' }
    ],
    redeemRules: [
      { type: 'INPUT_DISCOUNT', threshold: 1000 },
      { type: 'CREDIT_INTEREST', reduction: '1% on loan interest' },
      { type: 'PREMIUM_LISTING', threshold: 5000 }
    ]
  };
}
```

### 7.3 Wallet Usage in Agriculture

```typescript
interface AgriWalletUsage {
  // Farmer Wallet
  farmerWallet: {
    purposes: [
      'INPUT_PURCHASES',
      'HARVEST_PROCEEDS',
      'LOAN_REPAYMENT',
      'EQUIPMENT_RENTAL',
      'LABOR_PAYMENTS',
      'SAVINGS'
    ];
    fundingSources: [
      'HARVEST_SALES',
      'LOAN_DISBURSEMENT',
      'GOVERNMENT_SUBSIDY',
      'INSURANCE_CLAIM',
      'REWARD_POINTS'
    ];
    controls: {
      maxTransactionValue: 500000; // 5 lakhs
      dailyLimit: 1000000; // 10 lakhs
      dualApproval: { threshold: 200000 };
      mandatorySavings: { percentage: 5 };
    };
  };

  // FPO Collective Wallet
  fpoWallet: {
    collectivePurpose: [
      'BULK_INPUT_PURCHASES',
      'STORAGE_FACILITY',
      'TRANSPORT_LOGISTICS',
      'MARKETING_COSTS',
      'MEMBER_PAYOUTS'
    ];
    governance: {
      approvalRequired: 'MAJORITY_MEMBERS';
      boardApproval: { threshold: 500000 };
      auditFrequency: 'MONTHLY';
    };
  };

  // Subsidy Disbursement
  subsidyWallet: {
    types: [
      'INPUT_SUBSIDY',
      'DRIP_IRRIGATION',
      'SEED_SUBSIDY',
      'EQUIPMENT_SUBSIDY',
      'INSURANCE_PREMIUM_SUBSIDY'
    ];
    disbursement: {
      method: 'DIRECT_BANK_TRANSFER';
      verificationRequired: ['landRecords', 'cultivationProof'];
      amountCalculation: 'AUTO_CALCULATED';
    };
  };
}
```

### 7.4 RABTUL Lending for Agriculture

```typescript
interface AgriLendingProducts {
  // Crop Loan
  cropLoan: {
    purpose: 'Crop production inputs (seeds, fertilizer, pesticides, labor)',
    amountRange: { min: 50000, max: 500000 };
    tenure: '6-12 months';
    interestRate: { base: 9, subsidizedRate: 4 };
    eligibilityCriteria: [
      'Land ownership/lease verification',
      'Crop plan approved',
      'Farm Twin registration',
      'Minimum 2 acre cultivated land'
    ];
    security: { collateralRequired: false, guarantorRequired: false };
    disbursement: { method: 'DIRECT_TO_SELLER', percentage: 80, remainingAtHarvest: 20 };
    repayment: { source: 'HARVEST_PROCEEDS', autoDeduct: true };
  };

  // Kisan Credit Card
  kisanCreditCard: {
    purpose: 'Flexible credit for agriculture and allied activities',
    amountRange: { min: 100000, max: 300000 };
    tenure: 'Annual renewal';
    interestRate: { upToLimit: 4, aboveLimit: 9 };
    features: [
      'Withdraw as needed',
      'Pay interest only on used amount',
      'Insurance coverage included',
      'ATM withdrawals at rural centers'
    ];
  };

  // Equipment Loan
  equipmentLoan: {
    purpose: 'Purchase of farm machinery and equipment',
    amountRange: { min: 200000, max: 5000000 };
    tenure: '3-7 years';
    interestRate: { base: 10, subsidy: 5 };
    eligibilityCriteria: [
      'Existing farm operation',
      'Equipment verified',
      'Maintenance plan',
      'Utilization tracking via Equipment Twin'
    ];
    security: { collateralRequired: true, equipmentHypothecation: true };
  };

  // Warehouse Receipt Financing
  warehouseReceiptFinance: {
    purpose: 'Post-harvest financing against stored produce',
    amountRange: { min: 50000, max: 2000000 };
    tenure: '3-6 months';
    interestRate: { base: 8 };
    collateral: { type: 'WAREHOUSE_RECEIPT', hairCut: 20 };
    eligibilityCriteria: [
      'Quality grading passed',
      'Cold storage facility',
      'Insurance coverage',
      'Market price monitoring'
    ];
    features: [
      'Price risk hedging',
      'Auto-liquidation at maturity',
      'Top-up facility'
    ];
  };

  // Insurance Products
  insuranceProducts: {
    cropInsurance: {
      provider: 'Government + Private',
      coverage: ['Weather', 'Pest', 'Disease', 'Natural Fire'],
      premiumRate: { subsidized: 2, actual: 5 },
      claimProcess: 'AUTO_TRIGGERED based on Twin data'
    };
    livestockInsurance: {
      coverage: ['Death', 'Theft', 'Accident'],
      premiumRate: 4;
    };
    equipmentInsurance: {
      coverage: ['Breakdown', 'Accident', 'Theft'],
      premiumRate: 2;
    };
  };
}
```

---

## 8. Implementation Roadmap

### 8.1 6-Week Implementation Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGRICULTURE OS - 6 WEEK IMPLEMENTATION                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WEEK 1: Foundation                                                          │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • Farm Twin Core Schema Implementation                                      │
│  • Farmer Twin Core Schema Implementation                                    │
│  • REZ Inventory Agri Extension                                              │
│  • Basic API Endpoints (Farm CRUD, Farmer CRUD)                             │
│  • Twin Hub Integration Setup                                                │
│  Deliverables: Farm Twin v1.0, Farmer Twin v1.0, Inventory Extension v1.0    │
│                                                                              │
│  WEEK 2: Crop & Equipment Twins                                              │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • Crop Twin Schema & Lifecycle                                              │
│  • Equipment Twin Schema & Telemetry                                         │
│  • Growth Stage Tracking System                                              │
│  • Equipment Telemetry Integration                                           │
│  • Basic Growth Predictions                                                  │
│  Deliverables: Crop Twin v1.0, Equipment Twin v1.0, Growth Tracking v1.0    │
│                                                                              │
│  WEEK 3: Market Twin & Price Intelligence                                    │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • Market Twin Schema & Data Sources                                         │
│  • Real-time Price Feed Integration                                          │
│  • Price Forecasting Engine                                                  │
│  • Demand Signal Aggregation                                                 │
│  • Market Listing Management                                                 │
│  Deliverables: Market Twin v1.0, Price Intelligence v1.0, Listing v1.0      │
│                                                                              │
│  WEEK 4: Agent Implementation                                                │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • Farm Manager Agent Core                                                   │
│  • Crop Agent (Growth, Disease, Yield)                                       │
│  • Market Agent (Prices, Selling)                                            │
│  • Equipment Agent (Maintenance)                                             │
│  • Credit Agent (Basic Scoring)                                             │
│  Deliverables: All 5 Agents v1.0, Agent Communication v1.0                  │
│                                                                              │
│  WEEK 5: Integration & Business Copilot                                      │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • REZ Inventory ↔ Farm Twin Integration                                     │
│  • Procurement OS ↔ Farm Twin Integration                                   │
│  • Market Twin ↔ Crop Twin Integration                                        │
│  • Business Copilot Query Engine                                              │
│  • Dashboard Widgets (Farm, Crop, Market)                                    │
│  • Alert Routing System                                                      │
│  Deliverables: Full Integration v1.0, Copilot v1.0, Dashboard v1.0          │
│                                                                              │
│  WEEK 6: Financial & Credit Integration                                      │
│  ═══════════════════════════════════════════════════════════════════════   │
│  • RABTUL Lending Integration                                                │
│  • Credit Score Calculation                                                  │
│  • Payment Flows Implementation                                              │
│  • Wallet Integration                                                        │
│  • End-to-End Testing                                                        │
│  • Documentation & Training                                                  │
│  Deliverables: Financial v1.0, Production Ready                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Detailed Week-by-Week Tasks

#### Week 1: Foundation

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Farm Twin schema design | Architecture | Farm Twin schema |
| Mon | Farmer Twin schema design | Architecture | Farmer Twin schema |
| Tue | Farm Twin database models | Backend | Farm Twin API |
| Wed | Farmer Twin database models | Backend | Farmer Twin API |
| Thu | REZ Inventory Agri extension | Backend | Inventory Agri API |
| Thu | Twin Hub integration setup | Backend | Twin Hub config |
| Fri | Basic CRUD endpoints | Backend | Farm/Farmer APIs |
| Fri | Unit tests | QA | Test coverage > 60% |

#### Week 2: Crop & Equipment Twins

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Crop Twin schema design | Architecture | Crop Twin schema |
| Mon | Equipment Twin schema design | Architecture | Equipment Twin schema |
| Tue | Crop Twin lifecycle | Backend | Crop Lifecycle API |
| Wed | Growth stage tracking | Backend | Growth Tracking |
| Thu | Equipment telemetry integration | IoT | Telemetry API |
| Fri | Basic growth predictions | ML | Prediction v1.0 |
| Fri | Integration tests | QA | Integration Tests |

#### Week 3: Market Twin & Price Intelligence

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Market Twin schema | Architecture | Market Twin schema |
| Tue | Price feed integration | Backend | Price Feed API |
| Wed | Price forecasting model | ML | Forecast v1.0 |
| Thu | Demand signal aggregation | Backend | Demand Signals |
| Fri | Market listing management | Backend | Listing API |
| Fri | Dashboard for Market Twin | Frontend | Market Dashboard |

#### Week 4: Agent Implementation

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Farm Manager Agent | AI/ML | Farm Manager v1.0 |
| Tue | Crop Agent (Growth) | AI/ML | Crop Growth Agent |
| Tue | Crop Agent (Disease) | AI/ML | Disease Detection |
| Wed | Market Agent (Prices) | AI/ML | Market Agent v1.0 |
| Thu | Equipment Agent | AI/ML | Equipment Agent v1.0 |
| Fri | Credit Agent (Scoring) | AI/ML | Credit Agent v1.0 |
| Fri | Agent communication layer | Backend | Agent Bus v1.0 |

#### Week 5: Integration & Business Copilot

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Inventory ↔ Farm Twin | Backend | Inventory Integration |
| Tue | Procurement ↔ Farm Twin | Backend | Procurement Integration |
| Wed | Market ↔ Crop Twin | Backend | Market Integration |
| Thu | Business Copilot engine | AI/ML | Copilot Query Engine |
| Fri | Dashboard widgets | Frontend | Dashboard v1.0 |
| Fri | Alert routing | Backend | Alert System v1.0 |

#### Week 6: Financial & Credit Integration

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | RABTUL Lending integration | Backend | Lending API |
| Tue | Credit scoring engine | ML | Credit Score v1.0 |
| Wed | Payment flows | Backend | Payments v1.0 |
| Thu | Wallet integration | Backend | Wallet v1.0 |
| Fri | End-to-end testing | QA | E2E Test Suite |
| Fri | Documentation & Training | All | User Docs, Training |

### 8.3 Success Metrics

| Metric | Week 2 | Week 4 | Week 6 | Target |
|--------|--------|--------|--------|--------|
| Farm Twins Created | 50 | 200 | 500 | 1000 |
| Crop Twins Active | 20 | 100 | 300 | 500 |
| Market Listings | 0 | 50 | 200 | 500 |
| Credit Applications | 0 | 20 | 100 | 300 |
| Agent Interactions | 100 | 1000 | 5000 | 10000 |
| API Availability | 99.5% | 99.5% | 99.9% | 99.9% |
| Response Time P95 | <500ms | <300ms | <200ms | <200ms |
| Test Coverage | 60% | 75% | 85% | 90% |

### 8.4 Resource Requirements

| Role | Week 1-2 | Week 3-4 | Week 5-6 | Total |
|------|----------|----------|----------|-------|
| Backend Engineers | 3 | 3 | 2 | 5 |
| Frontend Engineers | 1 | 1 | 2 | 3 |
| AI/ML Engineers | 1 | 3 | 2 | 4 |
| QA Engineers | 1 | 2 | 2 | 3 |
| Product Manager | 1 | 1 | 1 | 1 |
| DevOps | 1 | 1 | 1 | 2 |

---

## Appendix A: API Port Reference

| Service | Port | Description |
|---------|------|-------------|
| REZ Inventory | 4010, 4625 | Agri input inventory |
| Distribution OS | 4300 | Agri distribution |
| Procurement OS | 4320 | Agri procurement |
| REZ QR Cloud | 4058, 4063 | Farm traceability |
| RABTUL Lending | 4008 | Agricultural credit |
| REZ Agri OS | 4860 | Farm management |
| Twin Hub | 5250 | Digital twin orchestration |
| Business Copilot | 4022 | Natural language interface |
| Market Twin | 5270 | Market intelligence |

---

## Appendix B: Data Format Standards

All API requests and responses follow the standard format:

```typescript
// Request
interface ApiRequest<T> {
  data: T;
  metadata?: {
    source: string;
    timestamp: string;
    correlationId: string;
  };
}

// Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

## Appendix C: Security & Compliance

- **Data Privacy**: All farmer PII (Aadhaar, PAN) encrypted at rest and in transit
- **Consent Management**: Explicit consent required for data sharing
- **Audit Trail**: All data access logged with timestamps
- **Compliance**: Follows NPOP, FSSAI, and APMC data requirements
- **KYC Verification**: Integration with official government databases

---

*Document Version: 1.0*
*Last Updated: 2026-06-12*
*Author: RTNM Digital Architecture Team*
