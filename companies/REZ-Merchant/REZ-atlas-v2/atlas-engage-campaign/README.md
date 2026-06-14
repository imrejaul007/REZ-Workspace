# Atlas Engage Campaign

**Port:** 5260 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Multi-channel campaign execution engine. Launch campaigns across WhatsApp, SMS, Email, and Push notifications with A/B testing.

## Features

- **WhatsApp Campaigns** - Rich messaging with templates
- **SMS Campaigns** - High delivery, instant reach
- **Email Campaigns** - Professional communications
- **Push Notifications** - Re-engagement
- **A/B Testing** - Optimize message performance

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/campaigns/:id/launch` | Launch campaign |
| GET | `/api/campaigns/:id/stats` | Get campaign stats |

## Quick Start

```bash
cd atlas-engage-campaign
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5260/health
```

## Ecosystem Integration

- **RABTUL WhatsApp** - WhatsApp Business API
- **RABTUL SMS** - SMS gateway
- **atlas-engage-core** - Campaign management
