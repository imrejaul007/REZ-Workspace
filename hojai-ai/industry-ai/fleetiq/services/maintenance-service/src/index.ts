/**
 * Maintenance Service - Vehicle Maintenance Management
 * Part of FLEETIQ - Fleet Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'emergency' | 'inspection';
  description: string;
  cost: number;
  parts: { name: string; cost: number; quantity: number }[];
  labor: number;
  date: string;
  nextDue?: string;
  vendor?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  completedAt?: string;
  odometer?: number;
}

export interface MaintenanceSchedule {
  vehicleId: string;
  type: 'oil-change' | 'tire-rotation' | 'brake-check' | 'general-service';
  dueDate: string;
  dueOdometer?: number;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class MaintenanceService {
  private records: Map<string, MaintenanceRecord> = new Map();
  private schedules: Map<string, MaintenanceSchedule> = new Map();

  async scheduleMaintenance(data: Omit<MaintenanceRecord, 'id' | 'status'>): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      ...data,
      id: uuidv4(),
      status: 'scheduled'
    };

    this.records.set(record.id, record);
    return record;
  }

  async startMaintenance(recordId: string): Promise<MaintenanceRecord | undefined> {
    const record = this.records.get(recordId);
    if (!record) return undefined;

    record.status = 'in-progress';
    this.records.set(recordId, record);
    return record;
  }

  async completeMaintenance(
    recordId: string,
    completionData: { cost: number; parts: MaintenanceRecord['parts']; labor: number; nextDue?: string }
  ): Promise<MaintenanceRecord | undefined> {
    const record = this.records.get(recordId);
    if (!record) return undefined;

    record.status = 'completed';
    record.completedAt = new Date().toISOString();
    record.cost = completionData.cost;
    record.parts = completionData.parts;
    record.labor = completionData.labor;
    record.nextDue = completionData.nextDue;

    this.records.set(recordId, record);
    return record;
  }

  async getMaintenanceHistory(vehicleId: string): Promise<MaintenanceRecord[]> {
    return Array.from(this.records.values())
      .filter(r => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUpcomingMaintenance(vehicles: { id: string; nextServiceDue: string }[]): Promise<{
    overdue: { vehicleId: string; daysOverdue: number }[];
    thisWeek: { vehicleId: string; daysUntil: number }[];
    nextMonth: { vehicleId: string; daysUntil: number }[];
  }> {
    const today = new Date();
    const overdue: { vehicleId: string; daysOverdue: number }[] = [];
    const thisWeek: { vehicleId: string; daysUntil: number }[] = [];
    const nextMonth: { vehicleId: string; daysUntil: number }[] = [];

    vehicles.forEach(v => {
      const dueDate = new Date(v.nextServiceDue);
      const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        overdue.push({ vehicleId: v.id, daysOverdue: Math.abs(daysUntil) });
      } else if (daysUntil <= 7) {
        thisWeek.push({ vehicleId: v.id, daysUntil });
      } else if (daysUntil <= 30) {
        nextMonth.push({ vehicleId: v.id, daysUntil });
      }
    });

    return { overdue, thisWeek, nextMonth };
  }

  async getMaintenanceCostSummary(vehicleId: string, months: number = 12): Promise<{
    totalCost: number;
    byType: Record<string, number>;
    byMonth: Record<string, number>;
    averagePerService: number;
    totalServices: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const records = Array.from(this.records.values())
      .filter(r => r.vehicleId === vehicleId)
      .filter(r => new Date(r.date) >= cutoffDate)
      .filter(r => r.status === 'completed');

    const byType: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    let totalCost = 0;

    records.forEach(r => {
      totalCost += r.cost;
      byType[r.type] = (byType[r.type] || 0) + r.cost;

      const month = r.date.split('T')[0].substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + r.cost;
    });

    return {
      totalCost,
      byType,
      byMonth,
      averagePerService: records.length > 0 ? Math.round(totalCost / records.length) : 0,
      totalServices: records.length
    };
  }

  async createSchedule(data: Omit<MaintenanceSchedule, 'id'>): Promise<MaintenanceSchedule> {
    const schedule: MaintenanceSchedule = {
      ...data,
      id: uuidv4()
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async getSchedules(vehicleId?: string): Promise<MaintenanceSchedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (vehicleId) {
      schedules = schedules.filter(s => s.vehicleId === vehicleId);
    }

    return schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async checkFleetHealth(vehicles: { id: string; status: string; fuelLevel: number; nextServiceDue: string }[]): Promise<{
    fleetHealthScore: number;
    vehiclesNeedingAttention: { id: string; issue: string; priority: 'low' | 'medium' | 'high' | 'urgent' }[];
    recommendations: string[];
  }> {
    const issues: { id: string; issue: string; priority: 'low' | 'medium' | 'high' | 'urgent' }[] = [];

    vehicles.forEach(v => {
      if (v.fuelLevel < 20) {
        issues.push({ id: v.id, issue: 'Critical fuel level', priority: 'urgent' });
      }

      const daysUntilService = Math.floor(
        (new Date(v.nextServiceDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilService < 0) {
        issues.push({ id: v.id, issue: 'Maintenance overdue', priority: 'high' });
      } else if (daysUntilService <= 7) {
        issues.push({ id: v.id, issue: `Maintenance due in ${daysUntilService} days`, priority: 'medium' });
      }
    });

    const healthScore = Math.max(0, 100 - issues.length * 10);
    const recommendations: string[] = [];

    if (healthScore < 70) {
      recommendations.push('Fleet health needs attention. Review maintenance schedules.');
    }

    return {
      fleetHealthScore: healthScore,
      vehiclesNeedingAttention: issues,
      recommendations
    };
  }
}

export default MaintenanceService;