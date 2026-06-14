# Data Clean Room Service

**Port:** 4950

Privacy-preserving data matching service that allows brands to safely combine data without exposing raw user data. Competitors: Amazon Ads, Google, Trade Desk.

## Features

### 1. Data Ingestion
- Accept brand data in multiple formats (CSV, JSON, TSV)
- Hash identifiers (SHA256, MD5, SHA1) for privacy
- Support multiple identifier types (email, phone, device_id, cookie)
- Segment-based data organization

### 2. Identity Matching
- Deterministic matching (exact hash match)
- Probabilistic matching (fuzzy matching)
- Hybrid matching (combined approach)
- Integration with Customer Graph 360 and Identity Cloud Service

### 3. Privacy Preservation
- K-anonymity enforcement (minimum group size)
- Differential privacy (Laplace noise)
- Privacy budget tracking
- Federated computation support

### 4. Match Analytics
- Match rate reporting
- Segment-level analytics
- Overlap analysis (Jaccard index)
- Audience size estimation

### 5. Audience Activation
- Push to DSP platforms (Google, Meta, Trade Desk)
- SSP integration
- DMP sync
- Lookalike audience creation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Clean Room Service                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Data    │  │   Match    │  │   Overlap   │              │
│  │ Ingestion  │  │   Engine   │  │  Analysis   │              │
│  │  Service   │  │  Service   │  │  Service    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Activation │  │   Privacy  │  │   Metrics   │              │
│  │  Service   │  │   Service  │  │   Service   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Connected Services                           │
│  Customer Graph 360 │ Identity Cloud │ HOJAI AI                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
cd data-clean-room-service
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Health check
curl http://localhost:4950/health
```

## API Endpoints

### Data Upload
```bash
# Upload brand data
POST /api/data/upload
Content-Type: application/json

{
  "brandId": "brand_123",
  "dataFormat": "csv",
  "hashAlgorithm": "SHA256",
  "identifiers": [
    { "type": "email", "column": "email" },
    { "type": "phone", "column": "phone" }
  ],
  "data": "email,phone,segment\nuser@example.com,9876543210,high_intent",
  "metadata": {
    "name": "Q4 Campaign Data"
  }
}

# Response
{
  "success": true,
  "data": {
    "uploadId": "uuid-v4",
    "recordCount": 10000,
    "processedCount": 10000,
    "hashedCount": 10000,
    "status": "completed",
    "segments": ["high_intent", "loyal"]
  }
}
```

### Match
```bash
# Run matching
POST /api/match
Content-Type: application/json

{
  "uploadId": "uuid-v4",
  "matchType": "deterministic",
  "matchThreshold": 0.7
}

# Response
{
  "success": true,
  "data": {
    "uploadId": "uuid-v4",
    "matchId": "uuid-v4",
    "matchType": "deterministic",
    "uploadedRecords": 10000,
    "matchedRecords": 4250,
    "matchRate": 42.5,
    "segments": [
      { "name": "high_intent", "total": 5000, "matched": 1800, "matchRate": 36 },
      { "name": "loyal_customers", "total": 3000, "matched": 1200, "matchRate": 40 }
    ]
  }
}
```

### Overlap Analysis
```bash
# Analyze overlap between two datasets
POST /api/overlap
Content-Type: application/json

{
  "uploadId1": "uuid-1",
  "uploadId2": "uuid-2",
  "analysisType": "exact"
}

# Response
{
  "success": true,
  "data": {
    "uploadId1": "uuid-1",
    "uploadId2": "uuid-2",
    "totalRecords1": 10000,
    "totalRecords2": 8000,
    "overlappingRecords": 3500,
    "overlapPercentage": 43.75,
    "uniqueToUpload1": 6500,
    "uniqueToUpload2": 4500,
    "jaccardIndex": 0.194,
    "segmentOverlap": {
      "high_intent": { "overlap": 1500, "percentage": 30 }
    }
  }
}
```

### Audience Activation
```bash
# Activate to ad platform
POST /api/activate
Content-Type: application/json

{
  "matchId": "uuid-v4",
  "target": "dsp",
  "targetConfig": {
    "platform": "google",
    "audienceName": "REZ Q4 High Intent"
  },
  "options": {
    "createLookalikes": true,
    "lookalikeSize": 10
  }
}

# Response
{
  "success": true,
  "data": {
    "activationId": "uuid-v4",
    "matchId": "uuid-v4",
    "target": "dsp",
    "status": "completed",
    "recordsActivated": 4250,
    "targetAudienceId": "audience_123",
    "targetResponse": {
      "platform": "google",
      "activated": true,
      "estimatedReach": 42500
    }
  }
}
```

## Health Check

```bash
# Basic health
GET /health

# Response
{
  "status": "healthy",
  "timestamp": "2026-06-07T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "mongodb": true,
    "customerGraph": true,
    "identityCloud": true,
    "hojaiAI": true
  }
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4950 | Service port |
| MONGODB_URI | mongodb://localhost:27017/data_clean_room | MongoDB connection |
| MIN_MATCH_THRESHOLD | 0.7 | Minimum match confidence |
| K_ANONYMITY_THRESHOLD | 5 | Minimum group size for privacy |
| DIFFERENTIAL_PRIVACY_EPSILON | 1.0 | Privacy noise level |

## Environment Variables

```bash
# Copy and configure
cp .env.example .env

# Required
MONGODB_URI=mongodb://localhost:27017/data_clean_room
INTERNAL_SERVICE_TOKEN=your-internal-token

# Optional (for external integrations)
CUSTOMER_GRAPH_URL=http://localhost:4808
IDENTITY_CLOUD_URL=http://localhost:4996
HOJAI_API_URL=http://localhost:4800
```

## Metrics

Prometheus metrics available at `/metrics`:

- `data_clean_room_http_request_duration_seconds` - Request latency
- `data_clean_room_uploads_total` - Total uploads
- `data_clean_room_match_jobs_total` - Total match jobs
- `data_clean_room_match_rate` - Average match rate
- `data_clean_room_activations_total` - Total activations
- `data_clean_room_privacy_budget_consumed` - Privacy budget used

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| customer-graph-360 | 4808 | Customer data & audience |
| identity-cloud-service | 4996 | Identity resolution |
| HOJAI AI | 4800 | Privacy computation |

## License

Proprietary - REZ Ecosystem