# RTMN Agent Twin Service

Digital twin service for real estate agents in the RTMN Real Estate OS platform.

## Overview

The Agent Twin Service manages digital representations of real estate agents, including their profiles, performance metrics, availability, expertise, and relationships with properties and deals.

## Features

- **Agent Profile Management**: Store and manage agent profiles with contact info, licenses, and specialties
- **Performance Tracking**: Track transactions, volume, ratings, and other KPIs
- **Availability Management**: Real-time availability status and working hours
- **Lead Routing**: Intelligent lead matching based on preferences and expertise
- **Listing Management**: Track active property listings per agent
- **Deal Management**: Monitor active deals per agent
- **Event-Driven Architecture**: Real-time events for all agent changes

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 7.0+
- Redis 7.0+ (optional, for distributed events)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start MongoDB and Redis (using Docker)
docker-compose -f ../docker/docker-compose.yml up -d mongodb redis

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build image
docker build -t rtm/agent-twin-service .

# Run container
docker run -p 8848:8848 \
  -e MONGODB_URI=mongodb://mongo:27017/agent_twin \
  -e REDIS_URL=redis://redis:6379 \
  rtm/agent-twin-service
```

## API Endpoints

### Agent Twin CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/agent` | Create new agent twin |
| GET | `/api/twins/agent/:id` | Get agent by ID |
| GET | `/api/twins/agent` | List agents (with filters) |
| PUT | `/api/twins/agent/:id` | Update agent |
| DELETE | `/api/twins/agent/:id` | Delete agent (internal) |

### Agent Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/twins/agent/:id/performance` | Update performance metrics |
| PUT | `/api/twins/agent/:id/availability` | Update availability status |
| PUT | `/api/twins/agent/:id/lead-preferences` | Update lead preferences |
| POST | `/api/twins/agent/:id/listings` | Add listing to agent |
| DELETE | `/api/twins/agent/:id/listings/:listingId` | Remove listing |
| POST | `/api/twins/agent/:id/deals` | Add deal to agent |
| DELETE | `/api/twins/agent/:id/deals/:dealId` | Remove deal |
| POST | `/api/twins/agent/match` | Find matching agents |
| GET | `/api/twins/agent/stats/summary` | Get agent statistics |

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Service info |

## Authentication

All API endpoints require authentication via API key:

```
X-API-Key: your-api-key
```

For internal service-to-service calls, use internal token:

```
X-Internal-Token: your-internal-token
```

## Event Types

The service emits the following events:

- `agent.twin.created` - Agent twin created
- `agent.twin.updated` - Agent twin updated
- `agent.profile.updated` - Profile changed
- `agent.performance.updated` - Performance metrics updated
- `agent.availability.updated` - Availability changed
- `agent.status.changed` - Status (available/busy/unavailable) changed
- `agent.lead_preferences.updated` - Lead preferences changed
- `agent.listing.added` - Listing added
- `agent.listing.removed` - Listing removed
- `agent.deal.added` - Deal added
- `agent.deal.removed` - Deal removed

## Database Schema

The Agent Twin model includes:

- **Profile**: Name, photo, bio, languages, specialties, license info
- **Contact**: Phone, email, website, social links
- **Brokerage**: Brokerage ID, name, address, team name
- **Performance**: Transactions YTD, volume YTD, avg days to close, ratings
- **Expertise**: Areas, property types, price ranges, years experience
- **Availability**: Status, response time, working hours
- **Lead Preferences**: Budget range, property types, areas, routing enabled
- **Compensation**: Commission split, referral fee rate

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8848 | Server port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/agent_twin | MongoDB connection |
| REDIS_URL | - | Redis URL for distributed events |
| API_KEY | agent-twin-api-key | API authentication key |
| INTERNAL_SERVICE_TOKEN | - | Internal service token |
| CORS_ORIGINS | http://localhost:3000 | Allowed CORS origins |
| LOG_LEVEL | info | Logging level |

## License

Proprietary - RTMN Inc.
