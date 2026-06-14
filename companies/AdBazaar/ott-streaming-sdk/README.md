# OTT Streaming SDK

Client SDK configuration service for OTT app developers building CTV (Connected TV) applications.

## Overview

This service provides:
- SDK configuration management for CTV apps
- DRM license acquisition (Widevine, Fairplay)
- Stream URL management with multi-CDN support
- Playback analytics collection
- Player heartbeat monitoring
- Manifest generation

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm run dev
```

## API Endpoints

### Configuration

```
GET  /api/config           - Get SDK configuration
PUT  /api/config           - Update SDK configuration
GET  /api/config/all      - Get all configurations (admin)
```

### DRM

```
POST /api/drm/license     - Acquire DRM license
GET  /api/drm/certificates/:drmType - Get DRM certificates
POST /api/drm/validate    - Validate DRM session
```

### Streams

```
GET  /api/stream/:contentId      - Get stream URLs
GET  /api/stream                 - List all streams (admin)
```

### Manifest

```
GET  /api/manifest/:contentId    - Get processed manifest
```

### Analytics

```
POST /api/analytics              - Collect playback events
GET  /api/analytics/metrics    - Get playback metrics
GET  /api/analytics/content/:contentId - Get content analytics
```

### Heartbeat

```
POST /api/heartbeat             - Player heartbeat
GET  /api/heartbeat/active     - Get active player sessions
GET  /api/heartbeat/active/:contentId - Get sessions for content
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4703 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ott-streaming-sdk |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| JWT_SECRET | JWT signing secret | - |
| CDN_BASE_URL | CDN base URL | https://cdn.adbazaar.com |
| DRM_LICENSE_URL | DRM license server URL | https://drm.adbazaar.com |
| FAIRPLAY_CERTIFICATE_URL | Fairplay certificate URL | https://drm.adbazaar.com/fairplay/certificate |
| AD_SERVER_URL | Ad server URL | https://ads.adbazaar.com |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OTT Streaming SDK                        │
├─────────────────────────────────────────────────────────────┤
│  Routes                                                     │
│  ├── Config Routes (SDK configuration)                    │
│  ├── DRM Routes (license acquisition)                      │
│  ├── Stream Routes (URL management)                        │
│  ├── Manifest Routes (manifest generation)                │
│  ├── Analytics Routes (event collection)                   │
│  └── Heartbeat Routes (player monitoring)                 │
├─────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ├── Config Service (configuration management)            │
│  ├── DRM Service (Widevine/Fairplay)                      │
│  ├── Stream Service (CDN management)                       │
│  ├── Analytics Service (playback tracking)                 │
│  └── Heartbeat Service (player sessions)                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── MongoDB (configurations, events, assets)             │
│  └── Redis (sessions, caching, real-time)                 │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Multi-CDN Configuration
- Primary CDN with automatic fallback
- Regional CDN selection based on device location
- Cache management with automatic invalidation

### Adaptive Bitrate Streaming
- Support for HLS and DASH formats
- Multiple quality levels (4K, 1080p, 720p, 480p, 360p)
- Dynamic bitrate selection

### DRM Support
- Widevine (Google) for Android/Chrome
- Fairplay (Apple) for iOS/tvOS
- License session management
- Certificate retrieval

### Analytics
- Real-time event collection
- Playback quality metrics
- Buffer and completion tracking
- Device and content analytics

### Player Monitoring
- Active session tracking
- Heartbeat-based presence detection
- Quality and position monitoring

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Metrics

Prometheus metrics available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `ott_active_streams_total` - Active streams
- `ott_playback_events_total` - Playback events by type
- `ott_drm_license_requests_total` - DRM license requests
- `ott_heartbeat_total` - Heartbeat messages
- `ott_stream_latency_seconds` - Stream fetch latency
- `ott_quality_distribution` - Quality distribution

## License

Proprietary - AdBazaar Inc.