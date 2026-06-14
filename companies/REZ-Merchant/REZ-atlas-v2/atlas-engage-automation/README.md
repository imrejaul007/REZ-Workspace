# Atlas Engage Automation

**Port:** 5290 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Visual workflow automation for marketing. Build trigger-based campaigns, drip sequences, and re-engagement flows.

## Features

- **Visual Builder** - Drag-and-drop workflow creation
- **Trigger-Based** - Event-driven automation
- **Drip Campaigns** - Multi-step sequences
- **Re-Engagement** - Win back inactive customers

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| POST | `/api/workflows/:id/enable` | Enable workflow |

## Quick Start

```bash
cd atlas-engage-automation
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5290/health
```

## Ecosystem Integration

- **atlas-engage-core** - Workflow triggers
- **atlas-engage-conversation** - Send messages
