# REZ-Mart Offer Service

**Port:** 4109 | **Company:** REZ-Consumer | **Category:** Quick Commerce Promotions

## Purpose

Manages offers, coupons, and promotional campaigns for REZ-Mart including discount codes, cashback offers, and store promotions.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/offers` | List active offers |
| GET | `/api/offers/:id` | Get offer details |
| POST | `/api/offers` | Create new offer |
| PATCH | `/api/offers/:id` | Update offer |
| POST | `/api/offers/validate` | Validate coupon code |
| POST | `/api/offers/apply` | Apply offer to order |
| GET | `/api/offers/stats` | Offer performance stats |

## Environment Variables

```env
PORT=4109
MONGODB_URI=mongodb://localhost:27017/rezmart_offers
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-offer-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4109/health     # Service health
curl http://localhost:4109/ready      # Database ping
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-order-service** | Port 4104 | Offer application |
| **REZ-Consumer** | REZ-Consumer | Customer-facing offers |
| **RABTUL Wallet** | RABTUL | Cashback disbursement |
| **AdBazaar** | AdBazaar | Promotional campaigns |

## Offer Types

| Type | Description |
|------|-------------|
| `coupon` | Discount codes |
| `cashback` | REZ coins on purchase |
| `discount` | Percentage off |
| `buy_x_get_y` | Bundle offers |
| `free_delivery` | Delivery waivers |

## Database

- MongoDB collection: `offers`
- Indexes on: `code`, `type`, `validFrom`, `validUntil`, `isActive`