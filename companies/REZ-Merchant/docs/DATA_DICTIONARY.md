# ReZ Merchant B2B Platform - Data Dictionary

**Version:** 1.0.0
**Last Updated:** 2026-05-12
**Platform:** ReZ Merchant B2B
**Database:** MongoDB

---

## Table of Contents

1. [Embedded Types](#embedded-types)
   - [Address](#address)
   - [BankDetails](#bankdetails)
   - [POItem](#poitem)
   - [RFQItem](#rfqitem)
   - [QuoteItem](#quoteitem)
   - [CreditTransaction](#credittransaction)
2. [Supplier](#supplier)
3. [PurchaseOrder](#purchaseorder)
4. [RFQ (Request for Quotation)](#rfq-request-for-quotation)
5. [Quote](#quote)
6. [CreditLine](#creditline)
7. [BankTransaction](#banktransaction)
8. [ReconciliationRule](#reconciliationrule)
9. [ReminderTemplate](#remindertemplate)
10. [ReminderSequence](#remindersequence)
11. [Enumerations](#enumerations)

---

## Embedded Types

### Address

Physical address structure used across multiple models.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `street` | string | Yes | Primary street address line | `"123 Industrial Area, Phase II"` | Max 500 characters |
| `city` | string | Yes | City name | `"Mumbai"` | Max 100 characters |
| `state` | string | Yes | State or province | `"Maharashtra"` | Max 100 characters |
| `postalCode` | string | Yes | ZIP or postal code | `"400001"` | 6 digits for India |
| `country` | string | Yes | Country name | `"India"` | Default: `"India"` |
| `landmark` | string | No | Nearby landmark for navigation | `"Near City Hospital"` | Max 200 characters |

**Example:**
```json
{
  "street": "123 Industrial Area, Phase II",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "landmark": "Near City Hospital"
}
```

---

### BankDetails

Bank account information for suppliers and merchants.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `bankName` | string | Yes | Name of the bank | `"HDFC Bank"` | Max 100 characters |
| `accountNumber` | string | Yes | Bank account number | `"50100123456789"` | 9-18 digits |
| `accountHolderName` | string | Yes | Name on the account | `"ABC Supplies Pvt Ltd"` | Max 200 characters |
| `ifscCode` | string | Yes | Indian Financial System Code | `"HDFC0001234"` | 11 characters, uppercase alphanumeric |
| `accountType` | string | No | Type of account | `"current"` | Enum: `savings`, `current` |
| `branchAddress` | string | No | Branch location | `"Andheri West, Mumbai"` | Max 300 characters |

**Example:**
```json
{
  "bankName": "HDFC Bank",
  "accountNumber": "50100123456789",
  "accountHolderName": "ABC Supplies Pvt Ltd",
  "ifscCode": "HDFC0001234",
  "accountType": "current",
  "branchAddress": "Andheri West, Mumbai"
}
```

---

### POItem

Line item within a Purchase Order.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `productId` | ObjectId | No | Reference to product catalog | `ObjectId("...")` | Valid ObjectId |
| `sku` | string | Yes | Stock Keeping Unit code | `"SKU-12345"` | Max 50 characters |
| `name` | string | Yes | Product or service name | `"Organic Cotton Bedsheet"` | Max 300 characters |
| `description` | string | No | Item description | `"Queen size, 400 thread count"` | Max 1000 characters |
| `quantity` | number | Yes | Ordered quantity | `100` | Positive integer, min 1 |
| `unit` | string | Yes | Unit of measurement | `"pcs"` | Max 20 characters |
| `unitPrice` | number | Yes | Price per unit | `299.99` | Positive decimal, 2 decimal places |
| `taxRate` | number | Yes | Tax percentage | `18` | 0-100 |
| `taxAmount` | number | Yes | Calculated tax amount | `5399.82` | Auto-calculated |
| `discount` | number | No | Discount amount | `500.00` | Positive decimal |
| `total` | number | Yes | Line item total | `30599.82` | Auto-calculated |
| `deliveredQuantity` | number | No | Quantity delivered so far | `50` | 0 to quantity |
| `notes` | string | No | Item-specific notes | `"Rush order - priority delivery"` | Max 500 characters |

**Calculated Fields:**
```
taxAmount = quantity * unitPrice * (taxRate / 100)
total = (quantity * unitPrice) + taxAmount - discount
```

**Example:**
```json
{
  "productId": ObjectId("507f1f77bcf86cd799439011"),
  "sku": "SKU-12345",
  "name": "Organic Cotton Bedsheet",
  "description": "Queen size, 400 thread count",
  "quantity": 100,
  "unit": "pcs",
  "unitPrice": 299.99,
  "taxRate": 18,
  "taxAmount": 5399.82,
  "discount": 500.00,
  "total": 30599.82,
  "deliveredQuantity": 50,
  "notes": "Rush order - priority delivery"
}
```

---

### RFQItem

Line item within a Request for Quotation.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `itemId` | string | Yes | Unique item identifier within RFQ | `"RFQ-001-1"` | Max 50 characters |
| `name` | string | Yes | Product or service name | `"Office Chairs"` | Max 300 characters |
| `description` | string | No | Detailed requirements | `"Ergonomic, mesh back, adjustable"` | Max 2000 characters |
| `quantity` | number | Yes | Required quantity | `50` | Positive integer, min 1 |
| `unit` | string | Yes | Unit of measurement | `"pcs"` | Max 20 characters |
| `specifications` | object | No | Technical specifications | `{"material": "mesh", "color": "black"}` | Flexible key-value pairs |
| `attachments` | string[] | No | URLs to reference files | `["https://..."]` | Valid URLs |
| `priority` | string | No | Item priority | `"high"` | Enum: `low`, `medium`, `high` |

**Example:**
```json
{
  "itemId": "RFQ-001-1",
  "name": "Office Chairs",
  "description": "Ergonomic, mesh back, adjustable height and armrests",
  "quantity": 50,
  "unit": "pcs",
  "specifications": {
    "material": "mesh",
    "color": "black",
    "warranty": "3 years",
    "loadCapacity": "120kg"
  },
  "attachments": [
    "https://storage.rez.app/attachments/chair-design.pdf"
  ],
  "priority": "high"
}
```

---

### QuoteItem

Line item within a Supplier Quote.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `rfqItemId` | string | Yes | Reference to RFQ item | `"RFQ-001-1"` | Must match RFQ item |
| `productName` | string | Yes | Supplier's product name | `"Premium Ergonomic Chair"` | Max 300 characters |
| `sku` | string | No | Supplier's SKU | `"PEC-001"` | Max 50 characters |
| `description` | string | No | Product description | `"High-back with lumbar support"` | Max 1000 characters |
| `quantity` | number | Yes | Quoted quantity | `50` | Must match RFQ quantity |
| `unit` | string | Yes | Unit of measurement | `"pcs"` | Max 20 characters |
| `unitPrice` | number | Yes | Price per unit | `4500.00` | Positive decimal, 2 decimal places |
| `taxRate` | number | Yes | Tax percentage | `18` | 0-100 |
| `taxAmount` | number | Yes | Calculated tax amount | `40500.00` | Auto-calculated |
| `discount` | number | No | Discount offered | `2000.00` | Positive decimal |
| `total` | number | Yes | Line item total | `235000.00` | Auto-calculated |
| `leadTimeDays` | number | No | Delivery lead time | `14` | Positive integer |
| `available` | boolean | Yes | Item availability | `true` | Boolean |

**Calculated Fields:**
```
taxAmount = quantity * unitPrice * (taxRate / 100)
total = (quantity * unitPrice) + taxAmount - discount
```

**Example:**
```json
{
  "rfqItemId": "RFQ-001-1",
  "productName": "Premium Ergonomic Chair",
  "sku": "PEC-001",
  "description": "High-back with lumbar support, adjustable armrests",
  "quantity": 50,
  "unit": "pcs",
  "unitPrice": 4500.00,
  "taxRate": 18,
  "taxAmount": 40500.00,
  "discount": 2000.00,
  "total": 235000.00,
  "leadTimeDays": 14,
  "available": true
}
```

---

### CreditTransaction

Individual transaction within a CreditLine.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `transactionId` | string | Yes | Unique transaction ID | `"CTX-2024-001234"` | Max 50 characters |
| `type` | string | Yes | Transaction type | `"purchase"` | Enum: `purchase`, `payment`, `adjustment`, `interest`, `refund` |
| `amount` | number | Yes | Transaction amount | `50000.00` | Positive decimal, 2 decimal places |
| `balance` | number | Yes | Running balance after transaction | `50000.00` | Decimal, 2 decimal places |
| `reference` | string | No | Reference document | `"PO-2024-001"` | Max 100 characters |
| `purchaseOrderId` | ObjectId | No | Link to PO if applicable | `ObjectId("...")` | Valid ObjectId |
| `description` | string | Yes | Transaction description | `"PO-2024-001 - Office Chairs"` | Max 500 characters |
| `dueDate` | Date | No | Payment due date | `ISODate("2024-07-15")` | Valid date |
| `paidAt` | Date | No | Actual payment date | `ISODate("2024-07-10")` | Valid date |
| `interestAmount` | number | No | Interest charged | `250.00` | Positive decimal |
| `metadata` | object | No | Additional transaction data | `{}` | Flexible key-value pairs |
| `createdAt` | Date | Yes | Transaction timestamp | `ISODate("2024-06-15")` | Auto-generated |

**Example:**
```json
{
  "transactionId": "CTX-2024-001234",
  "type": "purchase",
  "amount": 50000.00,
  "balance": 50000.00,
  "reference": "PO-2024-001",
  "purchaseOrderId": ObjectId("507f1f77bcf86cd799439011"),
  "description": "PO-2024-001 - Office Chairs",
  "dueDate": ISODate("2024-07-15"),
  "paidAt": null,
  "interestAmount": 0,
  "metadata": {
    "poAmount": 50000.00,
    "taxAmount": 9000.00
  },
  "createdAt": ISODate("2024-06-15T10:30:00Z")
}
```

---

## Collections

### Supplier

Stores supplier/vendor information for B2B procurement.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `name` | string | Yes | Supplier company name | `"ABC Textiles Pvt Ltd"` | 2-200 characters |
| `phone` | string | Yes | Primary contact phone | `"+919876543210"` | E.164 format or 10-digit Indian |
| `email` | string | No | Primary contact email | `"sales@abctextiles.com"` | Valid email format |
| `gstin` | string | No | Goods and Services Tax ID | `"27AAACH1234P1Z5"` | 15 characters, uppercase |
| `address` | Address | No | Primary business address | `{...}` | Valid Address object |
| `creditLimit` | number | Yes | Maximum credit allowed | `500000.00` | Positive decimal, default 0 |
| `currentBalance` | number | Yes | Outstanding balance | `125000.00` | Positive decimal, default 0 |
| `paymentTermsDays` | number | Yes | Credit payment period | `30` | Integer, 0-365 |
| `category` | string | No | Supplier category | `"textiles"` | Max 100 characters |
| `status` | string | Yes | Supplier status | `"active"` | Enum: `active`, `inactive` |
| `bankDetails` | BankDetails | No | Bank account information | `{...}` | Valid BankDetails object |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-01-15")` | Auto-generated |
| `updatedAt` | Date | Yes | Last modification timestamp | `ISODate("2024-06-20")` | Auto-updated |

**Indexes:**
- `merchantId` (ascending)
- `gstin` (unique, sparse)
- `phone` (ascending)
- `email` (ascending, sparse)
- `status` (ascending)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "name": "ABC Textiles Pvt Ltd",
  "phone": "+919876543210",
  "email": "sales@abctextiles.com",
  "gstin": "27AAACH1234P1Z5",
  "address": {
    "street": "456 Textile Mill Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400064",
    "country": "India"
  },
  "creditLimit": 500000.00,
  "currentBalance": 125000.00,
  "paymentTermsDays": 30,
  "category": "textiles",
  "status": "active",
  "bankDetails": {
    "bankName": "State Bank of India",
    "accountNumber": "40123456789",
    "accountHolderName": "ABC Textiles Pvt Ltd",
    "ifscCode": "SBIN0001234"
  },
  "createdAt": ISODate("2024-01-15T09:00:00Z"),
  "updatedAt": ISODate("2024-06-20T14:30:00Z")
}
```

---

### PurchaseOrder

Records purchase orders created against suppliers.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `poNumber` | string | Yes | Human-readable PO number | `"PO-2024-000123"` | Auto-generated, unique per merchant |
| `supplierId` | ObjectId | Yes | Supplier reference | `ObjectId("...")` | Required, valid ObjectId |
| `items` | POItem[] | Yes | Line items array | `[{...}, {...}]` | Min 1 item |
| `subtotal` | number | Yes | Sum of item totals before tax | `250000.00` | Auto-calculated |
| `tax` | number | Yes | Total tax amount | `45000.00` | Auto-calculated |
| `total` | number | Yes | Grand total (subtotal + tax - discounts) | `295000.00` | Auto-calculated |
| `status` | string | Yes | PO lifecycle status | `"approved"` | See PO Status enum |
| `expectedDeliveryDate` | Date | No | Promised delivery date | `ISODate("2024-07-15")` | Future date preferred |
| `actualDeliveryDate` | Date | No | Actual delivery date | `ISODate("2024-07-14")` | Valid date |
| `notes` | string | No | General PO notes | `"Please include invoice"` | Max 2000 characters |
| `terms` | string | No | Payment/shipping terms | `"FOB destination"` | Max 2000 characters |
| `creditLineId` | ObjectId | No | Linked credit line | `ObjectId("...")` | Valid ObjectId, sparse |
| `createdBy` | ObjectId | Yes | User who created PO | `ObjectId("...")` | Required, valid ObjectId |
| `approvedBy` | ObjectId | No | User who approved PO | `ObjectId("...")` | Valid ObjectId |
| `approvedAt` | Date | No | Approval timestamp | `ISODate("2024-06-10")` | Valid datetime |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-06-01")` | Auto-generated |
| `updatedAt` | Date | Yes | Last modification timestamp | `ISODate("2024-06-15")` | Auto-updated |

**Calculated Fields:**
```
subtotal = sum(items.quantity * items.unitPrice)
tax = sum(items.taxAmount)
total = subtotal + tax - sum(items.discount)
```

**Status Transitions:**
```
draft -> pending, cancelled
pending -> approved, cancelled
approved -> delivered, partial, cancelled
partial -> delivered
delivered -> paid
paid -> (terminal)
cancelled -> (terminal)
```

**Indexes:**
- `merchantId` (ascending)
- `poNumber` (unique)
- `supplierId` (ascending)
- `status` (ascending)
- `createdAt` (descending)
- `createdBy` (ascending)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "poNumber": "PO-2024-000123",
  "supplierId": ObjectId("507f1f77bcf86cd799439011"),
  "items": [
    {
      "productId": ObjectId("507f1f77bcf86cd799439015"),
      "sku": "CHAIR-001",
      "name": "Office Chair Premium",
      "quantity": 100,
      "unit": "pcs",
      "unitPrice": 2500.00,
      "taxRate": 18,
      "taxAmount": 45000.00,
      "discount": 0,
      "total": 295000.00,
      "deliveredQuantity": 100,
      "notes": ""
    }
  ],
  "subtotal": 250000.00,
  "tax": 45000.00,
  "total": 295000.00,
  "status": "delivered",
  "expectedDeliveryDate": ISODate("2024-07-15"),
  "actualDeliveryDate": ISODate("2024-07-14"),
  "notes": "Please include original invoice with delivery",
  "terms": "Payment due within 30 days of delivery",
  "creditLineId": ObjectId("507f1f77bcf86cd799439025"),
  "createdBy": ObjectId("507f1f77bcf86cd799439030"),
  "approvedBy": ObjectId("507f1f77bcf86cd799439031"),
  "approvedAt": ISODate("2024-06-10T11:00:00Z"),
  "createdAt": ISODate("2024-06-01T09:30:00Z"),
  "updatedAt": ISODate("2024-07-14T16:00:00Z")
}
```

---

### RFQ (Request for Quotation)

Captures supplier quote requests for procurement planning.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `rfqNumber` | string | Yes | Human-readable RFQ number | `"RFQ-2024-000045"` | Auto-generated, unique per merchant |
| `title` | string | Yes | RFQ title/subject | `"Office Furniture Supply Q3"` | 5-200 characters |
| `description` | string | No | Detailed requirements | `"Quarterly furniture procurement..."` | Max 5000 characters |
| `items` | RFQItem[] | Yes | Requested items array | `[{...}, {...}]` | Min 1 item |
| `deadline` | Date | Yes | Quote submission deadline | `ISODate("2024-06-30")` | Future date required |
| `status` | string | Yes | RFQ lifecycle status | `"open"` | See RFQ Status enum |
| `awardedQuoteId` | ObjectId | No | Selected winning quote | `ObjectId("...")` | Valid ObjectId, sparse |
| `createdBy` | ObjectId | Yes | User who created RFQ | `ObjectId("...")` | Required, valid ObjectId |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-06-01")` | Auto-generated |
| `updatedAt` | Date | Yes | Last modification timestamp | `ISODate("2024-06-15")` | Auto-updated |

**Status Transitions:**
```
draft -> open, cancelled
open -> closed, awarded
closed -> (terminal, no award)
awarded -> (terminal)
cancelled -> (terminal)
```

**Indexes:**
- `merchantId` (ascending)
- `rfqNumber` (unique)
- `status` (ascending)
- `deadline` (ascending)
- `createdBy` (ascending)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439040"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "rfqNumber": "RFQ-2024-000045",
  "title": "Office Furniture Supply Q3",
  "description": "Quarterly furniture procurement for new office expansion. Looking for ergonomic chairs, standing desks, and meeting room furniture.",
  "items": [
    {
      "itemId": "RFQ-045-1",
      "name": "Ergonomic Office Chair",
      "description": "Mesh back, adjustable armrests, lumbar support, 5-year warranty",
      "quantity": 50,
      "unit": "pcs",
      "specifications": {
        "material": "mesh",
        "color": "black",
        "warranty": "5 years",
        "loadCapacity": "150kg"
      },
      "attachments": [],
      "priority": "high"
    },
    {
      "itemId": "RFQ-045-2",
      "name": "Standing Desk",
      "description": "Electric height adjustable, memory presets, cable management",
      "quantity": 30,
      "unit": "pcs",
      "specifications": {
        "type": "electric",
        "heightRange": "70-120cm",
        "weightCapacity": "80kg"
      },
      "attachments": [],
      "priority": "medium"
    }
  ],
  "deadline": ISODate("2024-06-30T23:59:59Z"),
  "status": "open",
  "awardedQuoteId": null,
  "createdBy": ObjectId("507f1f77bcf86cd799439030"),
  "createdAt": ISODate("2024-06-01T10:00:00Z"),
  "updatedAt": ISODate("2024-06-15T14:30:00Z")
}
```

---

### Quote

Supplier quotations submitted in response to RFQs.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `rfqId` | ObjectId | Yes | Parent RFQ reference | `ObjectId("...")` | Required, valid ObjectId |
| `supplierId` | ObjectId | Yes | Supplier reference | `ObjectId("...")` | Required, valid ObjectId |
| `items` | QuoteItem[] | Yes | Quoted items array | `[{...}, {...}]` | Min 1 item |
| `subtotal` | number | Yes | Sum of item totals before tax | `235000.00` | Auto-calculated |
| `tax` | number | Yes | Total tax amount | `42300.00` | Auto-calculated |
| `total` | number | Yes | Grand total | `277300.00` | Auto-calculated |
| `validityDays` | number | Yes | Quote validity period | `30` | Integer, 1-365 |
| `notes` | string | No | Supplier notes/conditions | `"Free delivery on orders over 1L"` | Max 2000 characters |
| `status` | string | Yes | Quote status | `"submitted"` | See Quote Status enum |
| `submittedAt` | Date | Yes | Quote submission timestamp | `ISODate("2024-06-20")` | Auto-generated |
| `respondedAt` | Date | No | Merchant response timestamp | `ISODate("2024-06-25")` | Valid datetime |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-06-20")` | Auto-generated |

**Calculated Fields:**
```
subtotal = sum(items.quantity * items.unitPrice)
tax = sum(items.taxAmount)
total = subtotal + tax - sum(items.discount)
```

**Status Transitions:**
```
submitted -> accepted, rejected, expired
accepted -> (terminal)
rejected -> (terminal)
expired -> (terminal)
```

**Indexes:**
- `rfqId` (ascending)
- `supplierId` (ascending)
- `status` (ascending)
- `submittedAt` (descending)
- Compound: `{ rfqId, supplierId }` (unique)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439050"),
  "rfqId": ObjectId("507f1f77bcf86cd799439040"),
  "supplierId": ObjectId("507f1f77bcf86cd799439011"),
  "items": [
    {
      "rfqItemId": "RFQ-045-1",
      "productName": "Premium Ergonomic Chair",
      "sku": "PEC-001",
      "description": "High-back mesh chair with adjustable everything",
      "quantity": 50,
      "unit": "pcs",
      "unitPrice": 4500.00,
      "taxRate": 18,
      "taxAmount": 40500.00,
      "discount": 0,
      "total": 235500.00,
      "leadTimeDays": 14,
      "available": true
    }
  ],
  "subtotal": 235000.00,
  "tax": 42300.00,
  "total": 277300.00,
  "validityDays": 30,
  "notes": "Free delivery on orders above Rs. 1 lakh. Installation included.",
  "status": "submitted",
  "submittedAt": ISODate("2024-06-20T15:30:00Z"),
  "respondedAt": null,
  "createdAt": ISODate("2024-06-20T15:30:00Z")
}
```

---

### CreditLine

Manages supplier credit facilities and transactions.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `supplierId` | ObjectId | Yes | Supplier reference | `ObjectId("...")` | Required, valid ObjectId |
| `creditLimit` | number | Yes | Maximum credit amount | `1000000.00` | Positive decimal, 2 decimal places |
| `usedAmount` | number | Yes | Currently utilized credit | `450000.00` | Positive decimal, 2 decimal places |
| `availableAmount` | number | Yes | Remaining credit | `550000.00` | Computed: creditLimit - usedAmount |
| `interestRate` | number | No | Annual interest rate on outstanding | `12` | Percentage, 0-100 |
| `billingCycle` | string | Yes | Interest calculation period | `"monthly"` | Enum: `monthly`, `quarterly` |
| `nextBillingDate` | Date | Yes | Next billing/interest calculation date | `ISODate("2024-07-01")` | Valid date |
| `status` | string | Yes | Credit line status | `"active"` | Enum: `active`, `suspended`, `closed` |
| `transactions` | CreditTransaction[] | Yes | Transaction history array | `[{...}]` | Embedded documents |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-01-01")` | Auto-generated |
| `updatedAt` | Date | Yes | Last modification timestamp | `ISODate("2024-06-15")` | Auto-updated |

**Invariant:**
```
availableAmount = creditLimit - usedAmount
```

**Business Rules:**
- `usedAmount` cannot exceed `creditLimit`
- When credit line is closed, no new transactions allowed
- Interest is calculated and added to `usedAmount` on billing date

**Indexes:**
- `merchantId` (ascending)
- `supplierId` (ascending)
- `status` (ascending)
- Compound: `{ merchantId, supplierId }` (unique)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439060"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "supplierId": ObjectId("507f1f77bcf86cd799439011"),
  "creditLimit": 1000000.00,
  "usedAmount": 450000.00,
  "availableAmount": 550000.00,
  "interestRate": 12,
  "billingCycle": "monthly",
  "nextBillingDate": ISODate("2024-07-01"),
  "status": "active",
  "transactions": [
    {
      "transactionId": "CTX-2024-001",
      "type": "purchase",
      "amount": 250000.00,
      "balance": 250000.00,
      "reference": "PO-2024-001",
      "purchaseOrderId": ObjectId("507f1f77bcf86cd799439020"),
      "description": "Purchase - Office Furniture",
      "dueDate": ISODate("2024-07-01"),
      "paidAt": null,
      "interestAmount": 0,
      "createdAt": ISODate("2024-06-01")
    },
    {
      "transactionId": "CTX-2024-002",
      "type": "purchase",
      "amount": 200000.00,
      "balance": 450000.00,
      "reference": "PO-2024-002",
      "purchaseOrderId": ObjectId("507f1f77bcf86cd799439021"),
      "description": "Purchase - Electronics",
      "dueDate": ISODate("2024-07-15"),
      "paidAt": null,
      "interestAmount": 0,
      "createdAt": ISODate("2024-06-10")
    }
  ],
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-06-10T10:00:00Z")
}
```

---

### BankTransaction

Records imported bank statement transactions for reconciliation.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `importBatchId` | ObjectId | Yes | Bank statement import batch reference | `ObjectId("...")` | Required, valid ObjectId |
| `transactionDate` | Date | Yes | Date of bank transaction | `ISODate("2024-06-15")` | Valid date |
| `description` | string | Yes | Transaction description from bank | `"NEFT CREDIT FROM ABC SUPPLIERS"` | Max 500 characters |
| `amount` | number | Yes | Transaction amount | `50000.00` | Positive decimal, 2 decimal places |
| `type` | string | Yes | Credit or debit | `"credit"` | Enum: `credit`, `debit` |
| `reference` | string | No | Payment reference/UTR number | `"N24061500001"` | Max 50 characters |
| `matched` | boolean | Yes | Whether transaction is reconciled | `true` | Default: `false` |
| `matchedPaymentId` | ObjectId | No | Linked payment document | `ObjectId("...")` | Valid ObjectId, sparse |
| `confidence` | number | No | Auto-match confidence score | `0.95` | 0.0-1.0 |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-06-16")` | Auto-generated |

**Auto-Matching Process:**
1. System applies `ReconciliationRule` patterns
2. Exact matches (UTR/ reference) = 100% confidence
3. Fuzzy matches (description patterns) = 50-95% confidence
4. Manual review required if confidence < 80%

**Indexes:**
- `merchantId` (ascending)
- `importBatchId` (ascending)
- `transactionDate` (descending)
- `matched` (ascending)
- `reference` (ascending, sparse)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439070"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "importBatchId": ObjectId("507f1f77bcf86cd799439071"),
  "transactionDate": ISODate("2024-06-15T00:00:00Z"),
  "description": "NEFT CREDIT FROM ABC SUPPLIERS",
  "amount": 50000.00,
  "type": "credit",
  "reference": "N24061500001",
  "matched": true,
  "matchedPaymentId": ObjectId("507f1f77bcf86cd799439075"),
  "confidence": 1.0,
  "createdAt": ISODate("2024-06-16T08:00:00Z")
}
```

---

### ReconciliationRule

Defines patterns for automatic bank-to-payment matching.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `name` | string | Yes | Rule name for identification | `"UPI Payment Match"` | 2-100 characters |
| `pattern` | string | Yes | Pattern to match in bank description | `"UPI.*" ` | Max 500 characters |
| `matchType` | string | Yes | Matching strategy | `"regex"` | Enum: `exact`, `contains`, `regex` |
| `priority` | number | Yes | Rule evaluation order (lower = higher priority) | `1` | Positive integer, 1-1000 |
| `autoMatch` | boolean | Yes | Enable automatic matching | `true` | Default: `true` |
| `status` | string | Yes | Rule status | `"active"` | Enum: `active`, `inactive` |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-01-01")` | Auto-generated |

**Match Type Behavior:**

| Type | Behavior | Example Pattern | Matches |
|------|----------|-----------------|---------|
| `exact` | Exact string match (case-insensitive) | `"NEFT CREDIT"` | `"NEFT CREDIT"` only |
| `contains` | Substring match | `"ABC SUPPLIER"` | Any containing "ABC Supplier" |
| `regex` | Regular expression match | `"UPI.*CR"` | UPI credits |

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439080"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "name": "NEFT Payment Match",
  "pattern": "NEFT.*CREDIT.*FROM",
  "matchType": "regex",
  "priority": 10,
  "autoMatch": true,
  "status": "active",
  "createdAt": ISODate("2024-01-01T00:00:00Z")
}
```

---

### ReminderTemplate

Defines reusable reminder message templates.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `name` | string | Yes | Template name | `"Payment Reminder - 7 Days"` | 2-100 characters |
| `channel` | string | Yes | Delivery channel | `"whatsapp"` | Enum: `whatsapp`, `sms`, `email` |
| `subject` | string | No | Email subject line | `"Payment Reminder - Invoice #{{invoiceNumber}}"` | Max 200 characters, required for email |
| `templateId` | string | No | External template ID (e.g., WhatsApp Business) | `"welcome_template"` | Max 100 characters |
| `body` | string | Yes | Message template body | `"Dear {{supplierName}}..."` | 10-5000 characters |
| `variables` | string[] | Yes | Required template variables | `["supplierName", "amount"]` | Array of variable names |
| `delayDays` | number | Yes | Days after event to send | `7` | Integer, 0-365 |
| `priority` | string | Yes | Message priority level | `"medium"` | Enum: `low`, `medium`, `high` |
| `status` | string | Yes | Template status | `"active"` | Enum: `active`, `inactive` |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-01-01")` | Auto-generated |

**Variable Substitution:**
Variables in body are replaced using `{{variableName}}` syntax.

Available context variables:
- `{{supplierName}}` - Supplier company name
- `{{invoiceNumber}}` - Invoice number
- `{{amount}}` - Outstanding amount
- `{{dueDate}}` - Payment due date
- `{{merchantName}}` - Merchant company name
- `{{poNumber}}` - Purchase order number

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439090"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Payment Reminder - 7 Days",
  "channel": "whatsapp",
  "subject": null,
  "templateId": "payment_reminder_7d",
  "body": "Dear {{supplierName}},\n\nThis is a friendly reminder that payment of Rs. {{amount}} for Invoice #{{invoiceNumber}} is due on {{dueDate}}.\n\nPlease contact us if you have any queries.\n\nRegards,\n{{merchantName}}",
  "variables": ["supplierName", "amount", "invoiceNumber", "dueDate", "merchantName"],
  "delayDays": 7,
  "priority": "medium",
  "status": "active",
  "createdAt": ISODate("2024-01-01T00:00:00Z")
}
```

---

### ReminderSequence

Tracks individual reminder messages in a sequence.

| Field | Data Type | Required | Description | Example | Validation |
|-------|-----------|----------|-------------|---------|------------|
| `_id` | ObjectId | Yes | Unique document identifier | `ObjectId("...")` | Auto-generated |
| `merchantId` | ObjectId | Yes | Parent merchant organization | `ObjectId("...")` | Required, valid ObjectId |
| `supplierId` | ObjectId | Yes | Supplier reference | `ObjectId("...")` | Required, valid ObjectId |
| `invoiceId` | ObjectId | Yes | Invoice/PO reference | `ObjectId("...")` | Required, valid ObjectId |
| `templateId` | ObjectId | Yes | Reminder template reference | `ObjectId("...")` | Required, valid ObjectId |
| `scheduledFor` | Date | Yes | Scheduled send timestamp | `ISODate("2024-07-08")` | Valid datetime |
| `sentAt` | Date | No | Actual send timestamp | `ISODate("2024-07-08T10:00:00Z")` | Valid datetime |
| `status` | string | Yes | Reminder status | `"pending"` | Enum: `pending`, `sent`, `failed`, `cancelled` |
| `error` | string | No | Error message if failed | `"Template not found"` | Max 500 characters |
| `createdAt` | Date | Yes | Document creation timestamp | `ISODate("2024-07-01")` | Auto-generated |

**Status Transitions:**
```
pending -> sent, failed, cancelled
sent -> (terminal)
failed -> (terminal)
cancelled -> (terminal)
```

**Indexes:**
- `merchantId` (ascending)
- `supplierId` (ascending)
- `invoiceId` (ascending)
- `status` (ascending)
- `scheduledFor` (ascending)
- Compound: `{ invoiceId, templateId }` (sparse)

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439100"),
  "merchantId": ObjectId("507f1f77bcf86cd799439012"),
  "supplierId": ObjectId("507f1f77bcf86cd799439011"),
  "invoiceId": ObjectId("507f1f77bcf86cd799439020"),
  "templateId": ObjectId("507f1f77bcf86cd799439090"),
  "scheduledFor": ISODate("2024-07-08T10:00:00Z"),
  "sentAt": ISODate("2024-07-08T10:00:15Z"),
  "status": "sent",
  "error": null,
  "createdAt": ISODate("2024-07-01T00:00:00Z")
}
```

---

## Enumerations

### Supplier Status
| Value | Description |
|-------|-------------|
| `active` | Supplier is active and can receive orders |
| `inactive` | Supplier is temporarily or permanently disabled |

### PurchaseOrder Status
| Value | Description |
|-------|-------------|
| `draft` | PO created but not yet submitted |
| `pending` | PO submitted, awaiting approval |
| `approved` | PO approved, awaiting delivery |
| `delivered` | All items delivered |
| `partial` | Some items delivered |
| `paid` | Payment completed |
| `cancelled` | PO cancelled |

### RFQ Status
| Value | Description |
|-------|-------------|
| `draft` | RFQ being prepared |
| `open` | Accepting quotes from suppliers |
| `closed` | Deadline passed, no award made |
| `awarded` | Quote selected, contract awarded |

### Quote Status
| Value | Description |
|-------|-------------|
| `submitted` | Quote submitted by supplier |
| `accepted` | Quote accepted by merchant |
| `rejected` | Quote rejected by merchant |
| `expired` | Quote validity period ended |

### CreditLine Status
| Value | Description |
|-------|-------------|
| `active` | Credit line is active and usable |
| `suspended` | Credit line temporarily suspended |
| `closed` | Credit line permanently closed |

### Billing Cycle
| Value | Description |
|-------|-------------|
| `monthly` | Interest calculated monthly |
| `quarterly` | Interest calculated quarterly |

### Transaction Type
| Value | Description |
|-------|-------------|
| `purchase` | Credit purchase from supplier |
| `payment` | Payment made to supplier |
| `adjustment` | Manual balance adjustment |
| `interest` | Interest charged on outstanding |
| `refund` | Credit/refund from supplier |

### Bank Transaction Type
| Value | Description |
|-------|-------------|
| `credit` | Money received (payment from merchant to supplier) |
| `debit` | Money sent (payment from merchant to supplier) |

### Match Type
| Value | Description |
|-------|-------------|
| `exact` | Exact string match (case-insensitive) |
| `contains` | Substring match |
| `regex` | Regular expression pattern match |

### Reminder Channel
| Value | Description |
|-------|-------------|
| `whatsapp` | WhatsApp Business message |
| `sms` | SMS text message |
| `email` | Email message |

### Reminder Priority
| Value | Description |
|-------|-------------|
| `low` | Low priority, sent during business hours |
| `medium` | Medium priority, standard delivery |
| `high` | High priority, expedited delivery |

### Reminder Status
| Value | Description |
|-------|-------------|
| `pending` | Scheduled but not yet sent |
| `sent` | Successfully sent |
| `failed` | Sending failed |
| `cancelled` | Reminder cancelled |

### Rule Status
| Value | Description |
|-------|-------------|
| `active` | Rule is enabled |
| `inactive` | Rule is disabled |

---

## Appendix: Common Validation Patterns

### Indian Phone Number
```
Pattern: ^(\+91)?[6-9]\d{9}$
Example: "+919876543210" or "9876543210"
```

### GSTIN (Goods and Services Tax Identification Number)
```
Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
Example: "27AAACH1234P1Z5"
```

### IFSC Code (Indian Financial System Code)
```
Pattern: ^[A-Z]{4}0[A-Z0-9]{6}$
Example: "HDFC0001234"
```

### ObjectId
```
Pattern: ^[0-9a-fA-F]{24}$
Example: "507f1f77bcf86cd799439011"
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-12 | Initial release with all models |

---

*Document generated for ReZ Merchant B2B Platform*
