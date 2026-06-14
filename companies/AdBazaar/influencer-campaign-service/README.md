# Influencer Campaign Service

**Port:** 5066

## Overview
Manage influencer campaign workflows including campaign creation, influencer assignment, brief management, and deliverable tracking.

## Features
- Campaign lifecycle management
- Influencer assignment and tracking
- Campaign brief management
- Deliverable submission and approval
- Performance tracking

## Models

### Campaign
Main campaign entity with budget, timeline, and platform targets.

### CampaignInfluencer
Influencer-campaign relationship with status tracking.

### Brief
Campaign brief with content guidelines and creative assets.

### Deliverable
Individual content deliverables with performance metrics.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns | List campaigns |
| GET | /api/campaigns/:id | Get campaign |
| PUT | /api/campaigns/:id | Update campaign |
| POST | /api/campaigns/:id/influencers | Add influencer |
| GET | /api/campaigns/:id/influencers | List influencers |
| PUT | /api/campaigns/:id/influencers/:id | Update influencer status |
| GET | /api/campaigns/:id/performance | Get performance |
| POST | /api/campaigns/:id/brief | Create brief |
| GET | /api/campaigns/:id/brief | Get briefs |
| DELETE | /api/campaigns/:id | Delete campaign |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-campaign-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5066/health
```
