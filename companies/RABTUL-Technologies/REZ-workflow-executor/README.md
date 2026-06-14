# REZ Workflow Executor

Workflow execution engine with node-based processing.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows` | List workflows |
| GET | `/api/workflows/:id` | Get workflow by ID |
| POST | `/api/executions` | Create and start execution |
| GET | `/api/executions` | List executions |
| GET | `/api/executions/stats` | Get statistics |
| GET | `/api/executions/:id` | Get execution by ID |
| GET | `/api/executions/:id/events` | Get execution events |
| POST | `/api/executions/:id/cancel` | Cancel execution |

## Node Types

- **trigger**: Workflow trigger points
- **action**: Custom action nodes
- **condition**: Conditional branching
- **delay**: Wait/delay nodes
- **ai_agent**: AI agent integration
- **approval**: Human approval checkpoints
- **transform**: Data transformation

## Features

- Visual workflow execution
- Node-based processing
- Conditional branching
- Real-time execution events
- Retry mechanism
- Execution tracking and stats

## License

MIT
