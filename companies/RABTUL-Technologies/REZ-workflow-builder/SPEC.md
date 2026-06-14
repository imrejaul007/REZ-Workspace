# REZ Workflow Builder - SPEC.md

**Version:** 1.0.0
**Port:** 4045
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Visual workflow and journey builder with execution engine. Allows creation of automated workflows for marketing, operations, and business processes with drag-and-drop interface.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ Workflow Builder                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Visual Editor    → Workflow canvas with nodes                       │
│  ├── Execution Engine → Workflow execution with state                     │
│  ├── Node Library    → Reusable workflow components                      │
│  └── Scheduler       → Cron-based workflow triggers                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Workflow
```typescript
{
  workflowId: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: TriggerConfig
  status: 'draft' | 'active' | 'paused'
  createdAt: Date
  updatedAt: Date
}
```

### WorkflowNode
```typescript
{
  id: string
  type: string
  position: { x: number, y: number }
  config: Record<string, any>
}
```

### WorkflowEdge
```typescript
{
  id: string
  source: string
  target: string
  condition?: string
}
```

---

## API Endpoints

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workflows` | Create workflow |
| GET | `/workflows` | List workflows |
| GET | `/workflows/:id` | Get workflow |
| PUT | `/workflows/:id` | Update workflow |
| DELETE | `/workflows/:id` | Delete workflow |

### Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workflows/:id/execute` | Execute workflow |
| GET | `/workflows/:id/runs` | List runs |
| GET | `/workflows/:id/runs/:runId` | Get run status |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nodes` | List node types |
| GET | `/nodes/:type` | Get node config |

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
  "helmet": "^8.1.0",
  "cors": "^2.8.5",
  "uuid": "^9.0.0"
}
```

---

## Node Types

| Type | Description |
|------|-------------|
| trigger | Workflow start |
| action | Perform action |
| condition | Branch logic |
| delay | Wait period |
| http | External API call |
| transform | Data transformation |

---

## Status

- [x] Visual editor
- [x] Workflow CRUD
- [x] Execution engine
- [x] Node library
- [x] Scheduling
- [x] Run history
