# NPS Tracking Service

Net Promoter Score surveys and tracking for AdBazaar.

## Overview

This service manages NPS surveys, tracks responses, and provides analytics to measure customer satisfaction and loyalty.

## Features

- **Survey Management**: Create and send NPS surveys
- **Response Tracking**: Track survey responses and scores
- **NPS Calculation**: Automatic NPS score calculation
- **Trend Analysis**: Track NPS changes over time
- **Customer Analytics**: Individual customer NPS history

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nps/surveys` | Create survey |
| POST | `/api/nps/surveys/:id/send` | Send survey |
| GET | `/api/nps/surveys/:id` | Get survey |
| POST | `/api/nps/respond` | Submit response |
| GET | `/api/nps/:customerId/history` | Get customer history |
| GET | `/api/nps/analytics` | Get overall analytics |
| GET | `/api/nps/analytics/:customerId` | Get customer analytics |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

## Port

**Port: 5078**