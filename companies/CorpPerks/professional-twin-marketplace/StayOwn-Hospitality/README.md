# StayOwn Hospitality - "The Invisible Hotel" 🎯

> **Mission:** Zero-touch, AI-powered hotel experiences where guests feel genuinely cared for.

---

## Overview

StayOwn Hospitality is a next-generation hotel management system that transforms traditional operations into an autonomous, guest-centric experience. Built on the HOJAI AI infrastructure, it enables "The Invisible Hotel" vision - where technology fades into the background while personalized care takes center stage.

## The Vision: "The Invisible Hotel"

```
Guest arrives → Checked in automatically → Room ready → Welcome message sent
      ↓
Preferences remembered → Services anticipate needs → Billing handled seamlessly
      ↓
Guest leaves → Invoice generated → Key revoked → Review requested
```

No lines. No waiting. No friction. Just hospitality.

## Quick Start

```bash
# Navigate to StayOwn Hospitality
cd StayOwn-Hospitality

# Install dependencies for all services
./scripts/install-all.sh

# Start all services
./scripts/start-all.sh

# Or start individual services
cd guest-twin-service && npm run dev
cd hotel-business-twin && npm run dev
cd hotel-event-bus && npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      STAYOWN HOSPITALITY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Guest Experience                                                │
│   ├── Mobile App (React Native)                                 │
│   ├── Web App (Next.js)                                         │
│   ├── WhatsApp Bot                                              │
│   └── Voice Agent                                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Services (Port)                                                │
│   ├── Guest Twin Service (3810)                                │
│   ├── Hotel Business Twin (3811)                                │
│   ├── Event Bus (3812)                                          │
│   ├── Procurement Service (3814)                                │
│   ├── Maintenance AI (3815)                                     │
│   ├── Billing Service (3816)                                    │
│   └── Zero Checkout (3817)                                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   HOJAI Core                                                    │
│   ├── CorpID (4501) - Identity & Auth                          │
│   ├── Memory (4520) - Guest Memory & Preferences                │
│   ├── Event Bus (4510) - Cross-service Events                  │
│   └── Agents (4550) - AI Agents                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### Guest Twin Service (3810)
**Purpose:** Create and maintain personalized AI twins for each guest

- Learns guest preferences from stay history
- Generates personalized recommendations
- Predicts guest needs
- Syncs with HOJAI Memory

```typescript
// Create guest session
POST /guest-twin/sessions
{
  "guestId": "guest_123",
  "hotelId": "hotel_001",
  "stayDetails": {
    "checkIn": "2026-06-10",
    "checkOut": "2026-06-15",
    "roomType": "deluxe"
  }
}
```

### Hotel Business Twin (3811)
**Purpose:** AI twin for hotel operations and business intelligence

- Real-time operational metrics
- Revenue optimization predictions
- Staff productivity tracking
- AI-generated recommendations

### Event Bus (3812)
**Purpose:** Central nervous system for real-time communication

- 40+ event types across all operations
- WebSocket subscriptions
- Event history and replay
- Cross-service coordination

### Maintenance AI (3815)
**Purpose:** Intelligent maintenance management

- AI-powered diagnostics
- Priority-based task assignment
- Scheduled preventive maintenance
- Parts inventory management

### Zero Checkout (3817)
**Purpose:** Frictionless automated checkout

- Real-time bill calculation
- Multiple payment methods
- Digital key revocation
- Automatic invoice generation

## Key Features

### 🌟 For Guests

| Feature | Description |
|---------|-------------|
| Digital Key | Mobile-based room access |
| Zero Checkout | Leave without stopping at front desk |
| Personalized Rooms | Temperature, lighting, music preferences remembered |
| Smart Requests | AI anticipates needs before asking |
| Voice Control | Control room with voice commands |

### 📊 For Hotel Staff

| Feature | Description |
|---------|-------------|
| Unified Dashboard | All operations in one place |
| AI Diagnostics | Instant problem identification |
| Smart Scheduling | Optimized staff allocation |
| Real-time Alerts | Immediate notification of issues |
| Predictive Insights | Know problems before they happen |

### 📈 For Hotel Owners

| Feature | Description |
|---------|-------------|
| Revenue Dashboard | Real-time RevPAR, ADR, Occupancy |
| AI Recommendations | Data-driven optimization suggestions |
| Staff Productivity | Performance metrics |
| Guest Satisfaction | NPS tracking and trends |
| Maintenance Costs | Cost tracking and prediction |

## API Reference

### Health Check All Services
```bash
curl http://localhost:3810/health  # Guest Twin
curl http://localhost:3811/health  # Hotel Business Twin
curl http://localhost:3812/health  # Event Bus
curl http://localhost:3815/health  # Maintenance AI
curl http://localhost:3817/health  # Zero Checkout
```

### Guest Flow Example
```bash
# 1. Create guest session
curl -X POST http://localhost:3810/guest-twin/sessions \
  -H "Content-Type: application/json" \
  -d '{"guestId":"guest_123","hotelId":"hotel_001"}'

# 2. Get preferences
curl http://localhost:3810/guest-twin/guest_123/preferences

# 3. Get recommendations
curl http://localhost:3810/guest-twin/guest_123/recommendations

# 4. Initiate checkout
curl -X POST http://localhost:3817/checkout/init \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"booking_456","roomId":"room_501"}'

# 5. Complete checkout
curl -X POST http://localhost:3817/checkout/session/{sessionId}/complete
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design |
| [INTEGRATION.md](docs/INTEGRATION.md) | Service integration guide |
| [API.md](docs/API.md) | Complete API reference |
| [SETUP.md](docs/SETUP.md) | Installation and setup guide |

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB 7.0 |
| Cache | Redis 7.2 |
| Vector Store | HOJAI Memory |
| Event Bus | Redis Pub/Sub + Socket.IO |
| Auth | JWT + CorpID |
| Container | Docker + Kubernetes |
| CI/CD | GitHub Actions |

## Development

### Prerequisites
- Node.js 20+
- MongoDB 7.0+
- Redis 7.2+
- Docker (optional)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd StayOwn-Hospitality

# Install dependencies
npm install

# Copy environment files
cp .env.example .env

# Start services
docker-compose up -d

# Or run natively
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific service tests
cd guest-twin-service && npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - HOJAI AI. All rights reserved.

---

**Built with ❤️ by HOJAI AI**

*The future of hospitality is invisible.*
