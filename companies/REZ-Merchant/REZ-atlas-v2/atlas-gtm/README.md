# Atlas GTM

**Port:** 5200 | **Company:** REZ-Merchant | **Version:** 3.5.0

## Overview

Autonomous Go-To-Market module. Generate complete GTM campaigns from a single domain input.

## Features

- **Company Understanding** - Analyze company from domain
- **Competitor Discovery** - Find all competitors
- **Segment Builder** - Generate target segments
- **Buyer Personas** - Create decision-maker profiles
- **Message Factory** - Generate personalized outreach

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaign/generate` | Generate GTM campaign |
| GET | `/api/campaign/:id` | Get campaign details |

## Quick Start

```bash
cd atlas-gtm
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5200/health
```

## Example Request

```bash
curl -X POST http://localhost:5200/api/campaign/generate \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "targetICP": "enterprise"}'
```
