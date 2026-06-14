// Re-export shared types from local type modules
// Primary source is types/api.ts (matches page expectations)
export * from '../../types/api';

// Notification enums and types (no conflicts with api.ts)
export {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationDeliveryStatus,
  EmailTemplate,
} from '../../types/notifications';
export type {
  Notification,
  NotificationPreferences,
  NotificationWithDelivery,
  NotificationSendResult,
  NotificationTemplate,
  GetNotificationsRequest,
  GetNotificationsResponse,
} from '../../types/notifications';
