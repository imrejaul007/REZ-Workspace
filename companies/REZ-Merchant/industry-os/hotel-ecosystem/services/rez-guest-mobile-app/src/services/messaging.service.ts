import { v4 as uuidv4 } from 'uuid';

export type RequestType = 'housekeeping' | 'room_service' | 'concierge' | 'maintenance' | 'general' | 'emergency';
export type RequestStatus = 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';

export interface RoomServiceRequest {
  requestId: string;
  hotelId: string;
  roomNumber: string;
  guestId: string;
  type: RequestType;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: RequestStatus;
  assignedTo?: string;
  response?: string;
  respondedAt?: Date;
  respondedBy?: string;
  completedAt?: Date;
  slaDeadline?: Date;
  feedback?: {
    rating: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  notificationId: string;
  guestId: string;
  hotelId: string;
  title: string;
  body: string;
  type: 'info' | 'promotion' | 'alert' | 'reminder';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export class GuestMessagingService {
  private requests: Map<string, RoomServiceRequest> = new Map();
  private notifications: Map<string, Notification> = new Map();

  // SLA times in minutes
  private readonly SLA_TIMES: Record<RequestType, number> = {
    housekeeping: 30,
    room_service: 20,
    concierge: 15,
    maintenance: 45,
    general: 60,
    emergency: 5,
  };

  async createRequest(
    hotelId: string,
    roomNumber: string,
    guestId: string,
    message: string,
    type: RequestType,
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  ): Promise<string> {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Determine priority based on type
    const requestPriority = priority || (type === 'emergency' ? 'urgent' : 'normal');

    // Calculate SLA deadline
    const slaMinutes = this.SLA_TIMES[type];
    const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000);

    const request: RoomServiceRequest = {
      requestId,
      hotelId,
      roomNumber,
      guestId,
      type,
      message,
      priority: requestPriority,
      status: 'pending',
      slaDeadline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.requests.set(requestId, request);

    // Send push notification to staff
    await this.sendStaffNotification(hotelId, type, message, requestPriority);

    return requestId;
  }

  async getRequest(requestId: string): Promise<RoomServiceRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async getRoomRequests(hotelId: string, roomNumber: string): Promise<RoomServiceRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.hotelId === hotelId && r.roomNumber === roomNumber)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGuestRequests(guestId: string): Promise<RoomServiceRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.guestId === guestId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async acknowledgeRequest(requestId: string, staffId: string): Promise<RoomServiceRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'acknowledged';
    request.assignedTo = staffId;
    request.updatedAt = new Date();

    this.requests.set(requestId, request);
    return request;
  }

  async startWork(requestId: string): Promise<RoomServiceRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'in_progress';
    request.updatedAt = new Date();

    this.requests.set(requestId, request);
    return request;
  }

  async respondToRequest(requestId: string, response: string, respondedBy: string): Promise<RoomServiceRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    request.response = response;
    request.respondedBy = respondedBy;
    request.respondedAt = new Date();
    request.updatedAt = new Date();

    this.requests.set(requestId, request);

    // Notify guest
    await this.sendGuestNotification(request.guestId, 'Response to your request', response);

    return request;
  }

  async completeRequest(requestId: string, feedback?: { rating: number; comment?: string }): Promise<RoomServiceRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'completed';
    request.completedAt = new Date();
    request.feedback = feedback;
    request.updatedAt = new Date();

    this.requests.set(requestId, request);

    // Notify guest
    await this.sendGuestNotification(
      request.guestId,
      'Request Completed',
      `Your ${request.type} request has been completed.`
    );

    return request;
  }

  async cancelRequest(requestId: string, reason?: string): Promise<RoomServiceRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'cancelled';
    if (reason) {
      request.response = reason;
    }
    request.updatedAt = new Date();

    this.requests.set(requestId, request);
    return request;
  }

  async getPendingRequests(hotelId: string, type?: RequestType): Promise<RoomServiceRequest[]> {
    let requests = Array.from(this.requests.values())
      .filter(r => r.hotelId === hotelId && ['pending', 'acknowledged', 'in_progress'].includes(r.status));

    if (type) {
      requests = requests.filter(r => r.type === type);
    }

    return requests.sort((a, b) => {
      // Sort by priority first, then by SLA deadline
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (a.slaDeadline?.getTime() || Infinity) - (b.slaDeadline?.getTime() || Infinity);
    });
  }

  async getOverdueRequests(hotelId: string): Promise<RoomServiceRequest[]> {
    const now = new Date();
    return Array.from(this.requests.values())
      .filter(r => r.hotelId === hotelId &&
                   ['pending', 'acknowledged', 'in_progress'].includes(r.status) &&
                   r.slaDeadline && r.slaDeadline < now);
  }

  // ============ NOTIFICATIONS ============
  async sendGuestNotification(guestId: string, title: string, body: string, type: Notification['type'] = 'info', data?: Record<string, any>): Promise<string> {
    const notificationId = `NOTIF-${Date.now()}`;

    const notification: Notification = {
      notificationId,
      guestId,
      hotelId: '', // Would be set from guest profile
      title,
      body,
      type,
      data,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.set(notificationId, notification);

    return notificationId;
  }

  async getGuestNotifications(guestId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.guestId === guestId);

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
    }
  }

  async markAllNotificationsRead(guestId: string): Promise<number> {
    let count = 0;
    this.notifications.forEach(notification => {
      if (notification.guestId === guestId && !notification.read) {
        notification.read = true;
        count++;
      }
    });
    return count;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId);
  }

  private async sendStaffNotification(hotelId: string, type: RequestType, message: string, priority: string): Promise<void> {
    // In production, this would send via WebSocket, push notification, or internal messaging
    console.log(`[STAFF NOTIFICATION] Hotel: ${hotelId}, Type: ${type}, Priority: ${priority}, Message: ${message}`);
  }
}
