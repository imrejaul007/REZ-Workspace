# REZ-Mart Subscription Service

**Port:** 4110 | **Company:** REZ-Consumer | **Category:** Quick Commerce Membership

## Purpose

Manages REZ-Mart Prime and other subscription plans including membership tiers, billing cycles, and benefits delivery.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all subscriptions |
| GET | `/api/subscriptions/:id` | Get subscription details |
| POST | `/api/subscriptions` | Create subscription |
| PATCH | `/api/subscriptions/:id` | Update subscription |
| POST | `/api/subscriptions/:id/renew` | Renew subscription |
| POST | `/api/subscriptions/:id/cancel` | Cancel subscription |
| GET | `/api/subscriptions/:id/benefits` | Get member benefits |

## Environment Variables

```env
PORT=4110
MONGODB_URI=mongodb://localhost:27017/rezmart_subscriptions
NODE_ENV=development
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-subscription-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4110/health     # Service health
curl http://localhost:4110/ready      # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-order-service** | Port 4104 | Member discounts |
| **REZ-Consumer Auth** | RABTUL | User authentication |
| **RABTUL Payments** | RABTUL | Subscription billing |
| **HOJAI AI** | HOJAI | Member recommendations |

## Subscription Tiers

| Tier | Benefits |
|------|----------|
| **Prime** | Free delivery, 5% cashback, priority support |
| **Pro** | All Prime + 10% discount, early access |
| **Enterprise** | Bulk pricing, dedicated support |

## Database

- MongoDB collection: `subscriptions`
- Indexes on: `userId`, `plan`, `status`, `nextBillingDate`