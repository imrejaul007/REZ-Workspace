import { Types } from 'mongoose';
import { Prescription, IPrescription, IMedicine } from '../models/Prescription';
import { logger } from '../config/logger';

export interface PrescriptionInput {
  patientId: string;
  doctorId: string;
  doctorName: string;
  storeId: string;
  merchantId: string;
  medicines: Omit<IMedicine, '_id'>[];
  diagnosis: string;
  validUntil: Date;
  notes?: string;
}

export interface MedicineInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// Lean document type for queries (plain objects)
export interface PrescriptionLean {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  doctorName: string;
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  medicines: IMedicine[];
  diagnosis: string;
  validUntil: Date;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export class PrescriptionService {
  /**
   * Create a new prescription
   */
  async createPrescription(data: PrescriptionInput): Promise<IPrescription> {
    const prescription = await Prescription.create({
      patientId: new Types.ObjectId(data.patientId),
      doctorId: new Types.ObjectId(data.doctorId),
      doctorName: data.doctorName,
      storeId: new Types.ObjectId(data.storeId),
      merchantId: new Types.ObjectId(data.merchantId),
      medicines: data.medicines,
      diagnosis: data.diagnosis,
      validUntil: data.validUntil,
      notes: data.notes,
      status: 'active',
    });

    logger.info('Prescription created', {
      prescriptionId: prescription._id,
      patientId: data.patientId,
      merchantId: data.merchantId,
      medicineCount: data.medicines.length,
    });

    return prescription;
  }

  /**
   * Get a prescription by ID
   */
  async getPrescription(id: string): Promise<PrescriptionLean | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return Prescription.findById(id).lean() as unknown as PrescriptionLean | null;
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPatientPrescriptions(patientId: string, merchantId?: string): Promise<PrescriptionLean[]> {
    const query: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
    };

    if (merchantId) {
      query.merchantId = new Types.ObjectId(merchantId);
    }

    return Prescription.find(query)
      .sort({ createdAt: -1 })
      .lean() as unknown as PrescriptionLean[];
  }

  /**
   * Get prescriptions for a patient within a store
   */
  async getStorePrescriptions(storeId: string, merchantId: string, options?: {
    status?: 'active' | 'completed' | 'cancelled';
    limit?: number;
    page?: number;
  }): Promise<{ prescriptions: PrescriptionLean[]; total: number }> {
    const query: Record<string, unknown> = {
      storeId: new Types.ObjectId(storeId),
      merchantId: new Types.ObjectId(merchantId),
    };

    if (options?.status) {
      query.status = options.status;
    }

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(query),
    ]);

    return { prescriptions: prescriptions as unknown as PrescriptionLean[], total };
  }

  /**
   * Mark a prescription as completed
   */
  async markCompleted(id: string): Promise<IPrescription | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    );

    if (prescription) {
      logger.info('Prescription marked as completed', {
        prescriptionId: id,
        patientId: prescription.patientId,
      });
    }

    return prescription;
  }

  /**
   * Cancel a prescription
   */
  async cancelPrescription(id: string): Promise<IPrescription | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (prescription) {
      logger.info('Prescription cancelled', {
        prescriptionId: id,
        patientId: prescription.patientId,
      });
    }

    return prescription;
  }

  /**
   * Add a medicine to an existing prescription
   */
  async addMedicine(prescriptionId: string, medicine: MedicineInput): Promise<IPrescription | null> {
    if (!Types.ObjectId.isValid(prescriptionId)) {
      return null;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { $push: { medicines: medicine } },
      { new: true }
    );

    if (prescription) {
      logger.info('Medicine added to prescription', {
        prescriptionId,
        medicineName: medicine.name,
      });
    }

    return prescription;
  }

  /**
   * Remove a medicine from a prescription
   */
  async removeMedicine(prescriptionId: string, medicineIndex: number): Promise<IPrescription | null> {
    if (!Types.ObjectId.isValid(prescriptionId)) {
      return null;
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return null;
    }

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      return null;
    }

    prescription.medicines.splice(medicineIndex, 1);
    await prescription.save();

    logger.info('Medicine removed from prescription', {
      prescriptionId,
      removedIndex: medicineIndex,
    });

    return prescription;
  }

  /**
   * Get active prescriptions expiring within N days
   */
  async getExpiringPrescriptions(merchantId: string, daysUntilExpiry: number = 7): Promise<PrescriptionLean[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    return Prescription.find({
      merchantId: new Types.ObjectId(merchantId),
      status: 'active',
      validUntil: { $lte: expiryDate, $gt: new Date() },
    })
      .sort({ validUntil: 1 })
      .lean() as unknown as PrescriptionLean[];
  }

  /**
   * Generate printable HTML for a prescription
   */
  async printPrescription(id: string): Promise<string> {
    const prescription = await this.getPrescription(id);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const medicinesHtml = prescription.medicines.map((med, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${med.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${med.dosage}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${med.frequency}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${med.duration}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${med.instructions || '-'}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription #${prescription._id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #2563eb; }
    .header p { margin: 5px 0; color: #666; }
    .section { margin-bottom: 25px; }
    .section h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .info-value { font-size: 14px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
    .diagnosis-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .notes-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Medical Prescription</h1>
    <p>Prescription ID: ${prescription._id}</p>
    <p>Issued: ${new Date(prescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h3>Patient & Doctor Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Patient ID</div>
        <div class="info-value">${prescription.patientId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Doctor</div>
        <div class="info-value">${prescription.doctorName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Valid Until</div>
        <div class="info-value">${new Date(prescription.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value" style="text-transform: capitalize;">${prescription.status}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Diagnosis</h3>
    <div class="diagnosis-box">
      ${prescription.diagnosis}
    </div>
  </div>

  <div class="section">
    <h3>Medicines (${prescription.medicines.length})</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medicine Name</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${medicinesHtml}
      </tbody>
    </table>
  </div>

  ${prescription.notes ? `
  <div class="section">
    <h3>Additional Notes</h3>
    <div class="notes-box">
      ${prescription.notes}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This prescription was generated electronically. Please consult your doctor for unknown clarifications.</p>
    <p>Store ID: ${prescription.storeId} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `.trim();
  }
}

// Singleton instance
export const prescriptionService = new PrescriptionService();
