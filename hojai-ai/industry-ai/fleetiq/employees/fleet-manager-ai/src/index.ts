/**
 * Fleet Manager AI - Vehicle Operations & Maintenance
 * Part of FLEETIQ - Fleet Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: 'truck' | 'van' | 'car' | 'bike';
  capacity: number;
  status: 'available' | 'on-trip' | 'maintenance' | 'idle';
  fuelLevel: number;
  odometer: number;
  lastServiceDate: string;
  nextServiceDue: string;
  insuranceExpiry: string;
  pollutionCertExpiry: string;
}

export interface MaintenanceNeed {
  vehicleId: string;
  type: 'oil-change' | 'tire-rotation' | 'brake-check' | 'general-service' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedCost: number;
  dueDate: string;
}

export interface FleetDashboard {
  totalVehicles: number;
  available: number;
  onTrip: number;
  maintenance: number;
  idle: number;
  fuelAlerts: number;
  maintenanceDue: number;
  overallUtilization: number;
}

export class FleetManagerAI {
  async getDashboard(vehicles: Vehicle[]): Promise<FleetDashboard> {
    return {
      totalVehicles: vehicles.length,
      available: vehicles.filter(v => v.status === 'available').length,
      onTrip: vehicles.filter(v => v.status === 'on-trip').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      fuelAlerts: vehicles.filter(v => v.fuelLevel < 30).length,
      maintenanceDue: vehicles.filter(v => new Date(v.nextServiceDue) <= new Date()).length,
      overallUtilization: this.calculateUtilization(vehicles)
    };
  }

  async checkMaintenanceNeeds(vehicle: Vehicle): Promise<MaintenanceNeed[]> {
    const needs: MaintenanceNeed[] = [];
    const today = new Date();
    const serviceDue = new Date(vehicle.nextServiceDue);
    const daysUntilService = Math.floor((serviceDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (vehicle.fuelLevel < 20) {
      needs.push({
        vehicleId: vehicle.id,
        type: 'emergency',
        priority: 'urgent',
        description: 'Critical fuel level - refuel immediately',
        estimatedCost: 0,
        dueDate: today.toISOString()
      });
    }

    if (daysUntilService <= 0) {
      needs.push({
        vehicleId: vehicle.id,
        type: 'general-service',
        priority: 'high',
        description: 'Service overdue - schedule maintenance immediately',
        estimatedCost: 5000,
        dueDate: today.toISOString()
      });
    } else if (daysUntilService <= 7) {
      needs.push({
        vehicleId: vehicle.id,
        type: 'general-service',
        priority: 'medium',
        description: 'Service due within a week',
        estimatedCost: 5000,
        dueDate: serviceDue.toISOString()
      });
    }

    if (vehicle.fuelLevel < 40) {
      needs.push({
        vehicleId: vehicle.id,
        type: 'oil-change',
        priority: 'low',
        description: 'Low fuel indicator - consider refueling',
        estimatedCost: 0,
        dueDate: today.toISOString()
      });
    }

    const insuranceExpiry = new Date(vehicle.insuranceExpiry);
    const daysUntilInsurance = Math.floor((insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilInsurance <= 30) {
      needs.push({
        vehicleId: vehicle.id,
        type: 'emergency',
        priority: daysUntilInsurance <= 7 ? 'urgent' : 'high',
        description: `Insurance expires in ${daysUntilInsurance} days`,
        estimatedCost: 0,
        dueDate: insuranceExpiry.toISOString()
      });
    }

    return needs;
  }

  async scheduleMaintenance(vehicleId: string, type: MaintenanceNeed['type'], date: string): Promise<{ ticketId: string; message: string }> {
    return {
      ticketId: uuidv4(),
      message: `Maintenance scheduled for ${date}. Type: ${type}`
    };
  }

  async getUtilizationReport(vehicles: Vehicle[]): Promise<{
    overall: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recommendations: string[];
  }> {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    vehicles.forEach(v => {
      byType[v.type] = (byType[v.type] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    });

    const recommendations: string[] = [];
    const utilization = this.calculateUtilization(vehicles);

    if (utilization < 50) {
      recommendations.push('Low fleet utilization - consider reducing fleet size or increasing marketing efforts');
    } else if (utilization > 85) {
      recommendations.push('High fleet utilization - consider adding more vehicles to meet demand');
    }

    if (byStatus['idle'] > 2) {
      recommendations.push(`${byStatus['idle']} vehicles are idle - deploy them or schedule maintenance`);
    }

    return {
      overall: utilization,
      byType,
      byStatus,
      recommendations
    };
  }

  async getFuelEfficiencyReport(vehicles: Vehicle[], trips: any[]): Promise<{
    averageEfficiency: number;
    worstPerformer: { vehicleId: string; efficiency: number }[];
    bestPerformer: { vehicleId: string; efficiency: number }[];
    tips: string[];
  }> {
    const efficiency: Record<string, number> = {};

    trips.forEach(trip => {
      if (trip.fuelUsed && trip.distance) {
        efficiency[trip.vehicleId] = (efficiency[trip.vehicleId] || 0) + trip.distance / trip.fuelUsed;
      }
    });

    const avgEff = Object.values(efficiency).reduce((sum, e) => sum + e, 0) / (Object.keys(efficiency).length || 1);

    return {
      averageEfficiency: Math.round(avgEff * 100) / 100,
      worstPerformer: [],
      bestPerformer: [],
      tips: avgEff < 8 ? ['Consider driver training for better fuel efficiency', 'Check tire pressure regularly'] : []
    };
  }

  private calculateUtilization(vehicles: Vehicle[]): number {
    const operational = vehicles.filter(v => v.status !== 'maintenance').length;
    const onTrip = vehicles.filter(v => v.status === 'on-trip').length;
    return Math.round((onTrip / (operational || 1)) * 100);
  }
}

export default FleetManagerAI;