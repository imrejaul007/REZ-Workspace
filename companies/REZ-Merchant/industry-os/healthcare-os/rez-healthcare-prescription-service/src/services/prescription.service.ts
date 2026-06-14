import { PrescriptionModel } from '../models/Prescription';
import { MedicineModel } from '../models/Medicine';
import { Prescription, Medicine } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PrescriptionService {
  async createPrescription(data: {
    patientId: string;
    doctorId: string;
    diagnosis: string;
    medicines: { medicineId: string; name: string; dosage: string; frequency: string; duration: string; notes?: string }[];
    instructions?: string;
    validUntil: string;
  }): Promise<Prescription> {
    const prescription = new PrescriptionModel({
      prescriptionId: `RX-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      validUntil: new Date(data.validUntil),
      status: 'active'
    });
    await prescription.save();
    return prescription.toJSON();
  }

  async getPrescriptions(patientId?: string): Promise<Prescription[]> {
    const query: Record<string, unknown> = { status: 'active' };
    if (patientId) query.patientId = patientId;
    const prescriptions = await PrescriptionModel.find(query).sort({ createdAt: -1 });
    return prescriptions.map(p => p.toJSON());
  }

  async getMedicines(search?: string): Promise<Medicine[]> {
    const query: Record<string, unknown> = {};
    if (search) query.$text = { $search: search };
    const medicines = await MedicineModel.find(query).sort({ name: 1 });
    return medicines.map(m => m.toJSON());
  }
}

export const prescriptionService = new PrescriptionService();
