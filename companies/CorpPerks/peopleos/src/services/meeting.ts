// Meeting Service API Client for PeopleOS
// Connects to meeting-service on port 4728

const API_BASE_URL = process.env.NEXT_PUBLIC_MEETING_SERVICE_URL || 'http://localhost:4728';

interface ActionItem {
  _id: string;
  itemId: string;
  meetingId: string;
  task: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  createdById: string;
  createdByName: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  _id: string;
  feedbackId: string;
  meetingId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: 'meeting_prep' | 'engagement' | 'action_items' | 'communication' | 'overall';
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  submittedAt: string;
}

interface AgendaItem {
  _id: string;
  agendaItemId: string;
  meetingId: string;
  title: string;
  description?: string;
  topicType: 'discussion' | 'update' | 'decision' | 'feedback' | 'goal' | 'blocker' | 'other';
  proposedById: string;
  proposedByName: string;
  duration?: number;
  isCompleted: boolean;
  order: number;
  notes?: string;
}

interface MeetingNote {
  _id: string;
  noteId: string;
  meetingId: string;
  authorId: string;
  authorName: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  discussionSummary?: string;
  decisions: string[];
  keyTakeaways: string[];
  actionItems: string[];
  isPrivate: boolean;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

interface Meeting {
  _id: string;
  meetingId: string;
  companyId: string;
  type: '1on1' | 'skip_level' | 'team_meeting';
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  duration: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendeeId: string;
  attendeeName: string;
  attendeeAvatar?: string;
  participantIds: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cancellationReason?: string;
  agenda: AgendaItem[];
  agendaSent: boolean;
  notes: MeetingNote[];
  aiSummary?: string;
  actionItems: ActionItem[];
  feedback: Feedback[];
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  createdAt: string;
  updatedAt: string;
}

interface OneOnOne {
  _id: string;
  oneOnOneId: string;
  meetingId: string;
  companyId: string;
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: '1on1' | 'skip_level' | 'team_meeting';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextScheduled?: string;
  lastMeeting?: string;
  duration: number;
  preferredTime?: string;
  preferredDays: number[];
  status: 'active' | 'paused' | 'ended';
  pausedReason?: string;
  stats: {
    totalMeetings: number;
    completedMeetings: number;
    totalActionItems: number;
    completedActionItems: number;
    averageRating?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface MeetingStats {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  upcomingMeetings: number;
  totalDuration: number;
  averageDuration: number;
  totalActionItems: number;
  completedActionItems: number;
  pendingActionItems: number;
  overdueActionItems: number;
  averageRating?: number;
}

interface OneOnOneWithStats extends OneOnOne {
  completionRate: number;
  actionItemCompletionRate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MeetingService {
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

  // ==================== MEETINGS ====================

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}`);
    return response.data!;
  }

  async getUpcomingMeetings(userId: string, limit = 10): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>(
      `/api/meetings/upcoming/${userId}?limit=${limit}`
    );
    return response.data || [];
  }

  async getTodayMeetings(userId: string): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>(`/api/meetings/today/${userId}`);
    return response.data || [];
  }

  async getCalendarMeetings(userId: string, start: string, end: string): Promise<Meeting[]> {
    return this.request(`/api/meetings/calendar/${userId}?start=${start}&end=${end}`);
  }

  async getMeetingHistory(userId: string, limit = 20): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>(
      `/api/meetings/history/${userId}?limit=${limit}`
    );
    return response.data || [];
  }

  async getMeetingStats(userId: string): Promise<MeetingStats> {
    const response = await this.request<{ data: MeetingStats }>(`/api/meetings/stats/${userId}`);
    return response.data!;
  }

  async startMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/start`, {
      method: 'POST',
    });
    return response.data!;
  }

  async endMeeting(meetingId: string, aiSummary?: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/end`, {
      method: 'POST',
      body: JSON.stringify({ aiSummary }),
    });
    return response.data!;
  }

  async cancelMeeting(meetingId: string, reason?: string): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(`/api/meetings/${meetingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data!;
  }

  // ==================== NOTES ====================

  async addNote(meetingId: string, authorId: string, authorName: string, data: {
    content: string;
    discussionSummary?: string;
    decisions?: string[];
    keyTakeaways?: string[];
    isPrivate?: boolean;
    sharedWith?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  }): Promise<MeetingNote> {
    const response = await this.request<{ data: MeetingNote }>(`/api/meetings/${meetingId}/note`, {
      method: 'POST',
      body: JSON.stringify({ ...data, authorId, authorName }),
    });
    return response.data!;
  }

  async getNotes(meetingId: string, userId?: string): Promise<MeetingNote[]> {
    const url = userId
      ? `/api/meetings/${meetingId}/notes?userId=${userId}`
      : `/api/meetings/${meetingId}/notes`;
    const response = await this.request<{ data: MeetingNote[] }>(url);
    return response.data || [];
  }

  // ==================== ACTION ITEMS ====================

  async addActionItem(meetingId: string, createdById: string, createdByName: string, data: {
    task: string;
    description?: string;
    assigneeId: string;
    assigneeName: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ActionItem> {
    const response = await this.request<{ data: ActionItem }>(
      `/api/meetings/${meetingId}/action-item`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, createdById, createdByName }),
      }
    );
    return response.data!;
  }

  async getActionItems(meetingId: string): Promise<ActionItem[]> {
    const response = await this.request<{ data: ActionItem[] }>(
      `/api/meetings/${meetingId}/action-items`
    );
    return response.data || [];
  }

  async updateActionItem(itemId: string, data: {
    status?: 'pending' | 'in_progress' | 'completed';
    dueDate?: string;
    completedNote?: string;
  }): Promise<ActionItem> {
    const response = await this.request<{ data: ActionItem }>(
      `/api/meetings/action-items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async getMyActionItems(userId: string, params?: {
    status?: string;
    overdue?: boolean;
    limit?: number;
  }): Promise<ActionItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.overdue) queryParams.set('overdue', 'true');
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await this.request<{ data: ActionItem[] }>(
      `/api/meetings/action-items/my/${userId}${query ? `?${query}` : ''}`
    );
    return response.data || [];
  }

  // ==================== FEEDBACK ====================

  async submitFeedback(meetingId: string, reviewerId: string, reviewerName: string,
    revieweeId: string, revieweeName: string, data: {
      rating: 1 | 2 | 3 | 4 | 5;
      feedbackType: 'meeting_prep' | 'engagement' | 'action_items' | 'communication' | 'overall';
      comment?: string;
    }): Promise<Feedback> {
    const response = await this.request<{ data: Feedback }>(`/api/meetings/${meetingId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ ...data, reviewerId, reviewerName, revieweeId, revieweeName }),
    });
    return response.data!;
  }

  async getFeedback(meetingId: string): Promise<Feedback[]> {
    const response = await this.request<{ data: Feedback[] }>(`/api/meetings/${meetingId}/feedback`);
    return response.data || [];
  }

  async getMyFeedback(userId: string, limit = 20): Promise<Feedback[]> {
    const response = await this.request<{ data: Feedback[] }>(
      `/api/meetings/feedback/my/${userId}?limit=${limit}`
    );
    return response.data || [];
  }

  // ==================== 1:1 MANAGEMENT ====================

  async scheduleOneOnOne(data: {
    companyId: string;
    managerId: string;
    managerName: string;
    managerAvatar?: string;
    employeeId: string;
    employeeName: string;
    employeeAvatar?: string;
    type: '1on1' | 'skip_level' | 'team_meeting';
    frequency: 'weekly' | 'biweekly' | 'monthly';
    nextScheduled: string;
    duration?: number;
    preferredTime?: string;
    preferredDays?: number[];
    timezone?: string;
    meetingLink?: string;
    createdById: string;
  }): Promise<{ oneOnOne: OneOnOne; meeting: Meeting }> {
    const response = await this.request<{ data: { oneOnOne: OneOnOne; meeting: Meeting } }>(
      '/api/1on1/schedule',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async getOneOnOne(oneOnOneId: string): Promise<OneOnOne> {
    const response = await this.request<{ data: OneOnOne }>(`/api/1on1/${oneOnOneId}`);
    return response.data!;
  }

  async getOneOnOneByPair(managerId: string, employeeId: string): Promise<OneOnOne> {
    const response = await this.request<{ data: OneOnOne }>(
      `/api/1on1/pair/${managerId}/${employeeId}`
    );
    return response.data!;
  }

  async getManagerOneOnOnes(managerId: string, status?: string): Promise<OneOnOne[]> {
    const url = status
      ? `/api/1on1/manager/${managerId}?status=${status}`
      : `/api/1on1/manager/${managerId}`;
    const response = await this.request<{ data: OneOnOne[] }>(url);
    return response.data || [];
  }

  async getEmployeeOneOnOnes(employeeId: string, status?: string): Promise<OneOnOne[]> {
    const url = status
      ? `/api/1on1/employee/${employeeId}?status=${status}`
      : `/api/1on1/employee/${employeeId}`;
    const response = await this.request<{ data: OneOnOne[] }>(url);
    return response.data || [];
  }

  async getUpcomingOneOnOnes(userId: string, daysAhead = 7): Promise<OneOnOne[]> {
    const response = await this.request<{ data: OneOnOne[] }>(
      `/api/1on1/upcoming/${userId}?daysAhead=${daysAhead}`
    );
    return response.data || [];
  }

  async getActiveOneOnOnes(userId: string): Promise<OneOnOneWithStats[]> {
    const response = await this.request<{ data: OneOnOne[] }>(`/api/1on1/active/${userId}`);
    return (response.data || []).map((o2o) => ({
      ...o2o,
      completionRate: o2o.stats.totalMeetings > 0
        ? Math.round((o2o.stats.completedMeetings / o2o.stats.totalMeetings) * 100)
        : 0,
      actionItemCompletionRate: o2o.stats.totalActionItems > 0
        ? Math.round((o2o.stats.completedActionItems / o2o.stats.totalActionItems) * 100)
        : 0,
    }));
  }

  async getDirectReports(managerId: string): Promise<Array<{
    employeeId: string;
    employeeName: string;
    employeeAvatar?: string;
    oneOnOne?: OneOnOne;
    nextMeeting?: string;
  }>> {
    const response = await this.request<{
      data: Array<{
        employeeId: string;
        employeeName: string;
        employeeAvatar?: string;
        oneOnOne?: OneOnOne;
        nextMeeting?: string;
      }>;
    }>(`/api/1on1/direct-reports/${managerId}`);
    return response.data || [];
  }

  async pauseOneOnOne(oneOnOneId: string, reason?: string): Promise<OneOnOne> {
    const response = await this.request<{ data: OneOnOne }>(`/api/1on1/${oneOnOneId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data!;
  }

  async resumeOneOnOne(oneOnOneId: string): Promise<OneOnOne> {
    const response = await this.request<{ data: OneOnOne }>(`/api/1on1/${oneOnOneId}/resume`, {
      method: 'POST',
    });
    return response.data!;
  }

  async endOneOnOne(oneOnOneId: string): Promise<OneOnOne> {
    const response = await this.request<{ data: OneOnOne }>(`/api/1on1/${oneOnOneId}/end`, {
      method: 'POST',
    });
    return response.data!;
  }

  async scheduleNextOneOnOneMeeting(oneOnOneId: string, data: {
    scheduledStart: string;
    duration?: number;
    meetingLink?: string;
  }): Promise<Meeting> {
    const response = await this.request<{ data: Meeting }>(
      `/api/1on1/${oneOnOneId}/schedule-next`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async getOneOnOneHistory(oneOnOneId: string, limit = 20): Promise<Meeting[]> {
    const response = await this.request<{ data: Meeting[] }>(
      `/api/1on1/${oneOnOneId}/history?limit=${limit}`
    );
    return response.data || [];
  }

  async getOneOnOneStats(oneOnOneId: string): Promise<{
    oneOnOne: OneOnOne;
    meetingHistory: Meeting[];
    recentFeedback: Feedback[];
  }> {
    const response = await this.request<{
      data: {
        oneOnOne: OneOnOne;
        meetingHistory: Meeting[];
        recentFeedback: Feedback[];
      };
    }>(`/api/1on1/${oneOnOneId}/stats`);
    return response.data!;
  }

  // ==================== AGENDA ====================

  async addAgendaItem(meetingId: string, proposedById: string, proposedByName: string, data: {
    title: string;
    description?: string;
    topicType: 'discussion' | 'update' | 'decision' | 'feedback' | 'goal' | 'blocker' | 'other';
    duration?: number;
  }): Promise<AgendaItem> {
    const response = await this.request<{ data: AgendaItem }>(`/api/meetings/${meetingId}/agenda`, {
      method: 'POST',
      body: JSON.stringify({ ...data, proposedById, proposedByName }),
    });
    return response.data!;
  }

  async getAgenda(meetingId: string): Promise<AgendaItem[]> {
    const response = await this.request<{ data: AgendaItem[] }>(`/api/meetings/${meetingId}/agenda`);
    return response.data || [];
  }
}

// Singleton instance
export const meetingService = new MeetingService();

export type {
  Meeting,
  OneOnOne,
  ActionItem,
  Feedback,
  AgendaItem,
  MeetingNote,
  MeetingStats,
  OneOnOneWithStats,
};
