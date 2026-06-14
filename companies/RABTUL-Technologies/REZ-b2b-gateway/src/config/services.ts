// Service configuration for B2B Gateway
export const B2B_SERVICES = {
  // TAM Builder - ICP & Account Universe
  tamBuilder: {
    baseUrl: process.env.TAM_BUILDER_URL || 'http://localhost:4128',
    name: 'TAM Builder',
    timeout: 30000
  },

  // Signal Service - Intent Signals
  signalService: {
    baseUrl: process.env.SIGNAL_SERVICE_URL || 'http://localhost:4129',
    name: 'Signal Service',
    timeout: 30000
  },

  // Outbound Service - Sequences & Prospecting
  outboundService: {
    baseUrl: process.env.OUTBOUND_SERVICE_URL || 'http://localhost:4130',
    name: 'Outbound Service',
    timeout: 30000
  },

  // Deal Intelligence - Scoring & Predictions
  dealIntelligence: {
    baseUrl: process.env.DEAL_INTELLIGENCE_URL || 'http://localhost:4131',
    name: 'Deal Intelligence',
    timeout: 30000
  },

  // Activity Service - Activity Tracking
  activityService: {
    baseUrl: process.env.ACTIVITY_SERVICE_URL || 'http://localhost:4132',
    name: 'Activity Service',
    timeout: 30000
  },

  // Meeting Notes Service
  meetingNotes: {
    baseUrl: process.env.MEETING_NOTES_URL || 'http://localhost:4133',
    name: 'Meeting Notes',
    timeout: 30000
  },

  // Buyer Mapping Service
  buyerMapping: {
    baseUrl: process.env.BUYER_MAPPING_URL || 'http://localhost:4134',
    name: 'Buyer Mapping',
    timeout: 30000
  },

  // Personalization Engine
  personalization: {
    baseUrl: process.env.PERSONALIZATION_URL || 'http://localhost:4135',
    name: 'Personalization Engine',
    timeout: 30000
  },

  // AI CRM Updates
  aiCrmUpdates: {
    baseUrl: process.env.AI_CRM_UPDATES_URL || 'http://localhost:4136',
    name: 'AI CRM Updates',
    timeout: 30000
  },

  // Pipeline Suggestions
  pipelineSuggestions: {
    baseUrl: process.env.PIPELINE_SUGGESTIONS_URL || 'http://localhost:4137',
    name: 'Pipeline Suggestions',
    timeout: 30000
  }
} as const;

export type ServiceName = keyof typeof B2B_SERVICES;

// Route mappings for each service
export const SERVICE_ROUTES = {
  tamBuilder: '/api/v1/icps,/api/v1/companies,/api/v1/accounts,/api/v1/contacts',
  signalService: '/api/v1/signals,/api/v1/alerts,/api/v1/trends',
  outboundService: '/api/v1/sequences,/api/v1/prospects,/api/v1/timing',
  dealIntelligence: '/api/v1/deals,/api/v1/scores,/api/v1/recommendations',
  activityService: '/api/v1/activities,/api/v1/analytics',
  meetingNotes: '/api/v1/notes,/api/v1/meetings',
  buyerMapping: '/api/v1/personas,/api/v1/stakeholders,/api/v1/matrix',
  personalization: '/api/v1/templates,/api/v1/rules,/api/v1/generate',
  aiCrmUpdates: '/api/v1/rules,/api/v1/jobs',
  pipelineSuggestions: '/api/v1/pipelines,/api/v1/forecasts,/api/v1/suggestions'
} as const;
