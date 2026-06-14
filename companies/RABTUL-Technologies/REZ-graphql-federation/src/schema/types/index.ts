export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON

  # Enums
  enum HealthTrend {
    improving
    stable
    declining
  }

  enum GoalStatus {
    active
    completed
    paused
    failed
  }

  enum EventImportance {
    low
    medium
    high
    critical
  }

  enum AgentStatus {
    idle
    busy
    offline
    error
  }

  enum MemoryEntityType {
    company
    merchant
    restaurant
    hotel
    healthcare
    realestate
    retail
  }

  enum KnowledgeCategory {
    strategy
    operations
    customers
    products
    competitors
    processes
  }

  enum KnowledgeSource {
    manual
    ai_generated
    extracted
  }

  # Metric Types
  type MetricValue {
    value: Float!
    previousValue: Float
    changePercent: Float
    trend: String!
    period: String!
  }

  type CompanyMetrics {
    revenue: MetricValue
    customers: MetricValue
    orders: MetricValue
    conversionRate: MetricValue
    avgOrderValue: MetricValue
    retentionRate: MetricValue
    customMetrics: JSON
  }

  # Goal Types
  type Goal {
    id: ID!
    description: String!
    targetMetric: String
    targetValue: Float
    currentValue: Float
    progress: Int!
    deadline: DateTime
    status: GoalStatus!
    createdAt: DateTime!
  }

  # Decision Types
  type Decision {
    id: ID!
    type: String!
    description: String!
    outcome: String
    impactScore: Float!
    date: DateTime!
  }

  # Company Type
  type Company {
    id: ID!
    entityType: MemoryEntityType!
    entityId: String!
    name: String!
    healthScore: Int!
    healthTrend: HealthTrend!
    activeGoals: [Goal!]!
    recentDecisions: [Decision!]!
    metrics: CompanyMetrics!
    preferences: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Memory Types
  type MemoryEvent {
    id: ID!
    entityId: String!
    eventType: String!
    description: String!
    data: JSON
    source: String!
    importance: EventImportance!
    timestamp: DateTime!
    createdAt: DateTime!
  }

  type BusinessKnowledge {
    id: ID!
    entityId: String!
    category: KnowledgeCategory!
    topic: String!
    content: String!
    source: KnowledgeSource!
    confidence: Float!
    lastVerified: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Memory {
    entityType: MemoryEntityType!
    entityId: String!
    name: String!
    healthScore: Int!
    healthTrend: HealthTrend!
    activeGoals: [Goal!]!
    recentDecisions: [Decision!]!
    metrics: CompanyMetrics!
    knowledge: [BusinessKnowledge!]!
    events: [MemoryEvent!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Agent Types
  type AgentCapability {
    name: String!
    description: String
    enabled: Boolean!
  }

  type Agent {
    id: ID!
    name: String!
    description: String
    capabilities: [AgentCapability!]!
    status: AgentStatus!
    lastActiveAt: DateTime
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Intelligence Types
  type Prediction {
    id: ID!
    type: String!
    description: String!
    confidence: Float!
    timeframe: String
    impact: String
    data: JSON
    createdAt: DateTime!
  }

  type Recommendation {
    id: ID!
    category: String!
    title: String!
    description: String!
    priority: Int!
    actionItems: [String!]!
    expectedOutcome: String
    confidence: Float!
    createdAt: DateTime!
  }

  type Signal {
    id: ID!
    type: String!
    name: String!
    description: String!
    value: Float!
    unit: String
    source: String!
    timestamp: DateTime!
    metadata: JSON
  }

  type Intelligence {
    predictions: [Prediction!]!
    recommendations: [Recommendation!]!
    signals: [Signal!]!
    lastUpdated: DateTime!
  }

  # Health Response Type
  type ServiceHealth {
    name: String!
    status: String!
    latencyMs: Int
    error: String
  }

  type GatewayHealth {
    status: String!
    version: String!
    uptime: Float!
    services: [ServiceHealth!]!
    timestamp: DateTime!
  }

  # Pagination Types
  type PaginatedMemory {
    items: [Memory!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  type PaginatedEvents {
    items: [MemoryEvent!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  type PaginatedAgents {
    items: [Agent!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  # Input Types
  input MetricValueInput {
    value: Float!
    previousValue: Float
    changePercent: Float
    trend: String!
    period: String!
  }

  input GoalInput {
    description: String!
    targetMetric: String
    targetValue: Float
    deadline: DateTime
  }

  input DecisionInput {
    type: String!
    description: String!
    outcome: String
    impactScore: Float!
  }

  input MemoryInput {
    entityType: MemoryEntityType!
    entityId: String!
    name: String!
    healthScore: Int
    metrics: JSON
    preferences: JSON
  }

  input EventInput {
    entityId: String!
    eventType: String!
    description: String!
    data: JSON
    source: String
    importance: EventImportance
  }

  input KnowledgeInput {
    entityId: String!
    category: KnowledgeCategory!
    topic: String!
    content: String!
    source: KnowledgeSource
    confidence: Float
  }

  input AgentInput {
    name: String!
    description: String
    capabilities: [AgentCapabilityInput!]
  }

  input AgentCapabilityInput {
    name: String!
    description: String
    enabled: Boolean
  }

  input MemoryFilter {
    entityType: MemoryEntityType
    entityId: String
    search: String
    minHealthScore: Int
    maxHealthScore: Int
  }

  input EventFilter {
    entityId: String
    eventType: String
    importance: EventImportance
    startDate: DateTime
    endDate: DateTime
  }

  # Query
  type Query {
    # Company/Memory queries
    company(entityId: String!): Company
    companies(filter: MemoryFilter, page: Int, limit: Int): PaginatedMemory!
    memory(entityType: MemoryEntityType!, entityId: String!): Memory

    # Memory Events
    memoryEvents(filter: EventFilter, page: Int, limit: Int): PaginatedEvents!
    memoryEvent(id: ID!): MemoryEvent

    # Business Knowledge
    businessKnowledge(entityId: String!, category: KnowledgeCategory): [BusinessKnowledge!]!
    businessKnowledgeItem(id: ID!): BusinessKnowledge

    # Agent queries
    agents(page: Int, limit: Int): PaginatedAgents!
    agent(id: ID!): Agent
    agentByName(name: String!): Agent

    # Intelligence queries
    intelligence(entityId: String!): Intelligence
    predictions(entityId: String!, type: String): [Prediction!]!
    recommendations(entityId: String!): [Recommendation!]!
    signals(entityId: String!, type: String): [Signal!]!

    # Health
    health: GatewayHealth!
  }

  # Mutations
  type Mutation {
    # Memory/Memory mutations
    createMemory(input: MemoryInput!): Memory!
    updateMemory(entityType: MemoryEntityType!, entityId: String!, input: MemoryInput!): Memory!
    updateHealthScore(entityType: MemoryEntityType!, entityId: String!, score: Int!, trend: HealthTrend): Memory!
    addGoal(entityType: MemoryEntityType!, entityId: String!, input: GoalInput!): Goal!
    updateGoalProgress(entityType: MemoryEntityType!, entityId: String!, goalId: ID!, progress: Int!): Goal!
    addDecision(entityType: MemoryEntityType!, entityId: String!, input: DecisionInput!): Decision!

    # Event mutations
    createMemoryEvent(input: EventInput!): MemoryEvent!
    markEventImportance(id: ID!, importance: EventImportance!): MemoryEvent!

    # Knowledge mutations
    createBusinessKnowledge(input: KnowledgeInput!): BusinessKnowledge!
    updateBusinessKnowledge(id: ID!, input: KnowledgeInput!): BusinessKnowledge!
    deleteBusinessKnowledge(id: ID!): Boolean!

    # Agent mutations
    createAgent(input: AgentInput!): Agent!
    updateAgent(id: ID!, input: AgentInput!): Agent!
    updateAgentStatus(id: ID!, status: AgentStatus!): Agent!
    deleteAgent(id: ID!): Boolean!

    # Intelligence mutations
    addPrediction(entityId: String!, type: String!, description: String!, confidence: Float!, timeframe: String, impact: String, data: JSON): Prediction!
    addRecommendation(entityId: String!, category: String!, title: String!, description: String!, priority: Int!, actionItems: [String!]!, expectedOutcome: String, confidence: Float): Recommendation!
    addSignal(entityId: String!, type: String!, name: String!, description: String!, value: Float!, unit: String, metadata: JSON): Signal!

    # Batch operations
    syncFromRestService(service: String!, entityType: MemoryEntityType!, entityId: String!): Memory!
  }
`;
