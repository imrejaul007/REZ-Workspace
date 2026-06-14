# RisaCare Pharmacy Management Service

**B2B Pharmacy Management for Retail and Hospital Pharmacies**

A comprehensive, production-ready pharmacy management system built for RTNM Group's RisaCare vertical.

## Overview

RisaCare Pharmacy Management Service is a B2B solution designed for:
- **Retail Pharmacies** - Standalone drug stores and pharmacy chains
- **Hospital Pharmacies** - In-patient and out-patient pharmacy operations
- **Online Pharmacies** - E-prescription and delivery services

## Features

### Core Functionality

- **Pharmacy Management** - Setup and manage pharmacy details, operating hours, and pharmacists
- **Medicine Catalog** - Comprehensive medicine database with categories, pricing, and stock levels
- **Prescription Handling** - Create, validate, and dispense prescriptions with verification
- **Inventory Management** - Batch tracking, expiry alerts, low-stock notifications
- **Sales Processing** - Point-of-sale with multiple payment methods
- **Supplier Management** - Purchase orders, supplier performance tracking

### Inventory Intelligence

- Low stock alerts with customizable thresholds
- Expiry date tracking (30/60/90 days)
- Reorder suggestions based on consumption patterns
- Inventory valuation and turnover analysis
- Batch-level stock tracking (FIFO)

### Compliance & Safety

- Prescription validation workflow
- Schedule H/H1/X drug tracking
- Pharmacist assignment and shift management
- Complete audit trail

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
cd RisaCare/risa-care-pharmacy-management-service
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

The service starts on **port 4743** by default.

## API Endpoints

### Pharmacy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pharmacy` | Get pharmacy info |
| POST | `/pharmacy` | Setup new pharmacy |
| PUT | `/pharmacy` | Update pharmacy |
| POST | `/pharmacy/:id/pharmacists` | Add pharmacist |

### Medicines

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medicines` | List all medicines |
| GET | `/medicines/search?q=` | Search medicines |
| GET | `/medicines/:id` | Medicine details |
| POST | `/medicines` | Add medicine |
| PUT | `/medicines/:id` | Update medicine |
| GET | `/medicines/:id/batches` | Batch information |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/inventory/stock` | Add stock |
| GET | `/inventory/low-stock` | Low stock alerts |
| GET | `/inventory/expiring` | Expiring medicines |
| GET | `/inventory/reorder` | Reorder suggestions |
| GET | `/inventory/valuation` | Inventory valuation |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prescriptions` | Create prescription |
| GET | `/prescriptions` | List prescriptions |
| POST | `/prescriptions/validate` | Validate prescription |
| POST | `/prescriptions/:id/dispense` | Dispense medicines |
| GET | `/prescriptions/:id/history` | Dispense history |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sales` | Create sale |
| GET | `/sales` | List sales |
| GET | `/sales/daily` | Daily sales report |
| GET | `/sales/period` | Sales by date range |
| GET | `/sales/:id/invoice` | Generate invoice |
| POST | `/sales/:id/return` | Process return |

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | List suppliers |
| POST | `/suppliers` | Add supplier |
| GET | `/suppliers/:id/orders` | Supplier orders |
| POST | `/orders` | Create purchase order |

## Usage Examples

### Setup a Pharmacy

```bash
curl -X POST http://localhost:4743/pharmacy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RisaCare Central Pharmacy",
    "type": "retail",
    "address": {
      "street": "123 Health Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "licenseNumber": "MH-2024-12345",
    "contactPhone": "+91-9876543210",
    "is24Hours": false
  }'
```

### Add a Medicine

```bash
curl -X POST http://localhost:4743/medicines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paracetamol 500mg",
    "genericName": "Acetaminophen",
    "manufacturer": "Cipla",
    "category": "Analgesics",
    "dosage": "500mg",
    "form": "tablet",
    "packSize": "10 strips",
    "price": 25.00,
    "mrp": 30.00,
    "requiresPrescription": false,
    "currentStock": 500,
    "reorderLevel": 100
  }'
```

### Process a Sale

```bash
curl -X POST http://localhost:4743/sales \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Rajesh Kumar",
    "medicines": [
      { "medicineId": "MED_xxx", "quantity": 2 }
    ],
    "paymentMethod": "cash",
    "dispensedBy": "PHR_xxx"
  }'
```

## Architecture

```
risa-care-pharmacy-management-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/
│   │   └── pharmacy.ts       # TypeScript type definitions
│   ├── models/
│   │   └── pharmacy.ts       # In-memory data store
│   ├── services/
│   │   ├── pharmacyService.ts     # Pharmacy operations
│   │   ├── medicineService.ts     # Medicine catalog
│   │   ├── prescriptionService.ts # Prescription handling
│   │   ├── inventoryService.ts   # Stock management
│   │   ├── saleService.ts        # Sales processing
│   │   └── supplierService.ts    # Supplier management
│   └── routes/
│       └── pharmacyRoutes.ts     # Express routes
├── package.json
├── tsconfig.json
└── README.md
```

## Data Models

### Pharmacy
- `pharmacyId` - Unique identifier
- `name` - Pharmacy name
- `type` - retail | hospital | online
- `address` - Physical address
- `licenseNumber` - Drug license
- `pharmacists[]` - Staff list
- `operatingHours[]` - Business hours

### Medicine
- `medicineId` - Unique identifier
- `name` - Brand name
- `genericName` - Generic name
- `manufacturer` - Manufacturer
- `category` - Drug category
- `form` - tablet | capsule | syrup | injection | etc.
- `price` / `mrp` - Pricing
- `requiresPrescription` - Rx required flag
- `currentStock` / `reorderLevel` - Stock levels

### Prescription
- `prescriptionId` - Unique identifier
- `patientId` / `doctorId` - Parties
- `medicines[]` - Prescribed items
- `issuedAt` / `validUntil` - Validity period
- `status` - pending | validated | dispensed | expired

### Sale
- `saleId` - Unique identifier
- `medicines[]` - Line items
- `subtotal` / `discount` / `tax` / `total` - Totals
- `paymentMethod` - cash | card | upi | insurance
- `invoiceNumber` - Generated receipt

## Port Configuration

| Service | Port |
|---------|------|
| Pharmacy Management | 4743 |

## Integration

This service is part of the RTNM Group ecosystem and can integrate with:

- **RisaCare Healthcare Services** (port 4700-4799)
- **HOJAI AI** - For intelligent stock predictions
- **REZ Commerce** - For multi-channel sales
- **REZ-Merchant POS** - For point-of-sale sync

## License

Proprietary - RTNM Group

## Support

For technical support, contact the RisaCare development team.
