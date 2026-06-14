# HOJAI × Agency Agents Integration Plan

**Goal**: Transform HOJAI's 174 basic agents into 144+ deeply specialized personas + full runtime implementation

**Timeline**: 4 weeks (phased)

---

## PHASE 1: Architecture & Foundation (Week 1)

### 1.1 Create Enhanced Agent Template

**New agent format combines:**
- Agency Agents: Rich persona (identity, rules, workflows, metrics)
- HOJAI: Full runtime (Express, tools, memory hooks, APIs)

```
hojai-agents/{division}/{agent-name}/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md                    # Agency persona (markdown)
├── src/
│   ├── index.ts                 # Express server
│   ├── types.ts                 # TypeScript types
│   ├── persona.ts               # The full agency persona
│   ├── tools/                   # Tool definitions
│   │   ├── search.ts
│   │   ├── analyze.ts
│   │   └── ...
│   ├── memory/                  # Memory layer hooks
│   │   └── context.ts
│   └── routes/                  # API endpoints
│       └── chat.ts
└── tests/
    └── agent.test.ts
```

### 1.2 Create Base Agent SDK

New package: `@hojai/agent-sdk`

```typescript
// Core interfaces every agent extends
interface HOJAIAgent {
  // Agency-style persona
  persona: AgentPersona;

  // HOJAI runtime
  tools: Tool[];
  memory: MemoryContext;
  eventBus: EventBusClient;

  // API endpoints
  routes: Express.Router;
}
```

### 1.3 Port Allocation

| Range | Purpose |
|-------|---------|
| 4900-4949 | Engineering Division (50 agents) |
| 4950-4999 | Marketing Division (50 agents) |
| 5000-5049 | Sales & Paid Media (50 agents) |
| 5050-5099 | Design, Product, PM (50 agents) |
| 5100-5149 | Testing & Specialized (50 agents) |
| 5150-5199 | Game Dev & Spatial (50 agents) |
| 5200-5249 | Finance & Support (50 agents) |

---

## PHASE 2: Engineering Division (Week 1-2)

**29 agents** from `/tmp/agency-agents/engineering/`

### Build Order (by priority):

| Priority | Agent | Port | Description |
|----------|-------|------|-------------|
| 1 | frontend-developer | 4900 | React/Vue/Angular expert |
| 2 | backend-architect | 4901 | API design, DB architecture |
| 3 | mobile-app-builder | 4902 | iOS/Android, React Native |
| 4 | ai-engineer | 4903 | ML models, deployment |
| 5 | devops-automator | 4904 | CI/CD, infrastructure |
| 6 | security-engineer | 4905 | Threat modeling, secure code |
| 7 | data-engineer | 4906 | Data pipelines, ETL |
| 8 | sre | 4907 | SLOs, error budgets |
| 9 | code-reviewer | 4908 | Constructive code review |
| 10 | database-optimizer | 4909 | Schema design, query opt |
| 11 | technical-writer | 4910 | Developer docs, API ref |
| 12 | software-architect | 4911 | System design, DDD |
| 13 | incident-response | 4912 | Incident management |
| 14 | code-onboarding | 4913 | Developer onboarding |
| 15-29 | Others | 4914-4928 | Remaining engineering |

### Tools Each Engineering Agent Gets:

```typescript
const engineeringTools = [
  // Code Analysis
  searchCode,
  analyzeComplexity,
  generateTests,

  // Documentation
  generateDocs,
  updateReadme,

  // Development
  createComponent,
  createAPI,
  createMigration,

  // Review
  securityScan,
  performanceAudit,
  accessibilityCheck,

  // Communication
  slackNotify,
  jiraCreateTicket,
  githubCreatePR,
];
```

---

## PHASE 3: Marketing Division (Week 2)

**29 agents** from `/tmp/agency-agents/marketing/`

| Priority | Agent | Port |
|----------|-------|------|
| 1 | growth-hacker | 4950 |
| 2 | content-creator | 4951 |
| 3 | twitter-engager | 4952 |
| 4 | tiktok-strategist | 4953 |
| 5 | instagram-curator | 4954 |
| 6 | reddit-community-builder | 4955 |
| 7 | seo-specialist | 4956 |
| 8 | linkedin-content-creator | 4957 |
| 9 | app-store-optimizer | 4958 |
| 10 | douyin-strategist | 4959 |
| 11-29 | Others | 4960-4978 |

---

## PHASE 4: Sales & Paid Media (Week 2-3)

**Sales (8) + Paid Media (7) = 15 agents**

| Priority | Agent | Port |
|----------|-------|------|
| 1 | outbound-strategist | 5000 |
| 2 | discovery-coach | 5001 |
| 3 | deal-strategist | 5002 |
| 4 | sales-engineer | 5003 |
| 5 | proposal-strategist | 5004 |
| 6 | pipeline-analyst | 5005 |
| 7 | ppc-strategist | 5006 |
| 8 | tracking-specialist | 5007 |
| 9-15 | Others | 5008-5014 |

---

## PHASE 5: Design, Product & PM (Week 3)

**Design (8) + Product (5) + PM (6) = 19 agents**

| Division | Port Range |
|----------|------------|
| Design | 5050-5057 |
| Product | 5058-5062 |
| PM | 5063-5068 |

---

## PHASE 6: Game Dev & Spatial (Week 3)

**Game Dev (19) + Spatial (6) = 25 agents**

| Division | Port Range |
|----------|------------|
| Game Dev | 5100-5118 |
| Spatial | 5119-5124 |

---

## PHASE 7: Finance, Support & Specialized (Week 3-4)

**Finance (5) + Support (6) + Specialized (39) = 50 agents**

| Division | Port Range |
|----------|------------|
| Finance | 5150-5154 |
| Support | 5155-5160 |
| Specialized | 5161-5199 |

---

## IMPLEMENTATION STEPS

### Step 1: Create Agent Generator CLI

```bash
# Create new agent from template
npx hojai create-agent --division engineering --name frontend-developer --port 4900
```

### Step 2: Create Base Template

Every agent follows this structure:

```
src/
├── index.ts              # Express app + routes
├── persona.ts            # Full persona (from agency)
├── tools/
│   ├── search.ts
│   ├── analyze.ts
│   └── execute.ts
├── memory/
│   └── context.ts
├── routes/
│   ├── chat.ts           # POST /api/chat
│   └── execute.ts        # POST /api/execute
└── workflows/
    └── {agent-specific-workflows}.ts
```

### Step 3: Integration Points

```typescript
// Every agent connects to HOJAI Core
class BaseHOJAIAgent {
  memory = new HOJAIMemoryClient();    // Memory layer
  events = new EventBusClient();       // Event bus
  intelligence = new IntelligenceClient(); // ML predictions

  async execute(input: AgentInput): Promise<AgentOutput> {
    // 1. Get context from memory
    const context = await this.memory.getContext(input.userId);

    // 2. Execute with persona + tools
    const result = await this.runWithPersona(input, context);

    // 3. Store in memory
    await this.memory.store(result);

    // 4. Emit event
    this.events.emit('agent.executed', { ... });

    return result;
  }
}
```

---

## AGENT REGISTRY

All agents register with HOJAI Core:

```typescript
// POST /api/v1/agents/register
{
  name: 'frontend-developer',
  division: 'engineering',
  port: 4900,
  persona: { /* full persona */ },
  capabilities: ['code-review', 'component-creation', 'performance-audit'],
  tools: ['searchCode', 'generateTests'],
  metrics: {
    avgResponseTime: 'target',
    successRate: 'target',
    userSatisfaction: 'target'
  }
}
```

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Agents Built | 144 |
| Agents with Full Runtime | 144 |
| Memory Layer Integration | 100% |
| Event Bus Integration | 100% |
| Agent-to-Agent Communication | Enabled |
| Agent Marketplace | Live |

---

## FILES TO CREATE

### New Files:

1. `/hojai-ai/packages/agent-sdk/` - Base agent SDK
2. `/hojai-ai/cli/create-agent.ts` - Agent generator CLI
3. `/hojai-ai/employees/{division}/*` - 144 agent directories
4. `/hojai-ai/agent-registry/` - Central registry service

### Modified Files:

1. `/hojai-ai/employees/core/src/BaseAgent.ts` - Enhanced with persona support
2. `/hojai-ai/hojai-core/hojai-agents/index.ts` - Agent registry
3. `/hojai-ai/docker-compose.yml` - Add all new agents

---

## EXECUTION COMMAND

```bash
# This will be run in phases
./scripts/build-all-agents.sh

# Or individually
cd hojai-ai/employees/engineering/frontend-developer
npm install && npm run build && npm start
```

---

## VERIFICATION

After each phase:
1. Health check each agent: `curl localhost:{port}/health`
2. Test chat endpoint: `curl -X POST localhost:{port}/api/chat -d '{"message":"..."}'`
3. Verify memory integration: Check memory layer for agent context
4. Run integration tests: `npm test` for each agent
