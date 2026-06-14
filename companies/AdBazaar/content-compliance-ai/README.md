# Content Compliance AI Service

**Port:** 5113  
**Company:** AdBazaar  
**Purpose:** AI-powered content policy compliance checking for advertising and marketing content

## Overview

The Content Compliance AI Service provides automated content moderation and policy compliance checking for multi-platform advertising content. It leverages AI models (OpenAI GPT-4, Anthropic Claude) for advanced content analysis alongside rule-based detection.

## Features

### Compliance Checks

- **Brand Safety** - Detects controversial topics, sensitive subjects
- **Platform Policy Compliance** - Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn rules
- **Copyright Detection** - Trademarks, music, copyrighted material
- **Trademark Detection** - Unauthorized brand usage
- **FTC Disclosure** - #Ad, sponsored content disclosure compliance
- **Inappropriate Content** - Violence, adult content, hate speech
- **Competitor Mentions** - Detects competitor brand references

### Core Capabilities

- **Compliance Scoring** - 0-100 score based on violations
- **Pre-publish Validation** - Block content before publishing
- **Auto-fix Suggestions** - AI-powered content remediation
- **Multi-platform Support** - Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn
- **Batch Processing** - Check up to 100 items at once
- **Analytics Dashboard** - Track compliance trends over time

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI:** OpenAI GPT-4, Anthropic Claude
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus
- **Language:** TypeScript

## Installation

```bash
cd content-compliance-ai
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Service port (default: 5113) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | No |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI analysis | No |
| `INTERNAL_SERVICE_TOKEN` | Token for inter-service communication | Yes |
| `SERVICE_SECRET_KEY` | Service authentication key | Yes |

## Running the Service

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:5113/health
```

### Metrics

```bash
curl http://localhost:5113/metrics
```

## API Endpoints

### Content Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/compliance/check` | Check single content |
| `POST` | `/api/compliance/batch` | Batch check (up to 100) |
| `GET` | `/api/compliance/report/:id` | Get compliance report |
| `POST` | `/api/compliance/pre-publish` | Pre-publish validation |
| `POST` | `/api/compliance/fix` | Get fix suggestions |

### Rule Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/compliance/rules` | Create rule |
| `GET` | `/api/compliance/rules` | List rules |
| `PATCH` | `/api/compliance/rules/:id` | Update rule |
| `DELETE` | `/api/compliance/rules/:id` | Delete rule |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/compliance/history` | Check history |
| `GET` | `/api/compliance/analytics` | Compliance analytics |

## API Examples

### Check Content

```bash
curl -X POST http://localhost:5113/api/compliance/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "contentId": "post-123",
    "text": "Check out our new product #ad #sponsored",
    "platform": "instagram"
  }'
```

### Pre-publish Validation

```bash
curl -X POST http://localhost:5113/api/compliance/pre-publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "contentId": "draft-456",
    "text": "Get 50% off today only!",
    "platform": "facebook"
  }'
```

### Get Fix Suggestions

```bash
curl -X POST http://localhost:5113/api/compliance/fix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "contentId": "post-789"
  }'
```

### Create Compliance Rule

```bash
curl -X POST http://localhost:5113/api/compliance/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "name": "Gambling Content",
    "type": "brand_safety",
    "description": "Blocks gambling-related content",
    "severity": "high",
    "platforms": ["all"],
    "keywords": ["casino", "betting", "poker"],
    "action": "block",
    "enabled": true
  }'
```

### Get Analytics

```bash
curl http://localhost:5113/api/compliance/analytics \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "check-id",
    "contentId": "post-123",
    "score": 85,
    "status": "passed",
    "violations": [],
    "processingTimeMs": 150,
    "checkedAt": "2026-06-08T12:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    { "path": "text", "message": "Required" }
  ]
}
```

## Compliance Scoring

| Score Range | Status | Description |
|-------------|--------|-------------|
| 80-100 | `passed` | Content is compliant |
| 50-79 | `warning` | Minor issues found |
| 0-49 | `failed` | Critical issues found |

## Severity Levels

| Severity | Weight | Description |
|----------|--------|-------------|
| `critical` | -25 points | Immediate blocking required |
| `high` | -15 points | Serious compliance issue |
| `medium` | -8 points | Moderate concern |
| `low` | -3 points | Minor issue |
| `info` | -1 point | Informational |

## Default Rules

The service initializes with 11 default compliance rules:

1. FTC Disclosure Check
2. Competitor Mention Detection
3. Profanity Filter
4. Copyright Music Detection
5. Trademark Detection
6. Violence Content Detection
7. Adult Content Detection
8. Hate Speech Detection
9. Instagram Community Guidelines
10. Facebook Ad Policy
11. Twitter Character Limit

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Compliance AI                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Express   │───▶│  Middleware │───▶│   Routes    │    │
│  │   Server    │    │  (Auth, RL) │    │             │    │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    │
│                                               │             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Services Layer                     │   │
│  │  ┌──────────────────┐  ┌────────────────────────┐   │   │
│  │  │ ComplianceService│  │      AIService         │   │   │
│  │  │  - Rule Engine   │  │  - GPT-4 Analysis      │   │   │
│  │  │  - Scoring       │  │  - Claude Analysis     │   │   │
│  │  │  - Validation    │  │  - Fix Suggestions     │   │   │
│  │  └──────────────────┘  └────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   MongoDB Models                     │   │
│  │  ComplianceRule │ ComplianceCheck │ ComplianceReport │   │
│  │                    ComplianceHistory                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request duration |
| `compliance_checks_total` | Counter | Total compliance checks |
| `compliance_score_average` | Gauge | Average compliance score |

## Inter-service Communication

Internal services can call this service using:

```
X-Internal-Token: YOUR_INTERNAL_SERVICE_TOKEN
X-User-Id: user-id
```

## License

Proprietary - AdBazaar

## Support

For issues and feature requests, contact the AdBazaar team.