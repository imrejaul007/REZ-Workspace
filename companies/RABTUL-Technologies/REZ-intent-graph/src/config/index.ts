/**
 * REZ Intent Graph - Service Configuration
 */

export const config = {
  port: parseInt(process.env.PORT || '4150'),

  // B2B Service URLs
  services: {
    tamBuilder: process.env.TAM_BUILDER_URL || 'http://localhost:4128',
    signalService: process.env.SIGNAL_SERVICE_URL || 'http://localhost:4129',
    outboundService: process.env.OUTBOUND_SERVICE_URL || 'http://localhost:4130',
    dealIntelligence: process.env.DEAL_INTELLIGENCE_URL || 'http://localhost:4131',
    activityService: process.env.ACTIVITY_SERVICE_URL || 'http://localhost:4132',
    meetingNotes: process.env.MEETING_NOTES_URL || 'http://localhost:4133',
    buyerMapping: process.env.BUYER_MAPPING_URL || 'http://localhost:4134',
    personalization: process.env.PERSONALIZATION_URL || 'http://localhost:4135',
    aiCrmUpdates: process.env.AI_CRM_UPDATES_URL || 'http://localhost:4136',
    pipelineSuggestions: process.env.PIPELINE_URL || 'http://localhost:4137',
    b2bGateway: process.env.B2B_GATEWAY_URL || 'http://localhost:4138',
    copilot: process.env.COPILOT_URL || 'http://localhost:4140',
  },

  // Intent Graph Settings
  intent: {
    // Time windows for analysis (in days)
    windows: {
      hot: 7,       // Very recent = hot intent
      warm: 14,     // Within 2 weeks = warm intent
      cold: 30,     // Within month = cold intent
    },

    // Scoring weights
    weights: {
      signalStrength: 0.30,    // Signal intensity
      activityFrequency: 0.25, // How often they engage
      contentEngagement: 0.20,  // Content consumption
      recency: 0.15,          // How recent
      outreachResponse: 0.10,  // Response to outreach
    },

    // Threshold for intent stages
    thresholds: {
      hot: 75,     // Score >= 75 = Hot
      warm: 50,     // Score >= 50 = Warm
      cold: 25,     // Score >= 25 = Cold
      none: 0,      // Score < 25 = No Intent
    },
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
