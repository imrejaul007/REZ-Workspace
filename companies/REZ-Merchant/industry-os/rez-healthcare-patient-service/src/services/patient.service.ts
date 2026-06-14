import { PatientModel } from '../models/Patient';
import { MedicalRecordModel } from '../models/MedicalRecord';
import { Patient, MedicalRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PatientService {
  async createPatient(data: {
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    phone: string;
    email: string;
    address: string;
    bloodGroup?: string;
    allergies?: string[];
    emergencyContact: { name: string; phone: string; relation: string };
    insuranceProvider?: string;
    insuranceNumber?: string;
  }): Promise<Patient> {
    const patient = new PatientModel({
      patientId: `PT-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      allergies: data.allergies || [],
      status: 'active'
    });
    await patient.save();
    return patient.toJSON();
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const patient = await PatientModel.findById(id);
    return patient?.toJSON() || null;
  }

  async getPatients(search?: string): Promise<Patient[]> {
    const query: Record<string, unknown> = { status: 'active' };
    if (search) query.$text = { $search: search };
    const patients = await PatientModel.find(query).sort({ name: 1 });
    return patients.map(p => p.toJSON());
  }

  async createMedicalRecord(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const record = new MedicalRecordModel(data);
    await record.save();
    return record.toJSON();
  }

  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    const records = await MedicalRecordModel.find({ patientId }).sort({ createdAt: -1 });
    return records.map(r => r.toJSON());
  }
}

export const patientService = new PatientService();
