# REZ Salon Membership Service

REZ Salon OS - Membership and loyalty program management

**Port:** 4203

## Features

- **Package Management**: Create and manage spa/salon service packages with pricing, validity periods, and usage limits
- **Membership Plans**: Flexible membership tiers with benefits, discounts, and exclusive access
- **Package Redemption**: Track and process package usage by customers
- **Membership Benefits**: Configure member-only discounts, priority booking, and special offers
- **Validity Tracking**: Monitor package and membership expiration dates
- **Usage Analytics**: Track package utilization and membership engagement
- **Customer Portal**: View membership status and benefits

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/v1/packages | List all packages |
| GET | /api/v1/packages/:id | Get package by ID |
| POST | /api/v1/packages | Create new package |
| PUT | /api/v1/packages/:id | Update package |
| DELETE | /api/v1/packages/:id | Delete package |
| GET | /api/v1/memberships | List all memberships |
| GET | /api/v1/memberships/:id | Get membership by ID |
| POST | /api/v1/memberships | Create membership |
| PUT | /api/v1/memberships/:id | Update membership |
| POST | /api/v1/memberships/:id/activate | Activate membership |
| POST | /api/v1/memberships/:id/deactivate | Deactivate membership |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm run build && npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4008)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string for caching
- `JWT_SECRET`: Secret for JWT token validation
- `INTERNAL_SERVICE_TOKENS_JSON`: JSON string of service tokens for inter-service communication
