# Ridza Remittance - Features

**Product:** HOJAI Remittance API  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 4540

---

## Overview

P2P transfers and cross-border payments for GCC expats.

### Tagline
\`P2P Transfers & Cross-border Payments\`

---

## Core Features

### 1. Money Transfer

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Quote | \`/api/transfer/quote\` | POST | Get transfer quote |
| Send Money | \`/api/transfer/send\` | POST | Initiate transfer |
| Transfer Status | \`/api/transfer/:id\` | GET | Check status |
| Cancel Transfer | \`/api/transfer/:id/cancel\` | POST | Cancel transfer |

---

### 2. Exchange Rates

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Exchange Rates | \`/api/rates\` | GET | Current rates |
| Rate Convert | \`/api/rates/convert\` | POST | Convert amount |

#### Supported Currencies
USD, AED, INR, GBP, EUR, SAR, QAR, KWD, BHD, OMR

---

### 3. Recipient Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Add Recipient | \`/api/recipients\` | POST | Add recipient |
| List Recipients | \`/api/recipients\` | GET | List recipients |
| Update Recipient | \`/api/recipients/:id\` | PUT | Update recipient |
| Delete Recipient | \`/api/recipients/:id\` | DELETE | Remove recipient |

---

## Features Checklist

- [x] Real-time exchange rates
- [x] Multi-currency support
- [x] Transfer tracking
- [x] KYC integration
- [x] Recipient management
- [x] Rate locking
- [x] Fee calculation
- [x] Health checks
- [x] Docker support

**Last Updated:** 2026-06-12
