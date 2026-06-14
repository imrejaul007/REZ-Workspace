# go4food-api

**Food Comparison API Service**

## Overview

Aggregates menus and prices from multiple food platforms for comparison.

## Status

✅ COMPLETE - Built June 2026

## Features

- Restaurant search across platforms
- Menu aggregation
- Price comparison
- Smart search with AI recommendations
- Trending searches

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/restaurants/search` | GET | Search restaurants |
| `/api/restaurants/:id` | GET | Get restaurant details |
| `/api/menu` | GET | Get menu items |
| `/api/compare/price` | GET | Compare prices |
| `/api/compare/best-deals` | GET | Find best deals |
| `/api/search` | GET | Smart search |

## Quick Start

```bash
npm install
npm run dev
```

## Port

`3002`

## Documentation

See [SERVICE-CATALOG.md](./SERVICE-CATALOG.md) for full details.
