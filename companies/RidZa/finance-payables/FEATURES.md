# Finance Payables - Features

**Product:** AI Payables Manager  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

Bill tracking, vendor management, and payment scheduling service.

### Tagline
\`Pay Bills & Manage Vendors\`

---

## Core Features

### 1. Vendor Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Vendor | \`/api/vendors\` | POST | Add new vendor |
| List Vendors | \`/api/vendors/:tenantId\` | GET | List all vendors |
| Get Vendor | \`/api/vendors/:tenantId/:id\` | GET | Get vendor details |
| Update Vendor | \`/api/vendors/:tenantId/:id\` | PUT | Update vendor |
| Delete Vendor | \`/api/vendors/:tenantId/:id\` | DELETE | Remove vendor |

---

### 2. Bill Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Bill | \`/api/bills\` | POST | Create bill |
| List Bills | \`/api/bills/:tenantId\` | GET | List all bills |
| Get Bill | \`/api/bills/:tenantId/:id\` | GET | Get bill details |
| Update Bill | \`/api/bills/:tenantId/:id\` | PUT | Update bill |
| Process Payment | \`/api/bills/:tenantId/:id/pay\` | POST | Pay bill |

---

### 3. Payment Schedule

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Payment Schedule | \`/api/schedule/:tenantId\` | GET | Get payment schedule |

#### Schedule Features
- [x] Upcoming payments
- [x] Cash flow optimization
- [x] Due date tracking
- [x] Discount capture

---

## Features Checklist

- [x] Vendor CRUD
- [x] Bill CRUD
- [x] Payment processing
- [x] Payment scheduling
- [x] Cash flow optimization
- [x] GSTIN/PAN validation
- [x] Health checks
- [x] JWT authentication
- [x] Docker support

**Last Updated:** 2026-06-12
