# Role AI Agents Service

AI Agents for 10 job roles with 4 levels each.

**Port:** 4751
**Company:** CorpPerks
**Purpose:** Role-specific AI assistants for professional development and guidance

## Architecture

```
Role AI Agents (Port 4751)
├── Role Definitions (10 roles, 4 levels each)
├── Agent Service (chat, recommendations)
├── Session Management (MongoDB)
├── API Routes (Express)
└── MongoDB Storage
```

## 10 Job Roles

| Role | Description |
|------|-------------|
| **Software Engineer** | Code reviews, debugging, architecture |
| **Sales** | CRM, deals, pipeline management |
| **Marketing** | Campaigns, content, analytics |
| **Finance** | Budgets, reports, compliance |
| **HR** | Recruitment, policies, engagement |
| **Operations** | Processes, logistics, efficiency |
| **Product** | Roadmap, user research, strategy |
| **Design** | UI/UX, branding, assets |
| **Support** | Tickets, escalation, satisfaction |
| **Admin** | System, security, access control |

## 4 Levels per Role

| Level | Experience | Focus |
|-------|------------|-------|
| **L1** | 0-2 years | Learning & Growth |
| **L2** | 2-5 years | Execution & Ownership |
| **L3** | 5-8 years | Leadership & Strategy |
| **L4** | 8+ years | Vision & Impact |

## Quick Start

```bash
cd CorpPerks/role-ai-agents

# Install dependencies
npm install

# Seed database with agents
npm run seed

# Start service
npm run dev

# Or build and run
npm run build
npm start
```

## API Endpoints

### List all roles
```
GET /api/roles
```

### Get role info
```
GET /api/roles/:role
```

### Get all levels for a role
```
GET /api/roles/:role/levels
```

### Get specific role level
```
GET /api/roles/:role/levels/:level
```

### Chat with role agent
```
POST /api/roles/chat
{
  "role": "software-engineer",
  "level": "L2",
  "message": "How do I improve my API design skills?"
}
```

### Continue chat session
```
POST /api/roles/chat/:sessionId
{
  "message": "Can you give me an example?"
}
```

### Get role recommendations
```
POST /api/roles/recommend
{
  "experience": 3,
  "skills": ["coding", "testing", "git"],
  "interests": ["architecture", "system design"]
}
```

### Get chat session
```
GET /api/roles/sessions/:sessionId
```

## Example Usage

### Chat with a Software Engineer L2 Agent

```bash
curl -X POST http://localhost:4751/api/roles/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "software-engineer",
    "level": "L2",
    "message": "How do I design a scalable microservices architecture?"
  }'
```

### Get Role Recommendations

```bash
curl -X POST http://localhost:4751/api/roles/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "experience": 4,
    "skills": ["coding", "team leading", "architecture"],
    "interests": ["strategy", "mentoring"]
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4751 | Server port |
| MONGODB_URI | mongodb://localhost:27017/role-ai-agents | MongoDB connection |
| INTERNAL_SERVICE_TOKEN | - | Service authentication |
| ENABLE_AUTH | false | Enable authentication |
| AI_API_KEY | - | OpenAI API key (future) |

## Features

- **40 Role Agents** (10 roles x 4 levels)
- **Contextual Responses** based on role and level
- **Session Management** with conversation history
- **Role Recommendations** based on skills and experience
- **Usage Tracking** with statistics
- **TypeScript** throughout
- **Zod Validation** on all inputs
- **Rate Limiting** for protection
- **Security Headers** (Helmet, CORS)
- **Error Handling** with structured responses
- **MongoDB Persistence** for sessions and agents

## Future Integrations

- [ ] OpenAI/Claude integration for actual AI responses
- [ ] RABTUL Auth for user authentication
- [ ] RABTUL Wallet for premium features
- [ ] Analytics dashboard
- [ ] Custom agent training
- [ ] Team collaboration features
