# CorpPerks - API Reference

**Last Updated:** 2026-05-02

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Local | http://localhost:4013 |
| Production | https://corpperks-api.onrender.com |

---

## Authentication

Most endpoints require Bearer token:

```
Authorization: Bearer <token>
```

---

## Dual Wallet System

### Get Both Wallets (Personal + Corporate)

```
GET /api/wallet/combined/:employeeId
```

Response:
```json
{
  "personal": {
    "walletId": "PW001",
    "balance": 5000,
    "benefits": {
      "cashbackRate": 2,
      "coinsRate": 1
    }
  },
  "corporate": {
    "walletId": "ECW001",
    "totals": {
      "totalBalance": 15000
    },
    "wallets": {
      "meal": { "balance": 1500, "monthlyLimit": 2000 },
      "travel": { "balance": 8000, "monthlyLimit": 10000 },
      "wellness": { "balance": 3000, "monthlyLimit": 3000 },
      "gift": { "balance": 2500 }
    },
    "benefits": {
      "discountRate": 10,
      "cashbackRate": 5,
      "coinsRate": 2
    }
  },
  "combinedBalance": 20000
}
```

---

### Check Benefits Before Purchase

```
POST /api/benefits-config/resolve
```

Body:
```json
{
  "employeeId": "E001",
  "companyId": "C001",
  "merchantId": "REZ_M001",
  "walletType": "corporate",
  "amount": 500
}
```

Response:
```json
{
  "originalAmount": 500,
  "discount": 75,
  "amountAfterDiscount": 425,
  "cashback": 34,
  "coins": 25,
  "totalSavings": 109,
  "youPay": 425,
  "source": "merchant"
}
```

---

### Compare Both Wallets

```
POST /api/wallet/compare-benefits
```

Body:
```json
{
  "employeeId": "E001",
  "amount": 500,
  "merchantType": "restaurant",
  "merchantId": "REZ_M001"
}
```

Response:
```json
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

## Corporate Wallet

### Allocate to Employee

```
POST /api/wallet/employee-corporate/:employeeId/allocate
```

Body:
```json
{
  "type": "meal",
  "amount": 2000,
  "description": "Monthly meal allowance"
}
```

---

### Spend from Corporate Wallet

```
POST /api/wallet/employee-corporate/:employeeId/spend
```

Body:
```json
{
  "walletType": "meal",
  "amount": 450,
  "merchantId": "REZ_M001",
  "merchantType": "restaurant",
  "merchantName": "Spice Garden",
  "isReZMerchant": true,
  "description": "Team lunch"
}
```

---

### Bulk Allocate

```
POST /api/wallet/bulk-allocate
```

Body:
```json
{
  "allocations": [
    { "employeeId": "E001", "type": "meal", "amount": 2000 },
    { "employeeId": "E002", "type": "meal", "amount": 2000 },
    { "employeeId": "E001", "type": "travel", "amount": 10000 }
  ]
}
```

---

## Benefits Configuration

### Set Company Benefits

```
PUT /api/benefits-config/company/:companyId
```

Body:
```json
{
  "companyName": "TechCorp India",
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

---

### Set Merchant Benefits

```
PUT /api/benefits-config/merchant/:merchantId
```

Body:
```json
{
  "merchantName": "Taj Hotels",
  "merchantType": "hotel",
  "benefits": {
    "personal": {
      "cashbackRate": 5,
      "coinsRate": 3
    },
    "corporate": {
      "discountRate": 20,
      "cashbackRate": 10,
      "coinsRate": 5
    }
  }
}
```

---

### Get Benefits Roles

```
GET /api/benefits-config/roles
```

Response explains who sets what.

---

## Campaigns

### Create Campaign

```
POST /api/campaigns
```

Body:
```json
{
  "name": "Diwali Gifting 2026",
  "type": "gift",
  "description": "Festival gift for all employees",
  "budget": 500000,
  "startDate": "2026-10-15",
  "endDate": "2026-11-05"
}
```

---

### Launch Campaign

```
POST /api/campaigns/:id/launch
```

---

## GST Invoicing

### Calculate GST

```
POST /api/gst/calculate
```

Body:
```json
{
  "amount": 10000,
  "gstRate": 18
}
```

Response:
```json
{
  "subtotal": 10000,
  "cgst": 900,
  "sgst": 900,
  "totalTax": 1800,
  "grandTotal": 11800
}
```

---

### Create Invoice

```
POST /api/gst/invoices
```

Body:
```json
{
  "companyId": "C001",
  "companyName": "TechCorp India",
  "gstIn": "27AABCU9603R1ZM",
  "items": [
    {
      "description": "Hotel Booking - John Doe",
      "quantity": 1,
      "rate": 8500,
      "hsnCode": "7010"
    }
  ]
}
```

---

## HRIS Integration

### Get Providers

```
GET /api/hris/providers
```

Response:
```json
{
  "providers": [
    { "id": "greythr", "name": "GreytHR", "status": "connected" },
    { "id": "bamboo", "name": "BambooHR", "status": "disconnected" },
    { "id": "zoho", "name": "Zoho People", "status": "disconnected" }
  ]
}
```

---

### Connect HRIS

```
POST /api/hris/connect
```

Body:
```json
{
  "provider": "greythr",
  "apiKey": "your_api_key",
  "apiSecret": "your_secret"
}
```

---

## Transactions

### Get Transaction History

```
GET /api/wallet/transactions?employeeId=E001&walletType=corporate&page=1&limit=20
```

---

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "rez-corpperks-service",
  "version": "1.0.0"
}
```
