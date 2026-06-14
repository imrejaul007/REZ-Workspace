# Atlas Workforce Talent

**Port:** 5230 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Internal talent marketplace for matching employees to tasks, gigs, and mentorship opportunities based on skills and availability.

## Features

- **Skill Matching** - Match tasks to employees by skills
- **Gig Management** - Create and assign short-term tasks
- **Mentorship Pairing** - Connect senior and junior employees
- **Resource Allocation** - Optimize resource deployment

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/talents` | List talents (filter by skill, availability) |
| POST | `/api/talents` | Register new talent |
| POST | `/api/match` | Find matching talents for requirement |

## Quick Start

```bash
cd atlas-workforce-talent
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5230/health
```

## Example Request

```bash
# Find match
curl -X POST http://localhost:5230/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": {
      "skills": ["restaurant", "negotiation"],
      "availability": "full_time"
    }
  }'
```

## Ecosystem Integration

- **atlas-workforce-core** - Employee skills database
- **HOJAI AI** - Skill matching algorithms
