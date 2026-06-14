# REZ Session Manager

AI agent session management with context preservation.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions` | List sessions |
| GET | `/api/sessions/active` | Get active sessions |
| GET | `/api/sessions/stats` | Get session stats |
| GET | `/api/sessions/:id` | Get session by ID |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/sessions/:id/messages` | Add message |
| GET | `/api/sessions/:id/messages` | Get messages |
| PATCH | `/api/sessions/:id/context` | Update context |
| POST | `/api/sessions/:id/memory` | Add memory |
| GET | `/api/sessions/:id/memory` | Get memory |
| PATCH | `/api/sessions/:id/state` | Update state |
| POST | `/api/sessions/:id/resume` | Resume session |
| POST | `/api/sessions/:id/pause` | Pause session |
| POST | `/api/sessions/:id/complete` | Complete session |

## Features

- Session lifecycle management (create, pause, resume, complete)
- Message history with automatic trimming
- Context variables preservation
- Memory entries (facts, preferences, actions)
- Attachments support
- Configurable expiration
- User and agent filtering

## License

MIT
