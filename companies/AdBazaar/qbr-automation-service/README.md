# QBR Automation Service

Quarterly business review preparation for AdBazaar.

## Overview

This service automates the creation and generation of Quarterly Business Reviews (QBRs), including section content generation, report creation, and scheduling.

## Features

- **QBR Creation**: Create QBRs with customizable sections
- **Auto-Generation**: Automatically generate section content from data
- **Report Generation**: Generate PDF, PPTX, HTML, or JSON reports
- **Scheduling**: Schedule QBRs with reminders
- **Analytics**: Track QBR completion and downloads

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qbr` | Create QBR |
| GET | `/api/qbr/:id` | Get QBR |
| PUT | `/api/qbr/:id` | Update QBR |
| POST | `/api/qbr/:id/generate` | Generate QBR content |
| GET | `/api/qbr/:id/report` | Get QBR report |
| GET | `/api/qbr/schedule` | Get scheduled QBRs |
| GET | `/api/qbr/customer/:customerId` | Get customer QBRs |
| GET | `/api/qbr/quarter/:quarter/:year` | Get QBRs by quarter |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

## Port

**Port: 5081**