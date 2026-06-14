# RFQ (Request for Quotation) Module

## Overview

The RFQ module enables merchants to create requests for quotations, invite suppliers, collect and compare quotes, and award contracts. It streamlines the procurement process by centralizing supplier communication and quote management.

## Key Features

### RFQ Lifecycle Management
- **Draft Creation**: Create RFQs with line items and specifications
- **Supplier Invitation**: Invite specific suppliers or make public
- **Quote Collection**: Suppliers submit quotes with pricing
- **Quote Comparison**: Side-by-side comparison of all quotes
- **Award Process**: Select winning quote and create draft PO

### Supplier Communication
- Invite multiple suppliers to a single RFQ
- Track invitation status
- Track quote submission status
- Auto-notify on RFQ status changes

### Quote Analysis
- Side-by-side quote comparison
- Best quote identification
- Price breakdown by item
- Lead time comparison
- Payment terms comparison

## API Endpoints

### RFQ CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rfqs` | List RFQs with filters |
| `GET` | `/rfqs/stats` | Get RFQ statistics |
| `GET` | `/rfqs/:id` | Get RFQ with quotes count |
| `POST` | `/rfqs` | Create new RFQ |
| `PUT` | `/rfqs/:id` | Update RFQ (draft only) |
| `DELETE` | `/rfqs/:id` | Soft delete RFQ (draft only) |

### RFQ Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/rfqs/:id/open` | Open RFQ for quotes (draft -> open) |
| `POST` | `/rfqs/:id/close` | Close RFQ for new quotes (open -> closed) |
| `POST` | `/rfqs/:id/cancel` | Cancel RFQ |

### Supplier Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/rfqs/:id/invite` | Invite suppliers to RFQ |

### Quote Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rfqs/:id/quotes` | List all quotes for RFQ |
| `GET` | `/rfqs/:id/quotes/best` | Get best (lowest) quote |
| `GET` | `/rfqs/:id/quotes/compare` | Compare quotes side-by-side |
| `POST` | `/rfqs/:id/award/:quoteId` | Award to supplier and create PO |

## RFQ Status Workflow

```
DRAFT ──open──> OPEN ──close──> CLOSED ──award──> AWARDED
  │              │                             │
  │              └──cancel                      │
  └──delete──> CANCELLED                       │
                                              (PO created)
```

## Data Models

### RFQ Schema

```typescript
interface RFQ {
  _id: ObjectId;
  merchantId: ObjectId;
  storeId?: ObjectId;
  rfqNumber: string;           // Auto-generated, e.g., "RFQ-2026-00001"
  status: RFQStatus;

  title: string;
  description?: string;
  category: 'raw_materials' | 'equipment' | 'services' | 'packaging' | 'logistics' | 'other';

  items: [{
    itemName: string;
    description?: string;
    quantity: number;
    unit: string;
    specifications?: Record<string, unknown>;
  }];

  invitedSupplierIds: ObjectId[];
  respondingSupplierIds: ObjectId[];

  requiredByDate?: Date;
  isPublic: boolean;

  notes?: string;
  awardedSupplierId?: ObjectId;
  awardedQuoteId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

enum RFQStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  AWARDED = 'awarded',
  CANCELLED = 'cancelled'
}
```

### Quote Schema

```typescript
interface Quote {
  _id: ObjectId;
  merchantId: ObjectId;
  rfqId: ObjectId;
  supplierId: ObjectId;
  quoteNumber: string;

  status: QuoteStatus;

  items: [{
    itemName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    leadTimeDays?: number;
    remarks?: string;
  }];

  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;

  currency: 'INR';
  validityDays: number;
  validUntil: Date;

  paymentTerms?: string;
  deliveryPeriodDays?: number;
  warrantyTerms?: string;

  notes?: string;

  revisionCount: number;
  submittedAt: Date;
  revisedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

enum QuoteStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVISED = 'revised',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}
```

## Request/Response Examples

### Create RFQ

**Request:**
```json
POST /rfqs
{
  "title": "Office Furniture Supply",
  "description": "Annual supply contract for office furniture",
  "category": "raw_materials",
  "items": [
    {
      "itemName": "Executive Chair",
      "quantity": 50,
      "unit": "pieces",
      "specifications": { "material": "leather", "color": "black" }
    },
    {
      "itemName": "Standing Desk",
      "quantity": 30,
      "unit": "pieces"
    }
  ],
  "requiredByDate": "2026-06-30T00:00:00.000Z",
  "isPublic": false,
  "invitedSuppliers": ["supplier-id-1", "supplier-id-2"],
  "notes": "Quality certification required"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFQ created successfully",
  "data": {
    "_id": "...",
    "rfqNumber": "RFQ-2026-00001",
    "status": "draft",
    "title": "Office Furniture Supply"
  }
}
```

### Compare Quotes

**Response:**
```json
GET /rfqs/:id/quotes/compare

{
  "success": true,
  "data": {
    "quotes": [
      {
        "quoteId": "...",
        "supplierId": "...",
        "supplierName": "ABC Supplies",
        "totalAmount": 450000,
        "deliveryPeriodDays": 15,
        "paymentTerms": "Net 30",
        "isLowest": true,
        "items": [...]
      },
      {
        "quoteId": "...",
        "supplierId": "...",
        "supplierName": "XYZ Furniture",
        "totalAmount": 480000,
        "deliveryPeriodDays": 10,
        "paymentTerms": "Net 45",
        "isLowest": false,
        "items": [...]
      }
    ],
    "summary": {
      "totalQuotes": 2,
      "lowestQuote": 450000,
      "highestQuote": 480000,
      "avgQuote": 465000
    }
  }
}
```

### Award RFQ

**Response:**
```json
POST /rfqs/:id/award/:quoteId

{
  "success": true,
  "message": "RFQ awarded and draft purchase order created",
  "data": {
    "rfq": {
      "_id": "...",
      "rfqNumber": "RFQ-2026-00001",
      "status": "awarded",
      "awardedSupplierId": "...",
      "awardedQuoteId": "..."
    },
    "purchaseOrder": {
      "_id": "...",
      "poNumber": "PO-2026-00002",
      "status": "draft",
      "totalAmount": 450000
    }
  }
}
```

## RFQ Statistics

The `/rfqs/stats` endpoint returns:

```json
{
  "totalRFQs": 50,
  "draftRFQs": 5,
  "openRFQs": 10,
  "closedRFQs": 30,
  "awardedRFQs": 25,
  "cancelledRFQs": 5,
  "totalValue": 5000000,
  "avgQuoteCount": 3.2,
  "awardRate": 0.85
}
```

## Configuration Requirements

### RFQ Categories

```typescript
type RFQCategory =
  | 'raw_materials'   // Raw materials and commodities
  | 'equipment'       // Equipment and machinery
  | 'services'        // Professional services
  | 'packaging'       // Packaging materials
  | 'logistics'       // Transportation and logistics
  | 'other';          // Other procurement
```

### Quote Comparison Logic

- Quotes sorted by total amount (ascending)
- Best quote identified as lowest total amount
- Items matched by RFQ line item ID
- Lead time and payment terms included in comparison

## Error Handling

### Validation Errors

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| RFQ not found | 404 | Invalid RFQ ID |
| Cannot edit | 400 | Only draft RFQs can be edited |
| Cannot delete | 400 | Only draft RFQs can be deleted |
| Cannot open | 400 | Only draft RFQs with items can be opened |
| Cannot close | 400 | Only open RFQs can be closed |
| Quote not found | 404 | Invalid quote ID |
| Cannot award | 400 | RFQ must be closed before award |

### Business Rules

- RFQ must have at least one item before opening
- RFQ must be in CLOSED status before awarding
- Awarding creates a draft PO, not a finalized PO
- Quote must be in SUBMITTED status to be awarded

## Related Modules

| Module | Integration |
|--------|-------------|
| Suppliers | Invited suppliers, awarded supplier |
| Purchase Orders | Award creates draft PO |
| Credit Lines | Supplier credit checking for PO |
| WhatsApp | Supplier notification on RFQ events |

## File Structure

```
src/routes/
  rfq.ts                 # RFQ routes
  quotes.ts              # Quote routes

src/models/
  RFQ.ts               # RFQ Mongoose model
  Quote.ts             # Quote Mongoose model

src/services/
  rfqService.ts        # RFQ business logic
  quoteService.ts      # Quote business logic

src/schemas/
  b2b.ts              # Zod validation schemas
```

## Usage Workflow

1. **Create RFQ**: Create with items, description, requirements
2. **Invite Suppliers**: Add suppliers to receive the RFQ
3. **Open RFQ**: Make RFQ visible and accept quotes
4. **Collect Quotes**: Suppliers submit their quotes
5. **Close RFQ**: Stop accepting new quotes
6. **Compare**: View all quotes side-by-side
7. **Award**: Select winning quote, create draft PO
8. **Process PO**: Approve and fulfill the PO
