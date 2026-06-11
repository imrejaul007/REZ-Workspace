import { Prescription, IPrescription } from '../models/Prescription';
import { Drug } from '../models/Drug';
import { interactionService } from './interactionService';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const VerifyPrescriptionSchema = z.object({
  prescriptionId: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  medications: z.array(z.object({
    drugId: z.string(),
    drugName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
    quantity: z.number().optional()
  })),
  diagnosis: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type VerifyPrescriptionRequest = z.infer<typeof VerifyPrescriptionSchema>;

export interface VerificationResult {
  prescriptionId: string;
  status: 'verified' | 'rejected' | 'needs_review';
  warnings: string[];
  interactionFlags: {
    drug1: string;
    drug2: string;
    severity: 'mild' | 'moderate' | 'severe';
    message: string;
  }[];
  recommendations: string[];
  pharmacistNotes: string;
  verifiedAt: Date;
}

export class VerificationService {
  async createPrescription(request: VerifyPrescriptionRequest): Promise<IPrescription> {
    const prescriptionId = request.prescriptionId || `RX-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const prescription = new Prescription({
      prescriptionId,
      patientId: request.patientId,
      doctorId: request.doctorId,
      doctorName: request.doctorName,
      medications: request.medications.map(med => ({
        drugId: med.drugId,
        drugName: med.drugName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        quantity: med.quantity || 1
      })),
      diagnosis: request.diagnosis || [],
      notes: request.notes || '',
      status: 'pending'
    });

    await prescription.save();
    return prescription;
  }

  async verifyPrescription(prescriptionId: string, pharmacistId?: string): Promise<VerificationResult> {
    const prescription = await Prescription.findOne({ prescriptionId }).exec();
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const warnings: string[] = [];
    const interactionFlags: VerificationResult['interactionFlags'] = [];
    const recommendations: string[] = [];

    const drugIds = prescription.medications.map(m => m.drugId);
    const interactionResults = await interactionService.checkInteractions(drugIds);

    if (interactionResults.severeInteractions > 0) {
      warnings.push(`CRITICAL: ${interactionResults.severeInteractions} severe drug interaction(s) detected`);
      recommendations.push('Pharmacist consultation required before dispensing');
    }

    if (interactionResults.moderateInteractions > 0) {
      warnings.push(`WARNING: ${interactionResults.moderateInteractions} moderate drug interaction(s) detected`);
      recommendations.push('Consider alternative medications or closer monitoring');
    }

    interactionResults.interactions.forEach(interaction => {
      interactionFlags.push({
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        severity: interaction.severity as 'mild' | 'moderate' | 'severe',
        message: interaction.description
      });
    });

    for (const medication of prescription.medications) {
      const drug = await Drug.findOne({
        $or: [
          { _id: medication.drugId },
          { genericName: medication.drugId },
          { name: medication.drugId }
        ]
      }).lean().exec();

      if (drug) {
        if (drug.schedule === 'Controlled' || drug.schedule === 'Schedule X') {
          warnings.push(`SCHEDULE ${drug.schedule}: ${drug.genericName} requires special handling`);
          recommendations.push(`${drug.genericName} is a Schedule ${drug.schedule} drug - verify license`);
        }

        if (drug.contraindications && drug.contraindications.length > 0) {
          warnings.push(`CONTRAINDICATION CHECK: Review ${drug.genericName} contraindications`);
        }
      }
    }

    let status: 'verified' | 'rejected' | 'needs_review' = 'verified';
    if (interactionResults.severeInteractions > 0) {
      status = 'needs_review';
    }

    prescription.status = status === 'verified' ? 'verified' : 'pending';
    prescription.verification = {
      verifiedAt: new Date(),
      verifiedBy: pharmacistId,
      pharmacistName: pharmacistId || 'System',
      warnings,
      interactionFlags
    };

    await prescription.save();

    return {
      prescriptionId: prescription.prescriptionId,
      status,
      warnings,
      interactionFlags,
      recommendations,
      pharmacistNotes: status === 'verified'
        ? 'Prescription verified and ready for dispensing'
        : 'Prescription requires pharmacist review due to drug interactions',
      verifiedAt: new Date()
    };
  }

  async getPrescription(prescriptionId: string): Promise<IPrescription | null> {
    return Prescription.findOne({ prescriptionId }).lean().exec();
  }

  async getPatientPrescriptions(patientId: string): Promise<IPrescription[]> {
    return Prescription.find({ patientId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async dispensePrescription(prescriptionId: string): Promise<IPrescription> {
    const prescription = await Prescription.findOne({ prescriptionId }).exec();
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status !== 'verified') {
      throw new Error('Prescription must be verified before dispensing');
    }

    prescription.status = 'dispensed';
    await prescription.save();

    return prescription;
  }

  async cancelPrescription(prescriptionId: string, reason: string): Promise<IPrescription> {
    const prescription = await Prescription.findOne({ prescriptionId }).exec();
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    prescription.status = 'cancelled';
    prescription.notes = `${prescription.notes}\n\nCancelled: ${reason}`;
    await prescription.save();

    return prescription;
  }
}

export const verificationService = new VerificationService();
