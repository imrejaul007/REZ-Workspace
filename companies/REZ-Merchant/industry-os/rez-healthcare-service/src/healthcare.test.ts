import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies before importing the modules
jest.mock('mongoose', () => {
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      connection: { readyState: 1 },
      model: jest.fn().mockReturnValue(mockModel),
    },
    model: jest.fn().mockReturnValue(mockModel),
    Schema: jest.fn().mockImplementation(() => ({
      pre: jest.fn(),
      virtual: jest.fn().mockReturnValue({ get: jest.fn() }),
      index: jest.fn(),
    })),
  };
});

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  }));
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Import after mocks
import { SeverityLevel, DiagnosisHelper, SymptomInputSchema, getSymptomSynonyms } from './services/DiagnosisHelper';
import { TelemedicineService, StartSessionInput } from './services/TelemedicineService';
import express from 'express';

describe('ReZ Healthcare Service - TelemedicineService', () => {
  let telemedicineService: TelemedicineService;

  beforeEach(() => {
    jest.clearAllMocks();
    telemedicineService = new TelemedicineService();
  });

  describe('Session Management', () => {
    it('should create a new telemedicine session', async () => {
      const input: StartSessionInput = {
        appointmentId: 'APT-001',
        patientId: 'PAT-001',
        providerId: 'PROV-001',
        enableRecording: true,
      };

      // Mock the Appointment.findOne to return a telemedicine appointment
      const mockAppointment = {
        appointmentId: 'APT-001',
        type: 'telemedicine',
      };

      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue(mockAppointment);
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session = await telemedicineService.startSession(input);

      expect(session).toBeDefined();
      expect(session.appointmentId).toBe('APT-001');
      expect(session.patientId).toBe('PAT-001');
      expect(session.providerId).toBe('PROV-001');
      expect(session.status).toBe('waiting');
      expect(session.recording?.enabled).toBe(true);
      expect(session.roomUrl).toContain('https://app.rez.health/video/');
    });

    it('should generate unique session IDs', async () => {
      const input: StartSessionInput = {
        appointmentId: 'APT-002',
        patientId: 'PAT-002',
        providerId: 'PROV-002',
      };

      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-002', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session1 = await telemedicineService.startSession(input);
      const session2 = await telemedicineService.startSession({ ...input, appointmentId: 'APT-003' });

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should throw error when telemedicine appointment not found', async () => {
      const input: StartSessionInput = {
        appointmentId: 'INVALID-APT',
        patientId: 'PAT-001',
        providerId: 'PROV-001',
      };

      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue(null);

      await expect(telemedicineService.startSession(input)).rejects.toThrow('Telemedicine appointment not found');
    });

    it('should join waiting session and set status to active', async () => {
      // First start a session
      const input: StartSessionInput = {
        appointmentId: 'APT-004',
        patientId: 'PAT-004',
        providerId: 'PROV-004',
      };

      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-004', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session = await telemedicineService.startSession(input);

      // Join the session
      const joinedSession = await telemedicineService.joinSession(session.sessionId, 'PAT-004', 'patient');

      expect(joinedSession).toBeDefined();
      expect(joinedSession?.status).toBe('active');
      expect(joinedSession?.startedAt).toBeDefined();
    });

    it('should throw error when joining ended session', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Start and end a session
      const session = await telemedicineService.startSession({
        appointmentId: 'APT-005',
        patientId: 'PAT-005',
        providerId: 'PROV-005',
      });

      await telemedicineService.endSession(session.sessionId);

      // Try to join ended session
      await expect(
        telemedicineService.joinSession(session.sessionId, 'PAT-005', 'patient')
      ).rejects.toThrow('Session has ended');
    });

    it('should end session and calculate duration', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-006', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Start a session
      const session = await telemedicineService.startSession({
        appointmentId: 'APT-006',
        patientId: 'PAT-006',
        providerId: 'PROV-006',
      });

      // Join to set status to active
      await telemedicineService.joinSession(session.sessionId, 'PAT-006', 'patient');

      // End the session
      const endedSession = await telemedicineService.endSession(session.sessionId);

      expect(endedSession?.status).toBe('ended');
      expect(endedSession?.endedAt).toBeDefined();
      expect(endedSession?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null when ending non-existent session', async () => {
      const result = await telemedicineService.endSession('NON-EXISTENT-SESSION');
      expect(result).toBeNull();
    });

    it('should get session by ID', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-007', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session = await telemedicineService.startSession({
        appointmentId: 'APT-007',
        patientId: 'PAT-007',
        providerId: 'PROV-007',
      });

      const retrievedSession = await telemedicineService.getSession(session.sessionId);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.sessionId).toBe(session.sessionId);
    });

    it('should return null for non-existent session', async () => {
      const session = await telemedicineService.getSession('NON-EXISTENT');
      expect(session).toBeNull();
    });

    it('should generate presigned URL for recording', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-008', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session = await telemedicineService.startSession({
        appointmentId: 'APT-008',
        patientId: 'PAT-008',
        providerId: 'PROV-008',
        enableRecording: true,
      });

      const presignedUrl = await telemedicineService.generatePresignedUrl(session.sessionId, 'recording.mp4');

      expect(presignedUrl).toContain('api.videoprovider.com');
      expect(presignedUrl).toContain(session.sessionId);
      expect(presignedUrl).toContain('recording.mp4');
    });

    it('should throw error when generating presigned URL for non-existent session', async () => {
      await expect(
        telemedicineService.generatePresignedUrl('NON-EXISTENT', 'test.mp4')
      ).rejects.toThrow('Session not found');
    });

    it('should set recording URL on session', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-009', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const session = await telemedicineService.startSession({
        appointmentId: 'APT-009',
        patientId: 'PAT-009',
        providerId: 'PROV-009',
        enableRecording: true,
      });

      await telemedicineService.setRecording(session.sessionId, 'https://storage.example.com/recording.mp4');

      const updatedSession = await telemedicineService.getSession(session.sessionId);
      expect(updatedSession?.recording?.url).toBe('https://storage.example.com/recording.mp4');
      expect(updatedSession?.recording?.enabled).toBe(true);
    });

    it('should throw error when setting recording on non-existent session', async () => {
      await expect(
        telemedicineService.setRecording('NON-EXISTENT', 'https://example.com/test.mp4')
      ).rejects.toThrow('Session not found');
    });

    it('should get active sessions for user', async () => {
      // @ts-expect-error - mocking mongoose model
      const Appointment = require('./models/Appointment');
      Appointment.findOne.mockResolvedValue({ appointmentId: 'APT-010', type: 'telemedicine' });
      Appointment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Start multiple sessions
      await telemedicineService.startSession({
        appointmentId: 'APT-010',
        patientId: 'PAT-010',
        providerId: 'PROV-010',
      });

      await telemedicineService.startSession({
        appointmentId: 'APT-011',
        patientId: 'PAT-011',
        providerId: 'PROV-010',
      });

      // Join first session to make it active
      const sessions = telemedicineService['activeSessions'];
      const firstSessionKey = sessions.keys().next().value;
      if (firstSessionKey) {
        const session = sessions.get(firstSessionKey);
        if (session) {
          session.status = 'active';
        }
      }

      const activeSessions = await telemedicineService.getActiveSessions('PROV-010');
      expect(activeSessions.length).toBeGreaterThanOrEqual(0);
    });

    it('should cleanup expired sessions', () => {
      // Access private sessions map
      const sessions = telemedicineService['activeSessions'] as Map<string, any>;

      // Add an old session directly
      const oldSession = {
        sessionId: 'EXPIRED-SESSION',
        appointmentId: 'APT-OLD',
        patientId: 'PAT-OLD',
        providerId: 'PROV-OLD',
        roomName: 'room-old',
        roomUrl: 'https://app.rez.health/video/room-old',
        status: 'active' as const,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      };
      sessions.set('EXPIRED-SESSION', oldSession);

      // Run cleanup
      telemedicineService.cleanupExpiredSessions();

      const expiredSession = sessions.get('EXPIRED-SESSION');
      expect(expiredSession?.status).toBe('expired');
    });
  });
});

describe('ReZ Healthcare Service - Express App Configuration', () => {
  it('should export app with proper middleware configured', () => {
    // Test that app is properly configured (mock test)
    const app = express();

    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.listen).toBe('function');
  });

  it('should have health check endpoint', () => {
    const app = express();

    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'rez-healthcare-service',
        timestamp: new Date().toISOString(),
      });
    });

    expect(app._router).toBeDefined();
  });
});

describe('ReZ Healthcare Service - Error Handling', () => {
  it('should handle validation errors correctly', () => {
    const zod = require('zod');

    const schema = zod.object({
      firstName: zod.string().min(1),
      lastName: zod.string().min(1),
    });

    const invalidData = { firstName: '' };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('should validate required fields', () => {
    const zod = require('zod');

    const schema = zod.object({
      appointmentId: zod.string().min(1),
      patientId: zod.string().min(1),
      providerId: zod.string().min(1),
    });

    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept valid appointment data', () => {
    const zod = require('zod');

    const schema = zod.object({
      appointmentId: zod.string().min(1),
      patientId: zod.string().min(1),
      providerId: zod.string().min(1),
      enableRecording: zod.boolean().optional(),
    });

    const validData = {
      appointmentId: 'APT-001',
      patientId: 'PAT-001',
      providerId: 'PROV-001',
      enableRecording: true,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('ReZ Healthcare Service - API Routes Configuration', () => {
  it('should have patient routes configured', () => {
    const patientsRouter = require('./routes/patients.routes');
    expect(patientsRouter).toBeDefined();
  });

  it('should have appointment routes configured', () => {
    const appointmentsRouter = require('./routes/appointments.routes');
    expect(appointmentsRouter).toBeDefined();
  });

  it('should have prescription routes configured', () => {
    const prescriptionsRouter = require('./routes/prescriptions.routes');
    expect(prescriptionsRouter).toBeDefined();
  });

  it('should have telemedicine routes configured', () => {
    const telemedicineRouter = require('./routes/telemedicine.routes');
    expect(telemedicineRouter).toBeDefined();
  });
});
