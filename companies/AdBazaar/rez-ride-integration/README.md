# REZ Ride Integration

ReZ Ride mobility integration for AdBazaar.

## Service Purpose

Integrates advertising capabilities with the ReZ Ride mobility platform. Manages in-ride advertising, driver partnerships, location-based targeting, and mobility-specific campaign analytics.

## Port

```
3030
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List registered vehicles |
| POST | `/api/vehicles` | Register vehicle |
| GET | `/api/vehicles/:id` | Get vehicle details |
| PUT | `/api/vehicles/:id` | Update vehicle |
| GET | `/api/drivers` | List drivers |
| POST | `/api/drivers` | Register driver |
| GET | `/api/drivers/:id` | Get driver details |
| PUT | `/api/drivers/:id` | Update driver |
| POST | `/api/drivers/:id/payout` | Process driver payout |
| GET | `/api/campaigns` | List mobility campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| GET | `/api/analytics` | Ride analytics |

## Ad Formats

| Format | Placement | Description |
|--------|-----------|-------------|
| In-Ride Screen | Vehicle display | Video/banner in vehicle |
| Driver App | Driver app | Sponsored content |
| Receipt | Post-ride | Digital receipt ads |
| Location | Pickup/drop | Geo-fenced impressions |

## Configuration

Environment variables:

```env
PORT=3030
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-ride-integration
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
