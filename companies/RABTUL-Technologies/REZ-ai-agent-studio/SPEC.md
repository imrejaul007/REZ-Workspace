# REZ AI Agent Studio - SPEC.md

**Version:** 1.0.0
**Port:** 4046
**Company:** RABTUL-Technologies
**Category:** AI

---

## Overview

Conversational AI agent builder and management platform. Creates and deploys AI agents for marketing, sales, customer support, and specialized domains.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ AI Agent Studio                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Agent Builder   → Visual agent configuration                       │
│  ├── Intent Classifier → NLP intent detection                           │
│  ├── Response Generator → LLM-powered responses                         │
│  └── Conversation Manager → Multi-turn dialog handling                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Agent
```typescript
{
  agentId: string
  name: string
  type: 'marketing' | 'sales' | 'support' | 'custom'
  config: AgentConfig
  intents: Intent[]
  createdAt: Date
  status: 'active' | 'paused' | 'archived'
}
```

### Intent
```typescript
{
  intentId: string
  name: string
  patterns: string[]
  responses: string[]
  action?: string
  variables: string[]
}
```

---

## API Endpoints

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents` | Create agent |
| GET | `/agents` | List agents |
| GET | `/agents/:id` | Get agent |
| PUT | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |

### Intents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents/:id/intents` | Add intent |
| PUT | `/agents/:id/intents/:intentId` | Update intent |
| DELETE | `/agents/:id/intents/:intentId` | Delete intent |

### Conversation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message |
| GET | `/conversations/:id` | Get conversation |

### Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents/:id/train` | Train agent |
| GET | `/agents/:id/status` | Training status |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "cors": "^2.8.5",
  "uuid": "^9.0.0"
}
```

---

## Agent Types

| Type | Use Case |
|------|----------|
| marketing | Campaign responses, promotions |
| sales | Product recommendations, checkout |
| support | FAQ, troubleshooting |
| custom | Domain-specific bots |

---

## Status

- [x] Agent creation
- [x] Intent management
- [x] Conversation handling
- [x] Agent training
- [x] Multi-turn dialog
