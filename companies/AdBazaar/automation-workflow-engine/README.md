# Automation Workflow Engine

Advanced workflow automation engine for creating and executing automated workflows.

## Features

- Visual workflow builder with triggers and actions
- Multiple trigger types (manual, scheduled, event, webhook)
- Action execution with retry logic
- Real-time execution monitoring
- Execution logs and analytics
- Workflow templates

## Quick Start

```bash
cd automation-workflow-engine
npm install
npm run dev
```

## Environment Variables

```env
PORT=5053
MONGODB_URI=mongodb://localhost:27017/automation-workflow-engine
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows | Create workflow |
| GET | /api/workflows | List all workflows |
| GET | /api/workflows/:id | Get workflow by ID |
| PUT | /api/workflows/:id | Update workflow |
| POST | /api/workflows/:id/enable | Enable workflow |
| POST | /api/workflows/:id/pause | Pause workflow |
| POST | /api/workflows/:id/trigger | Trigger workflow |
| GET | /api/workflows/:id/logs | Get workflow logs |
| DELETE | /api/workflows/:id | Delete workflow |
| POST | /api/workflows/:id/duplicate | Duplicate workflow |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/executions/:id | Get execution by ID |
| GET | /api/executions/:id/logs | Get execution logs |
| POST | /api/executions/:id/cancel | Cancel execution |
| GET | /api/executions/workflow/:workflowId | Get workflow executions |

## Health Check

```bash
curl http://localhost:5053/health
```

## Metrics

```bash
curl http://localhost:5053/metrics
```