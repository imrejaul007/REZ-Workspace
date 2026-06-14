# Purchase Order Module

## Overview

The Purchase Order module provides end-to-end management of B2B purchase orders, including creation, approval workflows, goods receipt tracking, and payment recording. It integrates with the supplier credit system and ledger for automatic balance updates.

## Key Features

### Purchase Order Lifecycle
- **Draft Creation**: Create POs with line items, auto-calculate totals
- **Approval Workflow**: Submit for approval with full audit trail
- **Goods Receipt**: Track partial and full deliveries
- **Payment Recording**: Record payments with multiple methods
- **Status Workflow**: Full FSM validation for all transitions

### Credit Integration
- Automatic credit limit checking before PO creation
- Credit period calculation from supplier settings
- Automatic due date calculation
- Credit utilization tracking

### Financial Features
- Line item totals with tax calculation
- Discount handling
- Subtotal, tax, and total calculations
- Payment status tracking
- Partial payment support

## API Endpoints

### Purchase Order CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/purchase-orders` | List POs with filters (status, supplier, date range, store) |
| `GET` | `/purchase-orders/stats` | Dashboard statistics |
| `GET` | `/purchase-orders/overdue` | Get overdue POs |
| `GET` | `/purchase-orders/aging` | Supplier aging report |
| `GET` | `/purchase-orders/:id` | Get single PO with full details |
| `GET` | `/purchase-orders/:id/history` | Get approval history |
| `POST` | `/purchase-orders` | Create new PO |
| `PUT` | `/purchase-orders/:id` | Update PO (draft/pending_approval only) |
| `DELETE` | `/purchase-orders/:id` | Soft delete PO (draft only) |

### Workflow Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/purchase-orders/:id/submit` | Submit for approval |
| `POST` | `/purchase-orders/:id/approve` | Approve PO |
| `POST` | `/purchase-orders/:id/reject` | Reject PO with reason |
| `POST` | `/purchase-orders/:id/reopen` | Reopen rejected PO |
| `POST` | `/purchase-orders/:id/place-order` | Mark as ordered |
| `POST` | `/purchase-orders/:id/receive` | Mark items received |
| `POST` | `/purchase-orders/:id/payment` | Record payment |
| `POST` | `/purchase-orders/:id/close` | Close PO (received only) |
| `POST` | `/purchase-orders/:id/cancel` | Cancel PO |

## Status Workflow

```
                    ┌──────────────┐
                    │    DRAFT     │
                    └──────┬───────┘
                           │ submit
                           ▼
                    ┌──────────────┐
           ┌───────│PENDING_APPROVAL│───────┐
           │       └──────┬───────┘        │
           │              │ approve        │ reject
           ▼              ▼                ▼
    ┌──────────────┐ ┌──────────┐ ┌───────────┐
    │   APPROVED  │ │  ORDERED │ │ REJECTED  │
    └──────┬───────┘ └────┬─────┘ └─────┬─────┘
           │              │              │ reopen
           │              ▼              │
           │       ┌──────────┐         │
           │       │  PARTIAL │◄────────┘
           │       └────┬─────┘
           │            │ receive
           │            ▼
           │     ┌──────────────┐
           │     │   RECEIVED   │
           │     └──────┬───────┘
           │            │ close
           ▼            ▼
    ┌──────────────┐ ┌────────┐
    │   CLOSED     │ │CANCELLED│
    └──────────────┘ └────────┘
```

## Data Models

### PurchaseOrder Schema

```typescript
interface PurchaseOrder {
  _id: ObjectId;
  merchantId: ObjectId;
  supplierId: ObjectId;
  storeId?: ObjectId;
  poNumber: string;              // Auto-generated, e.g., "PO-2026-00001"
  status: POStatus;
  paymentStatus: POPaymentStatus;

  items: [{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    receivedQty: number;
    pendingQty: number;
  }];

  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;

  currency: 'INR';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  dueDate: Date;

  approvalHistory: [{
    approvedBy: ObjectId;
    approvedAt: Date;
    status: POStatus;
    previousStatus: POStatus;
    comments?: string;
  }];

  goodsReceipts: [{
    receiptId: string;
    receivedAt: Date;
    receivedBy: ObjectId;
    items: [{ sku: string; receivedQty: number; condition: string }];
    notes?: string;
  }];

  paymentRecords: [{
    paymentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    paidAt: Date;
    recordedBy: ObjectId;
  }];

  shippingAddress?: Address;
  referenceNumber?: string;
  source: 'manual' | 'reorder' | 'import' | 'api';

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### PO Status Enum

```typescript
enum POStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  PARTIAL = 'partial',
  RECEIVED = 'received',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

enum POPaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid'
}
```

## Request/Response Examples

### Create Purchase Order

**Request:**
```json
POST /purchase-orders
{
  "supplierId": "507f1f77bcf86cd799439011",
  "storeId": "507f1f77bcf86cd799439012",
  "items": [
    {
      "productName": "Office Chairs",
      "sku": "FURN-CHAIR-001",
      "quantity": 10,
      "unitPrice": 5000,
      "discount": 500,
      "taxRate": 18
    }
  ],
  "notes": "Urgent delivery required"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase order created",
  "data": {
    "_id": "...",
    "poNumber": "PO-2026-00001",
    "status": "draft",
    "dueDate": "2026-06-11T00:00:00.000Z",
    "totalAmount": 56000,
    "items": [...]
  }
}
```

### Record Goods Receipt

**Request:**
```json
POST /purchase-orders/:id/receive
{
  "items": [
    { "sku": "FURN-CHAIR-001", "receivedQty": 8, "condition": "good" }
  ],
  "receivedBy": "507f1f77bcf86cd799439013",
  "notes": "2 items damaged in transit"
}
```

### Record Payment

**Request:**
```json
POST /purchase-orders/:id/payment
{
  "amount": 28000,
  "paymentMethod": "bank_transfer",
  "reference": "TXN123456",
  "recordedBy": "507f1f77bcf86cd799439013"
}
```

## Configuration Requirements

### Status Transition Validation

All status transitions are validated against the FSM in `config/purchaseOrderTransitions.ts`:

```typescript
const VALID_TRANSITIONS: Record<POStatus, POStatus[]> = {
  [POStatus.DRAFT]: [POStatus.PENDING_APPROVAL],
  [POStatus.PENDING_APPROVAL]: [POStatus.APPROVED, POStatus.REJECTED],
  [POStatus.APPROVED]: [POStatus.ORDERED],
  [POStatus.ORDERED]: [POStatus.PARTIAL, POStatus.RECEIVED, POStatus.CANCELLED],
  [POStatus.PARTIAL]: [POStatus.PARTIAL, POStatus.RECEIVED, POStatus.CANCELLED],
  [POStatus.REJECTED]: [POStatus.DRAFT],
  // RECEIVED, CLOSED, CANCELLED are terminal states
};
```

### Credit Line Integration

- Credit limit checked before PO creation
- Auto-calculate due date from supplier's `creditPeriodDays`
- If supplier has no credit line, allow PO creation without credit check

## Error Handling

### Validation Errors

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| PO not found | 404 | Invalid PO ID or deleted |
| Cannot update | 400 | PO not in draft/pending_approval |
| Cannot delete | 400 | PO not in draft status |
| Credit limit exceeded | 400 | Total would exceed supplier's limit |
| Invalid transition | 400 | Status transition not allowed |
| Reason required | 400 | Rejection/cancellation needs reason |

### Business Rule Errors

- Only draft POs can be deleted
- Only draft/pending_approval POs can be edited
- Only rejected POs can be reopened
- Only received POs can be closed
- Payment amount cannot exceed outstanding balance

## Dashboard Stats

The `/purchase-orders/stats` endpoint returns:

```json
{
  "totalPOs": 150,
  "draftPOs": 5,
  "pendingApproval": 3,
  "approvedPOs": 10,
  "receivedPOs": 50,
  "totalValue": 5000000,
  "paidValue": 3000000,
  "outstandingValue": 2000000,
  "overduePOs": 8,
  "overdueAmount": 500000
}
```

## Related Modules

| Module | Integration |
|--------|-------------|
| Suppliers | Supplier lookup, credit period, credit limit |
| Credit Lines | Credit checking, balance updates |
| Supplier Ledger | Transaction recording, balance tracking |
| RFQ | Award creates draft PO |
| WhatsApp | PO notifications to suppliers |
| Dunning | Overdue PO tracking |
| Tally Sync | Export for accounting |

## File Structure

```
src/routes/
  purchaseOrders.ts           # Purchase order routes

src/models/
  PurchaseOrder.ts          # PO Mongoose model

src/services/
  purchaseOrderService.ts   # PO business logic

src/config/
  purchaseOrderTransitions.ts # Status FSM validation

src/schemas/
  b2b.ts                    # Zod validation schemas
```
