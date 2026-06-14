# rez-multi-property-dashboard

**Port:** 4046

Chain-wide Analytics Dashboard for multi-property hotel groups.

## Features

- **KPI Overview** - Total revenue, occupancy, ADR
- **Property Comparison** - Side-by-side performance
- **Trend Analysis** - Revenue & occupancy trends
- **Guest Analytics** - Repeat guests, ratings
- **Consolidated Reporting** - Group-level views

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:groupId` | Main KPI dashboard |
| GET | `/api/properties/:groupId` | Property list |
| GET | `/api/compare/:groupId` | Property comparison |
| GET | `/api/trends/:groupId` | Trend data |
| GET | `/api/guests/:groupId` | Guest analytics |

## Quick Start

```bash
npm install
npm run dev
npm test
```
