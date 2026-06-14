# Influencer Outreach Service

**Port:** 5070

## Overview
Automated outreach and relationship management for influencer marketing.

## Features
- Multi-channel outreach (email, DM, WhatsApp, SMS, call)
- Automated sequences
- Response tracking
- Personalization
- Analytics and reporting

## Models

### Outreach
Outreach messages with status tracking.

### Sequence
Automated outreach sequences with multiple steps.

### Email
Email records with delivery tracking.

### Response
Response records with sentiment analysis.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/outreach | Create outreach |
| GET | /api/outreach/:id | Get outreach |
| POST | /api/outreach/:id/send | Send outreach |
| GET | /api/outreach/:id/responses | Get responses |
| POST | /api/outreach/:id/response | Record response |
| GET | /api/outreach/sequences | Get sequences |
| POST | /api/outreach/sequences | Create sequence |
| POST | /api/outreach/sequences/:id/enroll | Enroll in sequence |
| GET | /api/outreach/analytics | Get analytics |
| PUT | /api/outreach/:id/status | Update status |
| POST | /api/outreach/:id/schedule | Schedule outreach |
| DELETE | /api/outreach/:id | Delete outreach |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-outreach-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5070/health
```