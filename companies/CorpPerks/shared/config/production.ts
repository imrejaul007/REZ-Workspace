/**
 * CorpPerks Production API Configuration
 * All services should use these URLs in production
 */

export const API_CONFIG = {
  // API Gateway (Single Entry Point)
  gateway: process.env.API_GATEWAY_URL || 'https://corpperks-api.onrender.com',

  // Backend Services
  services: {
    backend: process.env.BACKEND_URL || 'https://corpperks-backend.onrender.com',
    corpIntel: process.env.CORP_INTEL_URL || 'https://corpperks-intel.onrender.com',

    // HR Services
    projectos: process.env.PROJECTOS_URL || 'http://localhost:4715',
    teamCollab: process.env.TEAM_COLLAB_URL || 'http://localhost:4716',
    meeting: process.env.MEETING_URL || 'http://localhost:4728',
    performance: process.env.PERFORMANCE_URL || 'http://localhost:4729',
    okr: process.env.OKR_URL || 'http://localhost:4730',
    workflow: process.env.WORKFLOW_URL || 'http://localhost:4731',
    onboarding: process.env.ONBOARDING_URL || 'http://localhost:4732',
    exit: process.env.EXIT_URL || 'http://localhost:4733',
    lms: process.env.LMS_URL || 'http://localhost:4734',
    reports: process.env.REPORTS_URL || 'http://localhost:4735',
    calendar: process.env.CALENDAR_URL || 'http://localhost:4736',
    sso: process.env.SSO_URL || 'http://localhost:4737',
    payroll: process.env.PAYROLL_URL || 'http://localhost:4738',
    shift: process.env.SHIFT_URL || 'http://localhost:4739',
    compensation: process.env.COMPENSATION_URL || 'http://localhost:4740',
    document: process.env.DOCUMENT_URL || 'http://localhost:4741',
    video: process.env.VIDEO_URL || 'http://localhost:4742',

    // CRM
    corpCrm: process.env.CORP_CRM_URL || 'http://localhost:4725',

    // Analytics
    analytics: process.env.ANALYTICS_URL || 'http://localhost:4744',
    push: process.env.PUSH_URL || 'http://localhost:4743',
    whatsapp: process.env.WHATSAPP_URL || 'http://localhost:4745',

    // CorpID
    corpId: process.env.CORPID_URL || 'http://localhost:4701',

    // Bridges
    rezMerchant: process.env.REZ_MERCHANT_URL || 'http://localhost:4008',
    hojaiBridge: process.env.HOJAI_BRIDGE_URL || 'http://localhost:4720',
    adbazaarBridge: process.env.ADBAZAAR_BRIDGE_URL || 'http://localhost:4721',
    rezCareBridge: process.env.REZ_CARE_BRIDGE_URL || 'http://localhost:4722',
    corpIdProfile: process.env.CORPID_PROFILE_URL || 'http://localhost:4723',
  },

  // External Services (RABTUL)
  external: {
    rabtul: {
      auth: process.env.RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com',
      profile: process.env.RABTUL_PROFILE_URL || 'https://rez-profile-service.onrender.com',
      wallet: process.env.RABTUL_WALLET_URL || 'https://rez-wallet-service.onrender.com',
      payment: process.env.RABTUL_PAYMENT_URL || 'https://rez-payment-service.onrender.com',
      notification: process.env.RABTUL_NOTIFICATION_URL || 'https://rez-notifications-service.onrender.com',
    },

    // REZ Intelligence
    rezIntelligence: {
      intent: process.env.REZ_INTENT_URL || 'http://localhost:4018',
      predictive: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
      signal: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
    },

    // Hojai AI
    hojai: {
      agents: process.env.HOJAI_AGENTS_URL || 'http://localhost:4550',
      communications: process.env.HOJAI_COMM_URL || 'http://localhost:4590',
      flow: process.env.HOJAI_FLOW_URL || 'http://localhost:4560',
    },
  },
};

// Service health check endpoints
export const HEALTH_CHECKS = {
  gateway: `${API_CONFIG.gateway}/health`,
  backend: `${API_CONFIG.services.backend}/health`,
  corpIntel: `${API_CONFIG.services.corpIntel}/health`,
  projectos: `${API_CONFIG.services.projectos}/health`,
  teamCollab: `${API_CONFIG.services.teamCollab}/health`,
  meeting: `${API_CONFIG.services.meeting}/health`,
  performance: `${API_CONFIG.services.performance}/health`,
  okr: `${API_CONFIG.services.okr}/health`,
  workflow: `${API_CONFIG.services.workflow}/health`,
  payroll: `${API_CONFIG.services.payroll}/health`,
  corpCrm: `${API_CONFIG.services.corpCrm}/health`,
  corpId: `${API_CONFIG.services.corpId}/health`,
};

// Default timeout for API calls (ms)
export const TIMEOUT = {
  default: 30000,
  long: 60000,
  short: 5000,
};

// Retry configuration
export const RETRY = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
};
