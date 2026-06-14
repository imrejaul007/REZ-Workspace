// RiderCircle Shared Constants

// ============================================
// API Configuration
// ============================================

export const API_BASE_URL = process.env.RIDER_CIRCLE_API_URL || 'http://localhost:4200';

export const API_ENDPOINTS = {
  // Riders
  RIDERS: '/api/riders',
  RIDER_ME: '/api/riders/me',
  RIDER_SAFIQR: (id: string) => `/api/riders/${id}/safeqr`,
  RIDER_BIKES: (id: string) => `/api/riders/${id}/bikes`,
  RIDER_STATS: (id: string) => `/api/riders/${id}/stats`,
  RIDER_TRUST_SCORE: (id: string) => `/api/riders/${id}/trust-score`,
  RIDER_FOLLOW: (id: string) => `/api/riders/${id}/follow`,
  SAFEQR_VERIFY: '/api/riders/safeqr/verify',

  // Bikes
  BIKES: '/api/bikes',
  BIKE: (id: string) => `/api/bikes/${id}`,
  BIKE_HEALTH: (id: string) => `/api/bikes/${id}/health`,
  BIKE_SERVICE_HISTORY: (id: string) => `/api/bikes/${id}/service-history`,
  BIKE_SERVICE_RECORD: (id: string) => `/api/bikes/${id}/service-record`,
  BIKE_PREDICTIONS: (id: string) => `/api/bikes/${id}/predictions`,
  BIKE_HEALTH_UPDATE: (id: string) => `/api/bikes/${id}/health`,

  // Rides
  RIDES: '/api/rides',
  RIDE_ACTIVE: '/api/rides/active',
  RIDE: (id: string) => `/api/rides/${id}`,
  RIDE_TRACK: (id: string) => `/api/rides/${id}/track`,
  RIDE_STATS: (id: string) => `/api/rides/${id}/stats`,
  RIDE_WAYPOINTS: (id: string) => `/api/rides/${id}/waypoints`,
  RIDE_WAYPOINT: (id: string) => `/api/rides/${id}/waypoint`,
  RIDE_PAUSE: (id: string) => `/api/rides/${id}/pause`,
  RIDE_RESUME: (id: string) => `/api/rides/${id}/resume`,
  RIDE_COMPLETE: (id: string) => `/api/rides/${id}/complete`,
  RIDES_HISTORY: '/api/rides/history',
  RIDES_DISCOVER: '/api/rides/routes/discover',

  // Groups
  GROUPS: '/api/groups',
  GROUP: (id: string) => `/api/groups/${id}`,
  GROUP_MEMBERS: (id: string) => `/api/groups/${id}/members`,
  GROUP_JOIN: (id: string) => `/api/groups/${id}/join`,
  GROUP_LEAVE: (id: string) => `/api/groups/${id}/leave`,
  GROUPS_FEATURED: '/api/groups/featured/list',
  GROUPS_NEARBY: '/api/groups/nearby/list',

  // Events
  EVENTS: '/api/events',
  EVENT: (id: string) => `/api/events/${id}`,
  EVENT_RSVP: (id: string) => `/api/events/${id}/rsvp`,
  EVENT_CHECKIN: (id: string) => `/api/events/${id}/checkin`,
  EVENT_ATTENDEES: (id: string) => `/api/events/${id}/attendees`,
  EVENTS_UPCOMING: '/api/events/upcoming/list',
  EVENTS_NEARBY: '/api/events/nearby/list',

  // SOS
  SOS: '/api/sos',
  SOS_ACTIVE: '/api/sos/active/list',
  SOS_NEARBY: '/api/sos/nearby/list',
  SOS_STATS: '/api/sos/stats/summary',
  SOS_RATE: (id: string) => `/api/sos/${id}/rate`,

  // Health
  HEALTH: '/api/health',
  HEALTH_READY: '/api/health/ready',
} as const;

// ============================================
// WebSocket Events
// ============================================

export const WS_EVENTS = {
  // Ride events
  RIDE_START: 'ride:start',
  RIDE_UPDATE: 'ride:update',
  RIDE_COMPLETE: 'ride:complete',
  RIDE_LOCATION: 'ride:location',

  // SOS events
  SOS_TRIGGERED: 'sos:triggered',
  SOS_UPDATED: 'sos:updated',
  SOS_RESPONSE: 'sos:response',

  // Presence events
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_LEAVE: 'presence:leave',

  // Group events
  GROUP_MESSAGE: 'group:message',
  GROUP_EVENT: 'group:event',

  // Notification events
  NOTIFICATION: 'notification',
} as const;

// ============================================
// Constants
// ============================================

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const RIDING_STYLES = ['commuter', 'tourer', 'adventure', 'sport'] as const;

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert'] as const;

export const RIDE_TYPES = ['solo', 'group', 'event'] as const;

export const RIDE_STATUSES = ['planned', 'active', 'paused', 'completed', 'cancelled', 'aborted'] as const;

export const DIFFICULTIES = ['easy', 'moderate', 'hard', 'extreme'] as const;

export const GROUP_TYPES = ['club', 'chapter', 'crew', 'community', 'brand'] as const;

export const GROUP_FOCUS = ['adventure', 'touring', 'sport', 'commuter', 'electric', 'cruiser', 'offroad'] as const;

export const EVENT_TYPES = ['ride', 'meet', 'rally', 'track_day', 'workshop', 'rally_event', 'rally_stage'] as const;

export const SOS_TYPES = ['accident', 'medical', 'breakdown', 'assistance', 'safety_concern', 'lost'] as const;

export const SOS_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export const WAYPOINT_TYPES = ['start', 'stop', 'fuel', 'food', 'viewpoint', 'checkpoint', 'end'] as const;

export const FUEL_TYPES = ['petrol', 'electric', 'hybrid'] as const;

// ============================================
// Default Values
// ============================================

export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TRACKING_INTERVAL: 30, // seconds
  SOS_EXPIRY_MINUTES: 30,
  MAX_EMERGENCY_CONTACTS: 5,
  MAX_BIKES_PER_RIDER: 10,
  TRUST_SCORE_INITIAL: 50,
  HEALTH_SCORE_INITIAL: 100,
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Invalid request data',
  DUPLICATE_ENTRY: 'This record already exists',
  INTERNAL_ERROR: 'An internal error occurred',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  RIDER_CREATED: 'Rider profile created successfully',
  RIDER_UPDATED: 'Rider profile updated successfully',
  BIKE_CREATED: 'Bike added successfully',
  BIKE_UPDATED: 'Bike updated successfully',
  RIDE_STARTED: 'Ride started successfully',
  RIDE_COMPLETED: 'Ride completed successfully',
  GROUP_CREATED: 'Group created successfully',
  EVENT_CREATED: 'Event created successfully',
  RSVP_CONFIRMED: 'RSVP confirmed',
  SOS_TRIGGERED: 'Emergency services notified',
} as const;