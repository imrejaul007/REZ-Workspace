# RTMN Agent Framework

Shared foundation for all AI agents across the 24-industry RTMN ecosystem.

## Overview

The Agent Framework provides a unified infrastructure for building, deploying, and orchestrating AI agents across industries. It includes:

- **BaseAgent** - Core agent class with memory, context, tools, and error handling
- **AgentFactory** - Creates and manages agent instances
- **ToolRegistry** - Manages tools available to agents
- **AgentOrchestrator** - Coordinates multiple agents for complex tasks
- **ContextManager** - Manages agent context and memory types

## Quick Start

```javascript
import { createAgent, createToolRegistry } from '@rtmn/agent-framework';

// Create an agent
const agent = createAgent({
  name: 'MyAgent',
  industry: 'legal',
  role: 'researcher',
  capabilities: ['case_search', 'document_review'],
  tools: myTools
});

// Override the process method
agent.process = async (task, context) => {
  // Your agent logic here
  return { result: 'processed' };
};

// Execute a task
const result = await agent.execute({ type: 'research', query: 'contract law' });
```

## Architecture

```
agent-framework/
├── src/
│   ├── base/
│   │   ├── BaseAgent.js          # Core agent class
│   │   ├── AgentFactory.js       # Agent creation
│   │   ├── ToolRegistry.js       # Tool management
│   │   ├── AgentOrchestrator.js  # Multi-agent coordination
│   │   └── ContextManager.js     # Memory management
│   ├── utils/
│   │   └── logger.js             # Structured logging
│   ├── middleware/
│   │   └── agentMiddleware.js    # Request processing hooks
│   ├── prompts/
│   │   └── promptBuilder.js      # LLM prompt construction
│   └── index.js                  # Main exports
├── package.json
└── README.md
```

## Core Components

### BaseAgent

The foundation class for all agents:

```javascript
const agent = new BaseAgent({
  name: 'LegalResearchAgent',
  industry: 'legal',
  role: 'researcher',
  capabilities: ['case_law_search', 'precedent_analysis'],
  maxRequests: 40,  // Rate limit
  windowMs: 60000   // Per minute
});

// Register tools
agent.registerTool({
  name: 'search_cases',
  description: 'Search case law database',
  execute: async (params) => {
    // Tool implementation
    return results;
  }
});

// Execute task
const result = await agent.execute(task, context);
```

### AgentFactory

Creates pre-configured agents by industry and type:

```javascript
import { createAgentFactory } from '@rtmn/agent-framework';

const factory = createAgentFactory();

// Create specific agent types
const legalAgent = factory.create('legal', 'case_research');
const healthcareAgent = factory.create('healthcare', 'patient_intake');
const financeAgent = factory.create('finance', 'bookkeeping');

// Create agent team
const team = factory.createTeam({
  name: 'Compliance Team',
  industry: 'legal',
  agents: [
    { name: 'Researcher', type: 'case_research' },
    { name: 'Drafter', type: 'document_draft' },
    { name: 'Reviewer', type: 'compliance' }
  ]
});
```

### AgentOrchestrator

Coordinates multiple agents with different strategies:

```javascript
import { createOrchestrator, STRATEGIES } from '@rtmn/agent-framework';

const orchestrator = createOrchestrator();

// Add agents
orchestrator
  .addAgent(agent1, 'worker')
  .addAgent(agent2, 'worker')
  .addAgent(manager, 'manager');

// Execute with different strategies
const sequentialResult = await orchestrator.execute(task, {
  strategy: STRATEGIES.SEQUENTIAL
});

const parallelResult = await orchestrator.execute(task, {
  strategy: STRATEGIES.PARALLEL
});

const consensusResult = await orchestrator.execute(task, {
  strategy: STRATEGIES.CONSENSUS,
  threshold: 2
});
```

### ToolRegistry

Manages agent tools:

```javascript
import { createToolRegistry } from '@rtmn/agent-framework';

const registry = createToolRegistry();

// Register custom tools
registry.register({
  name: 'send_email',
  description: 'Send an email',
  category: 'communication',
  execute: async (params, context) => {
    return await emailService.send(params);
  }
});

// Execute tool
const result = await registry.execute('send_email', {
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Message'
});

// Get tool schema for LLM function calling
const schema = registry.getSchema();
```

### ContextManager

Manages different memory types:

```javascript
import { createContextManager } from '@rtmn/agent-framework';

const contextManager = createContextManager({
  contextWindow: 128000,  // 128k tokens
  maxEpisodic: 1000
});

// Start session
contextManager.startSession('user123', { project: 'X' });

// Add memories
contextManager.addEpisodic('task_completed', { task: 'research', result: 'success' });
contextManager.addSemantic('client_info', { name: 'Acme Corp', status: 'active' });
contextManager.addProcedural('research_method', researchProcedure);

// Get context for LLM
const llmContext = contextManager.getContextForLLM({
  maxTokens: 100000,
  includeTypes: ['working', 'episodic']
});
```

## Middleware

Pre-built middleware for common patterns:

```javascript
import { 
  rateLimitMiddleware,
  cacheMiddleware,
  retryMiddleware,
  compose 
} from '@rtmn/agent-framework';

// Compose middleware
const pipeline = compose(
  rateLimitMiddleware(40, 60000),  // Rate limit
  cacheMiddleware(myCache, { ttl: 60000 }),  // Cache
  retryMiddleware({ maxRetries: 3 })  // Retry
);
```

## Prompt Templates

Built-in prompts for common tasks:

```javascript
import { createPromptBuilder } from '@rtmn/agent-framework';

// Create industry-specific builder
const builder = createPromptBuilder('legal', 'contracts');

// Build prompt
const prompt = builder.build('documentDraft', {
  documentType: 'NDA',
  clientName: 'Acme Corp',
  jurisdiction: 'California'
});

// Custom template
builder.register('my_template', 'Hello {name}, your role is {role}');
const customPrompt = builder.build('my_template', {
  name: 'Agent',
  role: 'assistant'
});
```

## Rate Limiting

Built-in rate limiting to stay under 40 requests/60 seconds:

```javascript
const agent = new BaseAgent({
  maxRequests: 40,
  windowMs: 60000
});

// Check before execution
await agent.checkRateLimit();

// Error handler for rate limits
agent.onError('rate_limit', async (error) => {
  await this._sleep(5000);
  return { action: 'retry', delay: 5000 };
});
```

## Error Handling

Comprehensive error handling with retries:

```javascript
agent.onError('api_error', async (error) => {
  if (error.status >= 500) {
    return { action: 'retry', delay: 2000 };
  }
  return { action: 'fail' };
});

agent.onError('timeout', async (error) => {
  return { action: 'retry', delay: 1000 };
});
```

## Persistence

Serialize and restore agent state:

```javascript
// Save agent state
const serialized = agent.serialize();
await redis.set(`agent:${agent.id}`, JSON.stringify(serialized));

// Restore agent
const data = JSON.parse(await redis.get(`agent:${agent.id}`));
const restoredAgent = BaseAgent.deserialize(data);
```

## Metrics

Built-in metrics tracking:

```javascript
const status = agent.getStatus();
/*
{
  id: 'uuid',
  name: 'MyAgent',
  industry: 'legal',
  status: 'idle',
  metrics: {
    tasksCompleted: 100,
    tasksFailed: 2,
    avgResponseTime: 250,
    totalTokens: 50000
  },
  toolsCount: 5,
  memorySize: 45
}
*/
```

## License

MIT
