import { PrescriptionModel } from '../models/Prescription';
import { VerificationModel } from '../models/Verification';
import { Prescription, Verification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PrescriptionService {
  async createPrescription(data: {
    patientId: string;
    patientName: string;
    doctorName: string;
    doctorLicense: string;
    imageUrl?: string;
    medicines: { name: string; dosage: string; quantity: number }[];
    diagnosis?: string;
    validUntil: string;
  }): Promise<Prescription> {
    const prescription = new PrescriptionModel({
      prescriptionId: `RX-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      validUntil: new Date(data.validUntil),
      status: 'pending'
    });
    await prescription.save();
    return prescription.toJSON();
  }

  async getPrescriptionById(id: string): Promise<Prescription | null> {
    const prescription = await PrescriptionModel.findById(id);
    return prescription?.toJSON() || null;
  }

  async getPrescriptions(filters: { patientId?: string; status?: string }): Promise<Prescription[]> {
    const query: Record<string, unknown> = {};
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.status) query.status = filters.status;
    const prescriptions = await PrescriptionModel.find(query).sort({ createdAt: -1 });
    return prescriptions.map(p => p.toJSON());
  }

  async verifyPrescription(id: string, verifiedBy: string, isValid: boolean, notes?: string): Promise<Prescription | null> {
    const prescription = await PrescriptionModel.findByIdAndUpdate(
      id,
      { $set: { status: isValid ? 'verified' : 'rejected', verifiedBy, verifiedAt: new Date() } },
      { new: true }
    );
    if (!prescription) return null;

    const verification = new VerificationModel({ prescriptionId: prescription._id, verifiedBy, isValid, notes });
    await verification.save();

    return prescription.toJSON();
  }

  async getVerifications(prescriptionId: string): Promise<Verification[]> {
    const verifications = await VerificationModel.find({ prescriptionId });
    return verifications.map(v => v.toJSON());
  }
}

export const prescriptionService = new PrescriptionService();
