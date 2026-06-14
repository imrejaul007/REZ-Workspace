import axios, { AxiosInstance } from 'axios';
import { google, calendar_v3 } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { CalendarConnection, CalendarEvent } from '../models';
import { CalendarEventDocument } from '../models/CalendarEvent';
import {
  CalendarProvider,
  GoogleCalendarEvent,
  OutlookCalendarEvent,
  IAttendee,
  CreateEventRequest,
  UpdateEventRequest,
  ISyncConflict,
} from '../types';

export class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get OAuth URL for user authorization
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent',
    });
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
    const { tokens } = await this.oauth2Client.getToken(code);

    // Get user email from token
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date!),
      email: profile.email!,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: Date;
  }> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiryDate: new Date(credentials.expiry_date!),
    };
  }

  /**
   * Set credentials for API calls
   */
  private setCredentials(accessToken: string): void {
    this.oauth2Client.setCredentials({ access_token: accessToken });
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(
    accessToken: string,
    syncToken?: string,
    pageToken?: string
  ): Promise<{
    events: GoogleCalendarEvent[];
    nextSyncToken?: string;
    nextPageToken?: string;
  }> {
    this.setCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    };

    if (syncToken) {
      params.syncToken = syncToken;
    } else if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = await calendar.events.list(params);

    return {
      events: (response.data.items || []) as GoogleCalendarEvent[],
      nextSyncToken: response.data.nextSyncToken,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    accessToken: string,
    event: CreateEventRequest
  ): Promise<GoogleCalendarEvent> {
    this.setCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    const eventData: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay
        ? { date: startTime.toISOString().split('T')[0] }
        : { dateTime: startTime.toISOString(), timeZone: event.timezone || 'UTC' },
      end: event.allDay
        ? { date: endTime.toISOString().split('T')[0] }
        : { dateTime: endTime.toISOString(), timeZone: event.timezone || 'UTC' },
    };

    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
      sendUpdates: 'all',
    });

    return response.data as GoogleCalendarEvent;
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    accessToken: string,
    externalEventId: string,
    updates: UpdateEventRequest
  ): Promise<GoogleCalendarEvent> {
    this.setCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const updateData: calendar_v3.Schema$Event = {};

    if (updates.title) updateData.summary = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;

    if (updates.startTime) {
      const startTime = new Date(updates.startTime);
      updateData.start = updates.allDay
        ? { date: startTime.toISOString().split('T')[0] }
        : { dateTime: startTime.toISOString(), timeZone: updates.timezone || 'UTC' };
    }

    if (updates.endTime) {
      const endTime = new Date(updates.endTime);
      updateData.end = updates.allDay
        ? { date: endTime.toISOString().split('T')[0] }
        : { dateTime: endTime.toISOString(), timeZone: updates.timezone || 'UTC' };
    }

    if (updates.attendees) {
      updateData.attendees = updates.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: externalEventId,
      requestBody: updateData,
      sendUpdates: 'all',
    });

    return response.data as GoogleCalendarEvent;
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(accessToken: string, externalEventId: string): Promise<void> {
    this.setCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: externalEventId,
      sendUpdates: 'all',
    });
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(
    accessToken: string,
    emails: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<Map<string, boolean>> {
    this.setCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: emails.map((email) => ({ id: email })),
      },
    });

    const result = new Map<string, boolean>();
    const busyResponse = response.data.calendars || {};

    for (const email of emails) {
      const data = busyResponse[email];
      if (data) {
        result.set(email, !data.busy || data.busy.length === 0);
      } else {
        result.set(email, true);
      }
    }

    return result;
  }

  /**
   * Transform Google Calendar event to internal format
   */
  transformEvent(
    googleEvent: GoogleCalendarEvent,
    connectionId: string,
    userId: string,
    companyId: string
  ): Partial<CalendarEventDocument> {
    const startTime = googleEvent.start.dateTime
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start.date!);

    const endTime = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end.date!);

    const attendees: IAttendee[] = (googleEvent.attendees || []).map((a) => ({
      attendeeId: uuidv4(),
      email: a.email,
      name: a.displayName,
      status: this.mapAttendeeStatus(a.responseStatus),
      responseComment: a.comment,
      isOrganizer: false,
      isCorpPerksUser: false,
    }));

    return {
      eventId: uuidv4(),
      externalEventId: googleEvent.id,
      connectionId,
      userId,
      companyId,
      provider: 'google',
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime,
      endTime,
      timezone: googleEvent.start.timeZone || 'UTC',
      allDay: !googleEvent.start.dateTime,
      status: this.mapEventStatus(googleEvent.status),
      attendees,
      organizerName: googleEvent.organizer?.displayName,
      organizerEmail: googleEvent.organizer?.email,
      externalUrl: googleEvent.htmlLink,
      meetingLink: googleEvent.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === 'video'
      )?.uri,
      recurringEventId: googleEvent.recurringEventId,
      isCorpPerksEvent: false,
      syncStatus: 'synced',
    };
  }

  private mapAttendeeStatus(googleStatus?: string): IAttendee['status'] {
    switch (googleStatus) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentative':
        return 'tentative';
      case 'needsAction':
        return 'needs_action';
      default:
        return 'not_invited';
    }
  }

  private mapEventStatus(googleStatus?: string): CalendarEventDocument['status'] {
    switch (googleStatus) {
      case 'confirmed':
        return 'confirmed';
      case 'tentative':
        return 'tentative';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'confirmed';
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
