# REZ Approval Service

Human-in-loop approval checkpoints for REZ workflows.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/approvals` | Create approval request |
| GET | `/api/approvals` | List approvals |
| GET | `/api/approvals/stats` | Get statistics |
| GET | `/api/approvals/pending` | Get pending approvals |
| GET | `/api/approvals/:id` | Get approval by ID |
| POST | `/api/approvals/:id/resolve` | Resolve (approve/reject/modify) |
| POST | `/api/approvals/:id/cancel` | Cancel approval |
| POST | `/api/approvals/:id/comment` | Add comment |
| POST | `/api/approvals/:id/reassign` | Reassign |
| GET | `/api/approvals/templates` | List templates |

## Features

- Priority levels: low, medium, high, critical
- SLA tracking with escalation rules
- Resolution types: approve, reject, modify
- Comment threads and history tracking
- Template-based approval workflows
- Auto-escalation support

## License

MIT
