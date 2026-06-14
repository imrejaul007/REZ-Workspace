# CLAUDE.md - REZ Procurement Payment Service

## Project Overview

**Name:** REZ Procurement Payment Service  
**Purpose:** Schedule and manage supplier payments for grocery procurement  
**FreshMart Story:** 6AM - "RABTUL schedules payment for supplier delivery"  
**Location:** `companies/RABTUL-Technologies/REZ-procurement-payment/`  
**Port:** 4007

---

## FreshMart Story Context

### 6 AM - Procurement Payment

**Story:** After Nexha negotiates with suppliers:
- 1,000 Milk Packets from Dairy Agent
- 500 Dozen Eggs from Farm Agent
- 400kg Tomatoes from Wholesaler

RABTUL schedules payments:
- Advance payment for premium suppliers
- On-delivery for regular suppliers
- Net-30 for trusted suppliers

---

## Features

### Payment Scheduling
- **Advance Payment:** Pay before delivery
- **On-Delivery:** Pay on delivery day (10 AM)
- **Net-15/30/45:** Pay X days after delivery

### Payment Management
- **Auto-Scheduling:** Calculate payment dates based on terms
- **Payment Execution:** Process via RABTUL API
- **Supplier Tracking:** Monitor per-supplier payments
- **Analytics:** Payment metrics and forecasting

---

## Architecture

```
REZ-procurement-payment/
├── src/
│   ├── index.js                              # Main entry (Port 4007)
│   ├── models/
│   │   └── procurementPayment.model.js        # ScheduledPayment, PaymentTemplate
│   ├── services/
│   │   └── paymentSchedule.service.js        # Payment logic
│   └── routes/
│       └── payment.routes.js                 # API routes
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/schedule` | Create scheduled payment |
| GET | `/api/payments/due` | Get payments due for execution |
| POST | `/api/payments/:id/execute` | Execute payment |
| POST | `/api/payments/:id/delivery` | Confirm delivery |
| GET | `/api/payments/store/:storeId` | Get store payments |
| GET | `/api/payments/supplier/:supplierId` | Get supplier payments |
| GET | `/api/payments/:id` | Get payment details |
| DELETE | `/api/payments/:id` | Cancel payment |
| GET | `/api/payments/analytics/:storeId` | Get analytics |

---

## Data Models

### ScheduledPayment
```javascript
{
  payment_id: String,              // "PP-ABC123"
  procurement_id: String,
  rfq_id: String,
  order_id: String,
  supplier_id: String,
  supplier_name: String,
  supplier_account: String,
  store_id: String,
  store_name: String,
  amount: Number,                // Payment amount
  currency: String,               // "INR"
  payment_type: 'immediate' | 'scheduled' | 'on_delivery',
  scheduled_date: Date,
  expected_delivery_date: Date,
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed',
  rabtul_payment_id: String,
  rabtul_transaction_id: String,
  items: [{
    sku, name, quantity, unit_price, total
  }]
}
```

### PaymentTemplate
```javascript
{
  template_id: String,
  name: String,
  supplier_id: String,
  supplier_category: 'farm' | 'dairy' | 'wholesale' | 'distributor',
  payment_terms: {
    type: 'advance' | 'on_delivery' | 'net_15' | 'net_30' | 'net_45',
    advance_percentage: Number,
    milestone_percentage: Number
  },
  schedule_rules: {
    auto_schedule: Boolean,
    schedule_before_hours: Number,
    reminder_before_hours: Number
  }
}
```

---

## Payment Flow

```
Procurement Created
    ↓
Nexha Negotiates with Supplier
    ↓
POST /api/payments/schedule
    ↓
Payment Scheduled Based on Terms
    ↓
Delivery Confirmed
    ↓
POST /api/payments/:id/delivery
    ↓
Payment Executed via RABTUL
    ↓
Supplier Paid ✅
```

---

## Integration

### With Nexha ProcurementOS
- Receives procurement events
- Creates payment schedules

### With RABTUL Payment
- Executes payments
- Tracks transactions

### With DistributionOS
- Confirms delivery
- Triggers payment execution

---

## Development

```bash
cd REZ-procurement-payment
npm install
npm start  # Port 4007
npm run dev  # Development mode
```

---

**Last Updated:** June 13, 2026
