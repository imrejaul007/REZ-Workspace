# Invisible Hotel Demo

Complete demo script to test The Invisible Hotel experience.

## Prerequisites

1. Start infrastructure services:
```bash
docker-compose -f docker-compose.invisible-hotel.yml up -d redis mongodb rabbitmq mosquitto
```

2. Start all hotel services:
```bash
docker-compose -f docker-compose.invisible-hotel.yml up -d
```

Or start individually in development mode:
```bash
# Terminal 1: Infrastructure
docker-compose up -d redis rabbitmq mosquitto

# Terminal 2+: Services
cd ai-front-desk && npm run dev
cd pre-arrival-service && npm run dev
cd smart-lock-service && npm run dev
# ... etc
```

## Run Demo

```bash
# Install dependencies for demo
cd demo
npm install

# Run the demo
npx tsx invisible-hotel-demo.ts
```

## What the Demo Tests

### Phase 1: Pre-Arrival
- Creates pre-arrival session
- Submits guest preferences (pillow type, dietary, celebration)
- Verifies room preparation

### Phase 2: Check-In
- Grants smart lock access
- Initializes room controls
- Applies welcome scene
- Stores preferences in HOJAI Memory

### Phase 3: Stay Services
- Minibar order
- Restaurant booking
- Spa treatment booking
- Parking with valet
- Concierge request
- Mid-stay feedback

### Phase 4: Upsell & Loyalty
- Generates upsell offers
- Joins loyalty program
- Earns points

### Phase 5: Voice Agent
- Starts voice session
- Processes voice commands
- Dispatches services

### Phase 6: Checkout
- Initiates zero checkout
- Verifies lock revocation
- Requests and submits review
- Checks tier upgrade

## Individual Service Testing

Test each service individually:

```bash
# Health check all services
curl http://localhost:3800/health  # AI Front Desk
curl http://localhost:3810/health  # Minibar
curl http://localhost:3811/health  # Restaurant
curl http://localhost:3812/health  # Spa
curl http://localhost:3814/health  # Room Controls
curl http://localhost:3825/health  # Smart Lock
curl http://localhost:3827/health  # Zero Checkout
curl http://localhost:3828/health  # Pre-Arrival
curl http://localhost:4720/health  # HOJAI Memory
curl http://localhost:4870/health  # Voice Agent
```

## Docker Compose Quick Start

```bash
# Start everything
docker-compose -f docker-compose.invisible-hotel.yml up -d

# View logs
docker-compose -f docker-compose.invisible-hotel.yml logs -f

# Stop everything
docker-compose -f docker-compose.invisible-hotel.yml down
```

## Port Reference

| Port | Service |
|------|---------|
| 3800 | AI Front Desk |
| 3810 | Minibar |
| 3811 | Restaurant |
| 3812 | Spa |
| 3814 | Room Controls |
| 3815 | Parking |
| 3816 | Lost & Found |
| 3817 | Upsell Engine |
| 3818 | Loyalty |
| 3819 | Review Manager |
| 3820 | Feedback Survey |
| 3821 | Concierge Desk |
| 3825 | Smart Lock |
| 3826 | Predictive Housekeeping |
| 3827 | Zero Checkout |
| 3828 | Pre-Arrival |
| 3899 | Hotel OS Integration |
| 4720 | HOJAI Memory Hotel |
| 4870 | Voice Agent |