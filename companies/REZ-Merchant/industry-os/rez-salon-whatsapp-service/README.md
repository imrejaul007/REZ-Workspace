# REZ Salon WhatsApp Service

REZ Salon OS - WhatsApp integration for bookings and customer communication

**Port:** 4205

## Features

- **WhatsApp Integration**: Connect with customers via WhatsApp messaging
- **Booking Bot**: Automated booking assistance through WhatsApp conversations
- **Webhook Handling**: Process incoming WhatsApp messages and events
- **Reminder Scheduling**: Automated appointment reminders via cron jobs
- **Availability Notifications**: Daily notifications for available slots
- **Message Templates**: Pre-approved WhatsApp message templates
- **Session Management**: Track conversation sessions with customers
- **Internal Service Integration**: Communicate with salon service for booking operations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/webhook | WhatsApp webhook endpoint |
| GET | /api/webhook | Webhook verification |
| POST | /api/bot/send | Send message via bot |
| GET | /api/bot/status | Get bot connection status |
| POST | /api/bot/session/:sessionId | Manage session |

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
- `PORT`: Server port (default: 3005)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string for caching
- `SALON_SERVICE_URL`: URL for salon service integration
- `INTERNAL_SERVICE_TOKENS_JSON`: JSON string of service tokens
- `NODE_ENV`: Environment (development/production)

## Notes

This service requires WhatsApp Business API credentials and uses:
- WhatsAppService for core messaging
- BookingBot for automated booking assistance
- Cron jobs for reminder scheduling (hourly checks, daily notifications at 9 AM)
