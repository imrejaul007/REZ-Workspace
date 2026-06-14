# Feature Flags Service

Feature rollouts for AdBazaar.

## Overview

Complete feature flag management with:
- Percentage rollouts
- User targeting
- Segment targeting
- Rule-based evaluation
- Evaluation logging

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/flags` | Create flag |
| GET | `/api/flags/:id` | Get flag by ID |
| PUT | `/api/flags/:id` | Update flag |
| POST | `/api/flags/:id/enable` | Enable flag |
| POST | `/api/flags/:id/disable` | Disable flag |
| POST | `/api/flags/:id/evaluate` | Evaluate flag |
| POST | `/api/flags/:id/rules` | Create rule |
| GET | `/api/flags/:id/stats` | Get stats |

## Quick Start

```bash
npm install
npm run dev
```

## Port

**5107**