# REZ-nearby

**Location-based Discovery Service for REZ Consumer**

A powerful location-based discovery service that helps users find nearby places, businesses, and services. Built with Express and TypeScript.

## Overview

REZ-nearby provides intelligent location-based discovery for restaurants, shops, services, and local businesses. It supports category filtering, distance-based sorting, and personalized recommendations.

## Features

- **Places Search**: Find nearby places by category or keyword
- **Category Filtering**: Browse by predefined categories
- **Distance-based Sorting**: Sort results by proximity
- **Location Services**: GPS-based discovery
- **Multi-category Support**: Restaurants, shops, services, and more

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (ES Modules)
- **Validation**: Zod

## Project Structure

```
REZ-nearby/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── routes/
│   │   ├── places.ts        # Places endpoints
│   │   ├── search.ts        # Search endpoints
│   │   └── categories.ts    # Category endpoints
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/           # Express middleware
│   ├── integrations/         # RABTUL integrations
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3015**

The service runs on `PORT=3015` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-nearby

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Places

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/places/nearby` | GET | Get nearby places |
| `GET /api/places/:id` | GET | Get place details |

### Search

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/search` | GET | Search places |
| `GET /api/search/suggestions` | GET | Get search suggestions |

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/categories` | GET | List all categories |
| `GET /api/categories/:id/places` | GET | Get places by category |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Service health check |

## API Examples

### Get Nearby Places

```bash
curl "http://localhost:3015/api/places/nearby?lat=12.9716&lng=77.5946&radius=5000"
```

**Response:**
```json
{
  "places": [
    {
      "id": "place_1",
      "name": "Pizza Place",
      "category": "restaurant",
      "distance": 0.5,
      "rating": 4.2,
      "address": "MG Road, Bangalore"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

### Search Places

```bash
curl "http://localhost:3015/api/search?q=pizza&lat=12.9716&lng=77.5946"
```

### Get Categories

```bash
curl http://localhost:3015/api/categories
```

**Response:**
```json
{
  "categories": [
    {"id": "restaurant", "name": "Restaurants", "icon": "utensils", "count": 245},
    {"id": "shopping", "name": "Shopping", "icon": "shopping-bag", "count": 189},
    {"id": "entertainment", "name": "Entertainment", "icon": "film", "count": 67},
    {"id": "healthcare", "name": "Healthcare", "icon": "heart", "count": 34},
    {"id": "fitness", "name": "Fitness", "icon": "dumbbell", "count": 28}
  ]
}
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3015 |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

### REZ Intelligence

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_SERVICE_URL` | Intent tracking service | http://localhost:4018 |
| `PREDICTIVE_SERVICE_URL` | Predictive analytics | http://localhost:4123 |
| `SIGNAL_SERVICE_URL` | Signal processing | http://localhost:4121 |

## Place Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `restaurant` | Food and dining | Pizza, Biryani, Chinese |
| `shopping` | Retail stores | Clothing, Electronics |
| `entertainment` | Leisure activities | Movies, Games, Parks |
| `healthcare` | Medical services | Hospitals, Pharmacies |
| `fitness` | Gyms and sports | Gyms, Yoga studios |
| `beauty` | Salons and spas | Hair salons, Spas |
| `education` | Learning centers | Tuition, Courses |
| `services` | Local services | Plumber, Electrician |

## RABTUL Integration

REZ-nearby integrates with the following RABTUL services:

1. **Analytics** (`ANALYTICS_SERVICE_URL`): Tracks search patterns and popular places
2. **Event Bus** (`EVENT_BUS_URL`): Publishes discovery events

### Event Types Published

```typescript
interface DiscoveryEvent {
  type: 'place.discovered' | 'place.visited';
  userId: string;
  placeId: string;
  category: string;
  timestamp: Date;
  metadata: {
    distance?: number;
    searchQuery?: string;
  };
}
```

## Data Models

### Place Schema

```typescript
interface Place {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  images?: string[];
  hours?: {
    open: string;
    close: string;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
}
```

## Testing

```bash
# Run tests
npm test

# Test with curl
curl http://localhost:3015/health
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-nearby .

# Run container
docker run -p 3015:3015 rez-nearby
```

### Production Considerations

- Integrate with map providers (Mapbox, Google Maps)
- Add caching for frequently accessed places
- Set up CDN for place images
- Enable GeoIP for approximate location

## Monitoring

### Health Check

```bash
curl http://localhost:3015/health
```

Response:
```json
{
  "status": "ok",
  "service": "rez-nearby",
  "version": "1.0.0"
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| go4food-api | 3002 | Food-specific search |
| REZ-assistant | 3011 | AI recommendations |
| REZ-menu-qr | 3014 | Restaurant QR menus |

## License

Private - REZ Consumer Application
