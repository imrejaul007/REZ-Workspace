# REZ Salon CRM Service

REZ Salon OS - Customer relationship management and analytics

**Port:** 4204

## Features

- **Customer Management**: Comprehensive customer profiles with contact info, visit history, and preferences
- **Campaign Management**: Create and manage marketing campaigns (email, SMS, push notifications)
- **Segmentation**: Customer segmentation based on behavior, preferences, and demographics
- **Communication History**: Track all customer interactions and communications
- **Lead Management**: Manage potential customers and track conversion
- **Feedback Collection**: Collect and analyze customer feedback and ratings
- **Analytics**: Customer insights and campaign performance analytics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/customers | List all customers |
| GET | /api/customers/:id | Get customer by ID |
| POST | /api/customers | Create customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |
| GET | /api/campaigns | List all campaigns |
| GET | /api/campaigns/:id | Get campaign by ID |
| POST | /api/campaigns | Create campaign |
| PUT | /api/campaigns/:id | Update campaign |
| POST | /api/campaigns/:id/send | Send campaign |
| GET | /api/segments | List customer segments |
| POST | /api/segments | Create segment |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4004)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string for caching
