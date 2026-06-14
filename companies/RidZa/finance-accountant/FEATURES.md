# Finance Accountant - Features

**Product:** HOJAI Finance Accountant AI  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

AI-powered accounting service handling invoice management, ledger operations, and Tally integration.

### Tagline
\`Invoice → Ledger → Tally\`

---

## Core Features

### 1. Invoice Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Invoice | \`/api/invoice\` | POST | Create new invoice with line items |
| List Invoices | \`/api/invoice/:tenantId\` | GET | Get all invoices for a tenant |
| Get Invoice | \`/api/invoice/:tenantId/:invoiceId\` | GET | Get single invoice details |
| Update Status | \`/api/invoice/:tenantId/:invoiceId/status\` | PATCH | Update invoice status |

#### Invoice Statuses
- \`draft\` - Invoice created but not sent
- \`pending\` - Invoice sent, awaiting payment
- \`paid\` - Payment received
- \`cancelled\` - Invoice cancelled

#### Invoice Types
- \`sales\` - Sales invoice
- \`purchase\` - Purchase invoice
- \`credit\` - Credit note
- \`debit\` - Debit note

---

### 2. Ledger Operations

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Entry | \`/api/ledger\` | POST | Create ledger entry |
| Get Entries | \`/api/ledger/:tenantId/:ledger\` | GET | Get ledger entries |
| Ledger Summary | \`/api/ledger/:tenantId/:ledger/summary\` | GET | Get balance summary |

#### Ledger Features
- [x] Double-entry bookkeeping
- [x] Debit/Credit tracking
- [x] Multiple ledgers per tenant
- [x] Date range filtering
- [x] Running balance calculation

---

### 3. Tally Integration

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Export to Tally | \`/api/tally/export/:tenantId\` | GET | Generate Tally XML |
| Sync to Ledger | \`/api/tally/sync/:tenantId\` | POST | Sync invoices to ledger |
| Sync Status | \`/api/tally/sync/:tenantId/status\` | GET | Check sync progress |

---

## Features Checklist

- [x] Multi-tenant isolation
- [x] Invoice CRUD operations
- [x] Invoice items with tax
- [x] Multiple invoice types
- [x] Ledger double-entry
- [x] Tally XML export
- [x] Invoice-to-ledger sync
- [x] Date range filtering
- [x] Health checks
- [x] JWT authentication
- [x] Input validation
- [x] Docker support

**Last Updated:** 2026-06-12
