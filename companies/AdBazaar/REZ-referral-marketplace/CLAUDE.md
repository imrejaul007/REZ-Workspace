# REZ Referral Marketplace

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 3000

## Overview
Next.js application for referral program management with creator discovery, campaign management, and analytics. Enables merchants to discover creators, create referral campaigns, track performance, and manage payouts.

## Tech Stack
- Framework: Next.js 14
- UI: React 18, TypeScript, Tailwind CSS
- Icons: Lucide React
- Charts: Recharts
- Date: date-fns
- HTTP: Axios

## Key Features
1. **Dashboard** - Overview of referral performance with charts and recent activity
2. **Creator Marketplace** - Discover and connect with top-performing creators
3. **Campaign Management** - Create and manage referral campaigns
4. **Analytics** - Detailed performance tracking and payout management
5. **Payout System** - Process and track creator payments

## Pages

| Route | Description |
|-------|-------------|
| / | Dashboard - Referral overview with charts |
| /creators | Creator marketplace |
| /campaigns | Campaign management |
| /analytics | Analytics and payouts |

## Components
| Component | Purpose |
|-----------|---------|
| CreatorCard | Display creator profile and metrics |
| CampaignCard | Display campaign details |

## Quick Start

```bash
cd REZ-referral-marketplace
npm install
npm run dev
```

## Environment Variables
- API_URL (optional) - Backend API URL
- INTERNAL_SERVICE_TOKEN - Authentication token

## Related Services
- REZ-engagement-platform - Referral engine
- REZ-marketing-service - Campaign management
- REZ-wallet-service - Payout processing