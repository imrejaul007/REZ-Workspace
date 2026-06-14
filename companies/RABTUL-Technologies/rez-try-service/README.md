# REZ Try Service

**Tagline:** "Try Before You Buy"
**Port:** 3001
**Company:** RABTUL Technologies

## Overview

REZ Try is a product trials and sampling service that allows users to discover and book product trials at local merchants.

## Features

- **Trial Discovery** - Browse trials by category and location
- **Booking Management** - Reserve and manage trial slots
- **Explorer Score** - Gamified engagement scoring system
- **Campaigns** - Brand-sponsored trial campaigns
- **Leaderboard** - Ranked explorer rankings
- **Coins** - Earn coins on trial completions

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB (or use docker-compose)
docker-compose up -d

# Seed demo data
npm run seed

# Start service
npm run dev

# Run tests
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trials` | Get all trials |
| GET | `/api/trials/:id` | Get trial by ID |
| GET | `/api/trials/nearby/:lat/:lng` | Get nearby trials |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/user/:userId` | Get user bookings |
| PATCH | `/api/bookings/:id/complete` | Complete booking |
| GET | `/api/explorer/score/:userId` | Get explorer score |
| GET | `/api/explorer/leaderboard` | Get leaderboard |
| GET | `/api/campaigns` | Get active campaigns |
| GET | `/api/coins/balance/:userId` | Get coin balance |

## Architecture

```
REZ Try (:3001)
├── API Service (3001)              # Express + MongoDB
├── Trial Service                  # Trial discovery
├── Booking Service                # Slot management
├── Explorer Score                # Gamification
├── Coin Service                  # Rewards
└── Webhook Service                # Integrations
```

## Explorer Tiers

| Tier | Score | Benefits |
|------|-------|----------|
| Curious | 0-99 | Basic access |
| Explorer | 100-499 | Standard rewards |
| Adventurer | 500-999 | Premium rewards |
| Conqueror | 1000+ | Exclusive trials |

## Directory Structure

```
src/
├── index.ts                    # Entry point
├── config/                     # Configuration
├── models/                      # MongoDB models
├── routes/                      # API routes
├── middleware/                  # Auth, rate limit
├── services/                   # Business logic
├── types/                      # TypeScript types
└── utils/                      # Utilities

__tests__/                      # Unit tests
```

## Integrations

- RABTUL Wallet - Coin rewards
- RABTUL Auth - User authentication
- REZ App - Mobile app integration
