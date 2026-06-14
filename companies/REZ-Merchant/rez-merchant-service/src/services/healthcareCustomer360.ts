/**
 * Healthcare Customer 360 Service
 *
 * Extends Customer360Service with healthcare-specific patient insights:
 * - Patient medical history
 * - Medical profile and allergies
 * - Appointment history and patterns
 * - Prescription tracking
 * - Risk score assessment
 */

import mongoose, { Types } from 'mongoose';
import { CustomerMeta } from '../models/CustomerMeta';
import { Store } from '../models/Store';
import { Order } from '../models/Order';
import { logger } from '../config/logger';
import {
  Customer360Service,
  customer360Service,
  type CustomerProfile,
  type TransactionSummary,
  type LoyaltySummary,
  type EngagementMetrics,
  type RiskMetrics,
  type Customer360,
} from './customer360Service';

// ── Healthcare-Specific Types ───────────────────────────────────────────────────

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction?: string;
  diagnosedDate?: Date;
}

export interface ChronicCondition {
  condition: string;
  diagnosedDate: Date;
  status: 'active' | 'managed' | 'resolved';
  medication?: string;
  notes?: string;
}

export interface MedicationHistory {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  reason: string;
  isActive: boolean;
}

export interface AppointmentRecord {
  appointmentId: string;
  appointmentDate: Date;
  doctorId?: string;
  doctorName?: string;
  department: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface VitalRecord {
  date: Date;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface MedicalProfile {
  patientId: string;
  bloodType?: string;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
  };
  primaryPhysician?: {
    id: string;
    name: string;
    specialty: string;
  };
  vitalHistory: VitalRecord[];
  lastCheckup?: Date;
  nextCheckup?: Date;
}

export interface PatientHistory {
  medicalProfile: MedicalProfile;
  medicationHistory: MedicationHistory[];
  appointmentHistory: AppointmentRecord[];
  diagnosticRecords: Array<{
    testId: string;
    testName: string;
    date: Date;
    result?: string;
    labName?: string;
  }>;
  allergies: Allergy[];
  emergencyVisits: number;
  totalVisits: number;
  lastVisit?: Date;
}

export interface HealthcareCustomer360 extends Customer360 {
  // Healthcare-specific data
  medicalProfile: MedicalProfile;
  patientHistory: PatientHistory;
  riskScore?: number;
  riskFactors: string[];
  recommendedActions: string[];
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class HealthcareCustomerService {
  private baseService: Customer360Service;

  constructor() {
    this.baseService = customer360Service;
  }

  /**
   * Get complete Healthcare Customer 360 view
   */
  async getHealthcareCustomer360(
    customerId: string,
    merchantId: string
  ): Promise<HealthcareCustomer360> {
    const [
      base360,
      medicalProfile,
      medicationHistory,
      appointmentHistory,
      diagnosticRecords,
    ] = await Promise.all([
      this.baseService.getCustomer360(customerId, merchantId),
      this.getMedicalProfile(customerId, merchantId),
      this.getMedicationHistory(customerId, merchantId),
      this.getAppointmentHistory(customerId, merchantId),
      this.getDiagnosticRecords(customerId, merchantId),
    ]);

    const riskFactors = this.calculateRiskFactors(medicalProfile, appointmentHistory);
    const riskScore = this.calculateRiskScore(riskFactors);
    const recommendedActions = this.generateRecommendedActions(riskScore, medicalProfile);

    return {
      ...base360,
      medicalProfile,
      patientHistory: {
        medicalProfile,
        medicationHistory,
        appointmentHistory,
        diagnosticRecords,
        allergies: medicalProfile.allergies,
        emergencyVisits: appointmentHistory.filter(a => a.type === 'emergency').length,
        totalVisits: appointmentHistory.length,
        lastVisit: appointmentHistory[0]?.appointmentDate,
      },
      riskScore,
      riskFactors,
      recommendedActions,
    };
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(customerId: string, merchantId: string): Promise<PatientHistory> {
    const [medicalProfile, medicationHistory, appointmentHistory, diagnosticRecords] =
      await Promise.all([
        this.getMedicalProfile(customerId, merchantId),
        this.getMedicationHistory(customerId, merchantId),
        this.getAppointmentHistory(customerId, merchantId),
        this.getDiagnosticRecords(customerId, merchantId),
      ]);

    return {
      medicalProfile,
      medicationHistory,
      appointmentHistory,
      diagnosticRecords,
      allergies: medicalProfile.allergies,
      emergencyVisits: appointmentHistory.filter(a => a.type === 'emergency').length,
      totalVisits: appointmentHistory.length,
      lastVisit: appointmentHistory[0]?.appointmentDate,
    };
  }

  /**
   * Get medical profile for a patient
   */
  async getMedicalProfile(customerId: string, merchantId: string): Promise<MedicalProfile> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    if (!meta) {
      return this.getEmptyMedicalProfile(customerId);
    }

    const healthProfile = (meta as unknown).healthProfile || {};
    const healthcareProfile = (meta as unknown).healthcareProfile || {};

    return {
      patientId: customerId,
      bloodType: healthProfile.bloodType,
      allergies: this.parseAllergies(healthProfile.allergies),
      chronicConditions: this.parseChronicConditions(healthcareProfile.chronicConditions),
      emergencyContact: healthcareProfile.emergencyContact,
      insuranceInfo: healthcareProfile.insuranceInfo,
      primaryPhysician: healthcareProfile.primaryPhysician,
      vitalHistory: this.parseVitalHistory(healthcareProfile.vitalHistory),
      lastCheckup: healthcareProfile.lastCheckup
        ? new Date(healthcareProfile.lastCheckup)
        : undefined,
      nextCheckup: healthcareProfile.nextCheckup
        ? new Date(healthcareProfile.nextCheckup)
        : undefined,
    };
  }

  /**
   * Get appointment history for a patient
   */
  async getAppointmentHistory(customerId: string, merchantId: string): Promise<AppointmentRecord[]> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    // Get appointment orders (healthcare services)
    const appointments = await Order.aggregate([
      {
        $match: {
          userId: customerId,
          store: { $in: storeIds },
          orderType: { $in: ['appointment', 'healthcare', 'medical'] },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $limit: 50 },
    ]);

    return appointments.map((order) => ({
      appointmentId: order._id.toString(),
      appointmentDate: order.createdAt,
      doctorId: order.doctorId,
      doctorName: order.doctorName,
      department: order.department || 'General',
      type: this.categorizeAppointmentType(order),
      status: this.mapOrderStatusToAppointment(order.status),
      notes: order.notes,
      followUpRequired: order.followUpRequired || false,
      followUpDate: order.followUpDate ? new Date(order.followUpDate) : undefined,
    }));
  }

  /**
   * Get medication history for a patient
   */
  async getMedicationHistory(
    customerId: string,
    merchantId: string
  ): Promise<MedicationHistory[]> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    const medications = (meta as unknown)?.medications || [];

    return medications.map((med) => ({
      medicineId: med.medicineId || med.id || 'unknown',
      medicineName: med.medicineName || med.name || 'Unknown Medicine',
      dosage: med.dosage || 'As prescribed',
      frequency: med.frequency || 'Daily',
      startDate: med.startDate ? new Date(med.startDate) : new Date(),
      endDate: med.endDate ? new Date(med.endDate) : undefined,
      prescribedBy: med.prescribedBy,
      reason: med.reason || 'Not specified',
      isActive: !med.endDate || new Date(med.endDate) > new Date(),
    }));
  }

  /**
   * Get diagnostic records for a patient
   */
  async getDiagnosticRecords(
    customerId: string,
    merchantId: string
  ): Promise<Array<{
    testId: string;
    testName: string;
    date: Date;
    result?: string;
    labName?: string;
  }>> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    const diagnostics = (meta as unknown)?.diagnosticRecords || [];

    return diagnostics.map((record) => ({
      testId: record.testId || record.id || 'unknown',
      testName: record.testName || record.name || 'Unknown Test',
      date: record.date ? new Date(record.date) : new Date(),
      result: record.result,
      labName: record.labName,
    }));
  }

  /**
   * Calculate risk factors based on medical profile and history
   */
  private calculateRiskFactors(
    medicalProfile: MedicalProfile,
    appointmentHistory: AppointmentRecord[]
  ): string[] {
    const factors: string[] = [];

    // Check allergies
    const severeAllergies = medicalProfile.allergies.filter(
      a => a.severity === 'severe' || a.severity === 'life_threatening'
    );
    if (severeAllergies.length > 0) {
      factors.push(`Severe allergies: ${severeAllergies.map(a => a.allergen).join(', ')}`);
    }

    // Check chronic conditions
    const activeConditions = medicalProfile.chronicConditions.filter(
      c => c.status === 'active'
    );
    if (activeConditions.length > 0) {
      factors.push(`Active conditions: ${activeConditions.map(c => c.condition).join(', ')}`);
    }

    // Check for missed appointments
    const noShows = appointmentHistory.filter(a => a.status === 'no_show').length;
    if (noShows >= 3) {
      factors.push('High no-show rate');
    }

    // Check for overdue checkup
    if (medicalProfile.nextCheckup) {
      const daysUntilCheckup = Math.floor(
        (medicalProfile.nextCheckup.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilCheckup < 0) {
        factors.push('Overdue for checkup');
      }
    }

    // Check emergency visits
    const emergencyVisits = appointmentHistory.filter(a => a.type === 'emergency').length;
    if (emergencyVisits >= 3) {
      factors.push('Frequent emergency visits');
    }

    return factors;
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateRiskScore(riskFactors: string[]): number {
    let score = 25; // Base score

    for (const factor of riskFactors) {
      if (factor.includes('life_threatening') || factor.includes('Frequent emergency')) {
        score += 25;
      } else if (factor.includes('severe') || factor.includes('Overdue')) {
        score += 15;
      } else if (factor.includes('Active conditions') || factor.includes('no-show')) {
        score += 10;
      } else {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Generate recommended actions based on risk
   */
  private generateRecommendedActions(
    riskScore: number,
    medicalProfile: MedicalProfile
  ): string[] {
    const actions: string[] = [];

    if (riskScore >= 75) {
      actions.push('Schedule immediate consultation');
      actions.push('Review all current medications');
    } else if (riskScore >= 50) {
      actions.push('Schedule follow-up appointment');
      actions.push('Update emergency contact information');
    }

    if (medicalProfile.allergies.length === 0) {
      actions.push('Complete allergy assessment');
    }

    if (!medicalProfile.bloodType) {
      actions.push('Record blood type');
    }

    if (medicalProfile.lastCheckup) {
      const daysSinceCheckup = Math.floor(
        (Date.now() - medicalProfile.lastCheckup.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCheckup > 365) {
        actions.push('Annual checkup recommended');
      }
    }

    return actions;
  }

  /**
   * Parse allergies from stored format
   */
  private parseAllergies(allergies): Allergy[] {
    if (!allergies) return [];
    if (typeof allergies === 'string') {
      return allergies.split(',').map((a: string) => ({
        allergen: a.trim(),
        severity: 'unknown' as const,
      }));
    }
    if (Array.isArray(allergies)) {
      return allergies.map((a) => ({
        allergen: a.allergen || a,
        severity: a.severity || 'unknown',
        reaction: a.reaction,
        diagnosedDate: a.diagnosedDate ? new Date(a.diagnosedDate) : undefined,
      }));
    }
    return [];
  }

  /**
   * Parse chronic conditions from stored format
   */
  private parseChronicConditions(conditions): ChronicCondition[] {
    if (!conditions) return [];
    if (Array.isArray(conditions)) {
      return conditions.map((c) => ({
        condition: c.condition || c,
        diagnosedDate: c.diagnosedDate ? new Date(c.diagnosedDate) : new Date(),
        status: c.status || 'active',
        medication: c.medication,
        notes: c.notes,
      }));
    }
    return [];
  }

  /**
   * Parse vital history from stored format
   */
  private parseVitalHistory(vitals): VitalRecord[] {
    if (!vitals) return [];
    if (Array.isArray(vitals)) {
      return vitals.map((v) => ({
        date: v.date ? new Date(v.date) : new Date(),
        bloodPressure: v.bloodPressure,
        heartRate: v.heartRate,
        temperature: v.temperature,
        weight: v.weight,
        height: v.height,
        notes: v.notes,
      }));
    }
    return [];
  }

  /**
   * Get empty medical profile
   */
  private getEmptyMedicalProfile(patientId: string): MedicalProfile {
    return {
      patientId,
      bloodType: undefined,
      allergies: [],
      chronicConditions: [],
      emergencyContact: undefined,
      insuranceInfo: undefined,
      primaryPhysician: undefined,
      vitalHistory: [],
      lastCheckup: undefined,
      nextCheckup: undefined,
    };
  }

  /**
   * Categorize appointment type from order
   */
  private categorizeAppointmentType(order): string {
    const type = (order.appointmentType || order.type || '').toLowerCase();
    const category = (order.category || '').toLowerCase();

    if (type.includes('emergency') || category.includes('emergency')) return 'emergency';
    if (type.includes('follow') || order.followUpRequired) return 'follow_up';
    if (type.includes('checkup') || type.includes('check-up')) return 'checkup';
    if (type.includes('specialist')) return 'specialist';
    return 'general';
  }

  /**
   * Map order status to appointment status
   */
  private mapOrderStatusToAppointment(status: string): AppointmentRecord['status'] {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'no_show':
      case 'no-show':
        return 'no_show';
      default:
        return 'scheduled';
    }
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const healthcareCustomerService = new HealthcareCustomerService();
export default healthcareCustomerService;
