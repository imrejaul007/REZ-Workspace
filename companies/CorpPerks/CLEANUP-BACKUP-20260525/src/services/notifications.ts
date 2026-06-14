import logger from './utils/logger';

/**
 * Push Notification Service
 * Handles push notifications for geo-alerts
 */

const API_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';

// Types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens?: string[];
}

export interface AlertNotification {
  employeeId: string;
  employeeName: string;
  alertType: 'exit' | 'entry' | 'late';
  locationName: string;
  timestamp: string;
  distance?: number;
}

// ─── Send Notification ─────────────────────────────────────────────────────────────

export async function sendPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    logger.error('Push notification error:', error);
    return false;
  }
}

// ─── Geo-Fence Alerts ─────────────────────────────────────────────────────────────

export async function notifyGeoAlert(alert: AlertNotification): Promise<void> {
  // Notify HR
  await sendPushNotification({
    title: `🚨 ${alert.employeeName} ${alert.alertType === 'exit' ? 'left' : alert.alertType === 'late' ? 'is late' : 'entered'} ${alert.locationName}`,
    body: alert.distance
      ? `Employee is ${alert.distance}m outside the geofenced area`
      : alert.alertType === 'exit'
      ? 'Employee has left the workplace'
      : alert.alertType === 'late'
      ? 'Employee arrived after shift start'
      : 'Employee entered the workplace',
    data: {
      type: 'geo_alert',
      employeeId: alert.employeeId,
      alertType: alert.alertType,
      locationName: alert.locationName,
    },
  });

  // Notify Employee
  await sendPushNotification({
    title: alert.alertType === 'exit' ? '⚠️ Left Workplace' : '📍 Attendance Alert',
    body:
      alert.alertType === 'exit'
        ? `You have left ${alert.locationName}. HR has been notified.`
        : alert.alertType === 'late'
        ? `You are marked late at ${alert.locationName}`
        : `Attendance marked at ${alert.locationName}`,
    data: {
      type: 'employee_alert',
      employeeId: alert.employeeId,
      alertType: alert.alertType,
    },
  });
}

// ─── WFH Alerts ─────────────────────────────────────────────────────────────────

export async function notifyWFHStatus(employeeId: string, status: 'approved' | 'rejected', locationName: string): Promise<void> {
  await sendPushNotification({
    title: status === 'approved' ? '✅ WFH Approved' : '❌ WFH Rejected',
    body:
      status === 'approved'
        ? `Your WFH request for ${locationName} has been approved.`
        : `Your WFH request for ${locationName} has been rejected.`,
    data: {
      type: 'wfh_status',
      employeeId,
      status,
    },
  });
}

// ─── Attendance Reminders ────────────────────────────────────────────────────────

export async function sendAttendanceReminder(employeeId: string, message: string): Promise<void> {
  await sendPushNotification({
    title: '📍 Attendance Reminder',
    body: message,
    data: {
      type: 'attendance_reminder',
      employeeId,
    },
  });
}

// ─── Web Push (VAPID) ─────────────────────────────────────────────────────────────

export async function subscribeToPush(userId: string, subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });
    return response.ok;
  } catch (error) {
    logger.error('Push subscription error:', error);
    return false;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/notifications/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// ─── Client-side Web Push ─────────────────────────────────────────────────────────

export async function requestWebPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    logger.info('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      logger.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
}
