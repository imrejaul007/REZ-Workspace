# REZ Retail CRM Service

Customer Relationship Management service for the REZ Merchant Retail Platform.

## Overview

Handles all customer-related operations including:
- Customer profiles and preferences
- Loyalty tier management
- Purchase history tracking
- Address management
- Customer segmentation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| GET | `/api/customers/top` | Get top customers |
| GET | `/api/customers/stats` | Get customer statistics |
| GET | `/api/customers/:id` | Get customer by ID |
| GET | `/api/customers/user/:userId` | Get by user ID |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| POST | `/api/customers/:id/purchases` | Add purchase |
| POST | `/api/customers/:id/addresses` | Add address |
| PUT | `/api/customers/:id/preferences` | Update preferences |
| POST | `/api/customers/:id/points` | Add loyalty points |
| POST | `/api/customers/:id/points/redeem` | Redeem points |
| POST | `/api/customers/:id/tags` | Add tag |

## Loyalty Tiers

- Bronze: 0 - 4,999 spent
- Silver: 5,000 - 19,999 spent
- Gold: 20,000 - 49,999 spent
- Platinum: 50,000 - 99,999 spent
- Diamond: 100,000+ spent

## Installation

```bash
npm install
```

## Configuration

```env
PORT=4101
MONGODB_URI=mongodb://localhost:27017/rez-retail-crm
REDIS_URL=redis://localhost:6379
```

## Running

```bash
npm run dev   # Development
npm run build && npm start   # Production
```
