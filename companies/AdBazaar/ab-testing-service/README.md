# A/B Testing Service

A/B test framework for AdBazaar.

## Overview

Complete A/B testing framework supporting:
- A/B tests
- Multivariate tests
- Multi-armed bandit tests
- Statistical analysis
- Real-time assignment

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tests` | Create test |
| GET | `/api/tests/:id` | Get test by ID |
| PUT | `/api/tests/:id` | Update test |
| POST | `/api/tests/:id/start` | Start test |
| POST | `/api/tests/:id/pause` | Pause test |
| POST | `/api/tests/:id/complete` | Complete test |
| GET | `/api/tests/:id/results` | Get results |
| POST | `/api/tests/:id/compute` | Compute results |
| POST | `/api/tests/:id/variants` | Create variant |
| POST | `/api/tests/:id/assign` | Assign user |
| POST | `/api/tests/convert` | Record conversion |

## Quick Start

```bash
npm install
npm run dev
```

## Port

**5106**