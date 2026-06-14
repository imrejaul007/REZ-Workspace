# ReZ Merchant B2B Platform API Documentation

**Version:** 1.0.0
**Base URL:** `/api/b2b`
**Authentication:** Bearer Token (JWT) via `Authorization` header

---

## Table of Contents

1. [Suppliers API](#1-suppliers-api)
2. [Purchase Orders API](#2-purchase-orders-api)
3. [RFQ API](#3-rfq-api)
4. [Quotes API](#4-quotes-api)
5. [Credit Lines API](#5-credit-lines-api)
6. [Reconciliation API](#6-reconciliation-api)
7. [WhatsApp API](#7-whatsapp-api)
8. [Tally Sync API](#8-tally-sync-api)
9. [Dunning API](#9-dunning-api)

---

## Common Types

### Address
```typescript
{
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;         // ISO 3166-1 alpha-2, default: "India"
  formatted?: string;
  latitude?: number;
  longitude?: number;
}
```

### BankDetails
```typescript
{
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  accountNumber?: string;   // Encrypted at rest
  ifscCode?: string;        // Format: ABAB0XXXXXXX
  swiftCode?: string;
  accountType?: "savings" | "current";
  upiId?: string;
}
```

### ContactInfo
```typescript
{
  name?: string;
  email?: string;
  mobile?: string;
  designation?: string;
  department?: string;
}
```

### Attachment
```typescript
{
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;            // Bytes
  type: AttachmentType;
  uploadedAt: Date;
  uploadedBy?: string;
}
```

### Enums

| Enum | Values |
|------|--------|
| **SupplierStatus** | `pending`, `approved`, `rejected`, `blocked` |
| **POStatus** | `draft`, `pending_approval`, `approved`, `rejected`, `ordered`, `partial_received`, `received`, `cancelled`, `closed` |
| **PaymentStatus** | `unpaid`, `partial`, `paid` |
| **RFQStatus** | `draft`, `open`, `closed`, `awarded`, `cancelled` |
| **QuoteStatus** | `submitted`, `revised`, `accepted`, `rejected`, `withdrawn` |
| **CreditLineStatus** | `active`, `suspended`, `closed` |
| **PaymentMode** | `bank_transfer`, `cash`, `cheque`, `upi`, `neft`, `rtgs`, `credit`, `cod`, `mixed` |
| **DunningChannel** | `whatsapp`, `sms`, `email`, `all` |
| **DunningPriority** | `low`, `medium`, `high`, `critical` |
| **GstTaxRate** | `0`, `5`, `12`, `18`, `28` |

---

## 1. Suppliers API

Manage supplier/vendor relationships.

### GET /api/b2b/suppliers

List all suppliers with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by name, email, phone |
| `status` | SupplierStatus | - | Filter by status |
| `isActive` | boolean | - | Filter active/inactive |
| `tags` | string | - | Comma-separated tags |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max: 100) |
| `sort` | string | createdAt | Sort field |
| `order` | `asc` \| `desc` | desc | Sort direction |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "ABC Supplies Pvt Ltd",
      "phone": "9876543210",
      "email": "contact@abcsupplies.com",
      "status": "approved",
      "isActive": true,
      "creditLimit": 500000,
      "dueDatePreference": "end_of_month",
      "totalOrders": 45,
      "gstNumber": "27AABCU9603R1ZM"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

### POST /api/b2b/suppliers

Create a new supplier.

**Request Body:**
```json
{
  "name": "ABC Supplies Pvt Ltd",
  "contactPerson": "Rajesh Kumar",
  "email": "contact@abcsupplies.com",
  "phone": "9876543210",
  "address": {
    "street1": "123 Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "IN"
  },
  "gstNumber": "27AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "creditLimit": 500000,
  "creditPeriodDays": 30,
  "dueDatePreference": "end_of_month",
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountNumber": "50200012345678",
    "ifscCode": "HDFC0001234",
    "accountType": "current"
  },
  "tags": ["electronics", "preferred"],
  "paymentTerms": "Net 30",
  "minimumOrderValue": 5000,
  "avgDeliveryDays": 5,
  "contacts": [
    {
      "name": "Rajesh Kumar",
      "email": "rajesh@abcsupplies.com",
      "mobile": "9876543210",
      "designation": "Sales Manager"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "ABC Supplies Pvt Ltd",
    "status": "pending",
    "isActive": true,
    "createdAt": "2026-05-12T10:30:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid request body
- `409` - Supplier with same GST/PAN already exists

---

### GET /api/b2b/suppliers/:id

Get supplier details by ID.

**Response:**
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "merchantId": "64a1b2c3d4e5f6789000001",
    "name": "ABC Supplies Pvt Ltd",
    "contactPerson": "Rajesh Kumar",
    "email": "contact@abcsupplies.com",
    "phone": "9876543210",
    "address": { ... },
    "gstNumber": "27AABCU9603R1ZM",
    "pan": "AABCU9603R",
    "creditLimit": 500000,
    "creditPeriodDays": 30,
    "dueDatePreference": "end_of_month",
    "bankDetails": { ... },
    "isActive": true,
    "status": "approved",
    "tags": ["electronics", "preferred"],
    "paymentTerms": "Net 30",
    "minimumOrderValue": 5000,
    "avgDeliveryDays": 5,
    "rating": 4.5,
    "totalOrders": 45,
    "lastOrderDate": "2026-05-10T14:00:00Z",
    "contacts": [ ... ],
    "createdAt": "2026-01-15T09:00:00Z",
    "updatedAt": "2026-05-12T10:30:00Z"
  }
}
```

**Error Codes:**
- `404` - Supplier not found

---

### PUT /api/b2b/suppliers/:id

Update supplier details.

**Request Body:** (All fields optional)
```json
{
  "name": "ABC Supplies Updated",
  "creditLimit": 750000,
  "creditPeriodDays": 45,
  "isActive": true,
  "tags": ["electronics", "preferred", "bulk"]
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "updatedAt": "2026-05-12T11:00:00Z",
    ...updated fields
  }
}
```

---

### DELETE /api/b2b/suppliers/:id

Soft delete a supplier (sets isActive to false).

**Response:** `204 No Content`

**Error Codes:**
- `404` - Supplier not found
- `409` - Cannot delete supplier with pending POs

---

### GET /api/b2b/suppliers/:id/ledger

Get supplier ledger entries (transaction history).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `entryType` | LedgerEntryType | - | Filter by entry type |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `sort` | string | createdAt | Sort field |
| `order` | `asc` \| `desc` | desc | Sort direction |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012346",
      "entryType": "po",
      "transactionType": "debit",
      "amount": 50000,
      "balance": 50000,
      "referenceType": "po",
      "referenceId": "64a1b2c3d4e5f6789012350",
      "referenceNumber": "PO-2026-0045",
      "description": "Purchase Order #PO-2026-0045",
      "dueDate": "2026-06-15T00:00:00Z",
      "daysOverdue": 0,
      "createdAt": "2026-05-15T10:00:00Z"
    },
    {
      "_id": "64a1b2c3d4e5f6789012347",
      "entryType": "payment",
      "transactionType": "credit",
      "amount": 25000,
      "balance": 25000,
      "referenceType": "payment",
      "referenceId": "64a1b2c3d4e5f6789012351",
      "referenceNumber": "PAY-2026-0023",
      "description": "Payment via NEFT",
      "paymentDate": "2026-05-20T15:30:00Z",
      "createdAt": "2026-05-20T15:30:00Z"
    }
  ],
  "summary": {
    "openingBalance": 0,
    "totalDebits": 150000,
    "totalCredits": 25000,
    "closingBalance": 125000,
    "outstandingPOs": 3,
    "overdueAmount": 45000
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}
```

---

### GET /api/b2b/suppliers/:id/orders

Get purchase orders for a specific supplier.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | POStatus | - | Filter by status |
| `paymentStatus` | PaymentStatus | - | Filter by payment status |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012350",
      "poNumber": "PO-2026-0045",
      "status": "approved",
      "paymentStatus": "partial",
      "totalAmount": 50000,
      "paidAmount": 25000,
      "dueDate": "2026-06-15T00:00:00Z",
      "orderDate": "2026-05-15T10:00:00Z",
      "itemCount": 5
    }
  ],
  "stats": {
    "totalPOs": 45,
    "totalValue": 2250000,
    "paidValue": 1800000,
    "outstandingValue": 450000
  },
  "pagination": { ... }
}
```

---

## 2. Purchase Orders API

Manage purchase orders against suppliers.

### GET /api/b2b/purchase-orders

List all purchase orders.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search PO number |
| `supplierId` | string | - | Filter by supplier |
| `status` | POStatus | - | Filter by status |
| `paymentStatus` | PaymentStatus | - | Filter by payment |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `minAmount` | number | - | Minimum amount |
| `maxAmount` | number | - | Maximum amount |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012350",
      "poNumber": "PO-2026-0045",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "status": "approved",
      "paymentStatus": "partial",
      "totalAmount": 50000,
      "dueDate": "2026-06-15T00:00:00Z",
      "orderDate": "2026-05-15T10:00:00Z",
      "itemCount": 5
    }
  ],
  "stats": {
    "totalPOs": 234,
    "draftPOs": 12,
    "pendingApproval": 8,
    "approvedPOs": 156,
    "receivedPOs": 58,
    "totalValue": 12500000,
    "paidValue": 9500000,
    "outstandingValue": 3000000
  },
  "pagination": { ... }
}
```

---

### POST /api/b2b/purchase-orders

Create a new purchase order.

**Request Body:**
```json
{
  "supplierId": "64a1b2c3d4e5f6789012345",
  "storeId": "64a1b2c3d4e5f6789000002",
  "items": [
    {
      "productName": "LED TV 42 inch",
      "sku": "LED-42-SAMSUNG",
      "quantity": 10,
      "unitPrice": 25000,
      "discount": 2500,
      "taxRate": 18,
      "hsnCode": "85287220",
      "unit": "pieces",
      "expectedDeliveryDate": "2026-05-25T00:00:00Z"
    },
    {
      "productName": "HDMI Cable 2m",
      "sku": "HDMI-2M",
      "quantity": 20,
      "unitPrice": 350,
      "discount": 0,
      "taxRate": 18,
      "hsnCode": "85444220"
    }
  ],
  "discount": 500,
  "notes": "Urgent delivery required",
  "expectedDeliveryDate": "2026-05-25T00:00:00Z",
  "billingAddress": {
    "street1": "456 Business Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400002"
  },
  "shippingAddress": {
    "street1": "789 Warehouse Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400003"
  },
  "deliveryInstructions": "Call before delivery",
  "terms": "Warranty: 1 year manufacturer warranty"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012350",
    "poNumber": "PO-2026-0045",
    "status": "draft",
    "totalAmount": 299430,
    "subtotal": 253760,
    "discount": 500,
    "taxAmount": 45170,
    "createdAt": "2026-05-12T11:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid request body
- `402` - Credit limit exceeded
- `404` - Supplier not found

---

### GET /api/b2b/purchase-orders/:id

Get purchase order details.

**Response:**
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012350",
    "merchantId": "64a1b2c3d4e5f6789000001",
    "supplierId": "64a1b2c3d4e5f6789012345",
    "supplierName": "ABC Supplies Pvt Ltd",
    "poNumber": "PO-2026-0045",
    "status": "approved",
    "paymentStatus": "partial",
    "items": [
      {
        "id": "item-001",
        "productName": "LED TV 42 inch",
        "sku": "LED-42-SAMSUNG",
        "quantity": 10,
        "unitPrice": 25000,
        "discount": 2500,
        "taxRate": 18,
        "hsnCode": "85287220",
        "receivedQuantity": 0
      }
    ],
    "subtotal": 253760,
    "discount": 500,
    "taxAmount": 45170,
    "totalAmount": 299430,
    "currency": "INR",
    "orderDate": "2026-05-15T10:00:00Z",
    "expectedDeliveryDate": "2026-05-25T00:00:00Z",
    "dueDate": "2026-06-15T00:00:00Z",
    "paidAmount": 150000,
    "approvalHistory": [
      {
        "id": "approval-001",
        "action": "submitted",
        "userId": "user-001",
        "userName": "John Doe",
        "timestamp": "2026-05-15T10:00:00Z",
        "comments": "Created PO for electronics stock"
      },
      {
        "id": "approval-002",
        "action": "approved",
        "userId": "user-002",
        "userName": "Jane Smith",
        "timestamp": "2026-05-15T14:00:00Z",
        "comments": "Approved for procurement"
      }
    ],
    "attachments": [],
    "notes": "Urgent delivery required",
    "createdBy": "user-001",
    "approvedBy": "user-002",
    "createdAt": "2026-05-15T10:00:00Z",
    "updatedAt": "2026-05-15T14:00:00Z"
  }
}
```

---

### PUT /api/b2b/purchase-orders/:id

Update purchase order (only for draft/rejected status).

**Request Body:**
```json
{
  "items": [ ... ],
  "discount": 1000,
  "notes": "Updated notes",
  "expectedDeliveryDate": "2026-05-30T00:00:00Z"
}
```

**Response:** `200 OK`

**Error Codes:**
- `400` - Cannot modify PO in current status
- `404` - PO not found

---

### PATCH /api/b2b/purchase-orders/:id/status

Update PO status.

**Request Body:**
```json
{
  "status": "ordered",
  "comments": "PO sent to supplier via email"
}
```

**Status Transitions:**
- `draft` -> `pending_approval`, `cancelled`
- `pending_approval` -> `approved`, `rejected`
- `approved` -> `ordered`, `cancelled`
- `ordered` -> `partial_received`, `received`, `cancelled`
- `partial_received` -> `received`, `cancelled`
- `received` -> `closed`

**Response:** `200 OK`

---

### POST /api/b2b/purchase-orders/:id/approve

Approve a pending purchase order.

**Request Body:**
```json
{
  "comments": "Approved for procurement budget Q2"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012350",
    "status": "approved",
    "approvalHistory": [ ... ],
    "updatedAt": "2026-05-15T14:00:00Z"
  }
}
```

**Error Codes:**
- `400` - PO not in pending_approval status
- `402` - Credit limit would be exceeded

---

### POST /api/b2b/purchase-orders/:id/reject

Reject a pending purchase order.

**Request Body:**
```json
{
  "comments": "Budget exceeded for this quarter"
}
```

**Response:** `200 OK`

---

### POST /api/b2b/purchase-orders/:id/receive

Record receipt of items.

**Request Body:**
```json
{
  "items": [
    {
      "itemId": "item-001",
      "receivedQuantity": 8,
      "notes": "2 items damaged in transit"
    }
  ],
  "receivedDate": "2026-05-22T10:00:00Z",
  "notes": "Partial delivery received"
}
```

**Response:** `200 OK`

---

## 3. RFQ API

Request for Quotation management.

### GET /api/b2b/rfq

List all RFQs.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by RFQ number/title |
| `status` | RFQStatus | - | Filter by status |
| `supplierId` | string | - | Filter by invited supplier |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012400",
      "rfqNumber": "RFQ-2026-0012",
      "title": "Office Furniture Supply",
      "status": "open",
      "itemCount": 5,
      "invitedSupplierCount": 3,
      "responseCount": 2,
      "submissionDeadline": "2026-05-20T17:00:00Z",
      "createdAt": "2026-05-12T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/b2b/rfq

Create a new RFQ.

**Request Body:**
```json
{
  "storeId": "64a1b2c3d4e5f6789000002",
  "title": "Office Furniture Supply",
  "items": [
    {
      "description": "Executive desks (teak wood)",
      "quantity": 10,
      "unit": "pieces",
      "specifications": "Size: 60x30 inches, 3 drawer pedestal",
      "qualityRequirements": " ISI certified materials",
      "preferredDeliveryDate": "2026-06-15T00:00:00Z",
      "category": "furniture",
      "estimatedBudget": 150000
    },
    {
      "description": "Office chairs (ergonomic)",
      "quantity": 20,
      "unit": "pieces",
      "specifications": "Height adjustable, lumbar support, mesh back",
      "category": "furniture",
      "estimatedBudget": 100000
    }
  ],
  "invitedSupplierIds": [
    "64a1b2c3d4e5f6789012345",
    "64a1b2c3d4e5f6789012346",
    "64a1b2c3d4e5f6789012347"
  ],
  "submissionDeadline": "2026-05-20T17:00:00Z",
  "expectedDeliveryDate": "2026-06-15T00:00:00Z",
  "terms": "Delivery to Mumbai warehouse only. Installation included.",
  "notes": "Need quotation with GST breakdown"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012400",
    "rfqNumber": "RFQ-2026-0012",
    "status": "draft",
    "createdAt": "2026-05-12T09:00:00Z"
  }
}
```

---

### GET /api/b2b/rfq/:id

Get RFQ details.

**Response:**
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012400",
    "merchantId": "64a1b2c3d4e5f6789000001",
    "rfqNumber": "RFQ-2026-0012",
    "status": "open",
    "title": "Office Furniture Supply",
    "items": [
      {
        "id": "rfq-item-001",
        "description": "Executive desks (teak wood)",
        "quantity": 10,
        "unit": "pieces",
        "specifications": "Size: 60x30 inches, 3 drawer pedestal",
        "qualityRequirements": " ISI certified materials",
        "preferredDeliveryDate": "2026-06-15T00:00:00Z",
        "category": "furniture",
        "estimatedBudget": 150000
      }
    ],
    "invitedSupplierIds": ["64a1b2c3d4e5f6789012345"],
    "invitedSuppliers": [
      { "id": "64a1b2c3d4e5f6789012345", "name": "ABC Supplies Pvt Ltd" }
    ],
    "respondingSupplierIds": ["64a1b2c3d4e5f6789012345"],
    "submissionDeadline": "2026-05-20T17:00:00Z",
    "expectedDeliveryDate": "2026-06-15T00:00:00Z",
    "terms": "Delivery to Mumbai warehouse only. Installation included.",
    "notes": "Need quotation with GST breakdown",
    "attachments": [],
    "awardedSupplierId": null,
    "awardedQuoteId": null,
    "createdBy": "user-001",
    "createdAt": "2026-05-12T09:00:00Z",
    "updatedAt": "2026-05-12T09:00:00Z"
  }
}
```

---

### PUT /api/b2b/rfq/:id

Update RFQ (only draft status).

**Request Body:**
```json
{
  "title": "Updated title",
  "items": [ ... ],
  "submissionDeadline": "2026-05-25T17:00:00Z"
}
```

**Response:** `200 OK`

---

### DELETE /api/b2b/rfq/:id

Delete RFQ (only draft status).

**Response:** `204 No Content`

---

### POST /api/b2b/rfq/:id/close

Close RFQ for submissions.

**Request Body:**
```json
{
  "reason": "Reached maximum quotes needed"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012400",
    "status": "closed",
    "updatedAt": "2026-05-18T10:00:00Z"
  }
}
```

---

### POST /api/b2b/rfq/:id/invite

Invite additional suppliers to an open RFQ.

**Request Body:**
```json
{
  "supplierIds": ["64a1b2c3d4e5f6789012348"]
}
```

**Response:** `200 OK`

---

## 4. Quotes API

Manage supplier quotes for RFQs.

### GET /api/b2b/quotes

List all quotes.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search quote number |
| `rfqId` | string | - | Filter by RFQ |
| `supplierId` | string | - | Filter by supplier |
| `status` | QuoteStatus | - | Filter by status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012500",
      "quoteNumber": "QT-2026-0015",
      "rfqId": "64a1b2c3d4e5f6789012400",
      "rfqTitle": "Office Furniture Supply",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "status": "submitted",
      "totalAmount": 245000,
      "validUntil": "2026-06-19T17:00:00Z",
      "submittedAt": "2026-05-18T14:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/b2b/quotes

Submit a quote (called by supplier).

**Request Body:**
```json
{
  "rfqId": "64a1b2c3d4e5f6789012400",
  "items": [
    {
      "rfqLineItemId": "rfq-item-001",
      "productName": "Executive Desk (Teak Wood)",
      "sku": "EXEC-DSK-001",
      "quantity": 10,
      "unitPrice": 14500,
      "discount": 500,
      "taxRate": 18,
      "hsnCode": "94036000",
      "leadTimeDays": 15,
      "remarks": "Includes delivery and installation"
    },
    {
      "rfqLineItemId": "rfq-item-002",
      "productName": "Ergonomic Office Chair",
      "sku": "CHAIR-ERGO-001",
      "quantity": 20,
      "unitPrice": 4800,
      "discount": 0,
      "taxRate": 18,
      "hsnCode": "94013000",
      "leadTimeDays": 10
    }
  ],
  "validityDays": 30,
  "paymentTerms": "50% advance, 50% on delivery",
  "deliveryPeriodDays": 20,
  "warrantyTerms": "5 years manufacturer warranty",
  "notes": "Price includes GST. Free delivery to Mumbai.",
  "attachments": [
    {
      "fileName": "quotation_breakdown.pdf",
      "url": "https://storage.example.com/quotes/qt001.pdf",
      "mimeType": "application/pdf",
      "size": 102400,
      "type": "other"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012500",
    "quoteNumber": "QT-2026-0015",
    "status": "submitted",
    "totalAmount": 245000,
    "validUntil": "2026-06-19T17:00:00Z",
    "submittedAt": "2026-05-18T14:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid request
- `404` - RFQ not found
- `410` - RFQ closed for submissions

---

### GET /api/b2b/quotes/:id

Get quote details.

**Response:**
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012500",
    "merchantId": "64a1b2c3d4e5f6789000001",
    "rfqId": "64a1b2c3d4e5f6789012400",
    "supplierId": "64a1b2c3d4e5f6789012345",
    "supplierName": "ABC Supplies Pvt Ltd",
    "quoteNumber": "QT-2026-0015",
    "status": "submitted",
    "items": [
      {
        "id": "quote-item-001",
        "rfqLineItemId": "rfq-item-001",
        "productName": "Executive Desk (Teak Wood)",
        "sku": "EXEC-DSK-001",
        "quantity": 10,
        "unitPrice": 14500,
        "discount": 500,
        "taxRate": 18,
        "hsnCode": "94036000",
        "leadTimeDays": 15,
        "remarks": "Includes delivery and installation"
      }
    ],
    "subtotal": 207627,
    "discount": 4237,
    "taxAmount": 36610,
    "totalAmount": 245000,
    "currency": "INR",
    "validityDays": 30,
    "validUntil": "2026-06-19T17:00:00Z",
    "paymentTerms": "50% advance, 50% on delivery",
    "deliveryPeriodDays": 20,
    "warrantyTerms": "5 years manufacturer warranty",
    "notes": "Price includes GST. Free delivery to Mumbai.",
    "attachments": [ ... ],
    "submittedAt": "2026-05-18T14:00:00Z",
    "revisionCount": 0,
    "createdAt": "2026-05-18T14:00:00Z",
    "updatedAt": "2026-05-18T14:00:00Z"
  }
}
```

---

### PUT /api/b2b/quotes/:id

Update/revise a quote (supplier only, while status is submitted/revised).

**Request Body:**
```json
{
  "items": [ ... ],
  "paymentTerms": "60% advance, 40% on delivery",
  "deliveryPeriodDays": 25
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012500",
    "status": "revised",
    "revisionCount": 1,
    "revisedAt": "2026-05-19T10:00:00Z",
    "updatedAt": "2026-05-19T10:00:00Z"
  }
}
```

---

### POST /api/b2b/quotes/:id/accept

Accept a quote and optionally create a PO.

**Request Body:**
```json
{
  "createPO": true,
  "notes": "PO will be created based on accepted quote"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "quote": {
      "_id": "64a1b2c3d4e5f6789012500",
      "status": "accepted",
      "updatedAt": "2026-05-19T15:00:00Z"
    },
    "po": {
      "_id": "64a1b2c3d4e5f6789012355",
      "poNumber": "PO-2026-0046"
    }
  }
}
```

**Side Effects:**
- Updates RFQ status to `awarded`
- Updates RFQ `awardedSupplierId` and `awardedQuoteId`
- Creates PO from quote items (if `createPO: true`)

**Error Codes:**
- `400` - Quote not in valid state
- `409` - RFQ already awarded to another quote

---

### POST /api/b2b/quotes/:id/reject

Reject a quote.

**Request Body:**
```json
{
  "reason": "Budget constraints"
}
```

**Response:** `200 OK`

---

### GET /api/b2b/rfq/:id/quotes

Get all quotes for a specific RFQ with comparison view.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | `totalAmount` \| `deliveryDays` | totalAmount | Sort comparison |
| `order` | `asc` \| `desc` | asc | Sort direction |

**Response:**
```json
{
  "data": {
    "rfq": {
      "_id": "64a1b2c3d4e5f6789012400",
      "rfqNumber": "RFQ-2026-0012",
      "title": "Office Furniture Supply",
      "status": "open",
      "submissionDeadline": "2026-05-20T17:00:00Z"
    },
    "quotes": [
      {
        "_id": "64a1b2c3d4e5f6789012500",
        "supplierId": "64a1b2c3d4e5f6789012345",
        "supplierName": "ABC Supplies Pvt Ltd",
        "status": "submitted",
        "totalAmount": 245000,
        "deliveryPeriodDays": 20,
        "paymentTerms": "50% advance",
        "isLowest": true,
        "items": [ ... ]
      },
      {
        "_id": "64a1b2c3d4e5f6789012501",
        "supplierId": "64a1b2c3d4e5f6789012346",
        "supplierName": "XYZ Furniture Works",
        "status": "submitted",
        "totalAmount": 268000,
        "deliveryPeriodDays": 15,
        "paymentTerms": "30% advance",
        "isLowest": false,
        "items": [ ... ]
      }
    ],
    "summary": {
      "quoteCount": 2,
      "lowestQuote": 245000,
      "highestQuote": 268000,
      "avgQuote": 256500
    }
  }
}
```

---

## 5. Credit Lines API

Manage supplier credit facilities.

### GET /api/b2b/credit-lines

List all credit lines.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `supplierId` | string | - | Filter by supplier |
| `status` | CreditLineStatus | - | Filter by status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012600",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "creditLimit": 500000,
      "usedAmount": 125000,
      "availableAmount": 375000,
      "creditPeriodDays": 30,
      "interestRatePerMonth": 1.5,
      "graceDays": 5,
      "status": "active",
      "activatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "totalCreditLimit": 2500000,
    "totalUsed": 850000,
    "totalAvailable": 1650000,
    "avgUtilization": 34
  },
  "pagination": { ... }
}
```

---

### POST /api/b2b/credit-lines

Create a new credit line.

**Request Body:**
```json
{
  "supplierId": "64a1b2c3d4e5f6789012345",
  "creditLimit": 500000,
  "creditPeriodDays": 30,
  "interestRatePerMonth": 1.5,
  "graceDays": 5
}
```

**Response:** `201 Created`

---

### GET /api/b2b/credit-lines/:id

Get credit line details.

**Response:**
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012600",
    "merchantId": "64a1b2c3d4e5f6789000001",
    "supplierId": "64a1b2c3d4e5f6789012345",
    "supplierName": "ABC Supplies Pvt Ltd",
    "creditLimit": 500000,
    "usedAmount": 125000,
    "availableAmount": 375000,
    "creditPeriodDays": 30,
    "interestRatePerMonth": 1.5,
    "graceDays": 5,
    "status": "active",
    "activatedAt": "2026-01-01T00:00:00Z",
    "suspensionReason": null,
    "suspendedAt": null,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-05-12T00:00:00Z"
  }
}
```

---

### PUT /api/b2b/credit-lines/:id

Update credit line limits/terms.

**Request Body:**
```json
{
  "creditLimit": 750000,
  "creditPeriodDays": 45,
  "interestRatePerMonth": 1.25,
  "graceDays": 7,
  "status": "active"
}
```

**Response:** `200 OK`

**Error Codes:**
- `400` - Cannot update while suspended without reason
- `409` - Cannot close with outstanding balance

---

### GET /api/b2b/credit-lines/:id/utilization

Get detailed credit utilization breakdown.

**Response:**
```json
{
  "data": {
    "creditLine": {
      "_id": "64a1b2c3d4e5f6789012600",
      "creditLimit": 500000,
      "usedAmount": 125000,
      "availableAmount": 375000
    },
    "utilization": {
      "byPO": [
        {
          "poId": "64a1b2c3d4e5f6789012350",
          "poNumber": "PO-2026-0045",
          "totalAmount": 50000,
          "paidAmount": 25000,
          "outstanding": 25000,
          "dueDate": "2026-06-15T00:00:00Z",
          "daysUntilDue": 34
        },
        {
          "poId": "64a1b2c3d4e5f6789012351",
          "poNumber": "PO-2026-0046",
          "totalAmount": 100000,
          "paidAmount": 0,
          "outstanding": 100000,
          "dueDate": "2026-06-20T00:00:00Z",
          "daysUntilDue": 39
        }
      ],
      "overdue": {
        "amount": 15000,
        "poCount": 1,
        "oldestOverdueDate": "2026-05-01T00:00:00Z",
        "daysOverdue": 11
      },
      "upcomingDue": {
        "amount": 35000,
        "poCount": 2,
        "nextDueDate": "2026-05-15T00:00:00Z"
      }
    },
    "projection": {
      "30days": 125000,
      "60days": 200000,
      "90days": 300000
    }
  }
}
```

---

## 6. Reconciliation API

Bank statement matching and reconciliation.

### POST /api/b2b/reconciliation/upload

Upload bank statement for processing.

**Request:** `multipart/form-data`
- `file`: Bank statement file (CSV, XLSX, PDF)
- `accountId`: Account identifier
- `statementDate`: Statement period end date

**Response:**
```json
{
  "data": {
    "uploadId": "64a1b2c3d4e5f6789012700",
    "transactionsImported": 156,
    "duplicatesSkipped": 3,
    "errors": [
      { "row": 45, "error": "Invalid date format" }
    ],
    "processedAt": "2026-05-12T10:30:00Z"
  }
}
```

---

### GET /api/b2b/reconciliation/transactions

List bank transactions for reconciliation.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `isReconciled` | boolean | - | Filter reconciled |
| `transactionType` | `credit` \| `debit` | - | Filter type |
| `search` | string | - | Search description |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012710",
      "transactionDate": "2026-05-10T00:00:00Z",
      "description": "NEFT REF NO: ABC123456789",
      "amount": 50000,
      "transactionType": "credit",
      "utrNumber": "ABC123456789",
      "isReconciled": false,
      "matchType": null,
      "matchedPOId": null,
      "matchedPaymentId": null,
      "runningBalance": 250000,
      "createdAt": "2026-05-12T10:30:00Z"
    }
  ],
  "stats": {
    "totalTransactions": 156,
    "reconciledCount": 142,
    "unreconciledCount": 14,
    "totalReconciledAmount": 2500000
  },
  "pagination": { ... }
}
```

---

### POST /api/b2b/reconciliation/match

Manually match a bank transaction to PO/payment.

**Request Body:**
```json
{
  "transactionId": "64a1b2c3d4e5f6789012710",
  "matchType": "exact",
  "poId": "64a1b2c3d4e5f6789012350",
  "paymentId": "64a1b2c3d4e5f6789012800",
  "notes": "Matched manually - UTR number confirmed"
}
```

**Response:**
```json
{
  "data": {
    "transaction": {
      "_id": "64a1b2c3d4e5f6789012710",
      "isReconciled": true,
      "reconciledAt": "2026-05-12T11:00:00Z",
      "matchType": "exact",
      "matchedPOId": "64a1b2c3d4e5f6789012350",
      "matchedPaymentId": "64a1b2c3d4e5f6789012800"
    },
    "payment": {
      "_id": "64a1b2c3d4e5f6789012800",
      "status": "processed"
    },
    "po": {
      "_id": "64a1b2c3d4e5f6789012350",
      "paymentStatus": "paid"
    }
  }
}
```

---

### POST /api/b2b/reconciliation/auto-match

Trigger automatic matching algorithm.

**Request Body:**
```json
{
  "transactionIds": ["64a1b2c3d4e5f6789012710"],
  "matchTypes": ["exact", "contains", "regex"],
  "amountTolerance": 1.00,
  "dateRange": 3
}
```

**Response:**
```json
{
  "data": {
    "matched": 12,
    "skipped": 2,
    "matches": [
      {
        "transactionId": "64a1b2c3d4e5f6789012710",
        "matchType": "contains",
        "confidence": 0.95,
        "matchedPOId": "64a1b2c3d4e5f6789012350",
        "amount": 50000,
        "poAmount": 50000
      }
    ],
    "requiresReview": [
      {
        "transactionId": "64a1b2c3d4e5f6789012711",
        "possibleMatches": ["po-001", "po-002"],
        "reason": "Multiple POs with similar amounts"
      }
    ]
  }
}
```

---

### GET /api/b2b/reconciliation/matches

List all reconciliation matches.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `matchType` | string | - | Filter by match type |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012750",
      "transactionId": "64a1b2c3d4e5f6789012710",
      "poId": "64a1b2c3d4e5f6789012350",
      "paymentId": "64a1b2c3d4e5f6789012800",
      "matchType": "exact",
      "amount": 50000,
      "matchedAt": "2026-05-12T10:45:00Z",
      "matchedBy": "system",
      "notes": "Auto-matched via UTR reference"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/b2b/reconciliation/rules

Get matching rules configuration.

**Response:**
```json
{
  "data": [
    {
      "id": "rule-001",
      "name": "UTR Exact Match",
      "matchType": "exact",
      "pattern": "UTR.*([A-Z0-9]{16,22})",
      "field": "utrNumber",
      "priority": 1,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "rule-002",
      "name": "PO Reference Match",
      "matchType": "contains",
      "pattern": "PO-2026-",
      "field": "description",
      "priority": 2,
      "isActive": true
    }
  ]
}
```

---

### POST /api/b2b/reconciliation/rules

Create a new matching rule.

**Request Body:**
```json
{
  "name": "NEFT Reference Match",
  "matchType": "regex",
  "pattern": "NEFT.*?([A-Z0-9]{16})",
  "field": "description",
  "priority": 3,
  "isActive": true
}
```

**Response:** `201 Created`

---

## 7. WhatsApp API

WhatsApp Business integration for B2B communications.

### GET /api/b2b/whatsapp/templates

List WhatsApp message templates.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category |
| `isActive` | boolean | - | Filter active templates |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012900",
      "name": "po_created_supplier",
      "category": "purchase_order",
      "language": "en",
      "status": "approved",
      "templateBody": "Hello {{1}},\n\nYour Purchase Order {{2}} has been created.\n\nAmount: Rs. {{3}}\nDue Date: {{4}}\n\nView details: {{5}}",
      "headerType": "text",
      "headerContent": "New Purchase Order",
      "footerContent": "ReZ Merchant - Powered by WhatsApp",
      "buttons": [
        { "type": "url", "text": "View PO" }
      ],
      "variables": ["supplierName", "poNumber", "amount", "dueDate", "link"],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-05-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/b2b/whatsapp/templates

Create a new WhatsApp template.

**Request Body:**
```json
{
  "name": "payment_reminder_supplier",
  "category": "payment",
  "language": "en",
  "templateBody": "Hello {{1}},\n\nThis is a reminder for Payment ID {{2}}\n\nOutstanding Amount: Rs. {{3}}\nDue Date: {{4}}\n\nPlease process the payment at your earliest convenience.",
  "headerType": "text",
  "headerContent": "Payment Reminder",
  "footerContent": "ReZ Merchant",
  "buttons": [
    { "type": "url", "text": "Pay Now", "url": "https://pay.example.com/{{5}}" }
  ],
  "variables": ["supplierName", "paymentId", "amount", "dueDate", "paymentLink"]
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "_id": "64a1b2c3d4e5f6789012901",
    "name": "payment_reminder_supplier",
    "status": "pending_approval",
    "waTemplateId": "123456789012345",
    "createdAt": "2026-05-12T10:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid template format
- `409` - Template name already exists

---

### PUT /api/b2b/whatsapp/templates/:id

Update a template.

**Request Body:**
```json
{
  "templateBody": "Updated template body with {{1}}",
  "isActive": true
}
```

**Response:** `200 OK`

---

### DELETE /api/b2b/whatsapp/templates/:id

Delete a template.

**Response:** `204 No Content`

---

### POST /api/b2b/whatsapp/send

Send a WhatsApp message.

**Request Body:**
```json
{
  "templateName": "po_created_supplier",
  "recipient": {
    "phone": "919876543210",
    "type": "supplier",
    "supplierId": "64a1b2c3d4e5f6789012345"
  },
  "variables": {
    "supplierName": "ABC Supplies",
    "poNumber": "PO-2026-0045",
    "amount": "29,943",
    "dueDate": "15 June 2026",
    "link": "https://app.rez.com/po/PO-2026-0045"
  },
  "referenceId": "msg-ref-001",
  "scheduledAt": null
}
```

**Response:**
```json
{
  "data": {
    "messageId": "64a1b2c3d4e5f6789012910",
    "waMessageId": "wamid.123456789",
    "status": "queued",
    "recipient": "919876543210",
    "templateName": "po_created_supplier",
    "sentAt": "2026-05-12T11:00:00Z"
  }
}
```

---

### GET /api/b2b/whatsapp/messages

Get message history.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `supplierId` | string | - | Filter by supplier |
| `templateName` | string | - | Filter by template |
| `status` | string | - | Filter by status |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012910",
      "waMessageId": "wamid.123456789",
      "templateName": "po_created_supplier",
      "recipient": "919876543210",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "status": "delivered",
      "sentAt": "2026-05-12T11:00:00Z",
      "deliveredAt": "2026-05-12T11:00:15Z",
      "readAt": "2026-05-12T11:05:30Z",
      "referenceId": "msg-ref-001",
      "errorCode": null,
      "errorMessage": null
    }
  ],
  "stats": {
    "total": 1250,
    "sent": 1245,
    "delivered": 1240,
    "read": 1100,
    "failed": 5
  },
  "pagination": { ... }
}
```

---

## 8. Tally Sync API

Export data to Tally accounting software.

### GET /api/b2b/tally-sync/status

Get Tally connection and sync status.

**Response:**
```json
{
  "data": {
    "connection": {
      "isConnected": true,
      "tallyVersion": "9.4",
      "lastConnected": "2026-05-12T10:00:00Z",
      "companyName": "ReZ Demo Company"
    },
    "sync": {
      "lastSyncAt": "2026-05-12T10:30:00Z",
      "lastSyncType": "full",
      "itemsSynced": {
        "ledgers": 156,
        "vouchers": 342,
        "purchaseOrders": 45
      },
      "nextScheduledSync": "2026-05-13T10:30:00Z"
    },
    "settings": {
      "autoSync": true,
      "syncInterval": "daily",
      "syncPurchaseOrders": true,
      "syncPayments": true,
      "syncSuppliers": true
    }
  }
}
```

---

### POST /api/b2b/tally-sync/connect

Connect to Tally server.

**Request Body:**
```json
{
  "host": "192.168.1.100",
  "port": 9000,
  "companyName": "ReZ Demo Company",
  "credentials": {
    "type": "windows_auth",
    "username": "admin"
  }
}
```

**Response:**
```json
{
  "data": {
    "isConnected": true,
    "tallyVersion": "9.4",
    "companyName": "ReZ Demo Company",
    "companies": ["ReZ Demo Company", "ReZ Production"]
  }
}
```

**Error Codes:**
- `400` - Invalid connection parameters
- `503` - Tally server not reachable

---

### POST /api/b2b/tally-sync/export

Export data to Tally.

**Request Body:**
```json
{
  "type": "purchase_orders",
  "dateFrom": "2026-05-01T00:00:00Z",
  "dateTo": "2026-05-12T23:59:59Z",
  "poIds": ["64a1b2c3d4e5f6789012350"],
  "options": {
    "createLedgers": true,
    "createVouchers": true,
    "markAsExported": true
  }
}
```

**Export Types:**
- `suppliers` - Export supplier master
- `purchase_orders` - Export POs as purchase invoices
- `payments` - Export payment vouchers
- `all` - Export all data

**Response:**
```json
{
  "data": {
    "exportId": "64a1b2c3d4e5f6789012950",
    "type": "purchase_orders",
    "status": "processing",
    "itemsToExport": 25,
    "startedAt": "2026-05-12T11:00:00Z",
    "progress": {
      "ledgersCreated": 15,
      "vouchersCreated": 10,
      "errors": []
    }
  }
}
```

---

### GET /api/b2b/tally-sync/history

Get export history.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by export type |
| `status` | string | - | Filter by status |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012950",
      "type": "purchase_orders",
      "status": "completed",
      "itemsToExport": 25,
      "itemsExported": 25,
      "errors": [],
      "startedAt": "2026-05-12T11:00:00Z",
      "completedAt": "2026-05-12T11:05:00Z",
      "exportedBy": "user-001"
    }
  ],
  "pagination": { ... }
}
```

---

## 9. Dunning API

Automated payment reminder management.

### GET /api/b2b/dunning/templates

List dunning message templates.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `channel` | DunningChannel | - | Filter by channel |
| `priority` | DunningPriority | - | Filter by priority |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789013000",
      "name": "friendly_reminder",
      "channel": "whatsapp",
      "priority": "low",
      "subject": "Payment Reminder",
      "body": "Hello {{supplierName}},\n\nThis is a friendly reminder that Payment {{paymentId}} of Rs. {{amount}} is due on {{dueDate}}.\n\nPlease arrange payment at your convenience.\n\nRegards,\n{{merchantName}}",
      "variables": ["supplierName", "paymentId", "amount", "dueDate", "merchantName"],
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-05-01T00:00:00Z"
    },
    {
      "_id": "64a1b2c3d4e5f6789013001",
      "name": "urgent_reminder",
      "channel": "whatsapp",
      "priority": "high",
      "subject": "URGENT: Overdue Payment",
      "body": "Dear {{supplierName}},\n\nYour payment of Rs. {{amount}} (Payment ID: {{paymentId}}) is {{daysOverdue}} days overdue since {{dueDate}}.\n\nPlease process this payment immediately to avoid suspension of credit facility.\n\nContact: {{contactPhone}}\n\nRegards,\n{{merchantName}}",
      "variables": ["supplierName", "amount", "paymentId", "daysOverdue", "dueDate", "contactPhone", "merchantName"],
      "isActive": true
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/b2b/dunning/templates

Create a dunning template.

**Request Body:**
```json
{
  "name": "final_notice",
  "channel": "all",
  "priority": "critical",
  "subject": "FINAL NOTICE: Credit Line Suspension",
  "body": "Dear {{supplierName}},\n\nThis is a FINAL NOTICE.\n\nOutstanding amount: Rs. {{amount}}\nDays overdue: {{daysOverdue}}\n\nYour credit facility will be SUSPENDED if payment is not received within 48 hours.\n\nPlease contact us immediately to resolve this matter.\n\nEscalation Contact: {{escalationPhone}}\n\nRegards,\n{{merchantName}}",
  "variables": ["supplierName", "amount", "daysOverdue", "escalationPhone", "merchantName"],
  "isActive": true
}
```

**Response:** `201 Created`

---

### PUT /api/b2b/dunning/templates/:id

Update a dunning template.

**Request Body:**
```json
{
  "body": "Updated template body...",
  "isActive": false
}
```

**Response:** `200 OK`

---

### GET /api/b2b/dunning/sequences

List active dunning sequences.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `supplierId` | string | - | Filter by supplier |
| `status` | string | - | Filter by status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789013050",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "poId": "64a1b2c3d4e5f6789012350",
      "poNumber": "PO-2026-0045",
      "configId": "64a1b2c3d4e5f6789013010",
      "configName": "Standard Dunning",
      "currentStepIndex": 2,
      "nextActionDate": "2026-05-14T09:00:00Z",
      "status": "active",
      "reminderCount": 2,
      "completedSteps": [
        { "stepIndex": 0, "executedAt": "2026-05-12T09:00:00Z", "channel": "whatsapp", "success": true },
        { "stepIndex": 1, "executedAt": "2026-05-13T09:00:00Z", "channel": "whatsapp", "success": true }
      ],
      "createdAt": "2026-05-12T09:00:00Z",
      "updatedAt": "2026-05-13T09:00:00Z"
    }
  ],
  "stats": {
    "totalActive": 45,
    "pending": 12,
    "inProgress": 30,
    "completedToday": 3
  },
  "pagination": { ... }
}
```

---

### POST /api/b2b/dunning/sequences

Create a new dunning sequence.

**Request Body:**
```json
{
  "supplierId": "64a1b2c3d4e5f6789012345",
  "poId": "64a1b2c3d4e5f6789012350",
  "configId": "64a1b2c3d4e5f6789013010",
  "startStepIndex": 0
}
```

**Response:** `201 Created`

---

### POST /api/b2b/dunning/send

Send a manual dunning message.

**Request Body:**
```json
{
  "supplierId": "64a1b2c3d4e5f6789012345",
  "poId": "64a1b2c3d4e5f6789012350",
  "templateId": "64a1b2c3d4e5f6789013001",
  "channel": "whatsapp",
  "variables": {
    "daysOverdue": "7",
    "escalationPhone": "+91-9876543210"
  }
}
```

**Response:**
```json
{
  "data": {
    "notificationId": "64a1b2c3d4e5f6789013100",
    "status": "sent",
    "channel": "whatsapp",
    "recipient": "919876543210",
    "sentAt": "2026-05-12T11:30:00Z"
  }
}
```

---

### GET /api/b2b/dunning/sent

Get sent dunning notifications history.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `supplierId` | string | - | Filter by supplier |
| `poId` | string | - | Filter by PO |
| `channel` | DunningChannel | - | Filter by channel |
| `status` | string | - | Filter by status |
| `dateFrom` | ISO date | - | Start date |
| `dateTo` | ISO date | - | End date |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response:**
```json
{
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789013100",
      "sequenceId": "64a1b2c3d4e5f6789013050",
      "supplierId": "64a1b2c3d4e5f6789012345",
      "supplierName": "ABC Supplies Pvt Ltd",
      "poId": "64a1b2c3d4e5f6789012350",
      "poNumber": "PO-2026-0045",
      "channel": "whatsapp",
      "priority": "high",
      "recipient": "919876543210",
      "message": "Dear ABC Supplies...",
      "status": "delivered",
      "sentAt": "2026-05-12T11:30:00Z",
      "deliveredAt": "2026-05-12T11:30:15Z",
      "readAt": "2026-05-12T11:35:00Z",
      "externalMessageId": "wamid.987654321"
    }
  ],
  "stats": {
    "totalSent": 450,
    "delivered": 445,
    "read": 380,
    "failed": 5
  },
  "pagination": { ... }
}
```

---

## Error Responses

All API errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "gstNumber",
        "message": "Invalid GST number format"
      }
    ],
    "requestId": "req-abc123"
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request body validation failed |
| 400 | `INVALID_STATUS_TRANSITION` | Cannot transition to requested status |
| 400 | `CREDIT_LIMIT_EXCEEDED` | Operation would exceed credit limit |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `DUPLICATE_ENTRY` | Resource already exists |
| 409 | `CONFLICT` | Resource in conflicting state |
| 410 | `GONE` | Resource no longer accepting operations |
| 422 | `UNPROCESSABLE` | Request understood but cannot be processed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Pagination

All list endpoints support pagination with the following parameters:

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | number | 1 | - |
| `limit` | number | 20 | 100 |

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Read operations | 100/minute |
| Write operations | 30/minute |
| Bulk operations | 10/minute |

Rate limit headers included in all responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

**Required Claims:**
- `merchantId` - Merchant identifier
- `userId` - User identifier
- `role` - User role (owner, admin, manager, staff)

---

## Webhooks

Subscribe to B2B events via webhooks:

**Webhook Payload:**
```json
{
  "eventType": "po_created",
  "timestamp": "2026-05-12T10:30:00Z",
  "merchantId": "64a1b2c3d4e5f6789000001",
  "supplierId": "64a1b2c3d4e5f6789012345",
  "poId": "64a1b2c3d4e5f6789012350",
  "data": { ... },
  "signature": "sha256=..."
}
```

**Event Types:**
- `po_created` - New purchase order created
- `po_status_changed` - PO status updated
- `payment_received` - Payment recorded
- `payment_reminder` - Dunning reminder sent
- `credit_limit_reached` - Credit limit threshold reached
- `credit_line_suspended` - Credit line suspended
- `rfq_received` - New RFQ created
- `quote_received` - New quote submitted
- `quote_decided` - Quote accepted/rejected
