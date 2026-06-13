# Guest Memory TwinOS Integration

Integration service that connects Guest Memory (8447) with TwinOS Hub for the Hotel OS platform.

## Overview

This service provides:
- Guest Twin management (profile, preferences, loyalty, stay history, sentiment)
- Room Twin management (status, IoT state, occupancy, features)
- Property Twin management (venues, amenities, policies, revenue centers)
- Bidirectional sync with TwinOS Hub for unified digital twin orchestration

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run with Docker
docker-compose -f docker/docker-compose.yml up -d
```

## API Endpoints

### Guest Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/guest` | Create guest twin |
| GET | `/api/twins/guest/:id` | Get guest twin |
| PUT | `/api/twins/guest/:id/preferences` | Update preferences |
| GET | `/api/twins/guest` | List all guest twins |

### Room Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/room` | Create room twin |
| GET | `/api/twins/room/:id` | Get room twin |
| GET | `/api/twins/room/:id/status` | Get room status |
| GET | `/api/twins/room` | List all room twins |

### Property Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/property` | Create property twin |
| GET | `/api/twins/property/:id` | Get property twin |
| GET | `/api/twins/property` | List all property twins |

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/api/twins/sync-status` | TwinOS sync status |

## Authentication

All API endpoints require an API key:
```
X-API-Key: your-api-key
```

Internal services can use:
```
X-Internal-Service-Token: your-internal-token
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8447 | Service port |
| TWINOS_HUB_URL | http://localhost:4143 | TwinOS Hub URL |
| TWINOS_API_KEY | - | TwinOS Hub API key |
| INTERNAL_SERVICE_TOKEN | - | Internal service authentication |
| CORS_ORIGIN | * | CORS allowed origin |

## Request/Response Examples

### Create Guest Twin

```bash
curl -X POST http://localhost:8447/api/twins/guest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "profile": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "loyalty": {
      "tier": "gold"
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "guest_id": "uuid-string",
    "guest_twin_id": "twin.hotel.guest.uuid-string",
    "created_at": "2026-06-12T10:00:00Z",
    "synced_to_twinos": true,
    "twinos_twin_id": "twin.hotel.guest.uuid-string"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

### Get Guest Twin

```bash
curl -X GET http://localhost:8447/api/twins/guest/{guest_id} \
  -H "X-API-Key: your-api-key"
```

### Update Preferences

```bash
curl -X PUT http://localhost:8447/api/twins/guest/{guest_id}/preferences \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "preferences": {
      "room": {
        "floor_preference": "high",
        "temperature_setting": {
          "default": 72
        }
      },
      "dining": {
        "dietary_restrictions": ["vegetarian"],
        "allergies": ["peanuts"]
      }
    }
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hotel OS Platform                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  AI         │  │  Upsell     │  │  Predictive          │ │
│  │  Concierge  │  │  Engine     │  │  Housekeeping        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        Guest Memory TwinOS Integration (Port 8447)      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │  │ Guest    │  │ Room     │  │ Property │              │ │
│  │  │ Twin     │  │ Twin     │  │ Twin     │              │ │
│  │  └──────────┘  └──────────┘  └──────────┘              │ │
│  │         │              │              │                 │ │
│  │         └──────────────┴──────────────┘                 │ │
│  │                        │                               │ │
│  └────────────────────────┼───────────────────────────────┘ │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  TwinOS Hub   │
                    │  (Port 4143) │
                    └───────────────┘
```

## License

Internal RTMN Platform