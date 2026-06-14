# Reconciliation Module

## Overview

The Reconciliation module handles matching bank transactions with internal payment records and purchase orders. It supports automatic and manual matching, multiple match types, and provides tools for accounting reconciliation.

## Key Features

### Bank Statement Processing
- Import bank transactions from CSV/Excel
- Parse NEFT, RTGS, UPI, and cheque transactions
- Track running balance
- Duplicate detection

### Automatic Matching
- **Exact Match**: Transaction amount matches PO/payment exactly
- **Contains Match**: Reference number found in description
- **Regex Match**: Pattern-based matching
- **Range Match**: Amount within tolerance range

### Manual Review
- Pending matches queue
- Side-by-side comparison
- Manual override capability
- Audit trail for all actions

### Reconciliation Reports
- Matched vs unmatched summary
- Age analysis of unreconciled items
- Match rate metrics
- Export for audit

## Data Models

### BankTransaction Schema

```typescript
interface BankTransaction {
  _id: ObjectId;
  merchantId: ObjectId;

  transactionDate: Date;
  valueDate?: Date;
  description: string;
  amount: number;

  transactionType: 'credit' | 'debit';

  bankReferenceNumber?: string;
  utrNumber?: string;
  chequeNumber?: string;
  accountNumber?: string;
  branchName?: string;

  runningBalance?: number;

  isReconciled: boolean;
  reconciledAt?: Date;

  matchType?: ReconciliationMatchType;
  matchedPOId?: ObjectId;
  matchedPaymentId?: ObjectId;

  rawData?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

enum ReconciliationMatchType {
  EXACT = 'exact',           // Exact amount match
  CONTAINS = 'contains',    // Reference in description
  REGEX = 'regex',          // Pattern match
  RANGE = 'range',          // Amount within tolerance
  MANUAL = 'manual'         // Manual override
}
```

### MatchRecord Schema

```typescript
interface MatchRecord {
  _id: ObjectId;
  merchantId: ObjectId;

  bankTransactionId: ObjectId;
  paymentId?: ObjectId;
  poId?: ObjectId;

  matchType: ReconciliationMatchType;
  confidence: number;           // 0-100

  matchedBy: 'system' | 'user';
  userId?: ObjectId;

  matchedAt: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Bank Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reconciliation/transactions` | List bank transactions |
| `POST` | `/reconciliation/transactions/import` | Import from CSV |
| `GET` | `/reconciliation/transactions/:id` | Get transaction details |
| `PUT` | `/reconciliation/transactions/:id` | Update transaction |

### Reconciliation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reconciliation/match` | Auto-match transactions |
| `POST` | `/reconciliation/match/:transactionId` | Match specific transaction |
| `POST` | `/reconciliation/unmatch/:transactionId` | Remove match |
| `POST` | `/reconciliation/approve/:matchId` | Approve auto-match |
| `POST` | `/reconciliation/reject/:matchId` | Reject auto-match |

### Pending Review

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reconciliation/pending` | List pending matches |
| `GET` | `/reconciliation/pending/count` | Count pending matches |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reconciliation/report` | Reconciliation report |
| `GET` | `/reconciliation/unmatched` | List unmatched transactions |
| `GET` | `/reconciliation/summary` | Match rate summary |

## Matching Algorithm

### Auto-Match Process

```typescript
async function autoMatchTransactions(merchantId: string) {
  // 1. Get all unreconciled transactions
  const transactions = await BankTransaction.find({
    merchantId,
    isReconciled: false
  });

  // 2. Get all unreconciled payments
  const payments = await Payment.find({
    merchantId,
    isReconciled: false
  });

  for (const txn of transactions) {
    // Try exact match first
    const exactMatch = await findExactMatch(txn, payments);
    if (exactMatch) {
      await createMatch(txn, exactMatch, 'EXACT', 100);
      continue;
    }

    // Try contains match
    const containsMatch = await findContainsMatch(txn, payments);
    if (containsMatch) {
      await createMatch(txn, containsMatch, 'CONTAINS', 90);
      continue;
    }

    // Try regex match
    const regexMatch = await findRegexMatch(txn, payments);
    if (regexMatch) {
      await createMatch(txn, regexMatch, 'REGEX', 80);
      continue;
    }

    // Try range match (within 1% tolerance)
    const rangeMatch = await findRangeMatch(txn, payments, 0.01);
    if (rangeMatch) {
      await createMatch(txn, rangeMatch, 'RANGE', 70);
    }
  }
}
```

### Match Confidence Levels

| Match Type | Confidence | Description |
|------------|------------|-------------|
| EXACT | 100% | Amount and reference both match |
| CONTAINS | 90% | Reference found in description |
| REGEX | 80% | Pattern match on description |
| RANGE | 70% | Amount within tolerance |
| MANUAL | 100% | Manual override |

## Request/Response Examples

### Import Bank Statement

**Request:**
```bash
POST /reconciliation/transactions/import
Content-Type: multipart/form-data

file: [CSV file]
```

**CSV Format:**
```csv
Date,Description,Amount,Reference,UTR,Balance
2026-05-01,NEFT TRF FROM MERCHANT ABC,50000,TXN123456,UTR123456,100000
2026-05-02,UPI DR,25000,UPI/987654321/merchant,NULL,75000
2026-05-03,CHEQUE CLEARED,75000,CHQ456789,NULL,150000
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed",
  "data": {
    "imported": 150,
    "duplicates": 5,
    "errors": 2,
    "summary": {
      "totalCredit": 250000,
      "totalDebit": 100000,
      "startBalance": 0,
      "endBalance": 150000
    }
  }
}
```

### Match Transaction

**Request:**
```json
POST /reconciliation/match/:transactionId
{
  "matchType": "manual",
  "poId": "507f1f77bcf86cd799439011",
  "paymentId": "507f1f77bcf86cd799439012",
  "notes": "Matched with PO payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction matched",
  "data": {
    "transactionId": "...",
    "matchId": "...",
    "matchedPO": {
      "_id": "...",
      "poNumber": "PO-2026-00001"
    },
    "matchType": "manual",
    "confidence": 100
  }
}
```

### Reconciliation Report

**Response:**
```json
GET /reconciliation/report?startDate=2026-01-01&endDate=2026-03-31

{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-03-31"
    },
    "summary": {
      "totalTransactions": 500,
      "matched": 450,
      "unmatched": 50,
      "matchRate": 90.0
    },
    "byMatchType": {
      "exact": 300,
      "contains": 80,
      "regex": 40,
      "range": 20,
      "manual": 10
    },
    "unmatchedByAge": {
      "0to7days": 20,
      "8to30days": 15,
      "31to60days": 10,
      "60plusDays": 5
    },
    "unmatchedAmount": {
      "credits": 500000,
      "debits": 250000
    }
  }
}
```

## Configuration

### Match Tolerance

```typescript
const MATCH_CONFIG = {
  amountTolerance: 0.01,        // 1% amount tolerance
  dateTolerance: 3,             // 3 days date tolerance
  descriptionMinLength: 10,     // Min description length for matching
  autoMatchConfidence: 70,      // Min confidence for auto-match
  requireApprovalBelow: 90,     // Require approval below this confidence
};
```

### Bank Reference Patterns

```typescript
const REFERENCE_PATTERNS = {
  neft: /NEFT[\/\s]+([A-Z0-9]+)/i,
  rtgs: /RTGS[\/\s]+([A-Z0-9]+)/i,
  upi: /UPI[\/\s]+([\w@]+)[\/\s]+([\w]+)/i,
  imps: /IMPS[\/\s]+([A-Z0-9]+)/i,
  cheque: /CHQ[\/\s]+([0-9]+)/i,
};
```

## Error Handling

### Import Errors

| Error | Description |
|-------|-------------|
| Invalid CSV format | Cannot parse the file |
| Missing required columns | Date, Amount, Description required |
| Duplicate transaction | Transaction already imported |
| Invalid date format | Cannot parse date |

### Matching Errors

| Error | Description |
|-------|-------------|
| Already reconciled | Transaction already matched |
| PO not found | Invalid PO reference |
| Payment not found | Invalid payment reference |
| Amount mismatch | Matched amount exceeds transaction |

## Related Modules

| Module | Integration |
|--------|-------------|
| Payments | Match with payment records |
| Purchase Orders | Match with PO payments |
| Supplier Ledger | Reconciliation impacts ledger |
| Wallet | Merchant wallet reconciliation |
| Tally Sync | Export for accounting |

## File Structure

```
src/routes/
  reconciliation.ts         # Reconciliation routes

src/models/
  BankTransaction.ts      # Bank transaction model
  MatchRecord.ts          # Match record model

src/services/
  reconciliationService.ts # Reconciliation logic
  matchingService.ts      # Matching algorithms

src/schemas/
  b2b.ts                # Zod validation schemas

src/utils/
  bankParser.ts         # Bank statement parsers
```

## Usage Workflow

1. **Import**: Upload bank statement CSV
2. **Review**: Check imported transactions
3. **Auto-Match**: Run automatic matching
4. **Review Pending**: Approve/reject auto-matches
5. **Manual Match**: Match remaining items manually
6. **Generate Report**: Export reconciliation report
7. **Export**: Send to Tally/ERP
