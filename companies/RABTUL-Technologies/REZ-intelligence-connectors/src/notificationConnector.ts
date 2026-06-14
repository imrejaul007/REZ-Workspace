/**
 * Notification Service - Event Connector
 */

import { eventConnector, notificationEvents } from './eventConnectors';

export interface NotificationConnector {
  onNotificationSent(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    templateId: string;
    title?: string;
  }): void;

  onNotificationDelivered(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    deliveredAt: string;
  }): void;

  onNotificationOpened(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    openedAt: string;
  }): void;

  onNotificationClicked(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    action?: string;
    clickedAt: string;
  }): void;

  onNotificationFailed(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    reason: string;
  }): void;

  onNotificationBounced(notification: {
    notificationId: string;
    userId: string;
    channel: string;
    reason: string;
  }): void;
}

export function createNotificationConnector(): NotificationConnector {
  return {
    onNotificationSent: (notification) => {
      notificationEvents.sent({
        notificationId: notification.notificationId,
        channel: notification.channel,
        templateId: notification.templateId,
        title: notification.title,
        sentAt: new Date().toISOString()
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    },

    onNotificationDelivered: (notification) => {
      notificationEvents.delivered({
        notificationId: notification.notificationId,
        channel: notification.channel,
        deliveredAt: notification.deliveredAt
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    },

    onNotificationOpened: (notification) => {
      notificationEvents.opened({
        notificationId: notification.notificationId,
        channel: notification.channel,
        openedAt: notification.openedAt
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    },

    onNotificationClicked: (notification) => {
      notificationEvents.clicked({
        notificationId: notification.notificationId,
        channel: notification.channel,
        action: notification.action,
        clickedAt: notification.clickedAt
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    },

    onNotificationFailed: (notification) => {
      eventConnector.emit('notification.failed', {
        notificationId: notification.notificationId,
        channel: notification.channel,
        reason: notification.reason,
        failedAt: new Date().toISOString()
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    },

    onNotificationBounced: (notification) => {
      eventConnector.emit('notification.bounced', {
        notificationId: notification.notificationId,
        channel: notification.channel,
        reason: notification.reason,
        bouncedAt: new Date().toISOString()
      }, {
        userId: notification.userId,
        correlationId: notification.notificationId
      });
    }
  };
}

export const notificationConnector = createNotificationConnector();
export default notificationConnector;
