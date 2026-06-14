# NPS Survey Service

Net Promoter Score surveys for AdBazaar.

## Overview

Complete NPS survey management with:
- NPS, CES, CSAT survey types
- Question management
- Response collection
- Automated result computation
- Trend analysis

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/surveys` | Create survey |
| GET | `/api/surveys/:id` | Get survey |
| PUT | `/api/surveys/:id` | Update survey |
| POST | `/api/surveys/:id/send` | Send survey |
| POST | `/api/surveys/:id/close` | Close survey |
| GET | `/api/surveys/:id/results` | Get results |
| POST | `/api/surveys/:id/compute` | Compute results |
| POST | `/api/surveys/:id/questions` | Add question |
| POST | `/api/surveys/respond` | Submit response |

## Port

**5112**