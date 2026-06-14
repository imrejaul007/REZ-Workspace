# Workforce OS - RTMN AI Workforce Management

AI workforce management across all 24 industries with agent, team, and skills management.

## Quick Start

```bash
cd core/workforce-os
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List agents |
| POST | `/api/agents` | Create agent |
| POST | `/api/agents/:id/state` | Update state |
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |
| GET | `/api/skills` | List skills |
| GET | `/api/performance` | Performance overview |

## Agent States

- `available` - Ready to work
- `busy` - Currently working
- `offline` - Not available
- `training` - Learning new skills
- `maintenance` - Under maintenance

## Example

```bash
# Create agent
curl -X POST http://localhost:3021/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "Sales Agent", "industry": "retail", "role": "specialist"}'
```

## Docker

```bash
docker build -t rtmn-workforce-os core/workforce-os
docker run -p 3021:3021 rtmn-workforce-os
```
