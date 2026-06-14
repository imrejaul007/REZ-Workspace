# Atlas AI Workforce

**Port:** 5190 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Central orchestration hub for AI workforce agents. Manages SDR, Qualifier, Scheduler and other AI agents.

## Features

- **Agent Orchestration** - Coordinate multiple AI agents
- **Task Management** - Assign and track agent tasks
- **Agent Monitoring** - Real-time agent status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get agent details |

## Quick Start

```bash
cd atlas-ai-workforce
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5190/health
```

## Ecosystem Integration

- **atlas-workforce-agent** - Sales agent
- **atlas-workforce-scheduler** - Scheduling agent
