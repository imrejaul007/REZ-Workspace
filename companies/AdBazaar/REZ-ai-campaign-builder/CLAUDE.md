# REZ AI Campaign Builder

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4009

## Overview
AI-powered campaign generation service that creates complete marketing campaigns from natural language goals. Converts merchant objectives like "get more lunch customers" into structured campaigns with channels, budget allocation, targeting, and creative assets.

## Tech Stack
- Framework: Express.js (Node.js)
- Security: Helmet, CORS, Rate Limiting, Internal Auth
- AI: AI Generator service for campaign creation

## Key Features
1. **Natural Language Campaign Generation** - Generate campaigns from simple goals
2. **Channel Recommendations** - AI-suggested channels (WhatsApp, Push, SMS, etc.)
3. **Budget Allocation** - Optimal budget distribution across channels
4. **Creative Generation** - Generate headlines, body copy, and CTAs
5. **Campaign Optimization** - Analyze and optimize existing campaigns
6. **Template Library** - Pre-built templates for different merchant types
7. **Multi-Industry Support** - Restaurant, Hotel, Retail, Fitness, etc.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/generate | Generate campaign from natural language |
| POST | /api/generate-creative | Generate ad creative copy |
| GET | /api/recommendations | Get channel recommendations |
| POST | /api/optimize | Optimize existing campaign |
| GET | /api/templates | Get campaign templates by type |

## Quick Start

```bash
cd REZ-ai-campaign-builder
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4009)
- INTERNAL_SERVICE_TOKEN

## Related Services
- REZ-ad-ai - Ad creative generation
- REZ-marketing-backend - Campaign management
- REZ-media-analytics - Analytics pipeline
- REZ-growth-playbook - Growth playbooks
- HOJAI AI - Campaign generation models