// Team Collaboration Service API Client
// Connects to team-collab-service on port 4716

const API_BASE_URL = 'http://localhost:4716';

export interface Channel {
  _id: string;
  channelId: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'project' | 'direct';
  companyId: string;
  members: string[];
  admins: string[];
  isArchived: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  messageId: string;
  channelId: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  reactions: Array<{ emoji: string; odId: string; userName: string }>;
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  _id: string;
  announcementId: string;
  title: string;
  content: string;
  summary: string;
  category: 'hr' | 'company' | 'team' | 'event' | 'policy' | 'milestone';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  authorId: string;
  authorName: string;
  views: number;
  reactions: Array<{ emoji: string; odId: string; userName: string }>;
  createdAt: string;
}

export interface Meeting {
  _id: string;
  meetingId: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  actionItems: Array<{
    id: string;
    task: string;
    assigneeId: string;
    assigneeName: string;
    dueDate?: string;
    completed: boolean;
  }>;
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class TeamCollabService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // ==================== CHANNELS ====================

  async getMyChannels(): Promise<Channel[]> {
    try {
      const response = await this.request<{ data: Channel[] }>('/api/channels/my');
      return response.data || [];
    } catch {
      return [];
    }
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    try {
      const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}`);
      return response.data || null;
    } catch {
      return null;
    }
  }

  async markChannelAsRead(channelId: string): Promise<void> {
    try {
      await this.request(`/api/channels/${channelId}/read`, { method: 'POST' });
    } catch {
      // Silently fail
    }
  }

  // ==================== MESSAGES ====================

  async getMessages(
    channelId: string,
    params?: { before?: string; limit?: number }
  ): Promise<{ items: Message[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.set('before', params.before);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await this.request<{ items: Message[]; hasMore: boolean }>(
      `/api/channels/${channelId}/messages${query ? `?${query}` : ''}`
    );
    return response;
  }

  async sendMessage(data: {
    channelId: string;
    content: string;
    threadId?: string;
  }): Promise<Message | null> {
    try {
      const response = await this.request<{ data: Message }>(
        `/api/channels/${data.channelId}/messages`,
        { method: 'POST', body: JSON.stringify(data) }
      );
      return response.data || null;
    } catch {
      return null;
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      await this.request(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // Silently fail
    }
  }

  async getThreadReplies(
    messageId: string,
    params?: { before?: string; limit?: number }
  ): Promise<{ items: Message[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.set('before', params.before);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await this.request<{ items: Message[]; hasMore: boolean }>(
      `/api/messages/${messageId}/thread${query ? `?${query}` : ''}`
    );
    return response;
  }

  // ==================== ANNOUNCEMENTS ====================

  async getRecentAnnouncements(limit = 5): Promise<Announcement[]> {
    try {
      const response = await this.request<{ data: Announcement[] }>(
        `/api/announcements/recent?limit=${limit}`
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  async trackView(announcementId: string): Promise<void> {
    try {
      await this.request(`/api/announcements/${announcementId}/view`, { method: 'POST' });
    } catch {
      // Silently fail
    }
  }

  async addReaction(announcementId: string, emoji: string): Promise<void> {
    try {
      await this.request(`/api/announcements/${announcementId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // Silently fail
    }
  }

  // ==================== MEETINGS ====================

  async getUpcomingMeetings(limit = 5): Promise<Meeting[]> {
    try {
      const response = await this.request<{ data: Meeting[] }>(
        `/api/meetings/upcoming?limit=${limit}`
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  async getTodayMeetings(): Promise<Meeting[]> {
    try {
      const response = await this.request<{ data: Meeting[] }>('/api/meetings/today');
      return response.data || [];
    } catch {
      return [];
    }
  }

  async toggleActionItem(meetingId: string, itemId: string): Promise<boolean> {
    try {
      const response = await this.request<{ data: { completed: boolean } }>(
        `/api/meetings/${meetingId}/action-items/${itemId}/toggle`,
        { method: 'POST' }
      );
      return response.data?.completed || false;
    } catch {
      return false;
    }
  }

  async getMyActionItems(limit = 10): Promise<Array<{
    id: string;
    task: string;
    assigneeName: string;
    dueDate?: string;
    completed: boolean;
    meetingTitle?: string;
  }>> {
    try {
      const response = await this.request<{
        data: Array<{
          id: string;
          task: string;
          assigneeName: string;
          dueDate?: string;
          completed: boolean;
          meetingTitle?: string;
        }>;
      }>(`/api/meetings/action-items/my?limit=${limit}`);
      return response.data || [];
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const teamCollabService = new TeamCollabService();
