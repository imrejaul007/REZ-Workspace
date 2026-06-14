/**
 * Admission Service for RisaCare Hospital Management
 * Handles patient admissions, discharges, and transfers
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Admission,
  AdmitPatientInput,
  DischargePatientInput,
  TransferPatientInput,
  AdmissionStatus,
  Prescription,
  VitalSigns,
} from '../models/hospital.js';
import { patientService } from './patientService.js';
import { bedService } from './bedService.js';

class AdmissionService {
  private admissions: Map<string, Admission> = new Map();
  private activeAdmissions: Map<string, string> = new Map(); // patientId -> admissionId

  /**
   * Admit a patient to the hospital
   */
  async admitPatient(input: AdmitPatientInput): Promise<Admission> {
    const now = new Date();

    const admission: Admission = {
      admissionId: uuidv4(),
      patientId: input.patientId,
      departmentId: input.departmentId,
      roomId: input.roomId,
      bedId: input.bedId,
      admissionDate: now,
      diagnosis: input.diagnosis,
      treatmentPlan: input.treatmentPlan,
      attendingDoctorId: input.attendingDoctorId,
      status: AdmissionStatus.ACTIVE,
      notes: input.notes,
      prescriptions: [],
      procedures: [],
      createdAt: now,
      updatedAt: now,
    };

    // If bed is provided, allocate it
    if (input.bedId) {
      await bedService.allocateBedToPatient(input.bedId, input.patientId, admission.admissionId);
    }

    // Add admission to patient's history
    await patientService.addAdmissionToHistory(input.patientId, admission.admissionId);

    this.admissions.set(admission.admissionId, admission);
    this.activeAdmissions.set(input.patientId, admission.admissionId);

    return admission;
  }

  /**
   * Get admission by ID
   */
  async getAdmission(admissionId: string): Promise<Admission | null> {
    return this.admissions.get(admissionId) || null;
  }

  /**
   * Get admission by patient ID (active admission)
   */
  async getActiveAdmissionByPatient(patientId: string): Promise<Admission | null> {
    const admissionId = this.activeAdmissions.get(patientId);
    if (!admissionId) {
      return null;
    }
    return this.admissions.get(admissionId) || null;
  }

  /**
   * Get all admissions with filters
   */
  async getAdmissions(params: {
    patientId?: string;
    departmentId?: string;
    status?: AdmissionStatus;
    startDate?: Date;
    endDate?: Date;
    attendingDoctorId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    admissions: Admission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      patientId,
      departmentId,
      status,
      startDate,
      endDate,
      attendingDoctorId,
      page = 1,
      limit = 20,
    } = params;

    let filteredAdmissions = Array.from(this.admissions.values());

    // Apply filters
    if (patientId) {
      filteredAdmissions = filteredAdmissions.filter(a => a.patientId === patientId);
    }
    if (departmentId) {
      filteredAdmissions = filteredAdmissions.filter(a => a.departmentId === departmentId);
    }
    if (status) {
      filteredAdmissions = filteredAdmissions.filter(a => a.status === status);
    }
    if (startDate) {
      filteredAdmissions = filteredAdmissions.filter(
        a => a.admissionDate >= startDate
      );
    }
    if (endDate) {
      filteredAdmissions = filteredAdmissions.filter(a => a.admissionDate <= endDate);
    }
    if (attendingDoctorId) {
      filteredAdmissions = filteredAdmissions.filter(
        a => a.attendingDoctorId === attendingDoctorId
      );
    }

    // Sort by admission date (newest first)
    filteredAdmissions.sort(
      (a, b) => b.admissionDate.getTime() - a.admissionDate.getTime()
    );

    const total = filteredAdmissions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return {
      admissions: filteredAdmissions.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get all active admissions
   */
  async getActiveAdmissions(params?: {
    departmentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    admissions: Admission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getAdmissions({
      ...params,
      status: AdmissionStatus.ACTIVE,
    });
  }

  /**
   * Discharge a patient
   */
  async dischargePatient(input: DischargePatientInput): Promise<Admission | null> {
    const admission = this.admissions.get(input.admissionId);

    if (!admission) {
      return null;
    }

    const now = new Date();

    // Release the bed if allocated
    if (admission.bedId) {
      await bedService.releaseBed(admission.bedId);
    }

    const updatedAdmission: Admission = {
      ...admission,
      status: AdmissionStatus.DISCHARGED,
      dischargeDate: now,
      notes: input.dischargeNotes
        ? `${admission.notes || ''}\nDischarge Notes: ${input.dischargeNotes}`
        : admission.notes,
      ...(input.prescriptions && { prescriptions: input.prescriptions }),
      updatedAt: now,
    };

    this.admissions.set(input.admissionId, updatedAdmission);
    this.activeAdmissions.delete(admission.patientId);

    return updatedAdmission;
  }

  /**
   * Transfer patient to another department/bed
   */
  async transferPatient(input: TransferPatientInput): Promise<Admission | null> {
    const admission = this.admissions.get(input.admissionId);

    if (!admission) {
      return null;
    }

    // Release current bed if allocated
    if (admission.bedId) {
      await bedService.releaseBed(admission.bedId);
    }

    // Allocate new bed if provided
    if (input.targetBedId) {
      await bedService.allocateBedToPatient(
        input.targetBedId,
        admission.patientId,
        admission.admissionId
      );
    }

    const now = new Date();

    const updatedAdmission: Admission = {
      ...admission,
      departmentId: input.targetDepartmentId,
      bedId: input.targetBedId || admission.bedId,
      notes: `${admission.notes || ''}\nTransfer: ${input.transferReason}${
        input.notes ? ` - ${input.notes}` : ''
      }`,
      updatedAt: now,
    };

    this.admissions.set(input.admissionId, updatedAdmission);

    return updatedAdmission;
  }

  /**
   * Update vital signs for an admission
   */
  async updateVitals(
    admissionId: string,
    vitals: VitalSigns
  ): Promise<Admission | null> {
    const admission = this.admissions.get(admissionId);

    if (!admission) {
      return null;
    }

    const updatedAdmission: Admission = {
      ...admission,
      vitals,
      updatedAt: new Date(),
    };

    this.admissions.set(admissionId, updatedAdmission);

    return updatedAdmission;
  }

  /**
   * Add prescription to admission
   */
  async addPrescription(
    admissionId: string,
    prescription: Omit<Prescription, 'prescriptionId' | 'prescribedAt' | 'status'>
  ): Promise<Admission | null> {
    const admission = this.admissions.get(admissionId);

    if (!admission) {
      return null;
    }

    const newPrescription: Prescription = {
      ...prescription,
      prescriptionId: uuidv4(),
      prescribedAt: new Date(),
      status: 'active',
    };

    const updatedAdmission: Admission = {
      ...admission,
      prescriptions: [...(admission.prescriptions || []), newPrescription],
      updatedAt: new Date(),
    };

    this.admissions.set(admissionId, updatedAdmission);

    return updatedAdmission;
  }

  /**
   * Get admission statistics
   */
  async getAdmissionStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalAdmissions: number;
    activeAdmissions: number;
    dischargedPatients: number;
    averageStayDays: number;
    admissionsByDepartment: Record<string, number>;
  }> {
    const { startDate, endDate } = params || {};

    let admissions = Array.from(this.admissions.values());

    if (startDate) {
      admissions = admissions.filter(a => a.admissionDate >= startDate);
    }
    if (endDate) {
      admissions = admissions.filter(a => a.admissionDate <= endDate);
    }

    const activeAdmissions = admissions.filter(
      a => a.status === AdmissionStatus.ACTIVE
    );
    const dischargedAdmissions = admissions.filter(
      a => a.status === AdmissionStatus.DISCHARGED
    );

    // Calculate average stay
    let totalStayDays = 0;
    let dischargedCount = 0;

    for (const admission of dischargedAdmissions) {
      if (admission.dischargeDate) {
        const stayMs = admission.dischargeDate.getTime() - admission.admissionDate.getTime();
        totalStayDays += stayMs / (1000 * 60 * 60 * 24);
        dischargedCount++;
      }
    }

    // Admissions by department
    const admissionsByDepartment: Record<string, number> = {};
    for (const admission of admissions) {
      admissionsByDepartment[admission.departmentId] =
        (admissionsByDepartment[admission.departmentId] || 0) + 1;
    }

    return {
      totalAdmissions: admissions.length,
      activeAdmissions: activeAdmissions.length,
      dischargedPatients: dischargedAdmissions.length,
      averageStayDays: dischargedCount > 0 ? Math.round((totalStayDays / dischargedCount) * 10) / 10 : 0,
      admissionsByDepartment,
    };
  }

  /**
   * Cancel an admission (if not yet active or during pre-admission)
   */
  async cancelAdmission(admissionId: string, reason: string): Promise<Admission | null> {
    const admission = this.admissions.get(admissionId);

    if (!admission) {
      return null;
    }

    if (admission.status !== AdmissionStatus.ACTIVE) {
      return null; // Can only cancel active admissions
    }

    // Release bed if allocated
    if (admission.bedId) {
      await bedService.releaseBed(admission.bedId);
    }

    const now = new Date();

    const updatedAdmission: Admission = {
      ...admission,
      status: AdmissionStatus.DISCHARGED,
      notes: `${admission.notes || ''}\nCancelled: ${reason}`,
      updatedAt: now,
    };

    this.admissions.set(admissionId, updatedAdmission);
    this.activeAdmissions.delete(admission.patientId);

    return updatedAdmission;
  }
}

export const admissionService = new AdmissionService();
