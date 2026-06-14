// Calendar and SSO Service API Client for PeopleOS
// These services are used by the PeopleOS frontend to interact with backend services

const CALENDAR_SERVICE_URL = process.env.NEXT_PUBLIC_CALENDAR_SERVICE_URL || 'http://localhost:4736';
const SSO_SERVICE_URL = process.env.NEXT_PUBLIC_SSO_SERVICE_URL || 'http://localhost:4737';
const DOCUMENT_SERVICE_URL = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || 'http://localhost:4741';
const VIDEO_SERVICE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:4742';

// ==================== CALENDAR SERVICE TYPES ====================

export interface CalendarConnection {
  connectionId: string;
  userId: string;
  companyId: string;
  provider: 'google' | 'outlook' | 'apple' | 'corpperks';
  email: string;
  calendarId?: string;
  calendarName?: string;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncedAt?: string;
}

export interface CalendarEvent {
  eventId: string;
  externalEventId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  allDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees: {
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  }[];
  provider: string;
  meetingLink?: string;
  isCorpPerksEvent: boolean;
  linkedMeetingId?: string;
}

export interface SyncResult {
  syncLogId: string;
  status: 'started' | 'completed' | 'failed';
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflicts: number;
}

// ==================== SSO SERVICE TYPES ====================

export interface SSOConfiguration {
  configId: string;
  companyId: string;
  provider: 'google' | 'microsoft' | 'saml' | 'ldap' | 'oidc';
  status: 'active' | 'inactive' | 'pending_verification' | 'error';
  isDefault: boolean;
  securitySettings: {
    enforceSSO: boolean;
    allowPasswordLogin: boolean;
    sessionTimeout: number;
    maxSessionDuration: number;
    requireMFA: boolean;
    allowedDomains?: string[];
  };
  syncSettings: {
    autoProvisionUsers: boolean;
    autoUpdateUsers: boolean;
    syncGroups: boolean;
    syncFrequency: number;
  };
  lastVerifiedAt?: string;
  createdAt: string;
}

export interface SSOUser {
  userId: string;
  externalId: string;
  companyId: string;
  provider: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  groups: string[];
  roles: string[];
  status: 'active' | 'suspended' | 'pending' | 'deprovisioned';
  lastLoginAt?: string;
}

export interface SSOTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== API RESPONSE TYPE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== CALENDAR SERVICE API ====================

export const calendarServiceApi = {
  /**
   * Get OAuth URL for Google Calendar
   */
  getGoogleAuthUrl: (userId: string, companyId: string): string => {
    return `${CALENDAR_SERVICE_URL}/api/calendar/auth/google?userId=${userId}&companyId=${companyId}`;
  },

  /**
   * Get OAuth URL for Microsoft Outlook
   */
  getMicrosoftAuthUrl: (userId: string, companyId: string): string => {
    return `${CALENDAR_SERVICE_URL}/api/calendar/auth/microsoft?userId=${userId}&companyId=${companyId}`;
  },

  /**
   * Get user's calendar connections
   */
  getConnections: async (userId: string): Promise<CalendarConnection[]> => {
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/connections`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    const data: ApiResponse<CalendarConnection[]> = await response.json();
    return data.data || [];
  },

  /**
   * Disconnect a calendar
   */
  disconnectCalendar: async (connectionId: string, userId: string): Promise<boolean> => {
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/connections/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
      },
    });
    const data: ApiResponse<null> = await response.json();
    return data.success;
  },

  /**
   * Get calendar events
   */
  getEvents: async (
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      connectionId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ events: CalendarEvent[]; total: number }> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.connectionId) params.append('connectionId', options.connectionId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/events?${params}`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    const data: ApiResponse<{
      events: CalendarEvent[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }> = await response.json();
    return {
      events: data.data?.events || [],
      total: data.data?.total || 0,
    };
  },

  /**
   * Create a calendar event
   */
  createEvent: async (
    event: Omit<CalendarEvent, 'eventId' | 'externalEventId' | 'syncStatus'>,
    userId: string
  ): Promise<CalendarEvent> => {
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(event),
    });
    const data: ApiResponse<CalendarEvent> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Sync calendar
   */
  syncCalendar: async (
    connectionId: string,
    userId: string,
    companyId: string,
    provider: string,
    fullSync?: boolean
  ): Promise<SyncResult> => {
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionId,
        userId,
        companyId,
        provider,
        fullSync,
      }),
    });
    const data: ApiResponse<SyncResult> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get calendar view
   */
  getCalendarView: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; events: CalendarEvent[] }[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendar/calendar-view?${params}`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    const data: ApiResponse<{ date: string; events: CalendarEvent[] }[]> = await response.json();
    return data.data || [];
  },
};

// ==================== SSO SERVICE API ====================

export const ssoServiceApi = {
  /**
   * Get OAuth URL for Google SSO
   */
  getGoogleAuthUrl: (companyId: string): string => {
    return `${SSO_SERVICE_URL}/api/sso/auth/google?companyId=${companyId}`;
  },

  /**
   * Get OAuth URL for Microsoft SSO
   */
  getMicrosoftAuthUrl: (companyId: string): string => {
    return `${SSO_SERVICE_URL}/api/sso/auth/microsoft?companyId=${companyId}`;
  },

  /**
   * Get SAML metadata
   */
  getSAMLMetadata: async (companyId: string): Promise<string> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/metadata/${companyId}`);
    return response.text();
  },

  /**
   * Get SSO configurations for company
   */
  getConfigurations: async (companyId: string): Promise<SSOConfiguration[]> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/config/${companyId}`);
    const data: ApiResponse<SSOConfiguration[]> = await response.json();
    return data.data || [];
  },

  /**
   * Verify SSO configuration
   */
  verifyConfiguration: async (
    companyId: string,
    provider: string,
    accessToken: string,
    testUserId?: string,
    testUserPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        companyId,
        provider,
        testUserId,
        testUserPassword,
      }),
    });
    const data: ApiResponse<{ success: boolean; error?: string }> = await response.json();
    return data.data || { success: false };
  },

  /**
   * LDAP authentication
   */
  ldapAuth: async (
    companyId: string,
    username: string,
    password: string
  ): Promise<{ user: SSOUser; tokens: SSOTokens }> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/auth/ldap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId, username, password }),
    });
    const data: ApiResponse<{ user: SSOUser; tokens: SSOTokens }> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<SSOTokens> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    const data: ApiResponse<SSOTokens> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Logout
   */
  logout: async (accessToken: string): Promise<void> => {
    await fetch(`${SSO_SERVICE_URL}/api/sso/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Get user sessions
   */
  getSessions: async (accessToken: string): Promise<{
    sessionId: string;
    provider: string;
    expiresAt: string;
    lastActivityAt: string;
  }[]> => {
    const response = await fetch(`${SSO_SERVICE_URL}/api/sso/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data: ApiResponse<{
      sessionId: string;
      provider: string;
      expiresAt: string;
      lastActivityAt: string;
    }[]> = await response.json();
    return data.data || [];
  },
};

// ==================== DOCUMENT SERVICE TYPES ====================

export interface DocumentTemplate {
  templateId: string;
  name: string;
  type: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  category?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface GeneratedDocument {
  documentId: string;
  templateId: string;
  templateName: string;
  templateType: string;
  employeeId: string;
  employeeName: string;
  title: string;
  data: Record<string, unknown>;
  content: string;
  status: string;
  pdfUrl?: string;
  signedAt?: string;
}

export interface SignatureRequest {
  signatureId: string;
  documentId: string;
  documentTitle: string;
  signers: Array<{
    signerId: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    order: number;
  }>;
  status: string;
  currentSignerOrder: number;
  expiresAt: string;
}

// ==================== VIDEO SERVICE TYPES ====================

export interface VideoMeeting {
  meetingId: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  startTime: string;
  endTime: string;
  duration: number;
  link: string;
  status: string;
  participants: Array<{
    participantId: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt?: string;
    leftAt?: string;
  }>;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
}

// ==================== DOCUMENT SERVICE API ====================

export const documentServiceApi = {
  /**
   * Get all templates
   */
  getTemplates: async (companyId: string): Promise<DocumentTemplate[]> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/templates?companyId=${companyId}`);
    const data: ApiResponse<{ data: DocumentTemplate[] }> = await response.json();
    return data.data?.data || [];
  },

  /**
   * Get template by ID
   */
  getTemplate: async (templateId: string): Promise<DocumentTemplate | null> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/templates/${templateId}`);
    const data: ApiResponse<DocumentTemplate> = await response.json();
    return data.data || null;
  },

  /**
   * Generate a document
   */
  generateDocument: async (
    payload: {
      templateId: string;
      employeeId: string;
      employeeName: string;
      title?: string;
      data: Record<string, unknown>;
      sendForSignature?: boolean;
      signers?: Array<{
        userId: string;
        name: string;
        email: string;
        role: string;
        order: number;
      }>;
    },
    userId: string
  ): Promise<GeneratedDocument> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/documents/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<GeneratedDocument> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get document by ID
   */
  getDocument: async (documentId: string): Promise<GeneratedDocument | null> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/documents/${documentId}`);
    const data: ApiResponse<GeneratedDocument> = await response.json();
    return data.data || null;
  },

  /**
   * Get documents by employee
   */
  getDocumentsByEmployee: async (employeeId: string): Promise<GeneratedDocument[]> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/documents/employee/${employeeId}`);
    const data: ApiResponse<{ data: GeneratedDocument[] }> = await response.json();
    return data.data?.data || [];
  },

  /**
   * Request signature
   */
  requestSignature: async (
    payload: {
      documentId: string;
      signers: Array<{
        userId: string;
        name: string;
        email: string;
        role: string;
        order: number;
      }>;
      expiresInDays?: number;
    },
    userId: string
  ): Promise<SignatureRequest> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/sign/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<SignatureRequest> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Sign a document
   */
  signDocument: async (
    signatureId: string,
    userId: string,
    signatureImageUrl?: string
  ): Promise<SignatureRequest> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/sign/${signatureId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, signatureImageUrl }),
    });
    const data: ApiResponse<SignatureRequest> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get pending signatures for user
   */
  getPendingSignatures: async (userId: string): Promise<SignatureRequest[]> => {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/sign/pending/${userId}`);
    const data: ApiResponse<{ data: SignatureRequest[] }> = await response.json();
    return data.data?.data || [];
  },
};

// ==================== VIDEO SERVICE API ====================

export const videoServiceApi = {
  /**
   * Create a meeting
   */
  createMeeting: async (
    payload: {
      title: string;
      description?: string;
      hostId: string;
      hostName: string;
      hostEmail?: string;
      startTime: string;
      duration?: number;
      timezone?: string;
      maxParticipants?: number;
      agenda?: string;
      recordingEnabled?: boolean;
      waitingRoomEnabled?: boolean;
      participants?: Array<{
        userId: string;
        name: string;
        email: string;
        role?: string;
      }>;
    },
    userId: string
  ): Promise<VideoMeeting> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<VideoMeeting> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get meeting by ID
   */
  getMeeting: async (meetingId: string): Promise<VideoMeeting | null> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/${meetingId}`);
    const data: ApiResponse<VideoMeeting> = await response.json();
    return data.data || null;
  },

  /**
   * Join a meeting
   */
  joinMeeting: async (
    meetingId: string,
    payload: {
      userId: string;
      name: string;
      email: string;
      role?: string;
      deviceInfo?: {
        browser?: string;
        os?: string;
        device?: string;
      };
    }
  ): Promise<{ meeting: VideoMeeting; participant: unknown }> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<{ meeting: VideoMeeting; participant: unknown }> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * End a meeting
   */
  endMeeting: async (meetingId: string, userId: string): Promise<VideoMeeting> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/${meetingId}/end`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
      },
    });
    const data: ApiResponse<VideoMeeting> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get upcoming meetings for user
   */
  getUpcomingMeetings: async (userId: string, limit?: number): Promise<VideoMeeting[]> => {
    const url = `${VIDEO_SERVICE_URL}/api/meetings/upcoming/${userId}${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    const data: ApiResponse<{ data: VideoMeeting[] }> = await response.json();
    return data.data?.data || [];
  },

  /**
   * Get today's meetings
   */
  getTodayMeetings: async (userId: string): Promise<VideoMeeting[]> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/today/${userId}`);
    const data: ApiResponse<{ data: VideoMeeting[] }> = await response.json();
    return data.data?.data || [];
  },

  /**
   * Get meetings in date range
   */
  getMeetingsInRange: async (
    userId: string,
    fromDate: string,
    toDate: string
  ): Promise<VideoMeeting[]> => {
    const params = new URLSearchParams({ fromDate, toDate });
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/range/${userId}?${params}`);
    const data: ApiResponse<{ data: VideoMeeting[] }> = await response.json();
    return data.data?.data || [];
  },

  /**
   * Cancel a meeting
   */
  cancelMeeting: async (
    meetingId: string,
    userId: string,
    reason?: string
  ): Promise<VideoMeeting> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/${meetingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({ reason }),
    });
    const data: ApiResponse<VideoMeeting> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },

  /**
   * Get meeting statistics for user
   */
  getMeetingStats: async (userId: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    totalDuration: number;
  }> => {
    const response = await fetch(`${VIDEO_SERVICE_URL}/api/meetings/stats/${userId}`);
    const data: ApiResponse<{
      total: number;
      upcoming: number;
      completed: number;
      cancelled: number;
      totalDuration: number;
    }> = await response.json();
    return data.data || { total: 0, upcoming: 0, completed: 0, cancelled: 0, totalDuration: 0 };
  },
};
