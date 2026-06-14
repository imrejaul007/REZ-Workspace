import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../models/Appointment';
import { logger } from '../config/logger';
import { config } from '../config';
import { IntentGraphClient } from './IntentGraphClient';

export interface TelemedicineSession {
  sessionId: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  roomName: string;
  roomUrl: string;
  status: 'waiting' | 'active' | 'ended' | 'expired';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  recording?: {
    enabled: boolean;
    url?: string;
  };
  createdAt: Date;
}

export interface StartSessionInput {
  appointmentId: string;
  patientId: string;
  providerId: string;
  enableRecording?: boolean;
}

export class TelemedicineService {
  private intentGraphClient: IntentGraphClient;
  private activeSessions: Map<string, TelemedicineSession> = new Map();

  constructor() {
    this.intentGraphClient = new IntentGraphClient();
  }

  async startSession(input: StartSessionInput): Promise<TelemedicineSession> {
    try {
      // Verify appointment exists and is telemedicine type
      const appointment = await Appointment.findOne({
        appointmentId: input.appointmentId,
        type: 'telemedicine',
      });

      if (!appointment) {
        throw new Error('Telemedicine appointment not found');
      }

      const sessionId = `TMS-${uuidv4().substring(0, 12).toUpperCase()}`;
      const roomName = `room-${sessionId.toLowerCase()}`;

      // Generate room URL based on video provider
      const roomUrl = this.generateRoomUrl(roomName);

      const session: TelemedicineSession = {
        sessionId,
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        providerId: input.providerId,
        roomName,
        roomUrl,
        status: 'waiting',
        recording: {
          enabled: input.enableRecording || false,
        },
        createdAt: new Date(),
      };

      this.activeSessions.set(sessionId, session);

      // Update appointment with session ID
      await Appointment.updateOne(
        { appointmentId: input.appointmentId },
        { $set: { telemedicineSessionId: sessionId } }
      );

      logger.info('Telemedicine session started', {
        sessionId,
        appointmentId: input.appointmentId,
      });

      // Track intent
      await this.intentGraphClient.trackIntent({
        userId: input.patientId,
        intent: 'telemedicine_session_started',
        entities: {
          sessionId,
          appointmentId: input.appointmentId,
        },
        metadata: {
          service: 'rez-healthcare-service',
        },
      });

      return session;
    } catch (error) {
      logger.error('Failed to start telemedicine session', {
        error,
        appointmentId: input.appointmentId,
      });
      throw error;
    }
  }

  async joinSession(
    sessionId: string,
    userId: string,
    role: 'patient' | 'provider'
  ): Promise<TelemedicineSession | null> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        logger.warn('Session not found', { sessionId });
        return null;
      }

      if (session.status === 'expired' || session.status === 'ended') {
        throw new Error('Session has ended');
      }

      // Update session status to active on first join
      if (session.status === 'waiting') {
        session.status = 'active';
        session.startedAt = new Date();

        // Update appointment status
        await Appointment.updateOne(
          { telemedicineSessionId: sessionId },
          { $set: { status: 'in-progress' } }
        );
      }

      logger.info('User joined telemedicine session', {
        sessionId,
        userId,
        role,
      });

      return session;
    } catch (error) {
      logger.error('Failed to join session', { error, sessionId, userId });
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<TelemedicineSession | null> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return null;
      }

      session.status = 'ended';
      session.endedAt = new Date();
      if (session.startedAt) {
        session.duration = Math.floor(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
        );
      }

      // Update appointment status
      await Appointment.updateOne(
        { telemedicineSessionId: sessionId },
        { $set: { status: 'completed' } }
      );

      logger.info('Telemedicine session ended', {
        sessionId,
        duration: session.duration,
      });

      return session;
    } catch (error) {
      logger.error('Failed to end session', { error, sessionId });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<TelemedicineSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  async getActiveSessions(userId: string): Promise<TelemedicineSession[]> {
    const sessions: TelemedicineSession[] = [];

    this.activeSessions.forEach((session) => {
      if (
        (session.patientId === userId || session.providerId === userId) &&
        session.status === 'active'
      ) {
        sessions.push(session);
      }
    });

    return sessions;
  }

  async generatePresignedUrl(
    sessionId: string,
    fileName: string
  ): Promise<string> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // In production, this would call the video provider's API
      const presignedUrl = `https://api.videoprovider.com/recordings/${sessionId}/${fileName}?token=${uuidv4()}`;

      return presignedUrl;
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, sessionId });
      throw error;
    }
  }

  async setRecording(sessionId: string, url: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.recording = {
        enabled: true,
        url,
      };

      logger.info('Recording URL set', { sessionId, url });
    } catch (error) {
      logger.error('Failed to set recording', { error, sessionId });
      throw error;
    }
  }

  private generateRoomUrl(roomName: string): string {
    // In production, this would use actual video provider SDK
    return `https://app.rez.health/video/${roomName}`;
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    const sessionTimeout = 4 * 60 * 60 * 1000; // 4 hours

    this.activeSessions.forEach((session, sessionId) => {
      if (
        session.status !== 'ended' &&
        session.status !== 'expired' &&
        now - session.createdAt.getTime() > sessionTimeout
      ) {
        session.status = 'expired';
        logger.info('Session expired', { sessionId });
      }
    });
  }
}
