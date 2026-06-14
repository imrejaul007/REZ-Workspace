# Atlas Intelligence Assistant

**Port:** 5390 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Conversational AI assistant for business queries. Ask questions in natural language and get actionable insights.

## Features

- **Natural Language Queries** - Ask in plain English
- **Report Generation** - Auto-generate reports
- **Recommendations** - Actionable insights
- **Action Triggers** - Execute from chat

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to assistant |
| GET | `/api/history` | Get conversation history |

## Quick Start

```bash
cd atlas-intelligence-assistant
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5390/health
```

## Example Request

```bash
curl -X POST http://localhost:5390/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is our revenue growth this month?"
  }'
```

## Response

```json
{
  "response": "Revenue is up 12.5% this month.",
  "sources": ["analytics", "sales"],
  "actions": ["View Report", "Export Data"]
}
```
