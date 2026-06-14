# ReZ Wallet Service API

Consumer and merchant wallet management for the ReZ platform.

## Overview

The Wallet Service handles:
- Consumer wallet operations (balance, transactions, debit/credit)
- Merchant wallet operations (balance, withdrawals, bank details)
- Consumer credit and BNPL management
- Merchant payout processing
- Referral program management
- Corporate benefits (CorpPerks)
- Credit scoring for merchants

## Base URL

```
Production: https://api.rez.money/wallet
Staging: https://staging-api.rez.money/wallet
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Consumer Wallet

### Get Balance

```http
GET /api/wallet/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1500.00,
    "coinTypes": {
      "rez": 1000,
      "cashback": 500,
      "promo": 0
    }
  }
}
```

### Get Transactions

```http
GET /api/wallet/transactions?page=1&limit=20&coinType=rez
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_xxx",
      "type": "credit",
      "amount": 100,
      "coinType": "rez",
      "source": "payment_recharge",
      "description": "Wallet recharge",
      "balance": 1500,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "hasMore": true
  }
}
```

### Debit Wallet

```http
POST /debit
Content-Type: application/json

{
  "amount": 100,
  "coinType": "rez",
  "source": "order_payment",
  "description": "Payment for order #12345",
  "idempotencyKey": "order_12345_payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_xxx",
    "newBalance": 1400
  }
}
```

### Claim Welcome Coins

```http
POST /api/wallet/welcome-coins
```

Claims 50 welcome coins. Limited to 3 claims per day.

### Get Conversion Rate

```http
GET /api/wallet/conversion-rate
```

Returns current coin-to-rupee conversion rate.

## Consumer Credit (BNPL)

### Get Credit Score

```http
GET /api/credit/score
```

### Apply for BNPL

```http
POST /api/credit/apply
Content-Type: application/json

{
  "merchantId": "merchant_xxx",
  "merchantName": "Restaurant ABC",
  "vertical": "food",
  "amount": 500
}
```

### Check Eligibility

```http
POST /api/credit/check-eligibility
Content-Type: application/json

{
  "amount": 500
}
```

### Repay BNPL

```http
POST /api/credit/repay
Content-Type: application/json

{
  "transactionId": "bnpl_xxx",
  "amount": 500
}
```

## Merchant Wallet

### Get Merchant Wallet

```http
GET /
Authorization: Bearer <merchant_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "available": 50000,
      "pending": 5000,
      "withdrawn": 100000
    },
    "bankDetails": {
      "accountNumber": "****1234",
      "bankName": "HDFC Bank",
      "verified": true
    }
  }
}
```

### Request Withdrawal

```http
POST /withdraw
Content-Type: application/json

{
  "amount": 10000
}
```

**Rate Limit:** 1 withdrawal per hour per merchant.

### Update Bank Details

```http
PUT /bank-details
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "accountHolderName": "Restaurant ABC",
  "bankName": "HDFC Bank",
  "upiId": "restaurant@upi"
}
```

## Referral System

### Register Referral (Internal)

```http
POST /internal/referral/register
X-Internal-Token: <token>
Content-Type: application/json

{
  "referrerId": "user_xxx",
  "refereeId": "user_yyy",
  "rewardAmount": 100,
  "rewardCoinType": "rez"
}
```

### Qualify Referral (Internal)

```http
POST /internal/referral/qualify
X-Internal-Token: <token>
Content-Type: application/json

{
  "refereeId": "user_yyy",
  "action": "first_order",
  "actionId": "order_xxx"
}
```

### Check Referral Status (Internal)

```http
GET /internal/referral/status/{refereeId}
X-Internal-Token: <token>
```

## Corporate Benefits (CorpPerks)

### Get Benefits

```http
GET /api/corp/benefits
X-Company-ID: company_xxx
```

### Enroll Employee

```http
POST /api/corp/employees
X-Company-ID: company_xxx
Content-Type: application/json

{
  "userId": "user_xxx",
  "employeeId": "EMP001",
  "department": "Engineering",
  "level": "L3",
  "corpRole": "corp_employee"
}
```

### Get My Benefits

```http
GET /api/corp/me
X-Company-ID: company_xxx
```

## Coin Types

| Type | Description |
|------|-------------|
| `rez` | REZ platform coins |
| `prive` | Prive premium coins |
| `branded` | Branded loyalty coins |
| `promo` | Promotional coins |
| `cashback` | Cashback rewards |
| `referral` | Referral rewards |

## Rate Limits

| Operation | Limit |
|-----------|-------|
| Wallet Credit (admin) | 20/min per admin |
| Wallet Debit | 10/min per user |
| Welcome Coins | 3/day per user |
| Payout Withdrawal | 1/hour per merchant |

## Error Codes

| Code | Description |
|------|-------------|
| `BIZ_INSUFFICIENT_BALANCE` | Not enough coins |
| `BIZ_LIMIT_EXCEEDED` | Rate limit exceeded |
| `RES_NOT_FOUND` | Wallet not found |
| `SRV_INTERNAL_ERROR` | Server error |

## Webhooks

The wallet service emits events to REZ Mind:
- `wallet.topup` - When wallet is credited
- `wallet.withdraw` - When withdrawal is requested

## Related Services

- **rez-auth-service**: User authentication
- **rez-payment-service**: Payment processing
- **rez-merchant-service**: Merchant management
