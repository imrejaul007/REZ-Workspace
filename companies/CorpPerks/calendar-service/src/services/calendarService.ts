import { v4 as uuidv4 } from 'uuid';
import { CalendarConnection, CalendarEvent, SyncLog } from '../models';
import { CalendarConnectionDocument } from '../models/CalendarConnection';
import { CalendarEventDocument } from '../models/CalendarEvent';
import { SyncLogDocument } from '../models/SyncLog';
import { googleCalendarService } from './googleCalendarService';
import { outlookCalendarService } from './outlookCalendarService';
import {
  CalendarProvider,
  CreateEventRequest,
  UpdateEventRequest,
  CalendarEvent,
  SyncOptions,
  ISyncConflict,
} from '../types';

export class CalendarService {
  /**
   * Connect a calendar to the user's account
   */
  async connectCalendar(
    userId: string,
    companyId: string,
    provider: CalendarProvider,
    code: string,
    redirectUri: string
  ): Promise<CalendarConnectionDocument> {
    let tokens: { accessToken: string; refreshToken?: string; expiryDate: Date; email: string };
    let connectionData: Partial<CalendarConnectionDocument>;

    switch (provider) {
      case 'google':
        tokens = await googleCalendarService.exchangeCodeForTokens(code);
        connectionData = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.expiryDate,
          email: tokens.email,
          calendarId: 'primary',
          calendarName: 'Primary Calendar',
        };
        break;

      case 'outlook':
        tokens = await outlookCalendarService.exchangeCodeForTokens(code);
        connectionData = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.expiryDate,
          email: tokens.email,
          calendarId: 'primary',
          calendarName: 'Primary Calendar',
        };
        break;

      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    // Check for existing connection
    const existingConnection = await CalendarConnection.findOne({
      userId,
      provider,
      email: tokens.email,
    });

    if (existingConnection) {
      // Update existing connection
      existingConnection.accessToken = connectionData.accessToken!;
      if (connectionData.refreshToken) {
        existingConnection.refreshToken = connectionData.refreshToken;
      }
      existingConnection.tokenExpiry = connectionData.tokenExpiry;
      existingConnection.isActive = true;
      await existingConnection.save();
      return existingConnection;
    }

    // Create new connection
    const connection = new CalendarConnection({
      connectionId: uuidv4(),
      userId,
      companyId,
      provider,
      ...connectionData,
      isPrimary: true,
      isActive: true,
    });

    await connection.save();
    return connection;
  }

  /**
   * Disconnect a calendar
   */
  async disconnectCalendar(connectionId: string, userId: string): Promise<boolean> {
    const connection = await CalendarConnection.findOne({
      connectionId,
      userId,
    });

    if (!connection) {
      return false;
    }

    connection.isActive = false;
    await connection.save();
    return true;
  }

  /**
   * Get user's calendar connections
   */
  async getConnections(userId: string): Promise<CalendarConnectionDocument[]> {
    return CalendarConnection.findUserConnections(userId);
  }

  /**
   * Sync calendar events
   */
  async syncCalendar(options: SyncOptions): Promise<SyncLogDocument> {
    const { connectionId, userId, companyId, provider } = options;

    const connection = await CalendarConnection.findOne({
      connectionId,
      userId,
      isActive: true,
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Create sync log
    const syncLog = new SyncLog({
      syncLogId: uuidv4(),
      connectionId,
      userId,
      companyId,
      provider,
      status: 'started',
      syncType: options.fullSync ? 'full' : 'incremental',
      startedAt: new Date(),
    });
    await syncLog.save();

    try {
      // Ensure token is valid
      let accessToken = connection.accessToken;
      if (connection.tokenExpiry < new Date() && connection.refreshToken) {
        const refreshed = await this.refreshConnectionToken(connection);
        accessToken = refreshed.accessToken;
      }

      // Fetch events based on provider
      let events: CalendarEvent[];
      let nextSyncToken: string | undefined;

      if (provider === 'google') {
        const result = await googleCalendarService.fetchEvents(
          accessToken,
          options.fullSync ? undefined : connection.syncToken
        );
        events = result.events.map((e) =>
          googleCalendarService.transformEvent(e, connectionId, userId, companyId)
        );
        nextSyncToken = result.nextSyncToken;
      } else if (provider === 'outlook') {
        const rawEvents = await outlookCalendarService.fetchEvents(accessToken);
        events = rawEvents.map((e) =>
          outlookCalendarService.transformEvent(e, connectionId, userId, companyId)
        );
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Process events
      let eventsAdded = 0;
      let eventsUpdated = 0;
      const conflicts: ISyncConflict[] = [];

      for (const eventData of events) {
        const existingEvent = await CalendarEvent.findOne({
          connectionId,
          externalEventId: eventData.externalEventId,
        });

        if (existingEvent) {
          // Check for conflicts
          const hasConflict = this.checkConflict(existingEvent, eventData);
          if (hasConflict) {
            conflicts.push({
              eventId: existingEvent.eventId,
              conflictType: hasConflict.type,
              localVersion: existingEvent.toObject(),
              remoteVersion: eventData,
            });
          } else {
            // Update existing event
            await CalendarEvent.updateOne(
              { _id: existingEvent._id },
              { ...eventData, syncStatus: 'synced', lastSyncedAt: new Date() }
            );
            eventsUpdated++;
          }
        } else {
          // Create new event
          const event = new CalendarEvent({
            ...eventData,
            eventId: uuidv4(),
            lastSyncedAt: new Date(),
          });
          await event.save();
          eventsAdded++;
        }
      }

      // Update connection with new sync token
      await CalendarConnection.updateOne(
        { connectionId },
        { lastSyncedAt: new Date(), syncToken: nextSyncToken }
      );

      // Update sync log
      syncLog.status = 'completed';
      syncLog.eventsAdded = eventsAdded;
      syncLog.eventsUpdated = eventsUpdated;
      syncLog.conflicts = conflicts;
      syncLog.completedAt = new Date();
      syncLog.duration = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
      await syncLog.save();

      return syncLog;
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      syncLog.completedAt = new Date();
      syncLog.duration = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
      await syncLog.save();
      throw error;
    }
  }

  /**
   * Get events for user
   */
  async getEvents(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      connectionId?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ events: CalendarEventDocument[]; total: number }> {
    const query: Record<string, unknown> = {
      userId,
      status: { $ne: 'cancelled' },
    };

    if (options?.startDate) {
      query.startTime = { $gte: options.startDate };
    }
    if (options?.endDate) {
      query.endTime = { ...(query.endTime as object || {}), $lte: options.endDate };
    }
    if (options?.connectionId) {
      query.connectionId = options.connectionId;
    }

    const [events, total] = await Promise.all([
      CalendarEvent.find(query)
        .sort({ startTime: 1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50),
      CalendarEvent.countDocuments(query),
    ]);

    return { events, total };
  }

  /**
   * Create a new event (syncs to external calendar)
   */
  async createEvent(eventData: CreateEventRequest): Promise<CalendarEventDocument> {
    const connection = await CalendarConnection.findActiveConnection(
      eventData.userId,
      'corpperks'
    );

    // Create local event
    const event = new CalendarEvent({
      eventId: uuidv4(),
      externalEventId: uuidv4(),
      connectionId: connection?.connectionId || 'corpperks',
      userId: eventData.userId,
      companyId: eventData.companyId,
      provider: 'corpperks',
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      timezone: eventData.timezone || 'UTC',
      allDay: eventData.allDay || false,
      status: 'confirmed',
      attendees: eventData.attendees?.map((a, i) => ({
        attendeeId: uuidv4(),
        email: a.email,
        name: a.name,
        status: 'needs_action' as const,
        isOrganizer: false,
        isCorpPerksUser: false,
      })) || [],
      isCorpPerksEvent: true,
      linkedMeetingId: eventData.linkedMeetingId,
      linkedProjectId: eventData.linkedProjectId,
      meetingLink: eventData.meetingLink,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    });

    await event.save();

    // Sync to external calendars if linked
    const connections = await CalendarConnection.findUserConnections(eventData.userId);
    for (const conn of connections) {
      if (conn.provider === 'google') {
        try {
          const externalEvent = await googleCalendarService.createEvent(conn.accessToken, eventData);
          await CalendarEvent.updateOne(
            { eventId: event.eventId },
            {
              externalEventId: externalEvent.id,
              provider: 'google',
              syncStatus: 'synced',
            }
          );
        } catch (error) {
          logger.error('Failed to sync to Google Calendar:', error);
        }
      } else if (conn.provider === 'outlook') {
        try {
          const externalEvent = await outlookCalendarService.createEvent(conn.accessToken, eventData);
          await CalendarEvent.updateOne(
            { eventId: event.eventId },
            {
              externalEventId: externalEvent.id,
              provider: 'outlook',
              syncStatus: 'synced',
            }
          );
        } catch (error) {
          logger.error('Failed to sync to Outlook:', error);
        }
      }
    }

    return event;
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    userId: string,
    updates: UpdateEventRequest
  ): Promise<CalendarEventDocument | null> {
    const event = await CalendarEvent.findOne({ eventId, userId });
    if (!event) {
      return null;
    }

    const updateData: Record<string, unknown> = {
      syncStatus: 'pending',
      updatedAt: new Date(),
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;
    if (updates.startTime) updateData.startTime = new Date(updates.startTime);
    if (updates.endTime) updateData.endTime = new Date(updates.endTime);
    if (updates.timezone) updateData.timezone = updates.timezone;
    if (updates.allDay !== undefined) updateData.allDay = updates.allDay;
    if (updates.meetingLink) updateData.meetingLink = updates.meetingLink;

    await CalendarEvent.updateOne({ _id: event._id }, updateData);

    // Sync to external calendar
    if (event.externalEventId && event.provider !== 'corpperks') {
      const connection = await CalendarConnection.findById(event.connectionId);
      if (connection && connection.accessToken) {
        try {
          if (event.provider === 'google') {
            await googleCalendarService.updateEvent(
              connection.accessToken,
              event.externalEventId,
              updates
            );
          } else if (event.provider === 'outlook') {
            await outlookCalendarService.updateEvent(
              connection.accessToken,
              event.externalEventId,
              updates
            );
          }
          await CalendarEvent.updateOne({ _id: event._id }, { syncStatus: 'synced' });
        } catch (error) {
          logger.error('Failed to sync update to external calendar:', error);
          await CalendarEvent.updateOne({ _id: event._id }, { syncStatus: 'failed' });
        }
      }
    }

    return CalendarEvent.findById(event._id);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, userId: string): Promise<boolean> {
    const event = await CalendarEvent.findOne({ eventId, userId });
    if (!event) {
      return false;
    }

    // Delete from external calendar
    if (event.externalEventId && event.provider !== 'corpperks') {
      const connection = await CalendarConnection.findById(event.connectionId);
      if (connection && connection.accessToken) {
        try {
          if (event.provider === 'google') {
            await googleCalendarService.deleteEvent(connection.accessToken, event.externalEventId);
          } else if (event.provider === 'outlook') {
            await outlookCalendarService.deleteEvent(connection.accessToken, event.externalEventId);
          }
        } catch (error) {
          logger.error('Failed to delete from external calendar:', error);
        }
      }
    }

    await CalendarEvent.deleteOne({ _id: event._id });
    return true;
  }

  /**
   * Check for conflicts between local and remote versions
   */
  private checkConflict(
    local: CalendarEventDocument,
    remote: Partial<CalendarEventDocument>
  ): { type: 'title' | 'time' | 'attendee' | 'deleted' } | null {
    if (local.title !== remote.title) {
      return { type: 'title' };
    }
    if (local.startTime.getTime() !== remote.startTime?.getTime() ||
        local.endTime.getTime() !== remote.endTime?.getTime()) {
      return { type: 'time' };
    }
    if (local.attendees.length !== remote.attendees?.length) {
      return { type: 'attendee' };
    }
    return null;
  }

  /**
   * Refresh connection token
   */
  private async refreshConnectionToken(
    connection: CalendarConnectionDocument
  ): Promise<{ accessToken: string }> {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    let newAccessToken: string;
    let newExpiryDate: Date;

    if (connection.provider === 'google') {
      const refreshed = await googleCalendarService.refreshAccessToken(connection.refreshToken);
      newAccessToken = refreshed.accessToken;
      newExpiryDate = refreshed.expiryDate;
    } else if (connection.provider === 'outlook') {
      const refreshed = await outlookCalendarService.refreshAccessToken(connection.refreshToken);
      newAccessToken = refreshed.accessToken;
      newExpiryDate = refreshed.expiryDate;
    } else {
      throw new Error(`Cannot refresh token for provider: ${connection.provider}`);
    }

    await CalendarConnection.updateOne(
      { _id: connection._id },
      { accessToken: newAccessToken, tokenExpiry: newExpiryDate }
    );

    return { accessToken: newAccessToken };
  }

  /**
   * Get calendar view (events organized by day)
   */
  async getCalendarView(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; events: CalendarEventDocument[] }[]> {
    const events = await CalendarEvent.findInRange(userId, startDate, endDate);

    const viewMap = new Map<string, CalendarEventDocument[]>();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    for (const event of events) {
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);
      const dateKey = eventDate.toISOString().split('T')[0];

      if (!viewMap.has(dateKey)) {
        viewMap.set(dateKey, []);
      }
      viewMap.get(dateKey)!.push(event);
    }

    const view: { date: Date; events: CalendarEventDocument[] }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      view.push({
        date: new Date(current),
        events: viewMap.get(dateKey) || [],
      });
      current.setDate(current.getDate() + 1);
    }

    return view;
  }

  /**
   * Get sync history for a connection
   */
  async getSyncHistory(connectionId: string, limit: number = 10): Promise<SyncLogDocument[]> {
    return SyncLog.findRecentByConnection(connectionId, limit);
  }
}

export const calendarService = new CalendarService();
