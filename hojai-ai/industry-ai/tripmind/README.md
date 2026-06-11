# TRIPMIND - Travel AI Operating System

> **"Your AI Travel Co-Pilot"** - Powered by Claude AI

A production-ready Travel AI Operating System with 5 AI agents: Trip Planner, Booking Agent, Visa Agent, Airport Agent, and AI Brain.

## Features

### AI Agents

| Agent | Description | Capabilities |
|-------|-------------|--------------|
| **Trip Planner Agent** | Intelligent itinerary creation | Itinerary generation, destination recommendations, activity suggestions |
| **Booking Agent** | Reservations management | Flight/hotel search, availability checking, booking management |
| **Visa Agent** | Visa assistance | Requirements check, document guidance, application tips |
| **Airport Agent** | Flight assistance | Terminal info, gate updates, lounge access |
| **AI Brain** | Central intelligence hub | Trip planning, route optimization, budget planning, travel advisory, packing suggestions |

### AI Brain Features

The AI Brain provides advanced travel intelligence:

- **Trip Planning** - AI-powered itinerary generation with personalized recommendations
- **Route Optimization** - Find the most efficient routes between multiple destinations
- **Travel Advisory** - Safety, health, and local customs guidance
- **Budget Planning** - Comprehensive cost breakdown and money-saving tips
- **Packing Suggestions** - Smart, weather-aware packing lists
- **Natural Language Query** - Ask travel questions in plain English

## Quick Start

```bash
# Navigate to project directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/hojai-ai/industry-ai/tripmind

# Install dependencies (already installed)
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### AI Brain Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/brain/status` | Get AI Brain status |
| `POST` | `/api/brain/trip/plan` | Generate AI-powered trip plan |
| `POST` | `/api/brain/route/optimize` | Optimize travel routes |
| `POST` | `/api/brain/advisory` | Get travel advisory |
| `POST` | `/api/brain/budget/plan` | Generate budget plan |
| `POST` | `/api/brain/packing/list` | Generate packing list |
| `POST` | `/api/brain/query` | Natural language travel query |

### AI Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/status` | AI agents status |
| `POST` | `/api/ai/trip/plan` | Plan trip |
| `POST` | `/api/ai/booking/search` | Search bookings |
| `POST` | `/api/ai/visa/check` | Check visa requirements |
| `POST` | `/api/ai/airport/assist` | Airport assistance |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings` | List bookings |
| `PATCH` | `/api/bookings/:id` | Update booking |

### Destination Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/destinations` | Create destination |
| `GET` | `/api/destinations` | List destinations |
| `GET` | `/api/destinations/:id` | Get destination |

### Itinerary Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/itineraries` | Create itinerary |
| `GET` | `/api/itineraries/:bookingId` | Get itinerary |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/dashboard` | Dashboard data |

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /` | Server info |
| `GET /health` | Health check |
| `GET /ready` | Readiness check |

## API Examples with curl

### AI Brain Examples

#### Get AI Brain Status
```bash
curl -X GET http://localhost:4809/api/brain/status
```

#### Plan a Trip (AI Brain)
```bash
curl -X POST http://localhost:4809/api/brain/trip/plan \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo",
    "startDate": "2026-07-15",
    "endDate": "2026-07-22",
    "travelers": 2,
    "budget": 5000,
    "travelStyle": "moderate",
    "interests": ["culture", "food", "sightseeing"],
    "pace": "moderate"
  }'
```

#### Optimize Routes
```bash
curl -X POST http://localhost:4809/api/brain/route/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"name": "Tokyo Tower", "coordinates": {"lat": 35.6586, "lng": 139.7454}},
      {"name": "Senso-ji Temple", "coordinates": {"lat": 35.7148, "lng": 139.7967}},
      {"name": "Shibuya Crossing", "coordinates": {"lat": 35.6595, "lng": 139.7004}}
    ],
    "optimizeFor": "time"
  }'
```

#### Get Travel Advisory
```bash
curl -X POST http://localhost:4809/api/brain/advisory \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Japan",
    "travelDates": {
      "start": "2026-07-15",
      "end": "2026-07-22"
    }
  }'
```

#### Plan Budget
```bash
curl -X POST http://localhost:4809/api/brain/budget/plan \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo",
    "startDate": "2026-07-15",
    "endDate": "2026-07-22",
    "travelers": 2,
    "budget": 5000,
    "travelStyle": "moderate"
  }'
```

#### Generate Packing List
```bash
curl -X POST http://localhost:4809/api/brain/packing/list \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Japan",
    "startDate": "2026-07-15",
    "endDate": "2026-07-22",
    "travelers": 2,
    "travelStyle": "moderate",
    "interests": ["culture", "food"]
  }'
```

#### Natural Language Query
```bash
curl -X POST http://localhost:4809/api/brain/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the best time to visit Kyoto for cherry blossoms?"
  }'
```

### AI Agent Examples

#### Get AI Agents Status
```bash
curl -X GET http://localhost:4809/ai/status
```

#### Plan Trip (Trip Planner Agent)
```bash
curl -X POST http://localhost:4809/api/ai/trip/plan \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris",
    "startDate": "2026-08-01",
    "endDate": "2026-08-07",
    "travelers": 2,
    "budget": 4000,
    "travelStyle": "luxury",
    "interests": ["art", "food", "history"],
    "pace": "relaxed"
  }'
```

#### Search Bookings
```bash
curl -X POST http://localhost:4809/api/ai/booking/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "London",
    "startDate": "2026-09-01",
    "endDate": "2026-09-05",
    "travelers": 1,
    "type": "flight"
  }'
```

#### Check Visa Requirements
```bash
curl -X POST http://localhost:4809/api/ai/visa/check \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Japan",
    "nationality": "Indian",
    "purpose": "tourism",
    "duration": 14
  }'
```

#### Airport Assistance
```bash
curl -X POST http://localhost:4809/api/ai/airport/assist \
  -H "Content-Type: application/json" \
  -d '{
    "airportCode": "DEL",
    "flightNumber": "AI101",
    "assistanceType": "terminal_info"
  }'
```

### Authentication Examples

#### Register
```bash
curl -X POST http://localhost:4809/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "traveler@example.com",
    "password": "SecurePass123!",
    "name": "John Traveler"
  }'
```

#### Login
```bash
curl -X POST http://localhost:4809/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "traveler@example.com",
    "password": "SecurePass123!"
  }'
```

### Booking Examples

#### Create Booking
```bash
curl -X POST http://localhost:4809/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "flight",
    "destination": "Tokyo",
    "travelers": 2,
    "departureDate": "2026-07-15",
    "returnDate": "2026-07-22"
  }'
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4809` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `ANTHROPIC_API_KEY` | Claude AI API key | - |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `AI_TRIP_PLANNER_ENABLED` | Enable trip planner | `true` |
| `AI_BOOKING_ENABLED` | Enable booking agent | `true` |
| `AI_VISA_ENABLED` | Enable visa agent | `true` |
| `AI_AIRPORT_ENABLED` | Enable airport agent | `true` |
| `LOG_LEVEL` | Logging level | `info` |

## Port

**Default: 4809**

## Architecture

```
TRIPMIND
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── models/          # MongoDB schemas
│   ├── routes/         # API routes
│   ├── services/       # AI agents & business logic
│   │   ├── aiBrain.ts  # AI Brain (NEW)
│   │   ├── tripPlannerAgent.js
│   │   ├── bookingAgent.js
│   │   ├── visaAgent.js
│   │   └── airportAgent.js
│   ├── utils/          # Helpers, validators
│   ├── config/         # Database, app config
│   └── index.js        # Entry point
├── connectors/         # External integrations
├── employees/          # Voice AI agents
├── voice-agents/       # Voice interfaces
├── services/           # Additional services
├── k8s/                # Kubernetes manifests
├── docker-compose.yml  # Docker orchestration
└── Dockerfile          # Container build
```

## Security Features

- JWT authentication
- Rate limiting (configurable)
- Helmet security headers
- Input validation with Zod
- CORS configuration
- Request logging

## Production Ready

- Graceful shutdown
- Health checks
- Winston logging
- Prometheus metrics support
- Docker support
- Kubernetes manifests

## License

MIT
