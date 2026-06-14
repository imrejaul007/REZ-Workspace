# Identity Matching Engine

**Port:** 4952  
**Company:** AdBazaar  
**Purpose:** Deterministic + Probabilistic Identity Resolution for cross-device and cross-platform user identification

---

## Overview

The Identity Matching Engine is a sophisticated identity resolution service that combines deterministic matching (exact identifier matching) with probabilistic matching (statistical fingerprinting) to create unified user profiles across multiple touchpoints.

### Key Features

- **Deterministic Matching:** Exact identifier matching (email, phone, device ID, user ID)
- **Probabilistic Matching:** Statistical fingerprinting for anonymous users
- **Identity Graph:** Visual representation of identity relationships
- **Canonical Resolution:** Automatic resolution to unified user IDs
- **Identity Merging:** Merge multiple identities into one
- **Audit Trail:** Complete audit logging of all operations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    IDENTITY MATCHING ENGINE                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  REST API  │  │ Auth MW │  │  Metrics │              │
│  │ (Express) │  │             │  │  (Prom)     │              │
│  └──────┬──────┘  └─────────────┘  └─────────────┘              │
│         │                                                       │
│  ┌──────┴──────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER                         │   │
│  ├──────────────┬──────────────┬──────────────┬────────────┤   │
│  │Deterministic │ Probabilistic│ Graph     │  Merge    │   │
│  │ Service    │   Service    │   Service   │  Service  │   │
│  └──────────────┴──────────────┴──────────────┴────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 RESOLUTION SERVICE │   │
│  │              + AUDIT SERVICE │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                       │
│  ┌──────┴──────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                             │   │
│  ├──────────────┬──────────────┬──────────────┬────────────┤   │
│  │   Identity   │ MatchResult │ IdentityGraph│ MatchAudit │   │
│  │   (MongoDB)  │  (MongoDB)  │  (MongoDB)   │ (MongoDB) │   │
│  └──────────────┴──────────────┴──────────────┴────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with dependency status |
| GET | `/metrics` | Prometheus metrics endpoint |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/deterministic` | Deterministic identity matching |
| POST | `/api/match/probabilistic` | Probabilistic identity matching |
| POST | `/api/match/merge` | Merge multiple identities |
| POST | `/api/match/batch` | Batch matching operations |
| GET | `/api/match/:id` | Get match result by ID |
| GET | `/api/match/confidence/:id` | Get match confidence details |

### Identity Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/match/graph/:entityId` | Get identity graph for entity |

### Resolution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/match/resolve` | Resolve identifiers to canonical ID |

---

## API Usage Examples

### Deterministic Match

```bash
curl -X POST http://localhost:4952/api/match/deterministic \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-identity-internal-token" \
  -d '{
    "identifiers": {
      "email": "user@example.com",
      "phone": "+919876543210",
      "deviceId": "device_abc123"
    },
    "source": "web-app"
  }'
```

**Response:**
```json
{
  "success": true,
  "canonicalId": "canonical_550e8400-e29b-41d4-a716-446655440000",
  "confidence": 0.95,
  "matchedIdentifiers": ["email:user@example.com", "phone:+919876543210"],
  "matchId": "6578a1b2c3d4e5f6a7b8c9d0"
}
```

### Probabilistic Match

```bash
curl -X POST http://localhost:4952/api/match/probabilistic \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-identity-internal-token" \
  -d '{
    "features": {
      "emailHash": "hash123",
      "phoneHash": "hash456",
      "userAgent": "Mozilla/5.0...",
      "screenResolution": "1920x1080",
      "timezone": "Asia/Kolkata",
      "language": "en-IN"
    },
    "threshold": 0.7,
    "source": "mobile-app"
  }'
```

**Response:**
```json
{
  "success": true,
  "matchFound": true,
  "canonicalId": "canonical_550e8400-e29b-41d4-a716-446655440000",
  "confidence": 0.82,
  "matchedFeatures": ["emailHash", "phoneHash", "userAgent"],
  "matchId": "6578a1b2c3d4e5f6a7b8c9d1"
}
```

### Merge Identities

```bash
curl -X POST http://localhost:4952/api/match/merge \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-identity-internal-token" \
  -d '{
    "sourceIds": [
      "canonical_abc123",
      "canonical_def456"
    ],
    "mergeStrategy": "prefer_latest",
    "metadata": {
      "reason": "user_consent",
      "requestedBy": "user@example.com"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "mergeId": "6578a1b2c3d4e5f6a7b8c9d2",
  "canonicalId": "canonical_abc123",
  "mergedIds": ["canonical_abc123", "canonical_def456"],
  "strategy": "prefer_latest"
}
```

### Batch Matching

```bash
curl -X POST http://localhost:4952/api/match/batch \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-identity-internal-token" \
  -d '{
    "matches": [
      {
        "identifiers": { "email": "user1@example.com" },
        "source": "web"
      },
      {
        "identifiers": { "phone": "+919876543210" },
        "source": "mobile"
      }
    ]
  }'
```

### Get Identity Graph

```bash
curl -X GET "http://localhost:4952/api/match/graph/canonical_abc123?depth=3" \
  -H "X-Internal-Token: adbazaar-identity-internal-token"
```

**Response:**
```json
{
  "success": true,
  "graph": {
    "entityId": "canonical_abc123",
    "nodes": [
      {
        "id": "email:user@example.com",
        "type": "identifier",
        "value": "user@example.com",
        "source": "web",
        "confidence": 1.0
      }
    ],
    "edges": [
      {
        "source": "email:user@example.com",
        "target": "device:device_abc123",
        "type": "exact",
        "weight": 1.0,
        "confidence": 0.9
      }
    ],
    "relationships": [
      {
        "from": "email:user@example.com",
        "to": "email:user@example.com",
        "relationshipType": "same_person",
        "strength": 1.0
      }
    ]
  }
}
```

### Resolve to Canonical

```bash
curl -X POST http://localhost:4952/api/match/resolve \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-identity-internal-token" \
  -d '{
    "identifiers": {
      "email": "user@example.com",
      "phone": "+919876543210"
    },
    "preferExisting": true
  }'
```

---

## Data Models

### Identity

```typescript
{
  canonicalId: string;           // Unique canonical identifier
  identifiers: {                // Map of identifier types to values
    email?: string;
    phone?: string;
    deviceId?: string;
    userId?: string;
    cookieId?: string;
    ipAddress?: string;
    browserFingerprint?: string;
  };
  sources: string[];            // Data sources
  confidence: number;           // Overall confidence (0-1)
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}
```

### MatchResult

```typescript
{
  sourceIds: string[];          // Source identifiers used
  targetId: string;            // Canonical ID result
  method: 'deterministic' | 'probabilistic' | 'merge';
  confidence: number;           // Match confidence (0-1)
  features: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;             // Auto-cleanup after 30 days
}
```

### IdentityGraph

```typescript
{
  entityId: string;             // Canonical ID
  nodes: [{
    id: string;
    type: 'identifier' | 'device' | 'ip' | 'cookie' | 'user';
    value: string;
    source: string;
    confidence: number;
  }];
  edges: [{
    source: string;
    target: string;
    type: 'exact' | 'probabilistic' | 'temporal';
    weight: number;
    confidence: number;
  }];
  relationships: [{
    from: string;
    to: string;
    relationshipType: 'same_person' | 'same_device' | 'same_household' | 'same_business';
    strength: number;
  }];
}
```

---

## Matching Methods

### Deterministic Matching

Deterministic matching uses exact identifier matches to link identities:

| Identifier | Weight | Description |
|------------|--------|-------------|
| email | 1.0 | Primary identifier |
| userId | 1.0 | Authenticated user ID |
| phone | 0.95 | Phone number |
| deviceId | 0.9 | Device identifier |
| cookieId | 0.85 | Browser cookie |
| browserFingerprint | 0.8 | Browser fingerprint |
| ipAddress | 0.6 | IP address |

### Probabilistic Matching

Probabilistic matching uses statistical fingerprinting:

| Feature | Weight | Description |
|---------|--------|-------------|
| emailHash | 0.25 | Hashed email |
| phoneHash | 0.20 | Hashed phone |
| deviceHash | 0.25 | Hashed device ID |
| ipHash | 0.05 | Hashed IP |
| userAgent | 0.05 | Browser user agent |
| screenResolution | 0.05 | Screen size |
| timezone | 0.03 | Timezone |
| language | 0.02 | Language setting |
| cookies | 0.10 | Cookie fingerprint |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4952 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/identity-matching | MongoDB connection |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `INTERNAL_SERVICE_TOKEN` | adbazaar-identity-internal-token | Internal auth token |
| `LOG_LEVEL` | info | Logging level |

---

## Installation

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `identity_matching_http_request_duration_seconds` | Histogram | HTTP request latency |
| `identity_matching_matches_total` | Counter | Total matches by method/status |
| `identity_matching_confidence` | Histogram | Match confidence distribution |
| `identity_matching_identity_count` | Gauge | Total identities |
| `identity_matching_merges_total` | Counter | Total merge operations |
| `identity_matching_batch_duration_seconds` | Histogram | Batch operation latency |
| `identity_matching_audit_entries_total` | Counter | Audit entries by action |

---

## Use Cases

### 1. Cross-Device Tracking
Link the same user across mobile app, web browser, and smart TV using deterministic identifiers.

### 2. Anonymous-to-Authenticated Linking
Connect anonymous browsing behavior to authenticated user profiles after login.

### 3. Identity Graph Visualization
Visualize all known touchpoints for a user to understand their journey.

### 4. GDPR Right to Access
Query all data associated with a user across the ecosystem.

### 5. Fraud Detection
Identify device fingerprinting patterns for fraud prevention.

---

## Security

- Internal service authentication via `X-Internal-Token` header
- API key authentication via `X-Api-Key` header
- Rate limiting (100 requests/minute per IP)
- Audit logging for all operations
- Data retention policies (30-day match results, 1-year audit logs)

---

## Ecosystem Integration

The Identity Matching Engine connects to:

| Service | Company | Purpose |
|---------|---------|---------|
| AdBazaar Core | AdBazaar | Identity resolution for ad targeting |
| RABTUL Auth | RABTUL | User authentication |
| REZ Intelligence | REZ-Intelligence | Intent graph integration |

---

## License

Internal use only - AdBazaar
