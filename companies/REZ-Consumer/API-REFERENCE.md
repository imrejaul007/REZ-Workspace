# REZ-Consumer - Complete API Reference

**Version:** 1.0.0
**Date:** June 12, 2026
**Status:** ✅ ALL APIs PRODUCTION READY

---

## Overview

All REZ-Consumer services expose REST APIs with consistent patterns.

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:<PORT>` |
| Production | `https://api.rez.money` |

### Authentication

Most endpoints require authentication via:
- `Authorization: Bearer <token>`
- `X-Internal-Token: <service-token>` (for service-to-service)

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 1. verify-qr-service (Port 4003)

### Base URL
```
http://localhost:4003
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify` | Verify QR code authenticity |
| POST | `/api/activate-warranty` | Activate warranty |
| GET | `/api/warranty/:serial` | Get warranty status |
| POST | `/api/claims` | Submit warranty claim |
| GET | `/api/claims` | List claims |
| GET | `/api/claims/:id` | Get claim details |
| PUT | `/api/claims/:id` | Update claim |
| POST | `/api/merchant/register` | Register product |
| GET | `/api/merchant/:id/products` | List merchant products |
| POST | `/api/ownership/transfer` | Transfer ownership |
| GET | `/api/ownership/:serial/passport` | Get ownership passport |
| GET | `/api/oem/dashboard` | OEM dashboard analytics |
| GET | `/api/oem/counterfeit` | Counterfeit reports |
| POST | `/api/oem/recall` | Create recall campaign |
| POST | `/api/express/replacement` | Request replacement |
| GET | `/health` | Health check |

### Example: Verify QR

```bash
curl -X POST http://localhost:4003/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "REZ123456789",
    "user_id": "user_123",
    "user_phone": "+919876543210",
    "location": { "lat": 19.07, "lng": 72.87 }
  }'
```

### Example: Activate Warranty

```bash
curl -X POST http://localhost:4003/api/activate-warranty \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "REZ123456789",
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919876543210",
    "purchase_date": "2026-06-01"
  }'
```

---

## 2. safe-qr-service (Port 4001)

### Base URL
```
http://localhost:4001
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr/generate` | Generate QR code |
| POST | `/api/qr/scan` | Scan QR code |
| GET | `/api/qr/:id` | Get QR details |
| POST | `/api/blocks` | Block user |
| GET | `/api/blocks` | List blocked users |
| DELETE | `/api/blocks/:id` | Unblock user |
| POST | `/api/lost/report` | Report lost item |
| GET | `/api/lost/find` | Find lost items |
| POST | `/api/karma/award` | Award karma points |
| GET | `/api/karma/:userId` | Get karma balance |
| POST | `/api/relay` | Send anonymous message |
| GET | `/health` | Health check |

### Example: Generate QR

```bash
curl -X POST http://localhost:4001/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "mode": "pet",
    "name": "Max",
    "contact_phone": "+919876543210"
  }'
```

### Example: Scan QR

```bash
curl -X POST http://localhost:4001/api/qr/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_content": "REZ:PET:12345",
    "user_id": "user_456",
    "location": { "lat": 19.07, "lng": 72.87 }
  }'
```

---

## 3. REZ-assistant (Port 3011)

### Base URL
```
http://localhost:3011
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assistant/chat` | AI chat message |
| POST | `/api/assistant/search` | Search assistance |
| GET | `/api/assistant/preferences/:user_id` | Get preferences |
| PUT | `/api/assistant/preferences/:user_id` | Update preferences |
| POST | `/api/intents/track` | Track intent |
| GET | `/api/intents/:user_id` | Get user intents |
| POST | `/api/internal/sync` | Sync data (internal) |
| GET | `/health` | Health check |

### Example: Chat

```bash
curl -X POST http://localhost:3011/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "message": "Find nearby restaurants",
    "context": { "category": "food", "location": "Mumbai" }
  }'
```

### Example: Track Intent

```bash
curl -X POST http://localhost:3011/api/intents/track \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "intent_type": "search",
    "entities": { "query": "pizza", "location": "Mumbai" },
    "action": "search_performed"
  }'
```

---

## 4. REZ-inbox (Port 3003)

### Base URL
```
http://localhost:3003
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | List messages |
| GET | `/api/messages/:id` | Get message |
| PUT | `/api/messages/:id/read` | Mark as read |
| DELETE | `/api/messages/:id` | Delete message |
| POST | `/api/threads` | Create thread |
| GET | `/api/threads` | List threads |
| GET | `/api/threads/:id` | Get thread |
| POST | `/api/import/email` | Import email receipt |
| POST | `/api/webhook/email` | Email webhook |
| GET | `/api/subscriptions` | List subscriptions |
| POST | `/api/subscriptions` | Add subscription |
| GET | `/health` | Health check |

### Example: Import Email

```bash
curl -X POST http://localhost:3003/api/import/email \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "email": "user@example.com",
    "password": "app_password"
  }'
```

---

## 5. REZ-bills (Port 3012)

### Base URL
```
http://localhost:3012
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bills/scan` | Scan receipt |
| GET | `/api/bills/:userId` | List user bills |
| GET | `/api/bills/id/:id` | Get bill details |
| POST | `/api/bills/:id/claim-cashback` | Claim cashback |
| GET | `/api/tax/:userId` | Get tax records |
| POST | `/api/tax/generate` | Generate tax record |
| GET | `/health` | Health check |

### Example: Scan Receipt

```bash
curl -X POST http://localhost:3012/api/bills/scan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "receipt_image": "base64_encoded_image...",
    "manual_data": {
      "merchant_name": "Dominos",
      "merchant_category": "restaurant",
      "amount": 500,
      "date": "2026-06-01"
    }
  }'
```

---

## 6. REZ-expense (Port 3013)

### Base URL
```
http://localhost:3013
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expense/add` | Add expense |
| GET | `/api/expense/history/:userId` | Expense history |
| GET | `/api/expense/summary/:userId` | Spending summary |
| GET | `/api/expense/:id` | Get expense |
| PUT | `/api/expense/:id` | Update expense |
| DELETE | `/api/expense/:id` | Delete expense |
| GET | `/api/expense/budget/:userId` | Budget status |
| POST | `/api/receipt/add` | Add receipt |
| GET | `/api/receipt/:id` | Get receipt |
| POST | `/api/receipt/:id/match` | Match receipt |
| GET | `/api/insights/:userId/weekly` | Weekly insights |
| GET | `/api/insights/:userId/monthly` | Monthly insights |
| GET | `/api/insights/:userId/anomalies` | Spending anomalies |
| GET | `/api/categories/history/:userId` | Category history |
| POST | `/api/categories/learn` | Record learning |
| GET | `/health` | Health check |

### Example: Add Expense

```bash
curl -X POST http://localhost:3013/api/expense/add \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "merchant_name": "Uber",
    "category": "travel",
    "amount": 250,
    "date": "2026-06-01",
    "auto_categorize": true
  }'
```

---

## 7. REZ-nearby (Port 3014)

### Base URL
```
http://localhost:3014
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/request` | Post a request |
| GET | `/api/requests` | List requests |
| GET | `/api/request/:id` | Get request |
| PUT | `/api/request/:id/fulfill` | Mark fulfilled |
| GET | `/api/categories` | List categories |
| GET | `/api/places` | Search places |
| GET | `/health` | Health check |

### Example: Post Request

```bash
curl -X POST http://localhost:3014/api/request \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "type": "buy",
    "category": "electronics",
    "title": "Looking for iPhone 15",
    "budget": 80000,
    "location": { "city": "Mumbai", "lat": 19.07, "lng": 72.87 }
  }'
```

---

## 8. REZ-save (Port 3016)

### Base URL
```
http://localhost:3016
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/save` | Add to wishlist |
| GET | `/api/save/:userId` | List wishlist |
| DELETE | `/api/save/:itemId` | Remove item |
| POST | `/api/save/collection` | Create collection |
| GET | `/api/save/collections/:userId` | List collections |
| POST | `/api/save/transfer-to-savings` | Transfer to savings |
| GET | `/api/save/savings-balance/:userId` | Savings balance |
| GET | `/api/save/wishlist-total/:userId` | Wishlist total |
| GET | `/health` | Health check |

### Example: Add to Wishlist

```bash
curl -X POST http://localhost:3016/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "type": "product",
    "item_ref": "prod_123",
    "item_name": "iPhone 15 Pro",
    "price": 120000,
    "tags": ["electronics", "wishlist"]
  }'
```

---

## 9. REZ-scan (Port 3017)

### Base URL
```
http://localhost:3017
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Scan QR code |
| GET | `/api/scan/history/:userId` | Scan history |
| GET | `/api/scan/stats/:userId` | Scan statistics |
| GET | `/health` | Health check |

### Example: Scan QR

```bash
curl -X POST http://localhost:3017/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_content": "REZ:PAY:12345",
    "user_id": "user_123",
    "location": { "lat": 19.07, "lng": 72.87 }
  }'
```

---

## 10. REZ-menu-qr (Port 3018)

### Base URL
```
http://localhost:3018
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/menu/generate` | Generate menu QR |
| GET | `/api/menu/:id` | Get menu |
| PUT | `/api/menu/:id` | Update menu |
| POST | `/api/order` | Place order |
| GET | `/api/order/:id` | Get order |
| PUT | `/api/order/:id/status` | Update status |
| POST | `/api/table/link` | Link table |
| POST | `/api/table/:id/scan` | Scan table QR |
| GET | `/health` | Health check |

### Example: Generate Menu QR

```bash
curl -X POST http://localhost:3018/api/menu/generate \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "merchant_123",
    "merchant_name": "Dominos",
    "table_id": "table_5",
    "design": "default"
  }'
```

---

## 11. go4food-api (Port 3002)

### Base URL
```
http://localhost:3002
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | Search restaurants |
| GET | `/api/restaurants/:id` | Restaurant details |
| GET | `/api/restaurants/:id/menu` | Restaurant menu |
| GET | `/api/menu/:id` | Menu item details |
| GET | `/api/search` | Smart search |
| POST | `/api/compare` | Compare prices |
| GET | `/health` | Health check |

### Example: Search Restaurants

```bash
curl -X GET "http://localhost:3002/api/restaurants?location=Mumbai&cuisine=italian&limit=10"
```

### Example: Compare Prices

```bash
curl -X POST http://localhost:3002/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Margherita Pizza",
    "location": "Mumbai"
  }'
```

---

## 12. REZ-prive (Inside rez-app)

### API Service
```typescript
import priveApi from '@/services/priveApi';
```

### Endpoints

| Method | Function | Description |
|--------|----------|-------------|
| GET | `priveApi.getEligibility()` | Get eligibility |
| GET | `priveApi.getPillars()` | Get pillar scores |
| GET | `priveApi.getDashboard()` | Get dashboard |
| GET | `priveApi.getOffers()` | Get offers |
| GET | `priveApi.getEarnings()` | Get earnings |
| GET | `priveApi.getVouchers()` | Get vouchers |
| POST | `priveApi.checkIn()` | Daily check-in |
| POST | `priveApi.redeemCoins()` | Redeem coins |
| GET | `priveApi.getCampaigns()` | Get campaigns |
| POST | `priveApi.submitCampaignPost()` | Submit post |

---

## 13. REZ-try (Inside rez-app)

### API Service
```typescript
import tryApi from '@/services/tryApi';
```

### Endpoints

| Method | Function | Description |
|--------|----------|-------------|
| GET | `tryApi.getFeed(lat, lng)` | Get trial feed |
| GET | `tryApi.getTrialDetails(id)` | Trial details |
| POST | `tryApi.bookTrial(request)` | Book trial |
| GET | `tryApi.getHistory()` | Booking history |
| GET | `tryApi.getCoins()` | Coin balance |
| GET | `tryApi.getScore()` | Explorer score |
| GET | `tryApi.getMissions()` | Weekly missions |
| GET | `tryApi.getBundles()` | Trial bundles |
| GET | `tryApi.getLeaderboard(city, period)` | Leaderboard |
| POST | `tryApi.createPaymentOrder()` | Create order |

---

## Common Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | JSON requests |
| `Authorization: Bearer <token>` | Auth token |
| `X-Internal-Token: <token>` | Service auth |
| `X-Request-Id: <id>` | Request tracing |

---

## Rate Limits

| Service | Limit |
|---------|-------|
| verify-qr-service | 100 req/min |
| safe-qr-service | 100 req/min |
| REZ-assistant | 20 req/min (chat), 100 req/min (other) |

---

**Last Updated:** June 12, 2026