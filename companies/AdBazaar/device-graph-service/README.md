# Device Graph Service

**AdBazaar Device Graph Service** - Cross-device identity resolution and device graph management for advertising and marketing intelligence.

## Overview

The Device Graph Service provides cross-device identity resolution, enabling advertisers and marketers to connect user identities across multiple devices. This service is essential for:

- **Cross-device targeting**: Reach users across their mobile, tablet, desktop, and TV devices
- **Attribution**: Track user journeys across devices
- **Household targeting**: Target entire households based on device clusters
- **Audience segmentation**: Build comprehensive user profiles

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Device Graph Service                          │
│                        (Port 4997)                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Device    │  │   Linking  │  │ Household │             │
│  │  Service    │  │  Service   │  │  Service   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│ ┌─────────────┐  ┌─────────────┐                               │
│  │ Resolution │  │   Graph     │                               │
│  │  Service    │  │  Service    │                               │
│  └─────────────┘  └─────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   MongoDB   │  │    Redis    │  │ Prometheus │             │
│  │ (Storage)  │  │  (Cache)    │  │  (Metrics) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Device Management
- Register and track devices (mobile, tablet, desktop, smart TV, IoT)
- Support for multiple identifiers (IDFA, GAID, Android ID, cookies)
- Activity tracking and device state management
- Batch device registration

### Device Linking
- Link devices using multiple methods:
  - **IP**: Shared IP address
  - **WiFi**: Shared WiFi network
  - **Cookie**: Shared cookie/session
  - **Login**: Same authenticated user
  - **Fingerprint**: Device fingerprinting
  - **Behavioral**: Behavior pattern analysis
  - **Household**: Same household
  - **Inferred**: ML-inferred relationships
- Confidence scoring (0-1)
- Evidence tracking
- TTL-based link expiration

### Household Management
- Create and manage households
- Add/remove devices and members
- Role-based membership (owner, member, guest)
- Address and attribute storage
- Household merging

### User Resolution
- Resolve user identity from device
- Multi-signal resolution (direct, identifiers, links, household)
- Confidence-based matching
- Cross-device graph building
- User identity merging

### Device Graph
- Graph-based device relationships
- Node types: device, user, household
- Edge types: links_to, belongs_to, shared_with
- Graph statistics and analysis
- Reachability scoring

## API Endpoints

### Device Management

#### Register Device
```http
POST /api/devices
Content-Type: application/json
X-Internal-Token: <token>

{
  "deviceId": "device-123",
  "type": "mobile",
  "platform": "ios",
  "userId": "user-456",
  "identifiers": {
    "idfa": "AABBCCDD-1234-5678-90EF",
    "gaid": "GAID123456789"
  },
  "attributes": {
    "screenWidth": 390,
    "screenHeight": 844,
    "manufacturer": "Apple",
    "model": "iPhone 14"
  }
}
```

#### Get Device
```http
GET /api/devices/:id
X-Internal-Token: <token>
```

#### Get User Devices
```http
GET /api/devices/user/:userId
X-Internal-Token: <token>
```

### Device Linking

#### Link Devices
```http
POST /api/devices/link
Content-Type: application/json
X-Internal-Token: <token>

{
  "deviceIds": ["device-123", "device-456"],
  "confidence": 0.85,
  "method": "wifi",
  "evidence": {
    "sharedWifi": true
  },
  "userId": "user-456"
}
```

### Household Management

#### Get Device Household
```http
GET /api/devices/:id/household
X-Internal-Token: <token>
```

#### Create Household
```http
POST /api/households
Content-Type: application/json
X-Internal-Token: <token>

{
  "householdId": "hh-123",
  "name": "Smith Family",
  "members": [
    {
      "userId": "user-456",
      "role": "owner"
    }
  ]
}
```

### User Resolution

#### Resolve User
```http
POST /api/devices/resolve
Content-Type: application/json
X-Internal-Token: <token>

{
  "deviceId": "device-123",
  "identifiers": {
    "idfa": "AABBCCDD-1234-5678-90EF"
  }
}
```

### Device Graph

#### Get Device Graph
```http
GET /api/devices/:id/graph
X-Internal-Token: <token>
```

#### Get User Graph
```http
GET /api/users/:userId/graph
X-Internal-Token: <token>
```

### Statistics

#### Get Device Stats
```http
GET /api/devices/stats
X-Internal-Token: <token>
```

### Health& Monitoring

#### Health Check
```http
GET /health
```

#### Prometheus Metrics
```http
GET /metrics
```

## Data Models

### Device
```typescript
{
  deviceId: string;           // Unique device identifier
  type: DeviceType;         // mobile, tablet, desktop, smart_tv, smart_watch, iot, other
  platform: Platform;        // ios, android, windows, macos, linux, web, tvos, other
  userId?: string;           // Associated user
  householdId?: string;     // Associated household
  identifiers: {
    idfa?: string;           // iOS Advertising ID
    gaid?: string;           // Google Advertising ID
    androidId?: string;     // Android Device ID
    cookieId?: string;       // Browser cookie ID
    ipAddress?: string;      // Current IP
    userAgent?: string;      // User agent string
  };
  attributes: {
    screenWidth?: number;
    screenHeight?: number;
    browser?: string;
    osVersion?: string;
    appVersion?: string;
    manufacturer?: string;
    model?: string;
  };
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  tags: string[];
}
```

### DeviceLink
```typescript
{
  deviceIds: [string, string];  // Pair of linked devices
  confidence: number;            // 0-1 confidence score
  method: LinkMethod;            // ip, wifi, cookie, login, fingerprint, behavioral, household, inferred
  evidence: {
    sharedIp?: boolean;
    sharedWifi?: boolean;
    sharedCookie?: boolean;
    loginTimestamp?: Date;
    fingerprintScore?: number;
    behavioralScore?: number;
  };
  userId?: string;
  householdId?: string;
  expiresAt?: Date;
}
```

### Household
```typescript
{
  householdId: string;
  name?: string;
  devices: string[];
  members: [{
    userId: string;
    role: 'owner' | 'member' | 'guest';
    joinedAt: Date;
  }];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  attributes: Record<string, any>;
}
```

### DeviceGraph
```typescript
{
  userId: string;
  nodes: [{
    id: string;
    type: 'device' | 'user' | 'household';
    attributes?: Record<string, any>;
  }];
  edges: [{
    source: string;
    target: string;
    type: 'links_to' | 'belongs_to' | 'shared_with';
    weight: number;
    metadata?: Record<string, any>;
  }];
  lastUpdated: Date;
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `4997` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/device-graph` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `INTERNAL_SERVICE_TOKENS` | Comma-separated service tokens | - |
| `INTERNAL_ADMIN_TOKEN` | Admin token | - |
| `VALID_API_KEYS` | Comma-separated API keys | - |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `LOG_LEVEL` | Log level | `info` |

## Installation

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Testing

```bash
# Run tests
npm test

# Health check
curl http://localhost:4997/health

# Get metrics
curl http://localhost:4997/metrics
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `device_graph_devices_registered_total` - Total devices registered
- `device_graph_devices_linked_total` - Total device links created
- `device_graph_households_created_total` - Total households created
- `device_graph_resolution_attempts_total` - Resolution attempts by method
- `device_graph_http_request_duration_seconds` - HTTP request duration
- `device_graph_db_operation_duration_seconds` - Database operation duration

## Ecosystem Integration

### Connected Services

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | User authentication |
| RABTUL Wallet | 4004 | User wallet for rewards |
| AdBazaar Core | 4060 | Ad targeting and attribution |
| AdBazaar SSP | 4520 | Supply-side platform |

### Authentication

All API endpoints (except `/health` and `/metrics`) require authentication via:
- `X-Internal-Token`: Internal service token
- `X-API-Key`: API key for external clients

## License

Proprietary - AdBazaar Inc.
