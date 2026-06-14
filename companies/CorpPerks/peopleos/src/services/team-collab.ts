// Team Collaboration Service API Client
// Connects to team-collab-service on port 4716

const API_BASE_URL = process.env.NEXT_PUBLIC_TEAM_COLLAB_URL || 'http://localhost:4716';

interface Channel {
  _id: string;
  channelId: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'project' | 'direct';
  companyId: string;
  projectId?: string;
  members: string[];
  admins: string[];
  isArchived: boolean;
  memberCount: number;
  unreadCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  messageId: string;
  channelId: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system' | 'poll';
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface Reaction {
  emoji: string;
  odId: string;
  userName: string;
  createdAt: string;
}

interface Announcement {
  _id: string;
  announcementId: string;
  title: string;
  content: string;
  summary: string;
  category: 'hr' | 'company' | 'team' | 'event' | 'policy' | 'milestone';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  departmentIds: string[];
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  attachments: Attachment[];
  views: number;
  viewedBy: string[];
  reactions: Reaction[];
  scheduledFor?: string;
  expiresAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Meeting {
  _id: string;
  meetingId: string;
  title: string;
  description: string;
  projectId?: string;
  channelId?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  actionItems: ActionItem[];
  recordings: string[];
  location?: string;
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  createdAt: string;
  updatedAt: string;
}

interface ActionItem {
  id: string;
  task: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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

  async getChannels(params?: {
    includeArchived?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Channel>> {
    const queryParams = new URLSearchParams();
    if (params?.includeArchived) queryParams.set('includeArchived', 'true');
    if (params?.type) queryParams.set('type', params.type);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Channel>>(
      `/api/channels${query ? `?${query}` : ''}`
    );
  }

  async getMyChannels(): Promise<Channel[]> {
    const response = await this.request<{ data: Channel[] }>('/api/channels/my');
    return response.data || [];
  }

  async getChannel(channelId: string): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}`);
    return response.data!;
  }

  async createChannel(data: {
    name: string;
    description?: string;
    type: 'public' | 'private' | 'project' | 'direct';
    companyId: string;
    projectId?: string;
    members?: string[];
  }): Promise<Channel> {
    const response = await this.request<{ data: Channel }>('/api/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateChannel(
    channelId: string,
    data: { name?: string; description?: string; isArchived?: boolean }
  ): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async archiveChannel(channelId: string): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}/archive`, {
      method: 'POST',
    });
    return response.data!;
  }

  async addMembers(channelId: string, memberIds: string[]): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberIds }),
    });
    return response.data!;
  }

  async removeMember(channelId: string, memberId: string): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(
      `/api/channels/${channelId}/members/${memberId}`,
      { method: 'DELETE' }
    );
    return response.data!;
  }

  async leaveChannel(channelId: string): Promise<Channel> {
    const response = await this.request<{ data: Channel }>(`/api/channels/${channelId}/leave`, {
      method: 'POST',
    });
    return response.data!;
  }

  async markChannelAsRead(channelId: string): Promise<void> {
    await this.request(`/api/channels/${channelId}/read`, { method: 'POST' });
  }

  // ==================== MESSAGES ====================

  async getMessages(
    channelId: string,
    params?: { before?: string; after?: string; limit?: number }
  ): Promise<{ items: Message[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.set('before', params.before);
    if (params?.after) queryParams.set('after', params.after);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return this.request<{ items: Message[]; hasMore: boolean }>(
      `/api/channels/${channelId}/messages${query ? `?${query}` : ''}`
    );
  }

  async sendMessage(data: {
    channelId: string;
    content: string;
    threadId?: string;
    messageType?: 'text' | 'file' | 'image';
    mentions?: string[];
  }): Promise<Message> {
    const response = await this.request<{ data: Message }>(
      `/api/channels/${data.channelId}/messages`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data!;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await this.request<{ data: Message }>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return response.data!;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/api/messages/${messageId}`, { method: 'DELETE' });
  }

  async addReaction(messageId: string, emoji: string): Promise<Message> {
    const response = await this.request<{ data: Message }>(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    return response.data!;
  }

  async getThreadReplies(
    messageId: string,
    params?: { before?: string; limit?: number }
  ): Promise<{ items: Message[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.set('before', params.before);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return this.request<{ items: Message[]; hasMore: boolean }>(
      `/api/messages/${messageId}/thread${query ? `?${query}` : ''}`
    );
  }

  async searchMessages(
    channelId: string,
    query: string,
    params?: { limit?: number; skip?: number }
  ): Promise<Message[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.skip) searchParams.set('skip', String(params.skip));

    const response = await this.request<{ data: Message[] }>(
      `/api/channels/${channelId}/search?${searchParams.toString()}`
    );
    return response.data || [];
  }

  // ==================== ANNOUNCEMENTS ====================

  async getAnnouncements(params?: {
    category?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Announcement>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.priority) queryParams.set('priority', params.priority);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Announcement>>(
      `/api/announcements${query ? `?${query}` : ''}`
    );
  }

  async getRecentAnnouncements(limit = 10): Promise<Announcement[]> {
    const response = await this.request<{ data: Announcement[] }>(
      `/api/announcements/recent?limit=${limit}`
    );
    return response.data || [];
  }

  async getPriorityAnnouncements(limit = 5): Promise<Announcement[]> {
    const response = await this.request<{ data: Announcement[] }>(
      `/api/announcements/priority?limit=${limit}`
    );
    return response.data || [];
  }

  async getAnnouncement(announcementId: string): Promise<Announcement> {
    const response = await this.request<{ data: Announcement }>(
      `/api/announcements/${announcementId}`
    );
    return response.data!;
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    summary?: string;
    category: 'hr' | 'company' | 'team' | 'event' | 'policy' | 'milestone';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    departmentIds?: string[];
    scheduledFor?: string;
    expiresAt?: string;
  }): Promise<Announcement> {
    const response = await this.request<{ data: Announcement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateAnnouncement(
    announcementId: string,
    data: Partial<{
      title: string;
      content: string;
      summary: string;
      category: string;
      priority: string;
      isPublished: boolean;
    }>
  ): Promise<Announcement> {
    const response = await this.request<{ data: Announcement }>(
      `/api/announcements/${announcementId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
    return response.data!;
  }

  async trackView(announcementId: string): Promise<{ views: number }> {
    const response = await this.request<{ data: { views: number } }>(
      `/api/announcements/${announcementId}/view`,
      { method: 'POST' }
    );
    return response.data!;
  }

  async addAnnouncementReaction(announcementId: string, emoji: string): Promise<Announcement> {
    const response = await this.request<{ data: Announcement }>(
      `/api/announcements/${announcementId}/reactions`,
      { method: 'POST', body: JSON.stringify({ emoji }) }
    );
    return response.data!;
  }

  async getAnnouncementStats(): Promise<{
    totalAnnouncements: number;
    byCategory: Record<string, number>;
    totalViews: number;
  }> {
    return this.request('/api/announcements/stats/summary');
  }

  // ==================== MEETINGS ====================

  async getMeetings(params?: {
    status?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ items: Meeting[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status.join(','));
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return this.request<{ items: Meeting[]; total: number }>(
      `/api/meetings${query ? `?${query}` : ''}`
    );
  }

  async getUpcomingMeetings(limit = 10): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>(
      `/api/meetings/upcoming?limit=${limit}`
    );
    return response.data || [];
  }

  async getTodayMeetings(): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>('/api/meetings/today');
    return response.data || [];
  }

  async getCalendarMeetings(start: string, end: string): Promise<Meeting[]> {
    return this.request(`/api/meetings/calendar?start=${start}&end=${end}`);
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}`);
    return response.data!;
  }

  async createMeeting(data: {
    title: string;
    description?: string;
    projectId?: string;
    channelId?: string;
    attendees: string[];
    startTime: string;
    endTime: string;
    meetingLink?: string;
    location?: string;
    meetingType?: 'video' | 'audio' | 'in_person' | 'phone';
  }): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateMeeting(
    meetingId: string,
    data: Partial<{
      title: string;
      description: string;
      attendees: string[];
      startTime: string;
      endTime: string;
      meetingLink: string;
      location: string;
      status: string;
    }>
  ): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async startMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/start`, {
      method: 'POST',
    });
    return response.data!;
  }

  async endMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/end`, {
      method: 'POST',
    });
    return response.data!;
  }

  async cancelMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/cancel`, {
      method: 'POST',
    });
    return response.data!;
  }

  async addActionItem(
    meetingId: string,
    data: { task: string; assigneeId: string; assigneeName: string; dueDate?: string }
  ): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(
      `/api/meetings/${meetingId}/action-items`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data!;
  }

  async getActionItems(meetingId: string): Promise<ActionItem[]> {
    const response = await this.request<{ data: ActionItem[] }>(
      `/api/meetings/${meetingId}/action-items`
    );
    return response.data || [];
  }

  async toggleActionItem(
    meetingId: string,
    itemId: string
  ): Promise<{ completed: boolean }> {
    const response = await this.request<{ data: { completed: boolean } }>(
      `/api/meetings/${meetingId}/action-items/${itemId}/toggle`,
      { method: 'POST' }
    );
    return response.data!;
  }

  async getMeetingNotes(meetingId: string): Promise<unknown> {
    return this.request(`/api/meetings/${meetingId}/notes`);
  }

  async generateAiNotes(meetingId: string, transcript?: unknown[]): Promise<unknown> {
    const response = await this.request<{ data: unknown }>(`/api/meetings/${meetingId}/ai-notes`, {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
    return response.data;
  }

  async getMyActionItems(params?: {
    completed?: boolean;
    overdue?: boolean;
    limit?: number;
  }): Promise<ActionItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.completed !== undefined) queryParams.set('completed', String(params.completed));
    if (params?.overdue) queryParams.set('overdue', 'true');
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await this.request<{ data: ActionItem[] }>(
      `/api/meetings/action-items/my${query ? `?${query}` : ''}`
    );
    return response.data || [];
  }

  // ==================== ANALYTICS ====================

  async getChannelAnalytics(): Promise<{
    totalChannels: number;
    channels: Array<{
      channelId: string;
      name: string;
      type: string;
      memberCount: number;
      messageCount: number;
    }>;
  }> {
    return this.request('/api/analytics/channels');
  }

  async getUserActivity(userId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    messagesSent: number;
    actionItemsAssigned: number;
    actionItemsCompleted: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request(`/api/analytics/user/${userId}${query ? `?${query}` : ''}`);
  }

  async getCollaborationScore(userId: string): Promise<{
    totalScore: number;
    breakdown: Record<string, { score: number; max: number; label: string }>;
  }> {
    return this.request(`/api/analytics/score/${userId}`);
  }
}

// Singleton instance
export const teamCollabService = new TeamCollabService();

export type {
  Channel,
  Message,
  Announcement,
  Meeting,
  ActionItem,
  Attachment,
  Reaction,
};
