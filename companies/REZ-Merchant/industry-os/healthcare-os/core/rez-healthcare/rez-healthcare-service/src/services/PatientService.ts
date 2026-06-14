import { v4 as uuidv4 } from 'uuid';
import { Patient, IPatient } from '../models/Patient';
import { logger } from '../config/logger';
import { IntentGraphClient } from './IntentGraphClient';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: IPatient['gender'];
  email: string;
  phone: string;
  address?: IPatient['address'];
  emergencyContact?: IPatient['emergencyContact'];
  insurance?: IPatient['insurance'];
  bloodType?: IPatient['bloodType'];
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  preferredLanguage?: string;
  userId?: string;
}

export interface UpdatePatientInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: IPatient['address'];
  emergencyContact?: IPatient['emergencyContact'];
  insurance?: IPatient['insurance'];
  bloodType?: IPatient['bloodType'];
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  primaryPhysician?: string;
  preferredLanguage?: string;
}

export class PatientService {
  private intentGraphClient: IntentGraphClient;

  constructor() {
    this.intentGraphClient = new IntentGraphClient();
  }

  async createPatient(input: CreatePatientInput): Promise<IPatient> {
    try {
      const patientId = `PAT-${uuidv4().substring(0, 8).toUpperCase()}`;

      const patient = new Patient({
        patientId,
        ...input,
        allergies: input.allergies || [],
        chronicConditions: input.chronicConditions || [],
        medications: input.medications || [],
        medicalHistory: [],
        consentGiven: false,
        isActive: true,
      });

      await patient.save();
      logger.info('Patient created', { patientId, email: input.email });

      // Track intent in ReZ Mind
      await this.intentGraphClient.trackIntent({
        userId: input.userId,
        intent: 'patient_registration',
        entities: {
          patientId,
          registrationType: 'healthcare',
        },
        metadata: {
          service: 'rez-healthcare-service',
        },
      });

      return patient.toObject();
    } catch (error) {
      logger.error('Failed to create patient', { error, email: input.email });
      throw error;
    }
  }

  async getPatientById(patientId: string): Promise<IPatient | null> {
    try {
      const patient = await Patient.findOne({ patientId, isActive: true });
      return patient?.toObject() || null;
    } catch (error) {
      logger.error('Failed to get patient', { error, patientId });
      throw error;
    }
  }

  async getPatientByEmail(email: string): Promise<IPatient | null> {
    try {
      const patient = await Patient.findOne({ email, isActive: true });
      return patient?.toObject() || null;
    } catch (error) {
      logger.error('Failed to get patient by email', { error, email });
      throw error;
    }
  }

  async getPatientByUserId(userId: string): Promise<IPatient | null> {
    try {
      const patient = await Patient.findOne({ userId, isActive: true });
      return patient?.toObject() || null;
    } catch (error) {
      logger.error('Failed to get patient by userId', { error, userId });
      throw error;
    }
  }

  async updatePatient(patientId: string, input: UpdatePatientInput): Promise<IPatient | null> {
    try {
      const patient = await Patient.findOneAndUpdate(
        { patientId, isActive: true },
        { $set: input },
        { new: true }
      );

      if (patient) {
        logger.info('Patient updated', { patientId });
      }

      return patient?.toObject() || null;
    } catch (error) {
      logger.error('Failed to update patient', { error, patientId });
      throw error;
    }
  }

  async giveConsent(patientId: string, consentGiven: boolean = true): Promise<IPatient | null> {
    try {
      const patient = await Patient.findOneAndUpdate(
        { patientId, isActive: true },
        {
          $set: {
            consentGiven,
            consentDate: consentGiven ? new Date() : undefined,
          },
        },
        { new: true }
      );

      if (patient) {
        logger.info('Patient consent updated', { patientId, consentGiven });
      }

      return patient?.toObject() || null;
    } catch (error) {
      logger.error('Failed to update patient consent', { error, patientId });
      throw error;
    }
  }

  async searchPatients(query: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ patients: IPatient[]; total: number; page: number; totalPages: number }> {
    try {
      const { search, page = 1, limit = 20 } = query;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { isActive: true };

      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
        ];
      }

      const [patients, total] = await Promise.all([
        Patient.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Patient.countDocuments(filter),
      ]);

      return {
        patients: patients.map((p) => p.toObject()),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to search patients', { error });
      throw error;
    }
  }

  async deactivatePatient(patientId: string): Promise<boolean> {
    try {
      const result = await Patient.updateOne(
        { patientId, isActive: true },
        { $set: { isActive: false } }
      );

      if (result.modifiedCount > 0) {
        logger.info('Patient deactivated', { patientId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to deactivate patient', { error, patientId });
      throw error;
    }
  }

  async getPatientMedicalSummary(patientId: string): Promise<{
    patient: IPatient | null;
    upcomingAppointments: number;
    activePrescriptions: number;
    recentRecords: number;
  }> {
    try {
      const patient = await this.getPatientById(patientId);
      if (!patient) {
        return { patient: null, upcomingAppointments: 0, activePrescriptions: 0, recentRecords: 0 };
      }

      const now = new Date();
      const [upcomingAppointments, activePrescriptions, recentRecords] = await Promise.all([
        // Would use Appointment.countDocuments in real implementation
        Promise.resolve(0),
        // Would use Prescription.countDocuments in real implementation
        Promise.resolve(0),
        // Would use MedicalRecord.countDocuments in real implementation
        Promise.resolve(0),
      ]);

      return {
        patient,
        upcomingAppointments,
        activePrescriptions,
        recentRecords,
      };
    } catch (error) {
      logger.error('Failed to get patient medical summary', { error, patientId });
      throw error;
    }
  }
}
