# Supplier Management Module

## Overview

The Supplier Management module provides comprehensive CRUD operations and ledger queries for managing B2B suppliers in the ReZ Merchant platform. It integrates with the supplier ledger system to track credit usage, payment history, and aging reports.

## Key Features

### Supplier Management
- **Full CRUD Operations**: Create, read, update, and soft-delete suppliers
- **Status Workflow**: Pending -> Approved -> Blocked with transition validation
- **Credit Management**: Set and adjust credit limits with validation
- **Tag-based Organization**: Categorize suppliers with custom tags
- **Duplicate Prevention**: GST and PAN validation to prevent duplicates

### Ledger Integration
- Real-time balance tracking per supplier
- Aging reports with overdue categorization
- Transaction history with filtering
- CSV export for accounting reconciliation
- Unallocated entries tracking

### Supplier Statistics
- Credit utilization metrics
- Aging breakdown (0-30, 31-60, 61-90, 90+ days)
- Outstanding balance tracking
- Supplier performance stats

## API Endpoints

### Supplier CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/suppliers` | List suppliers with pagination, search, and filters |
| `GET` | `/suppliers/stats` | Get supplier statistics |
| `GET` | `/suppliers/tags` | Get all unique supplier tags |
| `GET` | `/suppliers/:id` | Get single supplier with credit available |
| `POST` | `/suppliers` | Create new supplier |
| `PUT` | `/suppliers/:id` | Update supplier |
| `DELETE` | `/suppliers/:id` | Soft delete supplier (only if no active POs) |
| `POST` | `/suppliers/:id/restore` | Restore soft-deleted supplier |

### Credit Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/suppliers/:id/credit-summary` | Get credit utilization summary |
| `GET` | `/suppliers/:id/aging` | Get aging report for supplier |
| `PATCH` | `/suppliers/:id/credit` | Adjust credit limit or used amount |
| `PATCH` | `/suppliers/:id/status` | Update supplier status |

### Ledger Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/supplier-ledger` | List ledger entries with filters |
| `GET` | `/supplier-ledger/:supplierId/balance` | Get current balance |
| `GET` | `/supplier-ledger/:supplierId/aging` | Get aging report |
| `GET` | `/supplier-ledger/:supplierId/export` | Export ledger as CSV/JSON |
| `POST` | `/supplier-ledger` | Create manual ledger entry |
| `GET` | `/supplier-ledger/:supplierId/transactions` | Get transactions for period |
| `GET` | `/supplier-ledger/:supplierId/unallocated` | Get unallocated entries |
| `GET` | `/supplier-ledger/:supplierId/verify` | Verify ledger integrity |
| `GET` | `/supplier-ledger/aging/summary` | Get aging summary for all suppliers |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/suppliers/:id/products` | Get products from supplier |

## Data Models

### Supplier Schema

```typescript
interface Supplier {
  _id: ObjectId;
  merchantId: ObjectId;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: Address;
  gstNumber?: string;        // Validated format: 27AABCU9603R1ZM
  pan?: string;              // Validated format: AABCU9603R
  creditLimit: number;
  creditUsed: number;
  creditPeriodDays: number;
  dueDatePreference: DueDatePreference;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  isActive: boolean;
  status: SupplierStatus;     // pending | approved | rejected | blocked
  tags: string[];
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### SupplierLedger Schema

```typescript
interface SupplierLedger {
  _id: ObjectId;
  merchantId: ObjectId;
  supplierId: ObjectId;
  entryType: 'debit' | 'credit';
  amount: number;
  balance: number;
  reference: string;
  referenceNumber?: string;
  description: string;
  dueDate?: Date;
  isOverdue: boolean;
  daysOverdue: number;
  unallocatedAmount: number;
  allocatedAmount: number;
  metadata: {
    isManualEntry: boolean;
    createdBy?: string;
  };
  createdAt: Date;
}
```

## Status Workflow

```
pending ──┬── approved ──── blocked
          │
          └── rejected ──── pending
                │
                └── blocked
```

### Status Transition Rules

| Current Status | Allowed Transitions |
|----------------|---------------------|
| pending | approved, rejected |
| approved | blocked |
| rejected | pending, blocked |
| blocked | approved, pending |

## Configuration Requirements

### Environment Variables

```bash
# Required
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}
JWT_SECRET=<secret>
REDIS_URL=redis://localhost:6379
MONGODB_URI=<connection-string>
```

### Allowed Fields for Create/Update

```typescript
const SUPPLIER_ALLOWED_FIELDS = [
  'name', 'contactPerson', 'email', 'phone', 'address',
  'gstNumber', 'pan', 'creditLimit', 'creditUsed', 'creditPeriodDays',
  'dueDatePreference', 'specificDayOfMonth',
  'bankName', 'accountNumber', 'ifscCode', 'accountHolderName',
  'isActive', 'status', 'tags', 'notes', 'metadata'
];
```

## Error Handling

### Validation Errors
- GST/PAN format validation with regex
- Credit limit cannot be reduced below current usage
- Duplicate GST/PAN detection per merchant
- Required field validation (name required)

### Business Rule Errors
- Cannot delete supplier with active purchase orders
- Status transitions validated against allowed transitions
- Credit limit changes validated against usage

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 404 | Supplier not found |
| 409 | Duplicate conflict |
| 500 | Internal server error |

## Related Modules

| Module | File | Integration |
|--------|------|-------------|
| Purchase Orders | `purchaseOrders.ts` | Suppliers referenced in POs |
| Credit Lines | `creditLines.ts` | Credit limits and utilization |
| Supplier Ledger | `supplierLedger.ts` | Transaction history and aging |
| Dunning | `dunningRoutes.ts` | Overdue supplier reminders |
| WhatsApp | `whatsappRoutes.ts` | Supplier notifications |

## File Structure

```
src/routes/
  suppliers.ts           # Main supplier routes
  supplierLedger.ts      # Ledger query routes

src/models/
  Supplier.ts           # Supplier Mongoose model
  SupplierLedger.ts     # Ledger Mongoose model

src/services/
  supplierService.ts    # Supplier business logic
  creditLineService.ts # Credit line operations

src/middleware/
  validateSupplier.ts   # Supplier validation middleware

src/config/
  b2b.ts              # B2B configuration
```

## Usage Examples

### Create Supplier

```bash
curl -X POST /suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Supplies",
    "phone": "9876543210",
    "email": "contact@abcsupplies.com",
    "gstNumber": "27AABCU9603R1ZM",
    "creditLimit": 100000,
    "creditPeriodDays": 30
  }'
```

### Get Supplier with Credit Summary

```bash
curl /suppliers/:id/credit-summary
```

### Export Ledger

```bash
curl /supplier-ledger/:supplierId/export?format=csv&startDate=2026-01-01&endDate=2026-03-31
```
