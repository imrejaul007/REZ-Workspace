# REZ Video Ads

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4067

## Overview
Video ad serving service with VAST/VPAID support. Manages video ad creation, serves VAST XML responses for video players, and tracks ad events (start, quartile completion, skip, click).

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Security: Helmet, CORS, Rate Limiting
- Protocol: VAST 4.2

## Key Features
1. **Video Ad Management** - Create, update, and manage video ads
2. **VAST XML Generation** - Generate VAST 4.2 compliant XML responses
3. **Ad Formats** - Support preroll, midroll, and postroll formats
4. **Skip Offset** - Configurable skip offset for skippable ads
5. **Event Tracking** - Track start, quartile, complete, skip, click events
6. **Click Tracking** - Track clicks with click-through URLs
7. **Status Management** - Active, paused, completed ad states

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/ads | Create video ad |
| GET | /api/ads | List video ads |
| GET | /api/ads/:id | Get video ad details |
| GET | /api/ads/:id/vast | Get VAST XML for ad |
| POST | /api/ads/:id/track | Track ad event |

## VAST Tracking Events
| Event | Description |
|-------|-------------|
| start | Video started playing |
| firstQuartile | 25% complete |
| midpoint | 50% complete |
| thirdQuartile | 75% complete |
| complete | Video completed |
| skip | User skipped ad |
| click | User clicked ad |

## Video Ad Schema
| Field | Type | Description |
|-------|------|-------------|
| adId | string | Unique ad identifier |
| advertiserId | string | Advertiser identifier |
| name | string | Ad name |
| videoUrl | string | Video file URL |
| duration | number | Duration in seconds |
| skipOffset | number | Seconds before skip allowed |
| vastXml | string | Pre-generated VAST XML |
| clickUrl | string | Click-through URL |
| format | enum | preroll, midroll, postroll |
| status | enum | active, paused, completed |

## Quick Start

```bash
cd REZ-video-ads
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4067)
- MONGODB_URI

## Related Services
- REZ-media-analytics - Video ad analytics
- REZ-ad-ai - Video ad optimization
- REZ-programmatic-bidding - Bidding for video inventory