import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Notifications Service
 * Handles push, WhatsApp, and SMS notifications via RABTUL notifications service
 */

interface NotificationPayload {
 userId: string;
 type: 'scan' | 'lost_mode' | 'contact_request' | 'emergency' | 'chat' | 'system';
 title: string;
 body: string;
 data?: Record<string, unknown>;
 channels?: ('push' | 'whatsapp' | 'sms')[];
 priority?: 'high' | 'normal' | 'low';
}

interface SendResult {
 success: boolean;
 messageId?: string;
 error?: string;
}

// Create axios instance for notifications service
const getNotificationsClient = (): AxiosInstance => {
 return axios.create({
   baseURL: config.notifications.url,
   timeout: 10000,
   headers: {
     'Content-Type': 'application/json',
     'X-Internal-Token': config.internalToken,
   },
 });
};

/**
 * Send notification via RABTUL notifications service
 */
export async function sendNotification(
 payload: NotificationPayload
): Promise<SendResult> {
 try {
   const client = getNotificationsClient();

   const response = await client.post('/api/notify', {
     userId: payload.userId,
     type: payload.type,
     title: payload.title,
     body: payload.body,
     data: payload.data,
     channels: payload.channels || ['push'],
     priority: payload.priority || 'normal',
   });

   return {
     success: true,
     messageId: response.data?.messageId,
   };
 } catch (error: unknown) {
   const err = error as { response?: { data?: { message?: string } }; message?: string };
   logger.error('Notification send failed: ' + String(err.message || error));
   return {
     success: false,
     error: String(err.message || String(error)),
   };
 }
}

/**
 * Safe QR specific notifications
 */
export const safeQRNotifications = {
 /**
  * Notify owner when QR is scanned
  */
 async onScan(
   safeQRId: string,
   ownerId: string,
   mode: string,
   scannerId?: string
 ): Promise<SendResult> {
   const modeNames: Record<string, string> = {
     pet: 'Pet',
     device: 'Device',
     vehicle: 'Vehicle',
     luggage: 'Luggage',
     key: 'Key',
     bicycle: 'Bicycle',
     child: 'Child',
     home: 'Home',
     office: 'Office',
     event: 'Event',
     student: 'Student',
     package: 'Package',
   };

   return sendNotification({
     userId: ownerId,
     type: 'scan',
     title: 'Your Safe QR was scanned',
     body: `Your ${modeNames[mode] || mode} Safe QR was just scanned.`,
     data: { safeQRId, mode, scannerId },
     priority: 'normal',
   });
 },

 /**
  * Notify owner when item is marked lost
  */
 async onLostModeActivated(
   safeQRId: string,
   ownerId: string,
   mode: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'lost_mode',
     title: 'Lost mode activated',
     body: `Your ${mode} is now in LOST mode. We'll alert you when scanned.`,
     data: { safeQRId, mode },
     channels: ['push', 'whatsapp'],
     priority: 'high',
   });
 },

 /**
  * Notify owner when item is found
  */
 async onFound(
   safeQRId: string,
   ownerId: string,
   location?: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'emergency',
     title: 'Your item was found!',
     body: location
       ? `Someone found your item near ${location}. Open app for details.`
       : 'Someone found your item! Open app to connect.',
     data: { safeQRId },
     channels: ['push', 'whatsapp'],
     priority: 'high',
   });
 },

 /**
  * Notify owner of new contact request
  */
 async onContactRequest(
   safeQRId: string,
   ownerId: string,
   requesterName: string,
   mode: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'contact_request',
     title: 'New contact request',
     body: `${requesterName} wants to reach you via your ${mode} Safe QR.`,
     data: { safeQRId },
     channels: ['push', 'whatsapp'],
     priority: 'normal',
   });
 },

 /**
  * Notify owner of new message
  */
 async onNewMessage(
   safeQRId: string,
   ownerId: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'chat',
     title: 'New message on Safe QR',
     body: 'You have a new message on your Safe QR.',
     data: { safeQRId },
     priority: 'normal',
   });
 },

 /**
  * Emergency notification
  */
 async onEmergency(
   safeQRId: string,
   ownerId: string,
   mode: string,
   location?: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'emergency',
     title: 'EMERGENCY ALERT',
     body: location
       ? `Emergency contact requested for your ${mode}! Location: ${location}`
       : `Emergency contact requested for your ${mode}!`,
     data: { safeQRId, mode, location },
     channels: ['push', 'whatsapp', 'sms'],
     priority: 'high',
   });
 },

 /**
  * Notify owner when contact request is approved
  */
 async onContactApproved(
   safeQRId: string,
   ownerId: string,
   sessionId: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'chat',
     title: 'Contact request approved',
     body: 'You can now message with the person who found your item.',
     data: { safeQRId, sessionId },
     priority: 'normal',
   });
 },

 /**
  * Notify owner of helper joining
  */
 async onHelperJoined(
   safeQRId: string,
   ownerId: string,
   helperName: string
 ): Promise<SendResult> {
   return sendNotification({
     userId: ownerId,
     type: 'system',
     title: 'New helper joined',
     body: `${helperName} is helping search for your item.`,
     data: { safeQRId },
     priority: 'normal',
   });
 },

 /**
  * System notification
  */
 async onSystem(
   userId: string,
   title: string,
   body: string,
   data?: Record<string, unknown>
 ): Promise<SendResult> {
   return sendNotification({
     userId,
     type: 'system',
     title,
     body,
     data,
     channels: ['push'],
     priority: 'normal',
   });
 },

 /**
  * Broadcast notification to multiple users
  */
 async broadcast(
   userIds: string[],
   notification: Omit<NotificationPayload, 'userId'>
 ): Promise<{ sent: number; failed: number }> {
   let sent = 0;
   let failed = 0;

   for (const userId of userIds) {
     const result = await sendNotification({
       ...notification,
       userId,
     });
     if (result.success) {
       sent++;
     } else {
       failed++;
     }
   }

   return { sent, failed };
 },
};
