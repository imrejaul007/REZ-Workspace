# AdBazaar Probabilistic Matching Service

**Port:** 4998  
**Version:** 1.0.0  
**Status:** Complete

Statistical identity resolution service for AdBazaar's advertising platform. Provides probabilistic matching, device fingerprinting, match graph analysis, and confidence scoring.

## Overview

The Probabilistic Matching Service enables accurate device and user identity resolution across AdBazaar's advertising ecosystem. It uses statistical methods to match devices and users based on multiple signals including IP addresses, user agents, device fingerprints, behavioral patterns, temporal data, and geographic information.

## Features

### Core Capabilities

- **Probabilistic Matching** - Match devices/users using weighted feature comparison
- **Device Fingerprinting** - Create and compare device fingerprints
- **Match Graph Analysis** - Visualize device relationship networks
- **Confidence Scoring** - Calculate and track match confidence levels
- **Match Merging** - Merge multiple matches into unified profiles
- **Batch Processing** - Process large volumes of match requests

### Matching Features

| Feature | Weight | Description |
|---------|--------|-------------|
| IP Address | 15% | Subnet-based IP matching |
| User Agent | 15% | Browser/OS component matching |
| Device Fingerprint | 25% | Hash-based fingerprint comparison |
| Behavioral | 20% | Session and interaction patterns |
| Temporal | 15% | Time-based consistency analysis |
| Geographic | 10% | Location-based matching |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBABILISTIC MATCHING SERVICE │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Routes │  │  Services  │  │   Models   │              │
│  │ │  │             │  │            │              │
│  │ matchRoutes│  │ matchingSvc │  │ ProbMatch │              │
│  │ fingerRoutes│ │ fingerprintSvc│ │ Fingerprint│ │
│  │ graphRoutes│  │ graphSvc   │  │ MatchGraph │              │
│  │            │  │ confidenceSvc│ │ MatchStats │              │
│  │            │  │ mergeSvc   │  │            │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middleware Layer │   │
│  │ Auth │ Validation │ Logging │ Metrics │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Data Layer                             │   │
│  │              MongoDB │ Redis │ Prometheus │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Match Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/probabilistic` | Create probabilistic match |
| POST | `/api/match/batch` | Batch matching |
| GET | `/api/match/:id` | Get match by ID |
| GET | `/api/match/stats` | Get match statistics |
| PATCH | `/api/match/:id/confirm` | Confirm a match |
| PATCH | `/api/match/:id/reject` | Reject a match |
| GET | `/api/match/device/:deviceId` | Get matches for device |

### Fingerprint Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/fingerprint` | Create fingerprint |
| GET | `/api/match/fingerprint/:id` | Get fingerprint |
| GET | `/api/match/fingerprint/device/:deviceId` | Get fingerprints for device |
| GET | `/api/match/fingerprint/similar/:hash` | Find similar fingerprints |
| POST | `/api/match/fingerprint/compare` | Compare two fingerprints |
| PUT | `/api/match/fingerprint/:id` | Update fingerprint |
| DELETE | `/api/match/fingerprint/:id` | Deactivate fingerprint |
| GET | `/api/match/fingerprint/stats` | Get fingerprint statistics |

### Graph Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/graph` | Create match graph |
| GET | `/api/match/graph/:id` | Get graph by ID |
| GET | `/api/match/graph/device/:deviceId` | Get graph by device |
| POST | `/api/match/graph/:id/node` | Add node to graph |
| POST | `/api/match/graph/:id/edge` | Add edge to graph |
| DELETE | `/api/match/graph/:id/edge/:edgeId` | Remove edge |
| GET | `/api/match/graph/:id/connected/:deviceId` | Get connected devices |
| PATCH | `/api/match/graph/:id/complete` | Mark graph complete |
| DELETE | `/api/match/graph/:id` | Delete graph |
| GET | `/api/match/graph/stats` | Get graph statistics |
| POST | `/api/match/graph/merge` | Merge two graphs |

### Confidence& Merge Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/match/confidence/:id` | Get confidence score |
| POST | `/api/match/merge` | Merge matches |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/probabilistic-matching
npm install
```

### Environment Variables

```bash
PORT=4998
MONGO_URI=mongodb://localhost:27017/probabilistic_matching
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
NODE_ENV=development
INTERNAL_SERVICE_TOKEN=your-internal-token
```

### Start Development Server

```bash
npm run dev
```

### Health Check

```bash
curl http://localhost:4998/health
```

## API Examples

### Create Probabilistic Match

```bash
curl -X POST http://localhost:4998/api/match/probabilistic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-token" \
  -d '{
    "deviceIds": ["device_abc123", "device_def456"],
    "features": {
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "deviceFingerprint": "fp_abc123def456",
      "behavioral": {
        "pageViews": 25,
        "sessionDuration": 1800,
        "clicks": 12
      },
      "temporal": {
        "firstSeen": "2024-01-01T00:00:00Z",
        "lastSeen": "2024-06-15T12:00:00Z"
      },
      "geographic": {
        "country": "IN",
        "region": "KA",
        "city": "Bangalore",
        "timezone": "Asia/Kolkata"
      }
    },
    "sources": ["web", "mobile"],
    "metadata": {
      "campaignId": "camp_123",
      "publisherId": "pub_456"
    }
  }'
```

### Batch Matching

```bash
curl -X POST http://localhost:4998/api/match/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-token" \
  -d '{
    "matches": [
      {
        "deviceIds": ["device_a", "device_b"],
        "features": { "ip": "192.168.1.1", "userAgent": "Chrome/120" }
      },
      {
        "deviceIds": ["device_c", "device_d"],
        "features": { "ip": "192.168.1.2", "userAgent": "Firefox/121" }
      }
    ]
  }'
```

### Create Device Fingerprint

```bash
curl -X POST http://localhost:4998/api/match/fingerprint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-token" \
  -d '{
    "deviceId": "device_abc123",
    "features": {
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      "screenResolution": "390x844",
      "timezone": "Asia/Kolkata",
      "language": "en-IN",
      "platform": "iPhone",
      "browser": "Safari",
      "webglVendor": "Apple Inc.",
      "webglRenderer": "Apple GPU",
      "fonts": ["Arial", "Helvetica", "San Francisco"]
    }
  }'
```

### Create Match Graph

```bash
curl -X POST http://localhost:4998/api/match/graph \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-token" \
  -d '{
    "rootDeviceId": "device_abc123",
    "name": "User Identity Graph",
    "nodes": [
      { "deviceId": "device_abc123", "type": "device" },
      { "deviceId": "device_def456", "type": "device" }
    ],
    "edges": [
      {
        "sourceNodeId": "node_1",
        "targetNodeId": "node_2",
        "type": "ip-match",
        "weight": 0.8,
        "probability": 0.85
      }
    ]
  }'
```

### Get Confidence Score

```bash
curl http://localhost:4998/api/match/confidence/match_abc123 \
  -H "Authorization: Bearer your-internal-token"
```

### Merge Matches

```bash
curl -X POST http://localhost:4998/api/match/merge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-token" \
  -d '{
    "sourceMatchIds": ["match_abc123", "match_def456"],
    "reason": "Same user confirmed via login",
    "metadata": {
      "confirmedBy": "user_auth_service"
    }
  }'
```

## Data Models

### ProbMatch

```typescript
{
  matchId: string;           // Unique match identifier
  deviceIds: string[];       // List of matched device IDs
  probability: number;       // Match probability (0-1)
  confidence: number;        // Confidence score (0-100)
  features: MatchFeature[];  // Matched features with similarity
  model: ModelConfig;        // Model configuration used
  status: 'pending' | 'confirmed' | 'rejected' | 'merged';
  sources: string[];         // Data sources
  firstSeen: Date;          // First match time
  lastSeen: Date;           // Last match time
  mergeCount: number;       // Number of merges
  mergedInto?: string;      // Target match if merged
  metadata: object;         // Additional metadata
}
```

### Fingerprint

```typescript
{
  fingerprintId: string;     // Unique fingerprint ID
  deviceId: string;         // Device identifier
  features: FingerprintFeature[];
  hash: string;             // Fingerprint hash
  confidence: number;       // Confidence score (0-100)
  version: string;          // Fingerprint version
  isActive: boolean;         // Active status
  matchCount: number;        // Number of matches
  lastMatchAt?: Date;        // Last match time
  metadata: object;           // Device metadata
}
```

### MatchGraph

```typescript
{
  graphId: string;           // Unique graph ID
  name: string;              // Graph name
  nodes: GraphNode[];        // Graph nodes
  edges: GraphEdge[];        // Graph edges
  rootDeviceId: string;      // Root device ID
  depth: number;             // Graph depth
  density: number;           // Graph density
  isComplete: boolean;       // Completion status
  metadata: object;           // Graph metadata
}
```

## Confidence Levels

| Level | Threshold | Action |
|-------|-----------|--------|
| High | >= 85% | Auto-confirm |
| Medium | 60-84% | Manual review |
| Low | 40-59% | Additional verification |
| Very Low | < 40% | Reject |

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `probabilistic_match_requests_total` - Total match requests
- `batch_match_requests_total` - Batch match requests
- `fingerprint_operations_total` - Fingerprint operations
- `graph_operations_total` - Graph operations
- `merge_operations_total` - Merge operations
- `match_duration_seconds` - Match processing duration
- `confidence_score_distribution` - Confidence score distribution
- `match_probability_distribution` - Probability distribution
- `active_matches_current` - Active matches count
- `graph_nodes_total` - Total graph nodes
- `graph_edges_total` - Total graph edges
- `match_accuracy_score` - Match accuracy (F1)

## Configuration

### Model Weights

```typescript
{
  ip: 0.15,
  userAgent: 0.15,
  deviceFingerprint: 0.25,
  behavioral: 0.20,
  temporal: 0.15,
  geographic: 0.10
}
```

### Confidence Thresholds

```typescript
{
  high: 85,
  medium: 60,
  low: 40
}
```

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Dependencies

- **Express** - HTTP server framework
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and session storage
- **Winston** - Logging
- **Prometheus** - Metrics collection
- **Zod** - Schema validation
- **TypeScript** - Type safety

## Directory Structure

```
probabilistic-matching/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main entry point
    ├── models/
    │   ├── ProbMatch.ts     # Match model
    │   ├── Fingerprint.ts   # Fingerprint model
    │   ├── MatchGraph.ts    # Graph model
    │   ├── MatchStats.ts   # Statistics model
    │   └── index.ts         # Model exports
    ├── services/
    │   ├── matchingService.ts     # Matching logic
    │   ├── fingerprintService.ts # Fingerprint logic
    │   ├── graphService.ts       # Graph operations
    │   ├── confidenceService.ts  # Confidence scoring
    │   ├── mergeService.ts       # Merge operations
    │   └── index.ts              # Service exports
    ├── routes/
    │   ├── matchRoutes.ts       # Match endpoints
    │   ├── fingerprintRoutes.ts # Fingerprint endpoints
    │   └── graphRoutes.ts       # Graph endpoints
    ├── middleware/
    │   └── auth.ts # Authentication
    └── utils/
        ├── logger.ts           # Winston logger
        └── metrics.ts          # Prometheus metrics
```

## Ecosystem Integration

The service integrates with:

- **RABTUL Auth** - Internal service authentication
- **RABTUL Wallet** - Match-based rewards
- **AdBazaar Core** - Campaign and ad attribution
- **REZ Intelligence** - Intent and behavior analysis

## License

Internal AdBazaar Service
