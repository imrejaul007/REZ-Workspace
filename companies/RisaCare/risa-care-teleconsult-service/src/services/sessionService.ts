import { v4 as uuidv4 } from 'uuid';
import {
  db,
  TeleconsultSession,
  SessionStatus,
  ConsultationMode,
  ScheduleSessionRequest,
} from '../models/teleconsult.js';
import { videoService } from './videoService.js';

export class SessionService {
  /**
   * Schedule a new teleconsult session
   */
  async scheduleSession(request: ScheduleSessionRequest): Promise<TeleconsultSession> {
    const now = new Date().toISOString();
    const sessionId = uuidv4();

    // Generate video room
    const room = await videoService.generateRoom(sessionId);

    const session: TeleconsultSession = {
      sessionId,
      patientId: request.patientId,
      doctorId: request.doctorId,
      appointmentId: request.appointmentId,
      scheduledAt: request.scheduledAt,
      consultationMode: request.consultationMode || ConsultationMode.VIDEO,
      chiefComplaint: request.chiefComplaint,
      status: SessionStatus.SCHEDULED,
      roomId: room.roomId,
      duration: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.sessions.set(sessionId, session);

    // If slot times provided, mark slot as booked
    if (request.slotStart && request.slotEnd) {
      await this.markSlotBooked(request.doctorId, request.slotStart, request.slotEnd, sessionId);
    }

    return session;
  }

  /**
   * Start a teleconsult session (patient or doctor joins)
   */
  async startSession(sessionId: string, userId: string, userType: 'patient' | 'doctor'): Promise<TeleconsultSession> {
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new Error('Session has already been completed');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new Error('Session has been cancelled');
    }

    const now = new Date().toISOString();

    // First join transitions from scheduled/waiting to in_progress
    if (session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.WAITING) {
      session.status = SessionStatus.IN_PROGRESS;
      session.startedAt = now;
      await videoService.startRecording(session.roomId!);
    }

    session.updatedAt = now;
    db.sessions.set(sessionId, session);

    return session;
  }

  /**
   * End a teleconsult session
   */
  async endSession(
    sessionId: string,
    endedBy: 'patient' | 'doctor' | 'system'
  ): Promise<TeleconsultSession> {
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new Error('Session has already been completed');
    }

    const now = new Date().toISOString();
    let recordingUrl: string | undefined;

    // Stop recording and get URL
    if (session.roomId) {
      recordingUrl = await videoService.stopRecording(session.roomId);
    }

    // Calculate duration
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : 0;
    const endTime = new Date(now).getTime();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    session.status = SessionStatus.COMPLETED;
    session.endedAt = now;
    session.duration = durationSeconds;
    session.recordingUrl = recordingUrl;
    session.updatedAt = now;

    db.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Cancel a teleconsult session
   */
  async cancelSession(
    sessionId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<TeleconsultSession> {
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed session');
    }

    const now = new Date().toISOString();

    session.status = SessionStatus.CANCELLED;
    session.endedAt = now;
    session.updatedAt = now;
    session.metadata = {
      ...session.metadata,
      cancelledBy,
      cancellationReason: reason,
    };

    db.sessions.set(sessionId, session);

    // Release the slot
    if (session.startedAt) {
      // If session had started, no slot to release
      return session;
    }

    // Mark slot as available again (find the original slot)
    const availKey = `${session.doctorId}:${session.scheduledAt.split('T')[0]}`;
    const availability = db.availability.get(availKey);
    if (availability) {
      const slot = availability.slots.find(s => s.consultationId === sessionId);
      if (slot) {
        slot.booked = false;
        slot.consultationId = null;
        db.availability.set(availKey, availability);
      }
    }

    return session;
  }

  /**
   * Mark patient as no-show
   */
  async markNoShow(sessionId: string, markedBy: string): Promise<TeleconsultSession> {
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== SessionStatus.SCHEDULED && session.status !== SessionStatus.WAITING) {
      throw new Error('Can only mark no-show for scheduled or waiting sessions');
    }

    const now = new Date().toISOString();

    session.status = SessionStatus.NO_SHOW;
    session.endedAt = now;
    session.updatedAt = now;
    session.metadata = {
      ...session.metadata,
      noShowMarkedBy: markedBy,
    };

    db.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Get a single session
   */
  getSession(sessionId: string): TeleconsultSession | undefined {
    return db.sessions.get(sessionId);
  }

  /**
   * Get all sessions for a patient
   */
  getPatientSessions(
    patientId: string,
    options?: {
      status?: SessionStatus;
      limit?: number;
      offset?: number;
    }
  ): { sessions: TeleconsultSession[]; total: number } {
    const allSessions = Array.from(db.sessions.values())
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    let filtered = allSessions;
    if (options?.status) {
      filtered = filtered.filter(s => s.status === options.status);
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return {
      sessions: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get all sessions for a doctor
   */
  getDoctorSessions(
    doctorId: string,
    options?: {
      status?: SessionStatus;
      date?: string;
      limit?: number;
      offset?: number;
    }
  ): { sessions: TeleconsultSession[]; total: number } {
    let allSessions = Array.from(db.sessions.values())
      .filter(s => s.doctorId === doctorId)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    if (options?.status) {
      allSessions = allSessions.filter(s => s.status === options.status);
    }

    if (options?.date) {
      allSessions = allSessions.filter(s => s.scheduledAt.startsWith(options.date!));
    }

    const total = allSessions.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return {
      sessions: allSessions.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get session token for video room access
   */
  async getSessionToken(
    sessionId: string,
    userId: string,
    userType: 'patient' | 'doctor'
  ): Promise<{ token: string; roomId: string }> {
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.roomId) {
      throw new Error('No video room associated with this session');
    }

    const token = await videoService.getRoomToken(session.roomId, userId, userType);
    return { token, roomId: session.roomId };
  }

  /**
   * Helper: Mark a slot as booked
   */
  private async markSlotBooked(
    doctorId: string,
    start: string,
    end: string,
    consultationId: string
  ): Promise<void> {
    const date = start.split('T')[0];
    const key = `${doctorId}:${date}`;
    const availability = db.availability.get(key);

    if (availability) {
      const slot = availability.slots.find(
        s => s.start === start && s.end === end
      );
      if (slot) {
        slot.booked = true;
        slot.consultationId = consultationId;
        db.availability.set(key, availability);
      }
    }
  }

  /**
   * Get upcoming sessions for a user (patient or doctor)
   */
  getUpcomingSessions(
    userId: string,
    userType: 'patient' | 'doctor'
  ): TeleconsultSession[] {
    const now = new Date().toISOString();
    const sessions = userType === 'patient'
      ? this.getPatientSessions(userId).sessions
      : this.getDoctorSessions(userId).sessions;

    return sessions.filter(
      s => s.scheduledAt > now &&
           (s.status === SessionStatus.SCHEDULED || s.status === SessionStatus.WAITING)
    );
  }

  /**
   * Get session statistics for a doctor
   */
  getDoctorSessionStats(doctorId: string): {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const sessions = this.getDoctorSessions(doctorId, { limit: 10000 });

    const completed = sessions.sessions.filter(s => s.status === SessionStatus.COMPLETED);
    const cancelled = sessions.sessions.filter(s => s.status === SessionStatus.CANCELLED);
    const noShow = sessions.sessions.filter(s => s.status === SessionStatus.NO_SHOW);

    const totalDuration = completed.reduce((sum, s) => sum + s.duration, 0);

    return {
      total: sessions.total,
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      totalDuration,
      averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
    };
  }
}

export const sessionService = new SessionService();
