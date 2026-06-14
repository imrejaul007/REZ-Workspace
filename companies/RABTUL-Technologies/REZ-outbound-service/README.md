# REZ Outbound Service

**Port: 4130**

Multi-channel Outbound Sequences Service - Manage email cadences, LinkedIn sequences, SMS, and calls.

## Features

- **Multi-channel Sequences**: Email, LinkedIn, SMS, Call, Task
- **Sequence Builder**: Visual step-by-step sequence creation
- **A/B Testing**: Test different message variants
- **Prospect Management**: Add, track, and manage prospects
- **Reply Detection**: Track replies and engagement
- **Opt-out Handling**: Automatic opt-out management
- **Working Hours**: Respect recipient time zones
- **Scheduled Sending**: Intelligent delivery timing

## Sequence Types

| Type | Channel | Description |
|------|---------|------------|
| email | Email | Email cadence with tracking |
| linkedin | LinkedIn | LinkedIn connection/message sequence |
| sms | SMS | Text message sequence |
| call | Call | Call task sequence |
| multi-channel | Mixed | Combine channels |

## API Endpoints

### Sequences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sequences` | Create sequence |
| GET | `/api/v1/sequences` | List sequences |
| GET | `/api/v1/sequences/:id` | Get sequence |
| PUT | `/api/v1/sequences/:id` | Update sequence |
| POST | `/api/v1/sequences/:id/activate` | Activate sequence |
| POST | `/api/v1/sequences/:id/pause` | Pause sequence |
| POST | `/api/v1/sequences/:id/clone` | Clone sequence |
| GET | `/api/v1/sequences/:id/stats` | Get statistics |

### Prospects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/prospects` | Add prospect |
| POST | `/api/v1/prospects/batch` | Batch add prospects |
| GET | `/api/v1/prospects` | List prospects |
| GET | `/api/v1/prospects/:id` | Get prospect |
| PATCH | `/api/v1/prospects/:id` | Update prospect |
| POST | `/api/v1/prospects/:id/opt-out` | Opt out |
| POST | `/api/v1/prospects/:id/reply` | Record reply |
| GET | `/api/v1/prospects/sequence/due` | Get due prospects |

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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4130 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-outbound-service | MongoDB |
| NODE_ENV | development | Environment |

## Related Services

- **REZ Signal Service** (Port 4129) - Intent signal detection
- **REZ TAM Builder** (Port 4128) - Account universe building
- **REZ Intelligence** (Ports 4100-4119) - AI/ML services
