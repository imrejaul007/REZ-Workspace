# REZ Cross-Merchant Service

City-wide badges and cross-merchant rewards for the REZ Loyalty System.

## Features

- Cross-merchant badge tracking
- Multi-category progress tracking
- Automatic badge awarding
- Coin rewards for badge achievements
- Integration with wallet service for rewards

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| PORT | Service port (default: 4027) | No |
| WALLET_SERVICE_URL | Wallet service URL | Yes |
| NOTIFICATION_SERVICE_URL | Notification service URL | Yes |

## API Endpoints

### GET /api/v1/cross-merchant/:userId
Get user's cross-merchant progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "categoriesVisited": {
      "restaurant": 5,
      "retail": 3,
      "grocery": 2
    },
    "totalMerchantsVisited": 10,
    "totalSpend": 500,
    "badgesEarned": [...]
  }
}
```

### GET /api/v1/cross-merchant/:userId/badges
Get user's earned and available badges.

**Response:**
```json
{
  "success": true,
  "data": {
    "earned": [
      {
        "badgeId": "explorer",
        "name": "City Explorer",
        "description": "Visit 5 different merchants",
        "earnedAt": "2026-05-08T00:00:00.000Z"
      }
    ],
    "available": [
      {
        "badgeId": "foodie",
        "name": "Foodie",
        "description": "Visit 10 restaurants",
        "progress": 5
      }
    ]
  }
}
```

### POST /api/v1/cross-merchant/:userId/visit
Record a visit to a merchant.

**Request:**
```json
{
  "merchantId": "merchant123",
  "category": "restaurant",
  "amount": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progressUpdated": true,
    "badgesEarned": ["explorer"]
  }
}
```

## Badge Categories

| Type | Description |
|------|-------------|
| visits | Awarded for number of visits |
| spending | Awarded for total spend threshold |
| categories | Awarded for visiting specific categories |
| merchants | Awarded for visiting different merchants |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run worker   # Start badge worker
```

## License

MIT
