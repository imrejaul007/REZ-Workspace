# REZ Ad AI

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4021

## Overview
AI-powered ad generation, optimization, and creative analysis service. Derives intent signals from user behavior and provides intelligent ad recommendations, banner generation, copy writing, and campaign optimization.

## Tech Stack
- Framework: Express.js (Node.js)
- Security: Helmet, CORS, Rate Limiting, Internal Auth
- Logging: Winston
- Request Tracing: Request ID middleware

## Key Features
1. **Banner Generation** - AI-powered banner ad asset generation with variations
2. **Ad Copy Writing** - Generate compelling ad copy and CTAs
3. **Creative Analysis** - Analyze creative performance and provide suggestions
4. **Bid Optimization** - AI-driven bid strategy optimization
5. **Targeting Optimization** - Optimize targeting parameters
6. **Intent Prediction** - Predict user intent from behavior signals
7. **Batch Processing** - Batch generate and optimize multiple ads/campaigns
8. **Campaign Auditing** - Complete campaign audit with improvement suggestions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| GET | /api | API documentation |
| POST | /api/intent/predict | Predict user intent |
| POST | /api/intent/batch | Batch predict intents |
| POST | /api/creative/banner | Generate banner ad assets |
| POST | /api/creative/banner/variations | Generate A/B test variations |
| POST | /api/creative/copy | Generate ad copy |
| POST | /api/creative/cta | Generate CTAs |
| POST | /api/creative/analyze | Analyze creative performance |
| POST | /api/creative/suggest | Get creative suggestions |
| POST | /api/creative/batch | Batch generate multiple ads |
| POST | /api/optimize/bid | Optimize bid strategy |
| POST | /api/optimize/bid/batch | Batch optimize campaigns |
| POST | /api/optimize/targeting | Optimize targeting |
| POST | /api/optimize/improve | Get improvement suggestions |
| POST | /api/optimize/audit | Complete campaign audit |

## Quick Start

```bash
cd REZ-ad-ai
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4021)
- NODE_ENV
- INTERNAL_SERVICE_TOKEN
- ALLOWED_ORIGINS

## Related Services
- REZ-ai-campaign-builder - AI campaign creation
- REZ-ab-testing - A/B testing for ads
- REZ-media-analytics - Analytics pipeline
- REZ-intent-graph - User intent signals
- HOJAI AI - Creative generation models