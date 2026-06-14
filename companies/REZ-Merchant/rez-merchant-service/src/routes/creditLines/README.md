# Credit Line Module (BNPL)

## Overview

The Credit Line module provides Buy Now, Pay Later (BNPL) functionality for B2B suppliers. It manages supplier credit limits, tracks utilization, handles interest calculations, and supports FIFO-based payment allocation.

## Key Features

### Credit Line Management
- **Credit Limit Control**: Set and adjust credit limits per supplier
- **Utilization Tracking**: Real-time credit usage monitoring
- **Status Management**: Active, suspended, and closed states
- **Interest Calculation**: Automatic interest on overdue amounts

### Payment Features
- **FIFO Allocation**: Automatic allocation to oldest due entries
- **Multi-method Payments**: Bank transfer, UPI, NEFT, RTGS, cash
- **Statement Generation**: Supplier statements for any period
- **Credit Notes**: Support for adjustments and credit notes

### Integration
- **Supplier Ledger**: Automatic ledger entry creation
- **Purchase Orders**: Credit checking before PO creation
- **Reconciliation**: Payment matching and allocation

## API Endpoints

### Credit Line CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credit-lines` | List all credit lines with pagination |
| `GET` | `/credit-lines/:id` | Get credit line with balance and aging |
| `POST` | `/credit-lines` | Create new credit line |
| `PUT` | `/credit-lines/:id` | Update credit line settings |
| `POST` | `/credit-lines/:id/suspend` | Suspend credit line |
| `POST` | `/credit-lines/:id/reactivate` | Reactivate suspended line |
| `POST` | `/credit-lines/:id/close` | Close credit line |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/credit-lines/:id/payment` | Record payment with auto-allocation |
| `GET` | `/credit-lines/:id/transactions` | Get ledger entries |

### Supplier Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credit-lines/supplier/:supplierId` | Get credit line by supplier |

### Interest Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/credit-lines/:id/interest/calculate` | Preview interest calculation |
| `POST` | `/credit-lines/:id/interest/apply` | Apply calculated interest |

### Aging & Statements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credit-lines/:id/aging` | Get aging report |
| `GET` | `/credit-lines/:id/statement` | Get supplier statement |

## Credit Line Status Workflow

```
ACTIVE ────suspend───> SUSPENDED ───reactivate───> ACTIVE
  │
  └──close───> CLOSED
```

## Data Models

### CreditLine Schema

```typescript
interface CreditLine {
  _id: ObjectId;
  merchantId: ObjectId;
  supplierId: ObjectId;

  creditLimit: number;         // Maximum credit allowed
  usedAmount: number;         // Current outstanding
  availableCredit: number;    // creditLimit - usedAmount

  creditPeriodDays: number;    // Days to payment due
  interestRate: number;       // Monthly interest rate (%)
  interestGraceDays: number;  // Days before interest accrues
  minPaymentPercent: number;   // Minimum payment required (%)

  status: CreditLineStatus;

  activatedAt?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;
  closedAt?: Date;
  closeReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

enum CreditLineStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed'
}
```

### SupplierLedger Entry

```typescript
interface SupplierLedger {
  _id: ObjectId;
  merchantId: ObjectId;
  supplierId: ObjectId;

  entryType: 'debit' | 'credit';
  amount: number;
  balance: number;

  reference: string;           // 'po' | 'payment' | 'credit_note' | 'adjustment' | 'interest'
  referenceNumber?: string;

  description: string;
  dueDate?: Date;

  isOverdue: boolean;
  daysOverdue: number;

  unallocatedAmount: number;   // For debit entries
  allocatedAmount: number;     // For credit entries

  metadata: {
    isManualEntry: boolean;
    createdBy?: string;
  };

  createdAt: Date;
}
```

## Request/Response Examples

### Create Credit Line

**Request:**
```json
POST /credit-lines
{
  "supplierId": "507f1f77bcf86cd799439011",
  "creditLimit": 500000,
  "creditPeriodDays": 30,
  "interestRate": 2.5,
  "interestGraceDays": 7,
  "minPaymentPercent": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credit line created",
  "data": {
    "_id": "...",
    "supplierId": "...",
    "creditLimit": 500000,
    "usedAmount": 0,
    "availableCredit": 500000,
    "status": "active"
  }
}
```

### Record Payment with Auto-Allocation

**Request:**
```json
POST /credit-lines/:id/payment
{
  "amount": 50000,
  "reference": "TXN-123456789",
  "method": "bank_transfer",
  "notes": "Payment for invoice #INV-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded",
  "data": {
    "paymentId": "...",
    "amount": 50000,
    "reference": "TXN-123456789",
    "allocations": [
      {
        "entryId": "...",
        "referenceNumber": "PO-2026-00001",
        "amount": 30000,
        "allocatedFrom": 30000
      },
      {
        "entryId": "...",
        "referenceNumber": "PO-2026-00002",
        "amount": 20000,
        "allocatedFrom": 20000
      }
    ],
    "remainingAmount": 0,
    "newBalance": 45000
  }
}
```

### Get Supplier Statement

**Request:**
```json
GET /credit-lines/:id/statement?startDate=2026-01-01&endDate=2026-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supplierId": "...",
    "supplierName": "ABC Supplies",
    "period": {
      "start": "2026-01-01",
      "end": "2026-03-31"
    },
    "openingBalance": 100000,
    "debits": 250000,
    "credits": 200000,
    "closingBalance": 150000,
    "transactions": [
      {
        "date": "2026-01-15",
        "type": "debit",
        "reference": "PO",
        "referenceNumber": "PO-2026-00001",
        "amount": 50000,
        "balance": 150000
      }
    ],
    "interestCharged": 2500,
    "overdueSummary": {
      "current": 100000,
      "overdue1to30": 30000,
      "overdue31to60": 20000,
      "overdue61plus": 0
    }
  }
}
```

## Payment Allocation (FIFO)

Payments are allocated to the oldest debit entries first:

1. Get all unreconciled debit entries for supplier (oldest first)
2. Sort by `dueDate` ascending
3. For each entry, allocate from payment amount
4. Update `unallocatedAmount` and `allocatedAmount`
5. Continue until payment fully allocated

### Allocation Rules

```typescript
// FIFO Allocation Algorithm
async function allocatePayment(supplierId, paymentAmount) {
  const entries = await SupplierLedger.find({
    supplierId,
    entryType: 'debit',
    unallocatedAmount: { $gt: 0 }
  }).sort({ dueDate: 1 });

  let remaining = paymentAmount;
  const allocations = [];

  for (const entry of entries) {
    if (remaining <= 0) break;

    const toAllocate = Math.min(remaining, entry.unallocatedAmount);
    entry.allocatedAmount += toAllocate;
    entry.unallocatedAmount -= toAllocate;
    await entry.save();

    allocations.push({ entryId: entry._id, amount: toAllocate });
    remaining -= toAllocate;
  }

  return { allocations, remaining };
}
```

## Interest Calculation

Interest is calculated on overdue amounts:

```typescript
interface InterestCalculation {
  entryId: ObjectId;
  referenceNumber: string;
  principalAmount: number;
  overdueDays: number;
  interestRate: number;
  interestAmount: number;
}
```

### Calculation Formula

```
Interest = Principal × (InterestRate / 30) × OverdueDays
```

After grace period, interest accrues daily on outstanding balance.

## Configuration Requirements

### Credit Line Defaults

```typescript
const CREDIT_LINE_DEFAULTS = {
  creditPeriodDays: 30,      // Net 30
  interestRate: 2.0,         // 2% per month
  interestGraceDays: 7,      // 7 day grace period
  minPaymentPercent: 25       // Minimum 25% payment
};
```

### Maximum Values

```typescript
const CREDIT_LINE_LIMITS = {
  maxCreditLimit: 999999999,    // 999 million
  maxInterestRate: 10,          // 10% per month
  maxGraceDays: 30,
  maxCreditPeriodDays: 365
};
```

## Error Handling

### Validation Errors

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| Credit line not found | 404 | Invalid credit line ID |
| Already exists | 409 | Credit line for supplier exists |
| Limit too high | 400 | Exceeds maximum credit limit |
| Cannot decrease below usage | 400 | New limit below current usage |
| Cannot suspend closed | 400 | Cannot suspend closed line |
| Outstanding balance | 400 | Cannot close with balance |

### Business Rules

- Only one credit line per supplier per merchant
- Credit limit cannot be reduced below used amount
- Cannot close credit line with outstanding balance
- Suspended lines cannot receive new credit
- Closed lines cannot be reactivated (create new instead)

## Aging Report Structure

```json
{
  "supplierId": "...",
  "supplierName": "ABC Supplies",
  "reportDate": "2026-05-12",
  "creditLine": {
    "creditLimit": 500000,
    "usedAmount": 150000,
    "availableCredit": 350000,
    "utilizationPercent": 30
  },
  "aging": {
    "current": 80000,           // Not yet due
    "overdue1to30": 40000,     // 1-30 days overdue
    "overdue31to60": 20000,    // 31-60 days overdue
    "overdue61to90": 10000,    // 61-90 days overdue
    "overdue90plus": 0         // 90+ days overdue
  },
  "totalOutstanding": 150000,
  "averageDaysOverdue": 15,
  "entries": [
    {
      "entryId": "...",
      "referenceNumber": "PO-2026-00001",
      "dueDate": "2026-04-15",
      "amount": 50000,
      "daysOverdue": 27,
      "bucket": "overdue1to30"
    }
  ]
}
```

## Related Modules

| Module | Integration |
|--------|-------------|
| Suppliers | Credit lines tied to suppliers |
| Purchase Orders | Credit checking, ledger entries |
| Supplier Ledger | Transaction recording, balance tracking |
| Reconciliation | Payment matching |
| Dunning | Overdue interest calculation |

## File Structure

```
src/routes/
  creditLines.ts           # Credit line routes

src/models/
  CreditLine.ts           # Credit line Mongoose model
  SupplierLedger.ts       # Ledger Mongoose model

src/services/
  creditLineService.ts    # Credit line business logic

src/schemas/
  b2b.ts                # Zod validation schemas
```
