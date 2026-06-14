# Influencer Discovery Service

**Port:** 5065

## Overview
Find and match influencers by niche, audience demographics, engagement rate, and platform presence.

## Features
- Influencer profile management
- Advanced search with filters
- Campaign matching
- Audience analytics
- Match scoring algorithm

## Models

### Influencer
Main influencer profile with platform stats and contact info.

### Profile
Platform-specific profile data (synced from social platforms).

### Audience
Audience demographics and engagement metrics.

### Match
Campaign-influencer matching records.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/influencers | Create influencer |
| GET | /api/influencers | List all influencers |
| GET | /api/influencers/:id | Get influencer by ID |
| POST | /api/influencers/search | Search influencers |
| GET | /api/influencers/:id/profile | Get full profile |
| POST | /api/influencers/:id/match | Match to campaign |
| PUT | /api/influencers/:id | Update influencer |
| DELETE | /api/influencers/:id | Delete influencer |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-discovery-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5065 | Service port |
| MONGODB_URI | mongodb://localhost:27017/influencer_discovery | MongoDB connection |

## Health Check

```bash
curl http://localhost:5065/health
```

## Metrics

```bash
curl http://localhost:5065/metrics
```
