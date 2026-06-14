# rez-gift-card-service

**Port:** 4047

Gift Card Service for issuance, balance management, and redemption tracking.

## Features

- **Card Issuance** - Generate gift cards with amounts
- **Balance Management** - Check balance, view history
- **Redemption** - Apply to bookings, F&B, spa
- **Promotional Cards** - Campaigns and special offers

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cards/issue` | Issue new card |
| GET | `/api/cards/:cardNumber` | Get card details |
| GET | `/api/cards/:cardNumber/balance` | Check balance |
| POST | `/api/cards/:cardNumber/redeem` | Redeem card |
| POST | `/api/cards/:cardNumber/topup` | Add balance |
| GET | `/api/transactions/:cardNumber` | Transaction history |
| POST | `/api/campaigns` | Create campaign |

## Quick Start

```bash
npm install
npm run dev
npm test
```
