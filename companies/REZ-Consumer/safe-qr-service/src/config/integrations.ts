import { config } from './index';

/**
 * Service integration configuration
 * Centralizes all external service URLs and auth tokens
 */
export const integrations = {
 // RABTUL Services
 rabtul: {
   auth: {
     baseUrl: config.auth.url,
     verifyEndpoint: '/api/auth/verify',
     profileEndpoint: '/api/users/profile',
   },
   notifications: {
     baseUrl: config.notifications.url,
     notifyEndpoint: '/api/notify',
     sendEndpoint: '/api/send',
   },
 },

 // REZ-Intelligence Services
 rezIntelligence: {
   agentOs: {
     baseUrl: config.rezIntelligence.agentOs.url,
     karmaEndpoint: '/api/karma',
     chatEndpoint: '/api/chat',
   },
   mind: {
     baseUrl: config.rezIntelligence.mind.url,
     moderateEndpoint: '/api/moderate',
     trustEndpoint: '/api/trust',
   },
   intentGraph: {
     baseUrl: config.rezIntelligence.intentGraph.url,
     profilesEndpoint: '/api/profiles/consumer',
     eventsEndpoint: '/api/events',
     analyticsEndpoint: '/api/analytics',
     karmaFeedEndpoint: '/api/karma/feed',
   },
 },
} as const;

/**
 * Headers for internal service calls
 */
export function getInternalHeaders(): Record<string, string> {
 return {
   'Content-Type': 'application/json',
   'X-Internal-Token': config.internalToken,
 };
}

/**
 * Full URL for a given service endpoint
 */
export function getServiceUrl(
 service: 'rabtul' | 'rezIntelligence',
 type: string,
 endpoint: string
): string {
 const serviceConfig = integrations[service] as Record<string, { baseUrl: string }>;
 const base = serviceConfig[type]?.baseUrl || '';
 return `${base}${endpoint}`;
}
