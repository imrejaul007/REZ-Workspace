export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  skills: Skill[];
  knowledge: KnowledgeSource[];
  llmModel: string;
  outputSchema: OutputField[];
  status: 'draft' | 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'query' | 'analysis' | 'generation';
  config: Record<string, unknown>;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'document' | 'api' | 'database' | 'webhook';
  config: Record<string, unknown>;
}

export interface OutputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  icon: string;
  skills: Skill[];
  knowledge: KnowledgeSource[];
  popularity: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
  duration?: number;
}
