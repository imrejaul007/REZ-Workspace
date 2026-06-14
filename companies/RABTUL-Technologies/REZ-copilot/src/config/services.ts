/**
 * REZ Copilot - Service Configuration
 */

export const config = {
  port: parseInt(process.env.PORT || '4140'),

  // Service URLs
  services: {
    // B2B Services
    tamBuilder: process.env.TAM_BUILDER_URL || 'http://localhost:4128',
    signalService: process.env.SIGNAL_SERVICE_URL || 'http://localhost:4129',
    outboundService: process.env.OUTBOUND_SERVICE_URL || 'http://localhost:4130',
    dealIntelligence: process.env.DEAL_INTELLIGENCE_URL || 'http://localhost:4131',
    activityService: process.env.ACTIVITY_SERVICE_URL || 'http://localhost:4132',
    meetingNotes: process.env.MEETING_NOTES_URL || 'http://localhost:4133',
    buyerMapping: process.env.BUYER_MAPPING_URL || 'http://localhost:4134',
    personalization: process.env.PERSONALIZATION_URL || 'http://localhost:4135',
    aiCrmUpdates: process.env.AI_CRM_UPDATES_URL || 'http://localhost:4136',
    pipelineSuggestions: process.env.PIPELINE_SUGGESTIONS_URL || 'http://localhost:4137',
    gateway: process.env.GATEWAY_URL || 'http://localhost:4138',

    // HOJAI Services
    llmGateway: process.env.LLM_GATEWAY_URL || 'http://localhost:4730',
    memory: process.env.MEMORY_SERVICE_URL || 'http://localhost:4520',
  },

  // AI Model Configuration
  ai: {
    defaultProvider: process.env.AI_PROVIDER || 'openai',
    defaultModel: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },

  // Session config
  session: {
    maxHistoryLength: 50,
    contextWindow: 10,
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // Analysis config
  analysis: {
    maxRisks: 5,
    maxOpportunities: 5,
    maxTalkTracks: 3,
    researchDepth: 'standard', // quick, standard, deep
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export type Config = typeof config;
