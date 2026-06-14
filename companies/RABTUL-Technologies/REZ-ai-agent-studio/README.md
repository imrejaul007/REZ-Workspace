# REZ AI Agent Studio

Conversational AI agents for marketing, sales, and support.

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/agents | List agents |
| POST | /api/agents | Create agent |
| POST | /api/agents/:id/message | Send message |

## Agent Types

- `customer_support` - Support agents
- `sales` - Sales agents  
- `marketing` - Marketing agents
- `operations` - Operations agents
- `custom` - Custom agents

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/ai-agent-studio
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
