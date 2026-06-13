# 🧠 AgentOS Hub

## Overview

**Service Name:** AgentOS Hub  
**Version:** 1.0.0  
**Location:** `core/agentos-hub/`  
**Purpose:** Central registry for all 121+ AI agents across 24 industries

**Status:** ✅ PRODUCTION READY  
**Last Updated:** June 13, 2026

---

## Quick Start

```bash
cd core/agentos-hub
npm install
npm start
```

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Agent Registry | Central registry for 121+ agents | ✅ |
| 24 Industries | Coverage across all major industries | ✅ |
| Agent Discovery | Find agents by capability | ✅ |
| Agent Invocation | Execute agents via API | ✅ |
| Redis Caching | Fast agent lookups | ✅ |
| Structured Logging | Winston logging | ✅ |

### Industries Covered

| Industry | Agents |
|----------|--------|
| Legal | 6 agents |
| Healthcare | 5 agents |
| Finance | 5 agents |
| Retail | 5 agents |
| Real Estate | 5 agents |
| Manufacturing | 5 agents |
| + 18 more | 90+ agents |

---

## Architecture

```
AgentOS Hub
├── Agent Registry
├── Agent Discovery
├── Agent Invocation
├── Redis Cache
└── Express API
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/agents` | List all agents |
| GET | `/agents/:id` | Get agent by ID |
| POST | `/agents/invoke` | Invoke agent |
| GET | `/agents/industry/:industry` | Agents by industry |

---

## Usage

```bash
# List all agents
curl http://localhost:PORT/agents

# Invoke agent
curl -X POST http://localhost:PORT/agents/invoke \
  -d '{"agentId": "agent-123", "input": {}}'
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| ioredis | ^5.3.2 | Redis client |
| winston | ^3.11.0 | Logging |
| uuid | ^9.0.1 | UUID generation |
| dotenv | ^16.3.1 | Environment config |

---

## Related Documentation

- [Agent Framework CLAUDE.md](../agent-framework/CLAUDE.md)
- [HOJAI AI CLAUDE.md](../../companies/hojai-ai/CLAUDE.md)
- [RTNM-COMPANIES-AUDIT.md](../../RTNM-COMPANIES-AUDIT.md)

---

**Built with ❤️ by RTNM**
