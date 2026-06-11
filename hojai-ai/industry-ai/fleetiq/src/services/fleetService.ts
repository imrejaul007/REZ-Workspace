/**
 * FLEETIQ - Fleet Manager Service
 * AI-powered fleet analytics and management
 */

import { Vehicle, Driver, Trip, Maintenance } from '../models';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface FleetMetrics {
  totalVehicles: number;
  availableVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  idleVehicles: number;
  averageFuelLevel: number;
  averageUtilization: number;
}

export interface VehicleStatus {
  id: string;
  registrationNumber: string;
  type: string;
  status: string;
  fuelLevel: number;
  utilization: number;
  currentDriver?: string;
  currentLocation?: { lat: number; lng: number };
  lastUpdated: Date;
}

export interface MaintenanceAlert {
  vehicleId: string;
  registrationNumber: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
  priority: number;
}

export interface FleetAnalysis {
  success: boolean;
  metrics: FleetMetrics;
  vehicles: VehicleStatus[];
  alerts: MaintenanceAlert[];
  recommendations: string[];
  period: string;
  generatedAt: Date;
}

// ============================================
// CALCULATE UTILIZATION
// ============================================

const calculateUtilization = (vehicleId: string): Promise<number> => {
  return new Promise(async (resolve) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trips = await Trip.countDocuments({
      vehicleId,
      createdAt: { $gte: thirtyDaysAgo },
      status: { $in: ['completed', 'in-progress'] }
    });
    // Assume 30 active days, 12 hours per day = 360 hours potential
    // Each trip takes ~4 hours on average
    const maxTrips = 90; // 30 days * 3 trips per day
    const utilization = Math.min((trips / maxTrips) * 100, 100);
    resolve(Math.round(utilization));
  });
};

// ============================================
// GET FLEET STATUS
// ============================================

export const getFleetStatus = async (): Promise<{
  success: boolean;
  summary: FleetMetrics;
  vehicles: VehicleStatus[];
}> => {
  try {
    logger.info('Fetching fleet status');

    const vehicles = await Vehicle.find()
      .populate('driverId', 'name')
      .lean();

    const vehicleStatuses: VehicleStatus[] = await Promise.all(
      vehicles.map(async (vehicle) => {
        const utilization = await calculateUtilization(vehicle._id.toString());
        return {
          id: vehicle._id.toString(),
          registrationNumber: vehicle.registrationNumber,
          type: vehicle.type,
          status: vehicle.status,
          fuelLevel: vehicle.fuelLevel,
          utilization,
          currentDriver: (vehicle.driverId as any)?.name,
          currentLocation: vehicle.location,
          lastUpdated: vehicle.updatedAt
        };
      })
    );

    const metrics: FleetMetrics = {
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.status === 'available').length,
      activeVehicles: vehicles.filter(v => v.status === 'on-trip').length,
      maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
      idleVehicles: vehicles.filter(v => v.status === 'idle').length,
      averageFuelLevel: Math.round(
        vehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / (vehicles.length || 1)
      ),
      averageUtilization: Math.round(
        vehicleStatuses.reduce((sum, v) => sum + v.utilization, 0) / (vehicleStatuses.length || 1)
      )
    };

    return {
      success: true,
      summary: metrics,
      vehicles: vehicleStatuses
    };

  } catch (error) {
    logger.error('Failed to get fleet status', { error });
    throw error;
  }
};

// ============================================
// ANALYZE FLEET
// ============================================

export const analyzeFleet = async (
  period: 'day' | 'week' | 'month' | 'quarter' = 'week',
  metrics?: Array<'utilization' | 'fuel' | 'maintenance' | 'performance'>
): Promise<FleetAnalysis> => {
  try {
    logger.info('Analyzing fleet', { period, metrics });

    const periodDays: Record<string, number> = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90
    };
    const days = periodDays[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get fleet status
    const fleetStatus = await getFleetStatus();

    // Get maintenance alerts
    const alerts: MaintenanceAlert[] = [];

    for (const vehicle of fleetStatus.vehicles) {
      // Critical fuel alerts
      if (vehicle.fuelLevel < 20) {
        alerts.push({
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          type: 'critical',
          message: `Critical fuel level: ${vehicle.fuelLevel}%`,
          action: 'Refuel immediately',
          priority: 1
        });
      } else if (vehicle.fuelLevel < 40) {
        alerts.push({
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          type: 'warning',
          message: `Low fuel level: ${vehicle.fuelLevel}%`,
          action: 'Plan refueling before next trip',
          priority: 2
        });
      }

      // Get vehicle for maintenance checks
      const vehicleDoc = await Vehicle.findById(vehicle.id);
      if (vehicleDoc?.nextServiceDue) {
        const daysUntilService = Math.ceil(
          (vehicleDoc.nextServiceDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        if (daysUntilService < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            registrationNumber: vehicle.registrationNumber,
            type: 'critical',
            message: 'Service overdue',
            action: 'Schedule maintenance immediately',
            priority: 1
          });
        } else if (daysUntilService < 7) {
          alerts.push({
            vehicleId: vehicle.id,
            registrationNumber: vehicle.registrationNumber,
            type: 'warning',
            message: `Service due in ${daysUntilService} days`,
            action: 'Schedule maintenance soon',
            priority: 2
          });
        }
      }
    }

    // Get recent maintenance records
    const recentMaintenance = await Maintenance.find({
      date: { $gte: startDate }
    }).populate('vehicleId', 'registrationNumber');

    // Calculate recommendations
    const recommendations: string[] = [];

    if (fleetStatus.summary.averageFuelLevel < 50) {
      recommendations.push('Consider establishing a proactive refueling schedule to reduce low-fuel emergencies');
    }

    if (fleetStatus.summary.averageUtilization < 40) {
      recommendations.push('Fleet utilization is below optimal levels - review scheduling efficiency');
    }

    if (alerts.filter(a => a.type === 'critical').length > 0) {
      recommendations.push('Address critical alerts immediately to prevent operational disruptions');
    }

    // Check for maintenance patterns
    const totalMaintenanceCost = recentMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
    if (totalMaintenanceCost > fleetStatus.summary.totalVehicles * 500) {
      recommendations.push('Maintenance costs are elevated - consider preventive maintenance program');
    }

    // Add performance recommendations based on drivers
    const lowPerformers = await Driver.find({ rating: { $lt: 4.0 } });
    if (lowPerformers.length > 0) {
      recommendations.push(`${lowPerformers.length} drivers have below-average ratings - consider coaching sessions`);
    }

    // Sort alerts by priority
    alerts.sort((a, b) => a.priority - b.priority);

    logger.info('Fleet analysis complete', {
      totalVehicles: fleetStatus.summary.totalVehicles,
      alerts: alerts.length,
      recommendations: recommendations.length
    });

    return {
      success: true,
      metrics: fleetStatus.summary,
      vehicles: fleetStatus.vehicles,
      alerts,
      recommendations,
      period,
      generatedAt: new Date()
    };

  } catch (error) {
    logger.error('Fleet analysis failed', { error });
    throw error;
  }
};

// ============================================
// CHECK MAINTENANCE NEEDS
// ============================================

export const checkMaintenanceNeeds = async (vehicleId: string): Promise<{
  success: boolean;
  urgent: string[];
  warnings: string[];
  recommendations: string[];
  vehicle?: any;
}> => {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return { success: false, urgent: [], warnings: [], recommendations: [] };
    }

    const urgent: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Fuel checks
    if (vehicle.fuelLevel < 20) {
      urgent.push('Critical fuel level - refuel immediately');
      recommendations.push('Dispatch to nearest fuel station');
    } else if (vehicle.fuelLevel < 40) {
      warnings.push('Low fuel - consider refueling before next trip');
    }

    // Maintenance checks
    if (vehicle.nextServiceDue) {
      const daysUntilService = Math.ceil(
        (vehicle.nextServiceDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilService < 0) {
        urgent.push('Service overdue - schedule maintenance');
        recommendations.push('Remove vehicle from active service');
      } else if (daysUntilService < 7) {
        warnings.push(`Service due in ${daysUntilService} days`);
        recommendations.push('Schedule service appointment');
      }
    }

    // Mileage check (rough estimate - service every 10000km)
    if (vehicle.mileage && vehicle.mileage > 9500) {
      warnings.push('Approaching service mileage');
      recommendations.push('Schedule comprehensive service check');
    }

    // Insurance check
    if (vehicle.insuranceExpiry) {
      const daysUntilExpiry = Math.ceil(
        (vehicle.insuranceExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry < 0) {
        urgent.push('Insurance expired - renew immediately');
      } else if (daysUntilExpiry < 30) {
        warnings.push(`Insurance expires in ${daysUntilExpiry} days`);
      }
    }

    // Recent maintenance
    const recentMaintenance = await Maintenance.find({
      vehicleId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (recentMaintenance.length > 0) {
      recommendations.push('Recent maintenance completed - monitor for issues');
    }

    return {
      success: true,
      urgent,
      warnings,
      recommendations,
      vehicle: {
        id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        fuelLevel: vehicle.fuelLevel,
        mileage: vehicle.mileage,
        nextServiceDue: vehicle.nextServiceDue
      }
    };

  } catch (error) {
    logger.error('Maintenance check failed', { error });
    throw error;
  }
};

// ============================================
// GET DASHBOARD DATA
// ============================================

export const getDashboardData = async (): Promise<{
  success: boolean;
  summary: {
    vehicles: FleetMetrics;
    trips: {
      active: number;
      completed: number;
      total: number;
    };
    drivers: {
      available: number;
      onTrip: number;
      total: number;
      averageRating: number;
    };
    maintenance: {
      pending: number;
      inProgress: number;
      completed: number;
    };
  };
  recentActivity: any[];
}> => {
  try {
    const [vehicles, trips, drivers, maintenance] = await Promise.all([
      getFleetStatus(),
      Trip.find().sort({ createdAt: -1 }).limit(10),
      Driver.find(),
      Maintenance.find({ status: { $ne: 'completed' } })
    ]);

    const summary = {
      vehicles: vehicles.summary,
      trips: {
        active: trips.filter((t: any) => t.status === 'in-progress').length,
        completed: trips.filter((t: any) => t.status === 'completed').length,
        total: trips.length
      },
      drivers: {
        available: drivers.filter((d: any) => d.status === 'available').length,
        onTrip: drivers.filter((d: any) => d.status === 'on-trip').length,
        total: drivers.length,
        averageRating: Math.round(
          drivers.reduce((sum: number, d: any) => sum + d.rating, 0) / (drivers.length || 1) * 10
        ) / 10
      },
      maintenance: {
        pending: maintenance.filter((m: any) => m.status === 'pending').length,
        inProgress: maintenance.filter((m: any) => m.status === 'in-progress').length,
        completed: maintenance.filter((m: any) => m.status === 'completed').length
      }
    };

    const recentActivity = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicleId', 'registrationNumber type')
      .populate('driverId', 'name');

    return {
      success: true,
      summary,
      recentActivity
    };

  } catch (error) {
    logger.error('Dashboard data fetch failed', { error });
    throw error;
  }
};

export default {
  getFleetStatus,
  analyzeFleet,
  checkMaintenanceNeeds,
  getDashboardData
};