# go4food

**Food Discovery & Comparison Platform**

## Status

⚠️ PARTIAL - Connected to go4food-api

## Overview

Restaurant discovery, menu viewing, and price comparison platform.

## Features

- Restaurant search
- Menu viewing
- Price comparison
- Food advisor
- Deals & offers
- Trending searches

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma

## API Connection

Connects to `go4food-api` on port `3002`

## Quick Start

```bash
npm install
npm run dev
```

## Pages

| Page | Route |
|------|-------|
| Home | `/` |
| Food Advisor | `/advisor` |
| Deals | `/deals` |
| Search | `/search` |

## Components

| Component | Description |
|-----------|-------------|
| `RestaurantCard` | Restaurant listing |
| `DishCard` | Menu item |
| `SearchBar` | Search input |
| `CuisineGrid` | Cuisine categories |

## Services

| Service | Description |
|---------|-------------|
| `api.ts` | API client for go4food-api |

## Documentation

See [SERVICE-CATALOG.md](../SERVICE-CATALOG.md) for full details.
