import { logger } from '../../shared/logger';
/**
 * API Gateway Service Configuration
 *
 * Central configuration for all backend service URLs.
 * Uses environment variables with localhost fallbacks for development.
 *
 * @module api-gateway/service-config
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Environment Variables:
 * - BACKEND_URL: Backend service URL (default: http://localhost:4006)
 * - PERFORMANCE_URL: Performance service URL (default: http://localhost:4729)
 * - MEETING_URL: Meeting service URL (default: http://localhost:4728)
 * - ... (see individual service configs below)
 */

export interface ServiceConfig {
  url: string;
  timeout: number;
  retries: number;
}

/**
 * Get service URL from environment or use default
 */
function getServiceUrl(envVar: string, defaultUrl: string): string {
  return process.env[envVar] || defaultUrl;
}

/**
 * Service URLs configuration
 */
export const serviceUrls = {
  // Core Services
  backend: getServiceUrl('BACKEND_URL', 'http://localhost:4006'),
  corpIntel: getServiceUrl('CORP_INTEL_URL', 'http://localhost:4135'),

  // Performance & OKR
  performance: getServiceUrl('PERFORMANCE_URL', 'http://localhost:4729'),
  meeting: getServiceUrl('MEETING_URL', 'http://localhost:4728'),
  okr: getServiceUrl('OKR_URL', 'http://localhost:4730'),

  // Workflow & Automation
  workflow: getServiceUrl('WORKFLOW_URL', 'http://localhost:4731'),

  // Employee Lifecycle
  onboarding: getServiceUrl('ONBOARDING_URL', 'http://localhost:4732'),
  exit: getServiceUrl('EXIT_URL', 'http://localhost:4733'),

  // Learning & Development
  lms: getServiceUrl('LMS_URL', 'http://localhost:4734'),

  // Analytics & Reports
  reports: getServiceUrl('REPORTS_URL', 'http://localhost:4735'),

  // Calendar & Scheduling
  calendar: getServiceUrl('CALENDAR_URL', 'http://localhost:4736'),

  // SSO & Identity
  sso: getServiceUrl('SSO_URL', 'http://localhost:4737'),

  // Payroll
  payroll: getServiceUrl('PAYROLL_URL', 'http://localhost:4738'),

  // Shift Management
  shift: getServiceUrl('SHIFT_URL', 'http://localhost:4739'),

  // Compensation
  compensation: getServiceUrl('COMPENSATION_URL', 'http://localhost:4740'),

  // Document Management
  document: getServiceUrl('DOCUMENT_URL', 'http://localhost:4741'),

  // Video Conferencing
  video: getServiceUrl('VIDEO_URL', 'http://localhost:4742'),

  // CRM
  corpCrm: getServiceUrl('CORP_CRM_URL', 'http://localhost:4725'),

  // Corporate ID
  corpId: getServiceUrl('CORPID_URL', 'http://localhost:4701'),

  // Project Management
  projectos: getServiceUrl('PROJECTOS_URL', 'http://localhost:4715'),

  // Team Management
  teamCollab: getServiceUrl('TEAM_COLLAB_URL', 'http://localhost:4716'),

  // Analytics
  analytics: getServiceUrl('ANALYTICS_URL', 'http://localhost:4744'),
  push: getServiceUrl('PUSH_URL', 'http://localhost:4743'),
  whatsapp: getServiceUrl('WHATSAPP_URL', 'http://localhost:4745'),

  // GraphQL
  graphql: getServiceUrl('GRAPHQL_URL', 'http://localhost:4747'),

  // Webhook
  webhook: getServiceUrl('WEBHOOK_URL', 'http://localhost:4746'),

  // Real-time
  realtime: getServiceUrl('REALTIME_URL', 'http://localhost:4748'),
} as const;

/**
 * Service configurations with timeouts and retries
 */
export const services: Record<string, ServiceConfig> = {
  backend: {
    url: serviceUrls.backend,
    timeout: 30000,
    retries: 2,
  },
  corpIntel: {
    url: serviceUrls.corpIntel,
    timeout: 30000,
    retries: 2,
  },
  performance: {
    url: serviceUrls.performance,
    timeout: 30000,
    retries: 2,
  },
  meeting: {
    url: serviceUrls.meeting,
    timeout: 30000,
    retries: 2,
  },
  okr: {
    url: serviceUrls.okr,
    timeout: 30000,
    retries: 2,
  },
  workflow: {
    url: serviceUrls.workflow,
    timeout: 45000,
    retries: 1,
  },
  onboarding: {
    url: serviceUrls.onboarding,
    timeout: 30000,
    retries: 2,
  },
  exit: {
    url: serviceUrls.exit,
    timeout: 30000,
    retries: 2,
  },
  lms: {
    url: serviceUrls.lms,
    timeout: 30000,
    retries: 2,
  },
  reports: {
    url: serviceUrls.reports,
    timeout: 60000,
    retries: 1,
  },
  calendar: {
    url: serviceUrls.calendar,
    timeout: 30000,
    retries: 2,
  },
  sso: {
    url: serviceUrls.sso,
    timeout: 20000,
    retries: 2,
  },
  payroll: {
    url: serviceUrls.payroll,
    timeout: 45000,
    retries: 2,
  },
  shift: {
    url: serviceUrls.shift,
    timeout: 30000,
    retries: 2,
  },
  compensation: {
    url: serviceUrls.compensation,
    timeout: 30000,
    retries: 2,
  },
  document: {
    url: serviceUrls.document,
    timeout: 30000,
    retries: 2,
  },
  video: {
    url: serviceUrls.video,
    timeout: 30000,
    retries: 2,
  },
  corpCrm: {
    url: serviceUrls.corpCrm,
    timeout: 30000,
    retries: 2,
  },
  corpId: {
    url: serviceUrls.corpId,
    timeout: 30000,
    retries: 2,
  },
  projectos: {
    url: serviceUrls.projectos,
    timeout: 30000,
    retries: 2,
  },
  teamCollab: {
    url: serviceUrls.teamCollab,
    timeout: 30000,
    retries: 2,
  },
  analytics: {
    url: serviceUrls.analytics,
    timeout: 60000,
    retries: 1,
  },
  graphql: {
    url: serviceUrls.graphql,
    timeout: 30000,
    retries: 2,
  },
} as const;

/**
 * Get service config by name
 */
export function getServiceConfig(name: string): ServiceConfig | undefined {
  return services[name];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Log service configuration (without sensitive data)
 */
export function logServiceConfig(): void {
  if (isProduction()) {
    logger.info(JSON.stringify({
      message: 'Service configuration loaded',
      serviceCount: Object.keys(services).length,
      services: Object.keys(services).map(name => ({
        name,
        hasUrl: !!services[name].url,
      })),
    }));
  } else {
    logger.info('Service Configuration (Development Mode):');
    Object.entries(services).forEach(([name, config]) => {
      const isLocalhost = config.url.includes('localhost');
      logger.info(`  ${name}: ${config.url}${isLocalhost ? ' ⚠️  (using localhost)' : ''}`);
    });
  }
}
