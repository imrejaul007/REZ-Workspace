# REZ Revenue OS Dashboard

**Port:** 4139  
**Status:** Complete

## Overview

React-based dashboard for REZ B2B Revenue OS. Provides a unified view of pipeline, deals, signals, and accounts with real-time analytics.

## Features

- **Pipeline View** - Kanban board with drag-and-drop
- **Deal Management** - List view with filtering and sorting
- **Signal Intelligence** - Real-time intent signals feed
- **Account Overview** - Company profiles with engagement metrics
- **Revenue Forecasting** - Interactive charts with actual vs forecast
- **Activity Timeline** - Unified activity feed across all entities

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Revenue OS Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌────────────────────────────────────┐│
│  │   Sidebar   │  │           Main Content               ││
│  │             │  │  ┌─────────────┬──────────────────┐ ││
│  │ • Overview   │  │  │ KPI Cards  │  Forecast Chart  │ ││
│  │ • Pipeline   │  │  ├─────────────┴──────────────────┤ ││
│  │ • Deals      │  │  │  Activity │  Signals │ Actions│ ││
│  │ • Signals    │  │  └──────────────────────────────┘  ││
│  │ • Accounts   │  │                                      │
│  └─────────────┘  └────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Views

### Overview
- KPI cards (Total Pipeline, Weighted, Active Deals, Win Rate)
- Revenue forecast chart
- Pipeline distribution
- Recent activity feed
- Live signals
- Action items

### Pipeline
- Kanban board with stages
- Drag-and-drop deal movement
- Stage statistics

### Deals
- Sortable table with all deals
- Filtering by stage, score, priority
- Quick actions

### Signals
- Intent signal cards
- Filter by intent level
- Signal type icons

### Accounts
- Top accounts list
- Account insights
- Engagement metrics

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Recharts
- Lucide Icons
- date-fns

## Installation

```bash
cd REZ-revenue-os-dashboard
npm install
npm run dev
```

## API Integration

The dashboard connects to [REZ-b2b-gateway](http://localhost:4138) for data:

```typescript
// Fetch account view
const response = await fetch('http://localhost:4138/api/unified/account/:id', {
  headers: { 'x-tenant-id': 'tenant-123' }
});

// Fetch pipeline overview
const response = await fetch('http://localhost:4138/api/unified/pipeline', {
  headers: { 'x-tenant-id': 'tenant-123' }
});
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:4138
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview |
| `/pipeline` | Pipeline kanban |
| `/deals` | Deal list |
| `/signals` | Intent signals |
| `/accounts` | Account list |
