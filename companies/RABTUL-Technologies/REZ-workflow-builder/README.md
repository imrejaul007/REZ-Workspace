# REZ Workflow Builder

Visual workflow/journey designer with execution engine.

## Quick Start

```bash
npm install
npm run dev
```

## Node Types

- **Trigger** - Event, schedule, manual, API, webhook
- **Action** - Send email, SMS, push, update user, create order
- **Condition** - If/else branching
- **Delay** - Wait/sleep
- **Filter** - Data filtering

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workflows | List workflows |
| POST | /api/workflows | Create workflow |
| POST | /api/workflows/:id/execute | Execute workflow |

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/workflow-builder
```
