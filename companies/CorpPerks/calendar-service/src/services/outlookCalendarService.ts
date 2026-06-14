import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CalendarConnection, CalendarEvent } from '../models';
import { CalendarEventDocument } from '../models/CalendarEvent';
import {
  IAttendee,
  CreateEventRequest,
  UpdateEventRequest,
  OutlookCalendarEvent,
} from '../types';

export class OutlookCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  private graphEndpoint = 'https://graph.microsoft.com/v1.0';

  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID || '';
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';
  }

  /**
   * Get OAuth URL for user authorization
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'offline_access',
      'Calendars.ReadWrite',
      'User.Read',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiryDate: Date;
    email: string;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await axios.post(this.tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    // Get user profile to get email
    const profileResponse = await axios.get(`${this.graphEndpoint}/me`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: new Date(Date.now() + data.expires_in * 1000),
      email: profileResponse.data.mail || profileResponse.data.userPrincipalName,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: Date;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(this.tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return {
      accessToken: data.access_token,
      expiryDate: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Fetch events from Outlook Calendar
   */
  async fetchEvents(
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OutlookCalendarEvent[]> {
    const params = new URLSearchParams({
      $select: 'id,subject,bodyPreview,body,location,start,end,isAllDay,showAs,attendees,organizer,webLink,isRecurring,recurrence,seriesMasterId',
      $orderby: 'start/dateTime',
      $top: '1000',
    });

    if (startDate) {
      params.append('$filter', `start/dateTime ge '${startDate.toISOString()}'`);
    }
    if (endDate) {
      const filter = params.get('$filter') || '';
      params.set('$filter', `${filter} and end/dateTime le '${endDate.toISOString()}'`);
    }

    const response = await axios.get(`${this.graphEndpoint}/me/calendar/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.value || [];
  }

  /**
   * Create event in Outlook Calendar
   */
  async createEvent(
    accessToken: string,
    event: CreateEventRequest
  ): Promise<OutlookCalendarEvent> {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    const eventData: Record<string, unknown> = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: startTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      isAllDay: event.allDay || false,
      showAs: 'busy',
    };

    if (event.location) {
      eventData.location = { displayName: event.location };
    }

    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map((a) => ({
        emailAddress: {
          address: a.email,
          name: a.name,
        },
        type: 'required',
      }));
    }

    const response = await axios.post(`${this.graphEndpoint}/me/calendar/events`, eventData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Update event in Outlook Calendar
   */
  async updateEvent(
    accessToken: string,
    externalEventId: string,
    updates: UpdateEventRequest
  ): Promise<OutlookCalendarEvent> {
    const updateData: Record<string, unknown> = {};

    if (updates.title) updateData.subject = updates.title;
    if (updates.description) {
      updateData.body = {
        contentType: 'text',
        content: updates.description,
      };
    }
    if (updates.location) {
      updateData.location = { displayName: updates.location };
    }
    if (updates.startTime) {
      updateData.start = {
        dateTime: new Date(updates.startTime).toISOString(),
        timeZone: updates.timezone || 'UTC',
      };
    }
    if (updates.endTime) {
      updateData.end = {
        dateTime: new Date(updates.endTime).toISOString(),
        timeZone: updates.timezone || 'UTC',
      };
    }
    if (updates.attendees) {
      updateData.attendees = updates.attendees.map((a) => ({
        emailAddress: {
          address: a.email,
          name: a.name,
        },
        type: 'required',
      }));
    }

    const response = await axios.patch(
      `${this.graphEndpoint}/me/calendar/events/${externalEventId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Delete event from Outlook Calendar
   */
  async deleteEvent(accessToken: string, externalEventId: string): Promise<void> {
    await axios.delete(`${this.graphEndpoint}/me/calendar/events/${externalEventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Transform Outlook Calendar event to internal format
   */
  transformEvent(
    outlookEvent: OutlookCalendarEvent,
    connectionId: string,
    userId: string,
    companyId: string
  ): Partial<CalendarEventDocument> {
    const startTime = new Date(outlookEvent.start.dateTime);
    const endTime = new Date(outlookEvent.end.dateTime);

    const attendees: IAttendee[] = (outlookEvent.attendees || []).map((a) => ({
      attendeeId: uuidv4(),
      email: a.emailAddress.address,
      name: a.emailAddress.name,
      status: this.mapAttendeeStatus(a.status?.response),
      responseComment: a.comment,
      isOrganizer: false,
      isCorpPerksUser: false,
    }));

    return {
      eventId: uuidv4(),
      externalEventId: outlookEvent.id,
      connectionId,
      userId,
      companyId,
      provider: 'outlook',
      title: outlookEvent.subject || 'Untitled Event',
      description: outlookEvent.bodyPreview,
      location: outlookEvent.location?.displayName,
      startTime,
      endTime,
      timezone: outlookEvent.start.timeZone,
      allDay: outlookEvent.isAllDay,
      status: this.mapShowAsToStatus(outlookEvent.showAs),
      attendees,
      organizerName: outlookEvent.organizer?.emailAddress?.name,
      organizerEmail: outlookEvent.organizer?.emailAddress?.address,
      externalUrl: outlookEvent.webLink,
      recurringEventId: outlookEvent.seriesMasterId,
      isCorpPerksEvent: false,
      syncStatus: 'synced',
    };
  }

  private mapAttendeeStatus(msStatus?: string): IAttendee['status'] {
    switch (msStatus) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentativelyAccepted':
        return 'tentative';
      case 'none':
        return 'needs_action';
      default:
        return 'not_invited';
    }
  }

  private mapShowAsToStatus(showAs?: string): CalendarEventDocument['status'] {
    switch (showAs) {
      case 'busy':
      case 'oof':
        return 'confirmed';
      case 'tentative':
        return 'tentative';
      case 'free':
        return 'confirmed';
      default:
        return 'confirmed';
    }
  }
}

export const outlookCalendarService = new OutlookCalendarService();
