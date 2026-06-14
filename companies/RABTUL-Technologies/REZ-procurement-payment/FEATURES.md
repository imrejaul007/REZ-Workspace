# FEATURES.md - REZ Procurement Payment Service

**Last Updated:** June 13, 2026  
**FreshMart Story:** 6AM - "RABTUL schedules payment for supplier delivery"

---

## Overview

The Procurement Payment Service schedules and manages supplier payments for grocery procurement, integrating with RABTUL's payment infrastructure.

---

## Features

### 1. Payment Types

| Type | Description | Use Case |
|------|-------------|---------|
| Advance | Pay before delivery | Premium/urgent suppliers |
| On-Delivery | Pay on delivery day | Regular suppliers |
| Net-15 | Pay 15 days after | Standard terms |
| Net-30 | Pay 30 days after | Bulk orders |
| Net-45 | Pay 45 days after | Trusted suppliers |
| Milestone | Pay at milestones | Large orders |

### 2. Payment Lifecycle

```
PENDING → SCHEDULED → PROCESSING → COMPLETED
                     ↓
                   FAILED → CANCELLED
```

### 3. Payment Templates

| Template | Supplier Type | Default Terms |
|----------|-------------|-------------|
| Farm Agent | Farm | Net-15 |
| Dairy Agent | Dairy | On-Delivery |
| Wholesaler | Wholesale | Net-30 |
| Distributor | Distributor | Net-45 |

### 4. Auto-Scheduling Rules

| Payment Type | Schedule Calculation |
|--------------|-------------------|
| Advance | Delivery Date - 24 hours |
| On-Delivery | Delivery Date, 10:00 AM |
| Net-15 | Delivery Date + 15 days |
| Net-30 | Delivery Date + 30 days |
| Net-45 | Delivery Date + 45 days |

---

## API Endpoints

### Create Scheduled Payment
```bash
POST /api/payments/schedule
{
  "procurement_id": "PROC-ABC123",
  "rfq_id": "RFQ-ABC123",
  "supplier_id": "dairy-agent-001",
  "supplier_name": "Fresh Dairy Co",
  "store_id": "freshmart-hsr",
  "store_name": "FreshMart",
  "amount": 45000,
  "payment_type": "on_delivery",
  "expected_delivery_date": "2026-06-14",
  "items": [
    { "sku": "milk-001", "name": "Milk", "quantity": 1000, "unit_price": 45 }
  ]
}
```

### Get Payments Due
```bash
GET /api/payments/due
```

### Execute Payment
```bash
POST /api/payments/PP-ABC123/execute
```

### Confirm Delivery
```bash
POST /api/payments/PP-ABC123/delivery
{ "deliveryDate": "2026-06-14T10:30:00Z" }
```

---

## Data Models

### ScheduledPayment
```javascript
{
  payment_id: "PP-ABC123",
  procurement_id: "PROC-ABC123",
  rfq_id: "RFQ-ABC123",
  supplier_id: "dairy-agent-001",
  supplier_name: "Fresh Dairy Co",
  store_id: "freshmart-hsr",
  amount: 45000,
  currency: "INR",
  payment_type: "on_delivery",
  scheduled_date: "2026-06-14T10:00:00Z",
  expected_delivery_date: "2026-06-14T08:00:00Z",
  status: "scheduled",
  rabtul_payment_id: null,
  rabtul_transaction_id: null,
  items: [...]
}
```

### PaymentTemplate
```javascript
{
  template_id: "TPL-DAIRY",
  name: "Dairy Supplier Terms",
  supplier_category: "dairy",
  payment_terms: {
    type: "on_delivery",
    advance_percentage: 0,
    milestone_percentage: 100
  },
  schedule_rules: {
    auto_schedule: true,
    schedule_before_hours: 24,
    reminder_before_hours: 4
  }
}
```

---

## FreshMart 6AM Flow

```
6:00 AM - Procurement Triggered
    ↓
Nexha Negotiates with Suppliers
    ↓
Contracts Signed
    ↓
POST /api/payments/schedule
Body: {
  procurement_id: "PROC-001",
  supplier_id: "dairy-agent-001",
  amount: 45000,
  payment_type: "on_delivery",
  delivery_date: "2026-06-14"
}
    ↓
Payment Scheduled for Delivery Day (10 AM)
    ↓
Delivery at 8 AM
    ↓
POST /api/payments/:id/delivery
    ↓
RABTUL Executes Payment ✅
    ↓
Supplier Paid ₹45,000 ✅
```

---

## Integration

### With Nexha ProcurementOS
- Receives procurement events
- Creates payment schedules
- Confirms delivery

### With RABTUL Payment
- Executes payments
- Tracks transactions
- Manages escrow

### With DistributionOS
- Receives delivery updates
- Triggers payment execution

---

## Analytics

### Get Store Analytics
```bash
GET /api/payments/analytics/freshmart-hsr?startDate=2026-06-01&endDate=2026-06-30
```

### Response
```json
{
  "success": true,
  "storeId": "freshmart-hsr",
  "analytics": {
    "totalPayments": 45,
    "totalAmount": 2340000,
    "completedPayments": 42,
    "byStatus": [
      { "_id": "completed", "count": 42, "amount": 2200000 },
      { "_id": "scheduled", "count": 3, "amount": 140000 }
    ],
    "upcomingPayments": 3,
    "pendingAmount": 140000
  }
}
```

---

**Last Updated:** June 13, 2026
