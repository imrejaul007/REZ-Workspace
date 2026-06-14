import { Types } from 'mongoose';
import { TelemedicineSession, ITelemedicineSession } from '../models/TelemedicineSession';
import { logger } from '../config/logger';

export interface SessionInput {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  storeId: string;
  merchantId?: string;
  scheduledTime: Date;
  recordingConsent?: boolean;
}

export interface TelemedicineSessionLean {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId?: Types.ObjectId;
  scheduledTime: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  prescriptionIds: Types.ObjectId[];
  recordingConsent: boolean;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TelemedicineService {
  /**
   * Schedule a new telemedicine session
   */
  async scheduleSession(data: SessionInput): Promise<ITelemedicineSession> {
    const session = await TelemedicineSession.create({
      appointmentId: new Types.ObjectId(data.appointmentId),
      patientId: new Types.ObjectId(data.patientId),
      doctorId: new Types.ObjectId(data.doctorId),
      storeId: new Types.ObjectId(data.storeId),
      merchantId: data.merchantId ? new Types.ObjectId(data.merchantId) : undefined,
      scheduledTime: data.scheduledTime,
      recordingConsent: data.recordingConsent ?? false,
      status: 'scheduled',
      prescriptionIds: [],
    });

    logger.info('Telemedicine session scheduled', {
      sessionId: session._id,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
    });

    return session;
  }

  /**
   * Start a telemedicine session and generate meeting link
   */
  async startSession(sessionId: string): Promise<{ meetingLink: string; session: ITelemedicineSession }> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'scheduled') {
      throw new Error(`Cannot start session with status: ${session.status}`);
    }

    // Generate meeting link
    const meetingLink = await this.generateMeetingLink(sessionId);

    session.status = 'in_progress';
    session.startTime = new Date();
    session.meetingLink = meetingLink;
    await session.save();

    logger.info('Telemedicine session started', {
      sessionId,
      meetingLink,
      patientId: session.patientId,
      doctorId: session.doctorId,
    });

    return { meetingLink, session };
  }

  /**
   * End a telemedicine session
   */
  async endSession(sessionId: string, notes?: string): Promise<ITelemedicineSession> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'in_progress') {
      throw new Error(`Cannot end session with status: ${session.status}`);
    }

    session.status = 'completed';
    session.endTime = new Date();
    if (notes) {
      session.notes = notes;
    }
    await session.save();

    logger.info('Telemedicine session ended', {
      sessionId,
      duration: session.endTime.getTime() - (session.startTime?.getTime() || 0),
      patientId: session.patientId,
      doctorId: session.doctorId,
    });

    return session;
  }

  /**
   * Cancel a telemedicine session
   */
  async cancelSession(sessionId: string): Promise<ITelemedicineSession> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Cannot cancel a completed session');
    }

    session.status = 'cancelled';
    await session.save();

    logger.info('Telemedicine session cancelled', {
      sessionId,
      patientId: session.patientId,
      doctorId: session.doctorId,
    });

    return session;
  }

  /**
   * Mark session as no-show
   */
  async markNoShow(sessionId: string): Promise<ITelemedicineSession> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'scheduled') {
      throw new Error(`Cannot mark no-show for session with status: ${session.status}`);
    }

    session.status = 'no_show';
    await session.save();

    logger.info('Telemedicine session marked as no-show', {
      sessionId,
      patientId: session.patientId,
      doctorId: session.doctorId,
    });

    return session;
  }

  /**
   * Get sessions for a doctor on a specific date
   */
  async getSessions(doctorId: string, date: Date): Promise<TelemedicineSessionLean[]> {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return TelemedicineSession.find({
      doctorId: new Types.ObjectId(doctorId),
      scheduledTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ scheduledTime: 1 })
      .lean() as unknown as TelemedicineSessionLean[];
  }

  /**
   * Get sessions for a patient
   */
  async getPatientSessions(patientId: string, options?: {
    status?: ITelemedicineSession['status'];
    limit?: number;
    page?: number;
  }): Promise<{ sessions: TelemedicineSessionLean[]; total: number }> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error('Invalid patient ID');
    }

    const query: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
    };

    if (options?.status) {
      query.status = options.status;
    }

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      TelemedicineSession.find(query)
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TelemedicineSession.countDocuments(query),
    ]);

    return { sessions: sessions as unknown as TelemedicineSessionLean[], total };
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<TelemedicineSessionLean | null> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    return TelemedicineSession.findById(sessionId).lean() as unknown as TelemedicineSessionLean | null;
  }

  /**
   * Generate a unique meeting link for a session
   */
  async generateMeetingLink(sessionId: string): Promise<string> {
    // Generate a unique meeting room ID
    const meetingRoomId = this.generateMeetingRoomId();
    const baseUrl = process.env.TELEMEDICINE_BASE_URL || 'https://telemedicine.rez.money';
    return `${baseUrl}/room/${meetingRoomId}?session=${sessionId}`;
  }

  /**
   * Generate a unique meeting room ID
   * FIX (security): Replaced Math.random() with crypto
   */
  private generateMeetingRoomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // FIX (security): Use crypto for secure random ID generation
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const array = new Uint8Array(12);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, b => chars[b % chars.length]).join('');
    }
    // Node.js fallback
    try {
      const { randomBytes } = require('crypto');
      const bytes = randomBytes(12);
      return Array.from(bytes, b => chars[b % chars.length]).join('');
    } catch {
      // Legacy fallback (only for environments without crypto)
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }

  /**
   * Add prescription to session
   */
  async addPrescription(sessionId: string, prescriptionId: string): Promise<ITelemedicineSession | null> {
    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(prescriptionId)) {
      throw new Error('Invalid session or prescription ID');
    }

    const session = await TelemedicineSession.findByIdAndUpdate(
      sessionId,
      { $addToSet: { prescriptionIds: new Types.ObjectId(prescriptionId) } },
      { new: true }
    );

    if (session) {
      logger.info('Prescription added to telemedicine session', {
        sessionId,
        prescriptionId,
      });
    }

    return session;
  }

  /**
   * Set recording URL after session
   */
  async setRecordingUrl(sessionId: string, recordingUrl: string): Promise<ITelemedicineSession | null> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const session = await TelemedicineSession.findByIdAndUpdate(
      sessionId,
      { recordingUrl },
      { new: true }
    );

    if (session) {
      logger.info('Recording URL set for telemedicine session', {
        sessionId,
        recordingUrl,
      });
    }

    return session;
  }

  /**
   * Get upcoming sessions for a doctor
   */
  async getUpcomingSessions(doctorId: string, limit: number = 10): Promise<TelemedicineSessionLean[]> {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }

    return TelemedicineSession.find({
      doctorId: new Types.ObjectId(doctorId),
      status: 'scheduled',
      scheduledTime: { $gte: new Date() },
    })
      .sort({ scheduledTime: 1 })
      .limit(limit)
      .lean() as unknown as TelemedicineSessionLean[];
  }

  /**
   * Get session statistics for a doctor
   */
  async getSessionStats(doctorId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    scheduled: number;
  }> {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }

    const match = {
      doctorId: new Types.ObjectId(doctorId),
      scheduledTime: { $gte: startDate, $lte: endDate },
    };

    const [stats] = await TelemedicineSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      scheduled: 0,
    };

    for (const item of stats) {
      const status = item._id as keyof typeof result;
      if (status in result) {
        result[status] = item.count;
        result.total += item.count;
      }
    }

    return result;
  }
}

// Singleton instance
export const telemedicineService = new TelemedicineService();
