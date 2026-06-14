# Coupon Management Service

Promo code and discount management for AdBazaar.

## Features

- Multiple coupon types (percentage, fixed, buy X get Y, free shipping)
- Usage limits and per-user limits
- Date-based validity
- Category and product restrictions
- Segment targeting
- Validation and redemption tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/coupons | Create coupon |
| GET | /api/coupons | List coupons |
| GET | /api/coupons/:id | Get coupon |
| PUT | /api/coupons/:id | Update coupon |
| POST | /api/coupons/:id/validate | Validate coupon |
| POST | /api/coupons/validate | Validate coupon by code |
| POST | /api/coupons/:id/redeem | Redeem coupon |
| DELETE | /api/coupons/:id | Expire coupon |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/coupon-management-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5100 | Service port |
| MONGODB_URI | mongodb://localhost:27017/coupon-management | MongoDB connection |