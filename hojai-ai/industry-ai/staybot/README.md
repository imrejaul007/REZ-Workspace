# STAYBOT - Hotel AI

> "AI That Makes Guests Stay Longer"

STAYBOT is an AI-powered operating system for hotels, resorts, and hospitality establishments. It combines AI agents, automated workers, voice agents, and a complete backend to manage hotel operations.

## Features

### AI Agents (Workers)

- **Front Desk AI** - Check-in/out, guest services
- **Concierge AI** - Recommendations, restaurant bookings
- **Revenue Manager AI** - Dynamic pricing, occupancy optimization
- **Bellhop AI** - Room service, requests

### AI Workers (Automated Tasks)

- **Housekeeping Worker** - Room cleaning, maintenance
- **Valet Worker** - Parking management
- **Billing Worker** - Invoice generation, payments
- **Report Worker** - Daily/weekly/monthly reports

### Voice Agents

- **Phone Receptionist** - Answer calls 24/7, room service
- **WhatsApp AI** - Text/voice conversations, concierge
- **IVR System** - Auto-attendant, wake-up calls

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### AI Agent APIs

```bash
POST /api/ai/frontdesk/checkin
POST /api/ai/frontdesk/checkout
POST /api/ai/concierge/recommendations
POST /api/ai/revenue/optimize
POST /api/ai/roomservice/order
```

### Worker APIs

```bash
POST /api/workers/housekeeping/request
POST /api/workers/valet/park
GET  /api/workers/billing/folio/:guestId
GET  /api/workers/reports/daily
```

## Environment Variables

```bash
PORT=4101
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## Port

- **Main Service:** 4101
- **Voice Agents:** 4850-4860

## Documentation

- [State of Technology](SOT.md) - Complete technical specification
- [Developer Guide](CLAUDE.md) - Developer documentation
- [Product Overview](PRODUCT.md) - Product requirements

## Pricing

- **₹4,999/month** (HOJAI AI - Non-REZ clients)
- Included in REZ-Merchant OS (REZ ecosystem clients)

## Support

For technical support, contact: support@hojai.ai

## API Examples

### Health Check
```bash
curl http://localhost:4840/health
```

### Guest Check-in
```bash
curl -X POST http://localhost:4840/api/ai/frontdesk/checkin \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest123", "roomNumber": "101", "checkInDate": "2026-06-10"}'
```

### Guest Check-out
```bash
curl -X POST http://localhost:4840/api/ai/frontdesk/checkout \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest123", "roomNumber": "101"}'
```

### Concierge Recommendations
```bash
curl -X POST http://localhost:4840/api/ai/concierge/recommendations \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest123", "request": "local restaurants"}'
```

### Room Service Order
```bash
curl -X POST http://localhost:4840/api/ai/roomservice/order \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest123", "roomNumber": "101", "items": [{"name": "Club Sandwich", "qty": 1}]}'
```

### Revenue Optimization
```bash
curl -X POST http://localhost:4840/api/ai/revenue/optimize \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "hotel123", "date": "2026-06-15"}'
```

### Housekeeping Request
```bash
curl -X POST http://localhost:4840/api/workers/housekeeping/request \
  -H "Content-Type: application/json" \
  -d '{"roomNumber": "101", "type": "cleaning", "priority": "normal"}'
```

### Valet Parking
```bash
curl -X POST http://localhost:4840/api/workers/valet/park \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest123", "vehicleNumber": "KA-01-AB-1234"}'
```

### Get Guest Folio
```bash
curl http://localhost:4840/api/workers/billing/folio/guest123
```

### Daily Reports
```bash
curl http://localhost:4840/api/workers/reports/daily
```

## License

Proprietary - HOJAI AI
