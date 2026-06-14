# Atlas Engage Content

**Port:** 5280 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

AI Content Studio for generating personalized marketing content. Create compelling messages for WhatsApp, SMS, and Email.

## Features

- **AI Generation** - Auto-generate marketing copy
- **Template Library** - Pre-built templates
- **Personalization** - Dynamic content variables
- **Brand Guidelines** - Maintain consistent voice

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate content |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |

## Quick Start

```bash
cd atlas-engage-content
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5280/health
```

## Example Request

```bash
curl -X POST http://localhost:5280/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp",
    "context": "discount_offer",
    "tone": "friendly"
  }'
```

## Ecosystem Integration

- **HOJAI AI** - GPT-powered content generation
- **atlas-engage-campaign** - Use generated content
