# Referral Program Service

Referral tracking and incentives for AdBazaar.

## Overview

Complete referral program management with tracking, credits, and rewards.

## Features

- Referral creation and tracking
- Multi-tier referral system
- Automated credit issuance
- Reward management and claiming
- Referral statistics and leaderboards
- Campaign-based referrals

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/referrals` | Create referral |
| GET | `/api/referrals/:id` | Get referral by ID |
| GET | `/api/referrals/referrer/:id` | Get referrals by referrer |
| POST | `/api/referrals/:id/credit` | Credit referrer |
| POST | `/api/referrals/:id/convert` | Convert referral |
| GET | `/api/referrals/stats/:id` | Get referrer stats |
| GET | `/api/referrals/leaderboard/top` | Get top referrers |
| POST | `/api/referrals/:id/reward` | Create reward |
| POST | `/api/rewards/:id/claim` | Claim reward |

## Models

### Referral
- Tracks referrer ↔ referee relationship
- Status: pending → completed → rewarded

### Credit
- Tracks referral earnings
- Types: points, cash, credit, discount

### Reward
- Issued rewards with validity period
- Status: pending → issued → claimed/expired

## Quick Start

```bash
npm install
npm run dev
```

## Port

**5105**