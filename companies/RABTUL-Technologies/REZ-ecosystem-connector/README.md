# REZ Ecosystem Connector

Central hub for cross-service communication in the Nexha Commerce Network.

## Port: 4399

## Features

- Service registration and discovery
- Cross-service messaging
- Event subscription and publishing
- Service health monitoring
- Distributed transaction management
- Heartbeat and status tracking
- Message correlation

## API Endpoints

### Health
- `GET /health` - Service health status

### Services
- `POST /api/services` - Register a service
- `GET /api/services` - List services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/name/:name` - Get service by name
- `PATCH /api/services/:id/status` - Update service status
- `POST /api/services/:id/heartbeat` - Send heartbeat
- `DELETE /api/services/:id` - Unregister service

### Messaging
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message
- `GET /api/messages/correlation/:correlationId` - Get by correlation
- `GET /api/messages/service/:serviceName` - Get service messages

### Subscriptions
- `POST /api/subscriptions` - Subscribe to events
- `GET /api/subscriptions` - List subscriptions
- `DELETE /api/subscriptions/:id` - Unsubscribe

### Health Monitoring
- `GET /api/health/services` - Get service health status

### Transactions
- `POST /api/transactions` - Start transaction
- `PATCH /api/transactions/:id/step` - Update step
- `POST /api/transactions/:id/rollback` - Rollback

### Stats
- `GET /api/stats` - Get connector statistics

## Running

```bash
npm install
npm run build
npm start
```
