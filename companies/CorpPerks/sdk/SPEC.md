# CorpPerks SDK - SPEC.md

**Version:** 1.0.0
**Company:** CorpPerks
**Category:** SDK

---

## Overview

TypeScript/JavaScript SDK for CorpPerks employee benefits platform. Provides typed interfaces for integrating corporate benefits into React Native and web applications.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CorpPerks SDK                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Modules:                                                                  │
│  ├── Benefits    → Employee benefit operations                           │
│  ├── Payments    → Benefit payment processing                           │
│  ├── Employees   → Employee management                                   │
│  └── Companies   → Company administration                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
npm install @rez/corpperks-sdk
# or
yarn add @rez/corpperks-sdk
```

---

## Usage

```typescript
import { CorpPerksSDK } from '@rez/corpperks-sdk';

// Initialize
const sdk = new CorpPerksSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.corpperks.com'
});

// Get employee benefits
const benefits = await sdk.benefits.getEmployeeBenefits('employee-id');

// Use benefit
await sdk.benefits.utilize({
  employeeId: 'employee-id',
  amount: 500,
  merchantName: 'Restaurant'
});
```

---

## API

### Benefits
```typescript
sdk.benefits.getEmployeeBenefits(employeeId: string): Promise<Benefit[]>
sdk.benefits.getTransactions(employeeId: string): Promise<Transaction[]>
sdk.benefits.utilize(params: UtilizeParams): Promise<Transaction>
```

### Companies
```typescript
sdk.companies.get(companyId: string): Promise<Company>
sdk.companies.create(data: CreateCompanyParams): Promise<Company>
```

---

## Peer Dependencies

```json
{
  "react": ">=18.0.0",
  "react-native": ">=0.70.0"
}
```

---

## Status

- [x] Benefits API
- [x] Payment processing
- [x] Employee management
- [x] TypeScript types

