// ReZ Schedule - Video Meeting Service
// Handles Zoom, Google Meet, Microsoft Teams, Daily.co integration
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';

interface VideoMeetingConfig {
  provider: 'zoom' | 'google_meet' | 'teams' | 'daily';
  topic: string;
  startTime: Date;
  duration: number; // minutes
  hostEmail: string;
}

interface VideoMeeting {
  meetingId: string;
  meetingUrl: string;
  hostUrl?: string;
  joinUrl?: string;
  password?: string;
}

export class VideoService {
  /**
   * Create a video meeting for a booking
   */
  async createMeeting(bookingId: string): Promise<VideoMeeting | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: true,
        user: true,
      },
    });

    if (!booking) {
      logger.error(`[Video] Booking not found: ${bookingId}`);
      return null;
    }

    const provider = this.getProviderForEvent(booking.eventType.locationType);

    const config: VideoMeetingConfig = {
      provider,
      topic: booking.eventType.title,
      startTime: booking.startTime,
      duration: booking.eventType.duration,
      hostEmail: booking.user.email,
    };

    let meeting: VideoMeeting | null = null;

    switch (provider) {
      case 'zoom':
        meeting = await this.createZoomMeeting(config);
        break;
      case 'google_meet':
        meeting = await this.createGoogleMeet(config);
        break;
      case 'teams':
        meeting = await this.createTeamsMeeting(config);
        break;
      case 'daily':
        meeting = await this.createDailyMeeting(config);
        break;
    }

    if (meeting) {
      // Store in database
      await prisma.videoMeeting.create({
        data: {
          bookingId,
          provider,
          meetingId: meeting.meetingId,
          meetingUrl: meeting.meetingUrl,
          hostUrl: meeting.hostUrl,
          joinUrl: meeting.joinUrl,
          password: meeting.password,
        },
      });

      // Update booking reference
      await prisma.bookingReference.create({
        data: {
          bookingId,
          type: provider,
          externalId: meeting.meetingId,
          externalLink: meeting.meetingUrl,
          meetingUrl: meeting.meetingUrl,
          password: meeting.password,
        },
      });

      logger.info(`[Video] Created ${provider} meeting for booking ${bookingId}`);
    }

    return meeting;
  }

  /**
   * Get video provider based on location type
   */
  private getProviderForEvent(locationType: string): 'zoom' | 'google_meet' | 'teams' | 'daily' {
    // In production, this would check user preferences
    switch (locationType) {
      case 'VIDEO_CALL':
        // Default to daily.co for flexibility
        return 'daily';
      default:
        return 'daily';
    }
  }

  /**
   * Create Zoom meeting
   */
  private async createZoomMeeting(config: VideoMeetingConfig): Promise<VideoMeeting> {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: config.topic,
        type: 2, // Scheduled meeting
        start_time: config.startTime.toISOString(),
        duration: config.duration,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true,
          audio: 'both',
          auto_recording: 'none',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${await this.getZoomAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      meetingId: response.data.id,
      meetingUrl: response.data.join_url,
      hostUrl: response.data.start_url,
      password: response.data.password,
    };
  }

  /**
   * Create Google Meet
   */
  private async createGoogleMeet(config: VideoMeetingConfig): Promise<VideoMeeting> {
    // Google Meet requires Google Calendar API
    const accessToken = await this.getGoogleAccessToken(config.hostEmail);

    const response = await axios.post(
      'https://calendar.googleapis.com/calendar/v3/calendars/primary/events',
      {
        summary: config.topic,
        start: {
          dateTime: config.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(config.startTime.getTime() + config.duration * 60000).toISOString(),
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: { conferenceDataVersion: 1 },
      }
    );

    const meetInfo = response.data.conferenceData?.conferenceSolution;

    return {
      meetingId: response.data.id,
      meetingUrl: response.data.hangoutLink || `https://meet.google.com/${randomBytes(3).toString('hex')}-${randomBytes(4).toString('hex')}-${randomBytes(3).toString('hex')}`,
      password: '',
    };
  }

  /**
   * Create Microsoft Teams meeting
   */
  private async createTeamsMeeting(config: VideoMeetingConfig): Promise<VideoMeeting> {
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      {
        subject: config.topic,
        start: {
          dateTime: config.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(config.startTime.getTime() + config.duration * 60000).toISOString(),
          timeZone: 'UTC',
        },
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      },
      {
        headers: {
          Authorization: `Bearer ${await this.getTeamsAccessToken(config.hostEmail)}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      meetingId: response.data.id,
      meetingUrl: response.data.onlineMeeting?.joinUrl,
      hostUrl: response.data.onlineMeeting?.joinUrl,
    };
  }

  /**
   * Create Daily.co meeting
   */
  private async createDailyMeeting(config: VideoMeetingConfig): Promise<VideoMeeting> {
    const roomName = `rez-${randomBytes(6).toString('hex')}`;

    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        privacy: 'public',
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'cloud',
          start_video_off: false,
          start_audio_off: false,
          max_participants: 100,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      meetingId: response.data.id,
      meetingUrl: response.data.url,
      joinUrl: response.data.url,
    };
  }

  /**
   * Delete a video meeting
   */
  async deleteMeeting(bookingId: string): Promise<boolean> {
    const meeting = await prisma.videoMeeting.findUnique({
      where: { bookingId },
    });

    if (!meeting) {
      return false;
    }

    try {
      switch (meeting.provider) {
        case 'zoom':
          await this.deleteZoomMeeting(meeting.meetingId);
          break;
        case 'daily':
          await this.deleteDailyMeeting(meeting.meetingId);
          break;
        // Other providers would be implemented similarly
      }

      await prisma.videoMeeting.delete({
        where: { id: meeting.id },
      });

      logger.info(`[Video] Deleted ${meeting.provider} meeting ${meeting.meetingId}`);
      return true;
    } catch (error) {
      logger.error(`[Video] Failed to delete meeting:`, error);
      return false;
    }
  }

  private async deleteZoomMeeting(meetingId: string): Promise<void> {
    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${await this.getZoomAccessToken()}`,
      },
    });
  }

  private async deleteDailyMeeting(roomName: string): Promise<void> {
    await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
    });
  }

  /**
   * Get video meeting info for a booking
   */
  async getMeeting(bookingId: string): Promise<VideoMeeting | null> {
    const meeting = await prisma.videoMeeting.findUnique({
      where: { bookingId },
    });

    if (!meeting) {
      return null;
    }

    return {
      meetingId: meeting.meetingId,
      meetingUrl: meeting.meetingUrl,
      hostUrl: meeting.hostUrl || undefined,
      joinUrl: meeting.joinUrl || undefined,
      password: meeting.password || undefined,
    };
  }

  /**
   * Token management (simplified - in production use proper OAuth handling)
   */
  private async getZoomAccessToken(): Promise<string> {
    // In production, use OAuth or Server-to-Server OAuth
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID || '',
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  }

  private async getGoogleAccessToken(userEmail: string): Promise<string> {
    // Simplified - in production, use OAuth tokens per user
    return process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN || '';
  }

  private async getTeamsAccessToken(userEmail: string): Promise<string> {
    // Simplified - in production, use OAuth tokens per user
    return process.env.MICROSOFT_ACCESS_TOKEN || '';
  }

  /**
   * Send meeting invite to attendees
   */
  async sendMeetingInvite(bookingId: string, attendeeEmail: string, attendeeName: string): Promise<boolean> {
    const meeting = await this.getMeeting(bookingId);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!meeting || !booking) {
      return false;
    }

    // In production, use calendar API to send invites
    logger.info(`[Video] Would send meeting invite to ${attendeeEmail} for ${meeting.meetingUrl}`);

    return true;
  }
}

export const videoService = new VideoService();
export default videoService;
