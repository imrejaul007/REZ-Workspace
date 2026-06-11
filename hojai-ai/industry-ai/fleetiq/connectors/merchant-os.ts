/**
 * Merchant OS Connector
 * Connects FLEETIQ to Merchant OS (REZ or Standalone)
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface VehicleRecord {
  id: string;
  registrationNumber: string;
  type: string;
  odometer: number;
  fuelConsumed: number;
  tripsCompleted: number;
}

export interface TripRecord {
  id: string;
  vehicleId: string;
  distance: number;
  fuelUsed: number;
  revenue: number;
  date: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  async getVehicleRecords(startDate?: string, endDate?: string): Promise<VehicleRecord[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${this.config.baseUrl}/api/fleet/vehicles?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.vehicles || [];
    } catch {
      console.error('Merchant OS: Failed to get vehicle records');
      return [];
    }
  }

  async syncTripData(trips: TripRecord[]): Promise<{ synced: number; failed: number }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/fleet/trips/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trips })
        }
      );

      if (!response.ok) return { synced: 0, failed: trips.length };
      const data = await response.json();
      return { synced: data.synced || 0, failed: data.failed || 0 };
    } catch {
      return { synced: 0, failed: trips.length };
    }
  }

  async getDriverPerformance(driverId: string): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalRevenue: number;
    averageRating: number;
  } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/fleet/drivers/${driverId}/performance`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;