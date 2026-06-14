# REZ-save

**Wishlist/Commerce Layer Service for REZ Consumer**

A wishlist and savings management service that allows users to save items, create collections, track prices, and manage purchase intent. Built with Express, Mongoose, and integrated with REZ Intelligence.

## Overview

REZ-save enables users to save items from anywhere in the REZ ecosystem - restaurants, products, hotels, events, or services. It tracks purchase intent and integrates with REZ Intelligence for personalized recommendations.

## Features

- **Item Wishlisting**: Save any item from the REZ ecosystem
- **Multi-type Support**: Restaurants, products, hotels, events, services
- **Collections Management**: Organize saved items into custom collections
- **Price Tracking**: Track original and current prices
- **Price Drop Alerts**: Get notified when prices drop
- **Purchase Intent Scoring**: AI-powered purchase probability estimation
- **Tagging System**: Tag items for easy filtering

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript

## Project Structure

```
REZ-save/
├── src/
│   ├── service.ts            # Express app entry point (standalone)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   ├── middleware/           # Express middleware
│   └── integrations/         # RABTUL integrations
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3016**

The service runs on `PORT=3016` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-save

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure MongoDB URI in .env
# MONGODB_URI=mongodb://localhost:27017/rez-save

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Wishlist

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/save` | POST | Add item to wishlist |
| `GET /api/save/:userId` | GET | Get user's wishlist |
| `DELETE /api/save/:itemId` | DELETE | Remove item from wishlist |
| `PUT /api/save/:itemId` | PUT | Update wishlist item |

### Collections

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/save/collection` | POST | Create collection |
| `GET /api/save/collection/:userId` | GET | Get user's collections |
| `PUT /api/save/collection/:id` | PUT | Update collection |
| `DELETE /api/save/collection/:id` | DELETE | Delete collection |

### Price Alerts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/save/price-alert` | POST | Set price alert |
| `GET /api/save/price-alerts/:userId` | GET | Get user's price alerts |

## API Examples

### Add to Wishlist

```bash
curl -X POST http://localhost:3016/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "type": "product",
    "item_ref": "prod_amazon_123",
    "item_name": "Sony WH-1000XM4 Headphones",
    "item_image": "https://example.com/headphones.jpg",
    "price": 24990,
    "original_price": 29990,
    "tags": ["electronics", "audio", "sale"]
  }'
```

**Response:**
```json
{
  "success": true,
  "item": {
    "item_id": "SAVE-1717500000000",
    "user_id": "user123",
    "type": "product",
    "item_ref": "prod_amazon_123",
    "item_name": "Sony WH-1000XM4 Headphones",
    "price": 24990,
    "original_price": 29990,
    "saved_at": "2026-06-04T10:00:00.000Z",
    "purchase_intent_score": 0.5
  }
}
```

### Get User Wishlist

```bash
curl http://localhost:3016/api/save/user123
```

**Response:**
```json
{
  "items": [
    {
      "item_id": "SAVE-1717500000000",
      "type": "product",
      "item_name": "Sony WH-1000XM4 Headphones",
      "price": 24990,
      "original_price": 29990,
      "saved_at": "2026-06-04T10:00:00.000Z",
      "price_drop_percentage": 17
    }
  ]
}
```

### Create Collection

```bash
curl -X POST http://localhost:3016/api/save/collection \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "name": "Birthday Gifts",
    "description": "Gifts to buy for my birthday party"
  }'
```

### Set Price Alert

```bash
curl -X POST http://localhost:3016/api/save/price-alert \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "item_id": "SAVE-1717500000000",
    "target_price": 22000
  }'
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3016 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/rez-save |

### External Services

| Variable | Description | Default |
|----------|-------------|---------|
| `INTELLIGENCE_API` | Intelligence service URL | https://rez-intelligence.onrender.com |
| `AGENT_API` | Agent service URL | https://REZ-agent.onrender.com |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

## Item Types

| Type | Description | Examples |
|----------|-------------|----------|
| `restaurant` | Restaurants and dining | Pizza places, Cafes |
| `product` | Physical products | Electronics, Clothing |
| `hotel` | Hotels and accommodations | OYO, Airbnb |
| `event` | Events and tickets | Concerts, Movies |
| `service` | Services | Salons, Repairs |

## RABTUL Integration

REZ-save integrates with the following RABTUL services:

1. **Intelligence** (`INTELLIGENCE_API`): Tracks purchase intent and preferences
2. **Analytics** (`ANALYTICS_SERVICE_URL`): Tracks save patterns

### Event Types Published

```typescript
interface WishlistEvent {
  type: 'wishlist.save' | 'wishlist.remove' | 'wishlist.purchase';
  userId: string;
  itemId: string;
  itemType: string;
  timestamp: Date;
  metadata: {
    price?: number;
    tags?: string[];
  };
}
```

## Data Models

### WishlistItem Schema

```typescript
interface WishlistItem {
  item_id: string;           // Unique item ID
  user_id: string;           // User identifier
  type: string;             // Item type (restaurant, product, etc.)
  item_ref: string;          // External reference ID
  item_name: string;         // Display name
  item_image?: string;       // Item image URL
  price: number;            // Current price
  original_price?: number;  // Original price (for discount calculation)
  saved_at: Date;           // Save timestamp
  notified: boolean;        // Notification sent flag
  purchase_intent_score: number; // AI-calculated intent score (0-1)
  tags?: string[];          // User-defined tags
}
```

### Collection Schema

```typescript
interface Collection {
  collection_id: string;    // Unique collection ID
  user_id: string;          // User identifier
  name: string;            // Collection name
  description?: string;     // Collection description
  items: string[];          // Wishlist item IDs
  created_at: Date;        // Creation timestamp
  updated_at?: Date;       // Last update timestamp
}
```

## Purchase Intent Score

The `purchase_intent_score` is calculated based on:

- Time spent viewing similar items
- Price relative to user budget
- Past purchase patterns
- Item category popularity
- Time since save (decay over time)

Score ranges:
- 0.0 - 0.3: Low intent
- 0.3 - 0.6: Medium intent
- 0.6 - 1.0: High intent

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-save .

# Run container
docker run -p 3016:3016 --env-file .env rez-save
```

### Production Considerations

- Use managed MongoDB for production
- Set up index on user_id for fast lookups
- Configure notification service for price alerts
- Add rate limiting to prevent abuse

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-assistant | 3011 | AI recommendations |
| REZ-scan | 3017 | QR scanning |
| REZ-nearby | 3015 | Location discovery |

## License

Private - REZ Consumer Application
