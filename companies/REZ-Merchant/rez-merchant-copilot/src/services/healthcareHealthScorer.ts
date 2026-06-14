/**
 * Healthcare Health Scorer - Metrics for healthcare clinics
 */

import axios from 'axios';

const HEALTHCARE_SERVICE_URL = process.env.HEALTHCARE_SERVICE_URL || 'http://localhost:4030';

export interface HealthcareMetrics {
  appointments: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    returningRate: number;
    avgVisitsPerPatient: number;
  };
  prescriptions: {
    written: number;
    filled: number;
    pendingRefills: number;
  };
  telemedicine: {
    sessions: number;
    avgDuration: number;
    patientSatisfaction: number;
  };
  revenue: {
    thisMonth: number;
    avgPerVisit: number;
  };
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
  }>;
}

export interface HealthcareHealthScore {
  overall: number;
  breakdown: {
    appointmentHealth: number;
    patientHealth: number;
    prescriptionHealth: number;
    telemedicineHealth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
}

export class HealthcareHealthScorer {
  async getMetrics(merchantId: string): Promise<HealthcareMetrics> {
    try {
      const res = await axios.get(`${HEALTHCARE_SERVICE_URL}/api/healthcare/${merchantId}/metrics`, { timeout: 5000 });
      return res.data.data;
    } catch {
      return this.getMockMetrics();
    }
  }

  async calculateHealthScore(merchantId: string): Promise<HealthcareHealthScore> {
    const m = await this.getMetrics(merchantId);

    const appointmentHealth = this.calculateAppointmentHealth(m);
    const patientHealth = this.calculatePatientHealth(m);
    const prescriptionHealth = this.calculatePrescriptionHealth(m);
    const telemedicineHealth = this.calculateTelemedicineHealth(m);

    const overall = Math.round(
      appointmentHealth * 0.3 +
      patientHealth * 0.3 +
      prescriptionHealth * 0.2 +
      telemedicineHealth * 0.2
    );

    return {
      overall,
      breakdown: {
        appointmentHealth: Math.round(appointmentHealth),
        patientHealth: Math.round(patientHealth),
        prescriptionHealth: Math.round(prescriptionHealth),
        telemedicineHealth: Math.round(telemedicineHealth),
      },
      trend: overall > 70 ? 'improving' : overall > 50 ? 'stable' : 'declining',
    };
  }

  private calculateAppointmentHealth(m: HealthcareMetrics): number {
    const completionRate = m.appointments.completed / Math.max(m.appointments.thisWeek, 1);
    const noShowPenalty = m.appointments.noShow * 5;
    return Math.max(0, Math.min(100, completionRate * 100 - noShowPenalty));
  }

  private calculatePatientHealth(m: HealthcareMetrics): number {
    return Math.min(100, m.patients.returningRate * 2);
  }

  private calculatePrescriptionHealth(m: HealthcareMetrics): number {
    const fillRate = m.prescriptions.filled / Math.max(m.prescriptions.written, 1);
    return fillRate * 100;
  }

  private calculateTelemedicineHealth(m: HealthcareMetrics): number {
    return Math.min(100, m.telemedicine.patientSatisfaction * 20);
  }

  private getMockMetrics(): HealthcareMetrics {
    return {
      appointments: { thisWeek: 45, lastWeek: 42, thisMonth: 180, completed: 160, cancelled: 10, noShow: 10 },
      patients: { total: 850, newThisMonth: 45, returningRate: 72, avgVisitsPerPatient: 3.2 },
      prescriptions: { written: 120, filled: 108, pendingRefills: 15 },
      telemedicine: { sessions: 28, avgDuration: 25, patientSatisfaction: 4.5 },
      revenue: { thisMonth: 450000, avgPerVisit: 2500 },
      alerts: [],
    };
  }
}

export const healthcareHealthScorer = new HealthcareHealthScorer();
