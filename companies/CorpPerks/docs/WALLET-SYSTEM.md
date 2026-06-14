# CorpPerks - Dual Wallet System Documentation

**Last Updated:** 2026-05-01

---

## Overview

CorpPerks features a **Dual Wallet System** where every employee has:

1. **Personal Wallet** - Employee's own money
2. **Corporate Wallet** - Company-loaded benefits

---

## Wallet Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ EMPLOYEE WALLET SYSTEM │
├─────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PERSONAL WALLET │ │
│ │ (Employee's Own Money) │ │
│ │ │ │
│ │ • Employee tops up │ │
│ │ • Use anywhere │ │
│ │ • 2% cashback at ReZ merchants │ │
│ │ • 1 ReZ Coin per ₹100 │ │
│ │ • Personal wallet balance: ₹5,000 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CORPORATE WALLET │ │
│ │ (Company's Money - Benefits) │ │
│ │ │ │
│ │ ┌─────────┬─────────┬─────────┬─────────┐ │ │
│ │ │ MEAL │ │TRAVEL │ │WELLNESS│ │ GIFT │ │ │
│ │ │ ₹1,500 │ │ ₹8,000 │ │ ₹3,000 │ │₹2,500│ │ │
│ │ └─────────┴─────────┴─────────┴─────────┘ │ │
│ │ │ │
│ │ • Company allocates │ │
│ │ • Category restricted │ │
│ │ • 10% discount at ReZ merchants │ │
│ │ • 5% cashback + 2 ReZ Coins/₹100 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ReZ Merchant Benefits

### Benefit Rates by Wallet Type

| Wallet | Discount | Cashback | ReZ Coins |
|--------|---------|----------|-----------|
| **Personal** | 0% | 2% | 1 per ₹100 |
| **Corporate** | 10% | 5% | 2 per ₹100 |

### Benefit Resolution Priority

```
Merchant Custom Offer (HIGHEST)
 ↑
Company Admin Set
 ↑
Platform Default (LOWEST)
```

---

## Benefits Configuration

### Who Sets What

| Role | Sets | Endpoint |
|------|------|----------|
| **ReZ Admin** | Platform defaults | `PUT /api/benefits-config/platform` |
| **Company Admin** | Corporate benefits | `PUT /api/benefits-config/company/:companyId` |
| **Merchant** | Custom offers | `PUT /api/benefits-config/merchant/:merchantId` |

### Configuration Fields

#### Platform (ReZ Admin)
```json
{
  "personal": {
    "cashbackRate": 2,
    "coinsRate": 1,
    "maxMonthlyCashback": 200
  },
  "corporate": {
    "defaultDiscountRate": 10,
    "defaultCashbackRate": 5,
    "defaultCoinsRate": 2,
    "maxMonthlyDiscount": 1000,
    "maxMonthlyCashback": 500
  }
}
```

#### Company (Company Admin)
```json
{
  "companyId": "C001",
  "benefits": {
    "corporate": {
      "discountRate": 12,
      "cashbackRate": 6,
      "coinsRate": 3,
      "maxMonthlyDiscount": 1500,
      "maxMonthlyCashback": 750
    }
  }
}
```

#### Merchant
```json
{
  "merchantId": "REZ_M001",
  "merchantName": "Spice Garden",
  "benefits": {
    "personal": {
      "cashbackRate": 3
    },
    "corporate": {
      "discountRate": 15,
      "cashbackRate": 8
    }
  }
}
```

---

## API Endpoints

### Personal Wallet

```
GET  /api/wallet/personal/:employeeId              Get wallet
POST /api/wallet/personal/:employeeId/topup       Top up
POST /api/wallet/personal/:employeeId/spend        Spend
```

### Corporate Wallet

```
GET  /api/wallet/corporate/:companyId             Company wallet
POST /api/wallet/corporate/:companyId/topup       Company top up
GET  /api/wallet/employee-corporate/:employeeId  Employee corporate wallet
GET  /api/wallet/employee-corporate/:employeeId/:type  Category wallet
POST /api/wallet/employee-corporate/:employeeId/allocate  Allocate
POST /api/wallet/employee-corporate/:employeeId/spend  Spend
```

### Combined & Comparison

```
GET  /api/wallet/combined/:employeeId              Both wallets
POST /api/wallet/compare-benefits                 Compare benefits
POST /api/benefits-config/resolve                 Calculate savings
```

### Benefits Configuration

```
GET  /api/benefits-config/platform                Platform defaults
PUT  /api/benefits-config/platform                Set platform defaults
GET  /api/benefits-config/company/:companyId      Company benefits
PUT  /api/benefits-config/company/:companyId      Set company benefits
GET  /api/benefits-config/merchant/:merchantId   Merchant benefits
PUT  /api/benefits-config/merchant/:merchantId   Set merchant benefits
GET  /api/benefits-config/roles                 Who sets what
```

---

## Example Flows

### Flow 1: Company Allocates Benefits

```
Company Admin (TechCorp) allocates monthly allowance:

POST /api/wallet/bulk-allocate
{
  "allocations": [
    { "employeeId": "E001", "type": "meal", "amount": 2000 },
    { "employeeId": "E001", "type": "travel", "amount": 10000 },
    { "employeeId": "E001", "type": "wellness", "amount": 3000 }
  ]
}

RESULT:
- John's Meal Wallet: ₹2,000
- John's Travel Wallet: ₹10,000
- John's Wellness Wallet: ₹3,000
```

### Flow 2: Employee Checks Benefits

```
Employee (John) wants to buy lunch at ReZ Restaurant:

POST /api/benefits-config/resolve
{
  "employeeId": "E001",
  "companyId": "C001",
  "merchantId": "REZ_M001",
  "walletType": "corporate",
  "amount": 500
}

RESPONSE:
{
  "discount": 75,          // 15% from Spice Garden
  "cashback": 34,         // 8% of ₹425
  "coins": 25,            // 5 coins per ₹100
  "totalSavings": 109,
  "youPay": 425,
  "source": "merchant"
}
```

### Flow 3: Employee Chooses Wallet

```
John compares both wallets:

POST /api/wallet/compare-benefits
{
  "employeeId": "E001",
  "amount": 500,
  "merchantType": "restaurant",
  "merchantId": "REZ_M001"
}

RESPONSE:
{
  "personal": {
    "youPay": 490,
    "cashback": 10,
    "coins": 5,
    "totalSavings": 10
  },
  "corporate": {
    "youPay": 425,
    "cashback": 34,
    "coins": 25,
    "totalSavings": 109
  },
  "recommendation": "Use Corporate Wallet (save ₹99 more)"
}
```

---

## Corporate Wallet Categories

| Category | For | Accepted Merchants |
|---------|-----|-------------------|
| **Meal** | Food, dining | Restaurants, cafes, groceries |
| **Travel** | Transport, hotels | Hotels, cabs, flights |
| **Wellness** | Health, fitness | Gyms, spas, pharmacy |
| **Gift** | Festival gifts | All merchants |

---

## Monthly Reset

Corporate wallets can be set to reset monthly:

```
Wallet Rules:
{
  "type": "meal",
  "monthlyLimit": 2000,
  "resetDay": 1,
  "expiry": "monthly"
}

Result: Balance resets to ₹2,000 on 1st of every month
```

---

## Transaction Types

| Type | Description |
|------|-------------|
| `topup` | Money added to wallet |
| `allocation` | Company allocated to employee |
| `spend` | Purchase made |
| `refund` | Refund received |
| `cashback` | Cashback credited |
| `coins` | ReZ Coins earned |

---

## ReZ Ecosystem Flywheel

```
Company joins CorpPerks
 ↓
Allocates employee benefits
 ↓
Employees use ReZ merchants
 ↓
Merchants get more customers
 ↓
Merchants set better offers
 ↓
More employees join
 ↓
Flywheel spins faster!
```

---

## Notes

- Benefits resolve in priority: Merchant > Company > Platform
- Cashback caps prevent abuse
- All transactions are logged
- GST invoices auto-generated for corporate purchases
