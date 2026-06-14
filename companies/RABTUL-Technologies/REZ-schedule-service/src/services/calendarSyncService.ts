// ReZ Schedule - Calendar Sync Service
// Handles Google Calendar, Outlook, Apple Calendar synchronization
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { dayjs } from '../utils/datetime';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
  conferenceData?: {
    conferenceType: string;
    entryPoints?: { entryType: string; uri: string; label?: string }[];
  };
}

interface SyncResult {
  success: boolean;
  syncedEvents: number;
  conflicts: string[];
  errors: string[];
}

export class CalendarSyncService {
  private readonly PROVIDERS = {
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBase: 'https://www.googleapis.com/calendar/v3',
    },
    outlook: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      apiBase: 'https://graph.microsoft.com/v1.0',
    },
  };

  /**
   * Get OAuth URL for calendar provider
   */
  getOAuthUrl(provider: 'google' | 'outlook', redirectUri: string, state?: string): string {
    // In production, this would generate proper OAuth URLs with scopes
    if (provider === 'google') {
      const scopes = encodeURIComponent([
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' '));

      return `${this.PROVIDERS.google.authUrl}?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&state=${state || ''}`;
    }

    // Outlook/Microsoft
    const scopes = encodeURIComponent([
      'Calendars.ReadWrite',
      'offline_access',
    ].join(' '));

    return `${this.PROVIDERS.outlook.authUrl}?client_id=${process.env.OUTLOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state || ''}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    provider: 'google' | 'outlook',
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    const config = this.PROVIDERS[provider];

    const response = await axios.post(config.tokenUrl, {
      client_id: provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.OUTLOOK_CLIENT_ID,
      client_secret: provider === 'google' ? process.env.GOOGLE_CLIENT_SECRET : process.env.OUTLOOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    provider: 'google' | 'outlook',
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const config = this.PROVIDERS[provider];

    const response = await axios.post(config.tokenUrl, {
      client_id: provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.OUTLOOK_CLIENT_ID,
      client_secret: provider === 'google' ? process.env.GOOGLE_CLIENT_SECRET : process.env.OUTLOOK_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Get calendar list from provider
   */
  async getCalendarList(provider: 'google' | 'outlook', accessToken: string): Promise<{
    id: string;
    name: string;
    primary: boolean;
    color?: string;
  }[]> {
    if (provider === 'google') {
      const response = await axios.get(`${this.PROVIDERS.google.apiBase}/users/me/calendarList`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.items.map((cal: Record<string, unknown>) => ({
        id: cal.id as string,
        name: cal.summary as string,
        primary: (cal.primary as boolean) || false,
        color: cal.backgroundColor as string,
      }));
    }

    // Outlook
    const response = await axios.get(`${this.PROVIDERS.outlook.apiBase}/me/calendars`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data.value.map((cal: Record<string, unknown>) => ({
      id: cal.id as string,
      name: cal.name as string,
      primary: (cal.isDefaultCalendar as boolean) || false,
    }));
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    provider: 'google' | 'outlook',
    accessToken: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<{ id: string; htmlLink: string }> {
    if (provider === 'google') {
      const response = await axios.post(
        `${this.PROVIDERS.google.apiBase}/calendars/${calendarId}/events`,
        {
          ...event,
          conferenceDataVersion: event.conferenceData ? 1 : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    }

    // Outlook
    const response = await axios.post(
      `${this.PROVIDERS.outlook.apiBase}/me/calendars/${calendarId}/events`,
      {
        subject: event.summary,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: event.start,
        end: event.end,
        location: event.location ? { displayName: event.location } : undefined,
        attendees: event.attendees,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      htmlLink: response.data.webLink,
    };
  }

  /**
   * Update calendar event
   */
  async updateCalendarEvent(
    provider: 'google' | 'outlook',
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    if (provider === 'google') {
      await axios.put(
        `${this.PROVIDERS.google.apiBase}/calendars/${calendarId}/events/${eventId}`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return;
    }

    // Outlook
    await axios.patch(
      `${this.PROVIDERS.outlook.apiBase}/me/calendars/${calendarId}/events/${eventId}`,
      {
        subject: event.summary,
        body: event.description ? { contentType: 'HTML', content: event.description } : undefined,
        start: event.start,
        end: event.end,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(
    provider: 'google' | 'outlook',
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    if (provider === 'google') {
      await axios.delete(
        `${this.PROVIDERS.google.apiBase}/calendars/${calendarId}/events/${eventId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return;
    }

    // Outlook
    await axios.delete(
      `${this.PROVIDERS.outlook.apiBase}/me/calendars/${calendarId}/events/${eventId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  /**
   * Get events from calendar
   */
  async getCalendarEvents(
    provider: 'google' | 'outlook',
    accessToken: string,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> {
    const formatDate = (d: Date) => d.toISOString();

    if (provider === 'google') {
      const response = await axios.get(
        `${this.PROVIDERS.google.apiBase}/calendars/${calendarId}/events`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            timeMin: formatDate(timeMin),
            timeMax: formatDate(timeMax),
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      return response.data.items || [];
    }

    // Outlook
    const response = await axios.get(
      `${this.PROVIDERS.outlook.apiBase}/me/calendars/${calendarId}/calendarView`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          startDateTime: formatDate(timeMin),
          endDateTime: formatDate(timeMax),
        },
      }
    );

    return response.data.value.map((event: Record<string, unknown>) => ({
      id: event.id,
      summary: event.subject as string,
      description: (event.body as { content?: string })?.content,
      start: event.start as { dateTime?: string; date?: string; timeZone?: string },
      end: event.end as { dateTime?: string; date?: string; timeZone?: string },
      location: (event.location as { displayName?: string })?.displayName,
    }));
  }

  /**
   * Sync booking to external calendar
   */
  async syncBookingToCalendar(bookingId: string): Promise<SyncResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: true,
        user: true,
        attendee: true,
        bookingReference: true,
      },
    });

    if (!booking) {
      return { success: false, syncedEvents: 0, conflicts: [], errors: ['Booking not found'] };
    }

    const integrations = await prisma.calendarIntegration.findMany({
      where: { userId: booking.userId },
      include: { calendars: true },
    });

    const result: SyncResult = {
      success: true,
      syncedEvents: 0,
      conflicts: [],
      errors: [],
    };

    for (const integration of integrations) {
      if (!integration.calendars.length) continue;

      try {
        // Get valid access token
        let accessToken = integration.accessToken;
        if (integration.tokenExpiry && new Date(integration.tokenExpiry) < new Date()) {
          const refreshed = await this.refreshAccessToken(
            integration.provider as 'google' | 'outlook',
            integration.refreshToken || ''
          );
          accessToken = refreshed.accessToken;

          await prisma.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              accessToken: refreshed.accessToken,
              tokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
            },
          });
        }

        const primaryCalendar = integration.calendars.find(c => c.isPrimary) || integration.calendars[0];
        const provider = integration.provider as 'google' | 'outlook';

        // Check if event already exists
        const existingRef = booking.bookingReference;

        if (existingRef && existingRef.type === integration.provider) {
          // Update existing event
          await this.updateCalendarEvent(provider, accessToken, primaryCalendar.externalId, existingRef.externalId, {
            summary: `${booking.eventType.title} with ${booking.attendee?.name || 'Guest'}`,
            description: booking.eventType.description || '',
            start: { dateTime: booking.startTime.toISOString(), timeZone: booking.timezone },
            end: { dateTime: booking.endTime.toISOString(), timeZone: booking.timezone },
          });
        } else {
          // Create new event
          const created = await this.createCalendarEvent(provider, accessToken, primaryCalendar.externalId, {
            summary: `${booking.eventType.title} with ${booking.attendee?.name || 'Guest'}`,
            description: booking.eventType.description || '',
            start: { dateTime: booking.startTime.toISOString(), timeZone: booking.timezone },
            end: { dateTime: booking.endTime.toISOString(), timeZone: booking.timezone },
          });

          // Create booking reference
          await prisma.bookingReference.create({
            data: {
              bookingId: booking.id,
              type: integration.provider,
              externalId: created.id,
              externalLink: created.htmlLink,
            },
          });
        }

        result.syncedEvents++;
      } catch (error) {
        result.errors.push(`Failed to sync to ${integration.provider}: ${(error as Error).message}`);
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Check for calendar conflicts
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ hasConflict: boolean; conflictingEvents: CalendarEvent[] }> {
    const integrations = await prisma.calendarIntegration.findMany({
      where: { userId },
      include: { calendars: true },
    });

    const conflicts: CalendarEvent[] = [];

    for (const integration of integrations) {
      if (!integration.calendars.length) continue;

      try {
        let accessToken = integration.accessToken;
        if (integration.tokenExpiry && new Date(integration.tokenExpiry) < new Date()) {
          const refreshed = await this.refreshAccessToken(
            integration.provider as 'google' | 'outlook',
            integration.refreshToken || ''
          );
          accessToken = refreshed.accessToken;
        }

        const primaryCalendar = integration.calendars.find(c => c.isPrimary) || integration.calendars[0];
        const events = await this.getCalendarEvents(
          integration.provider as 'google' | 'outlook',
          accessToken,
          primaryCalendar.externalId,
          dayjs(startTime).subtract(1, 'minute').toDate(),
          dayjs(endTime).add(1, 'minute').toDate()
        );

        // Check for time overlap
        for (const event of events) {
          const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
          const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);

          if (eventStart < endTime && eventEnd > startTime) {
            conflicts.push(event);
          }
        }
      } catch (error) {
        logger.warn(`Failed to check conflicts for ${integration.provider}:`, error);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictingEvents: conflicts,
    };
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ start: Date; end: Date; busy: boolean }[]> {
    const busySlots: { start: Date; end: Date; busy: boolean }[] = [];

    const conflicts = await this.checkConflicts(userId, startTime, endTime);

    if (!conflicts.hasConflict) {
      return [{ start: startTime, end: endTime, busy: false }];
    }

    // Mark conflicting times as busy
    for (const event of conflicts.conflictingEvents) {
      const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
      const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);

      busySlots.push({
        start: eventStart,
        end: eventEnd,
        busy: true,
      });
    }

    return busySlots;
  }
}

export const calendarSyncService = new CalendarSyncService();
export default calendarSyncService;
