# SSAI Service - Server-Side Ad Insertion

Server-Side Ad Insertion (SSAI) service for CTV streaming. Handles HLS/DASH manifest manipulation, SCTE-35 cue processing, and ad break management for live and VOD streaming.

## Features

- **HLS Manifest Manipulation** - Insert ads with X-DISCONTINUITY tags
- **DASH Period Insertion** - Insert ad periods into DASH manifests
- **SCTE-35 Processing** - Parse and process SCTE-35 cue messages
- **Ad Break Management** - Schedule, activate, and complete ad breaks
- **Slate Generation** - Generate fallback slate videos
- **Prometheus Metrics** - Built-in observability
- **JWT Authentication** - Secure API access

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/ssai-service
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=4701
MONGODB_URI=mongodb://localhost:27017/ssai-service
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret
CDN_BASE_URL=https://cdn.adbazaar.com
NODE_ENV=development
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4701/api/health
curl http://localhost:4701/api/health/metrics
```

## API Endpoints

### Stream Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream/:streamId/manifest` | Get modified HLS/DASH manifest with ads |
| POST | `/api/stream/splice/:streamId` | Insert ad splice point |
| POST | `/api/stream/manifest/process` | Process manifest with ads |
| POST | `/api/stream/:streamId/deactivate` | Deactivate a stream |

### Ad Break Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream/:streamId/break` | Get ad break info |
| POST | `/api/stream/:streamId/break/complete` | Mark break complete |
| GET | `/api/stream/:streamId/slate` | Get slate video URL |
| POST | `/api/stream/:streamId/slate` | Set slate video URL |

### SCTE-35 Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cue` | Process SCTE-35 cue message |
| GET | `/api/cue/stream/:streamId` | Get cue history for stream |
| GET | `/api/cue/:cueId` | Get specific cue by ID |
| GET | `/api/cue/segmentation-type/:typeId` | Get segmentation type name |
| POST | `/api/cue/generate` | Generate SCTE-35 splice insert |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full health check |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |
| GET | `/api/health/metrics` | Prometheus metrics |

## API Examples

### Process Manifest with Ads

```bash
curl -X POST http://localhost:4701/api/stream/manifest/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "contentUrl": "https://cdn.example.com/video.m3u8",
    "contentType": "vod",
    "manifestType": "hls",
    "adBreaks": [
      {
        "position": "preroll",
        "duration": 15
      },
      {
        "position": "midroll",
        "offset": 300,
        "duration": 30
      },
      {
        "position": "postroll",
        "duration": 15
      }
    ]
  }'
```

### Insert Ad Splice

```bash
curl -X POST http://localhost:4701/api/stream/splice/stream-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "spliceEventId": 1001,
    "breakDuration": 30,
    "startTime": 120,
    "assets": [
      "https://cdn.adbazaar.com/ads/ad-1.mp4",
      "https://cdn.adbazaar.com/ads/ad-2.mp4"
    ]
  }'
```

### Process SCTE-35 Cue

```bash
curl -X POST http://localhost:4701/api/cue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "streamId": "stream-123",
    "rawData": "0x47413934fc0000000000000000000000000000",
    "ptsTime": 1000
  }'
```

### Complete Ad Break

```bash
curl -X POST http://localhost:4701/api/stream/stream-123/break/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "adBreakId": "break-456",
    "completedAds": ["ad-1", "ad-2"],
    "totalDuration": 30,
    "exitPosition": "natural"
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SSAI Service                          │
├──────��──────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Routes   │  │ Middleware │  │   Models   │          │
│  │  /stream   │  │   Auth    │  │  Stream    │          │
│  │  /cue      │  │  Metrics  │  │  SCTE35    │          │
│  │  /health   │  │   Error   │  │           │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                      Services                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Manifest   │  │ AdInsertion│  │   SCTE35    │        │
│  │   Service   │  │   Service  │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                      External                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   MongoDB   │  │    Redis   │  │     CDN     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### StreamManifest

```typescript
interface StreamManifest {
  streamId: string;
  contentId: string;
  contentType: 'live' | 'vod';
  originalManifestUrl: string;
  modifiedManifestUrl: string;
  manifestType: 'hls' | 'dash';
  adBreaks: AdBreak[];
  slateUrl?: string;
  status: 'active' | 'inactive' | 'completed';
}
```

### AdBreak

```typescript
interface AdBreak {
  id: string;
  position: 'preroll' | 'midroll' | 'postroll';
  offset?: number;
  duration: number;
  maxAds: number;
  status: 'scheduled' | 'active' | 'completed';
  insertedAds: InsertedAd[];
}
```

### SCTE35CueMessage

```typescript
interface SCTE35CueMessage {
  id: string;
  streamId: string;
  spliceEventType: 'splice_insert' | 'splice_schedule' | 'time_signal';
  spliceEventId: number;
  spliceInsert: {
    spliceEventId: number;
    spliceExecuteFlag: boolean;
    breakDuration: number;
  };
  ptsOffset?: number;
  duration?: number;
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Metrics

The service exposes Prometheus metrics at `/api/health/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `ssai_streams_active` - Active SSAI streams gauge
- `ssai_ad_breaks_active` - Active ad breaks gauge
- `ssai_ads_served_total` - Total ads served counter
- `manifest_processing_duration_seconds` - Manifest processing histogram
- `scte35_cues_processed_total` - SCTE-35 cues processed counter

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4701 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/ssai-service | MongoDB connection URI |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `JWT_SECRET` | - | JWT signing secret |
| `CDN_BASE_URL` | https://cdn.adbazaar.com | CDN base URL for manifests |
| `NODE_ENV` | development | Environment (development/production/test) |
| `LOG_LEVEL` | info | Logging level |

## License

Proprietary - AdBazaar Technologies
