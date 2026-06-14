# REZ Webhook Service

Webhook management microservice for loyalty events and integrations.

## Features

- Webhook registration and management
- Event delivery with retry logic
- Delivery tracking and analytics
- Secret-based signature verification
- Multiple event types support

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
| REDIS_URL | Redis connection string | Yes |
| PORT | Service port (default: 4034) | No |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm test         # Run tests
```

## API Endpoints

- `POST /api/webhooks` - Register a webhook
- `GET /api/webhooks` - List webhooks
- `DELETE /api/webhooks/:id` - Delete webhook
- `GET /api/deliveries` - List deliveries
- `GET /api/stats` - Get delivery statistics

## Webhook Events

- `points.earned` - Points earned
- `points.redeemed` - Points redeemed
- `tier.upgraded` - Tier upgraded
- `tier.downgraded` - Tier downgraded

## License

MIT
