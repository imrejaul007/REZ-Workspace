import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver } from '../models/driver.model';
import { Ride } from '../models/ride.model';
import { NotFoundError } from '../common/exceptions';

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  config: CityConfig;
}

export interface CityConfig {
  // Location bounds
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: { lat: number; lng: number };

  // Fare adjustments
  fareMultiplier: number;
  minBaseFare: number;
  maxBaseFare: number;

  // Driver settings
  minDriverAge: number;
  requirePermit: boolean;
  vehicleAgeLimit: number;

  // Operational
  surgeEnabled: boolean;
  scheduledRidesEnabled: boolean;
  airportEnabled: boolean;

  // Zone pricing
  zones: CityZone[];
}

export interface CityZone {
  id: string;
  name: string;
  type: 'airport' | 'railway' | 'business' | 'residential';
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  fareSurcharge: number; // Percentage
  minFare: number;
}

// In-memory city store (use DB in production)
const CITIES: Map<string, City> = new Map([
  ['bangalore', {
    id: 'bangalore',
    name: 'Bangalore',
    slug: 'bangalore',
    state: 'Karnataka',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    isActive: true,
    config: {
      bounds: {
        minLat: 12.7,
        maxLat: 13.2,
        minLng: 77.3,
        maxLng: 77.9,
      },
      center: { lat: 12.9716, lng: 77.5946 },
      fareMultiplier: 1.0,
      minBaseFare: 0,
      maxBaseFare: 0,
      minDriverAge: 21,
      requirePermit: true,
      vehicleAgeLimit: 10,
      surgeEnabled: true,
      scheduledRidesEnabled: true,
      airportEnabled: true,
      zones: [
        {
          id: 'blr_airport',
          name: 'Kempegowda Airport',
          type: 'airport',
          bounds: { minLat: 13.195, maxLat: 13.205, minLng: 77.695, maxLng: 77.715 },
          fareSurcharge: 50,
          minFare: 300,
        },
        {
          id: 'blr_railway',
          name: 'City Railway Station',
          type: 'railway',
          bounds: { minLat: 12.97, maxLat: 12.98, minLng: 77.56, maxLng: 77.58 },
          fareSurcharge: 25,
          minFare: 150,
        },
      ],
    },
  }],
  ['mumbai', {
    id: 'mumbai',
    name: 'Mumbai',
    slug: 'mumbai',
    state: 'Maharashtra',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    isActive: false, // Coming soon
    config: {
      bounds: {
        minLat: 18.8,
        maxLat: 19.3,
        minLng: 72.7,
        maxLng: 73.2,
      },
      center: { lat: 19.076, lng: 72.877 },
      fareMultiplier: 1.2,
      minBaseFare: 0,
      maxBaseFare: 0,
      minDriverAge: 21,
      requirePermit: true,
      vehicleAgeLimit: 8,
      surgeEnabled: true,
      scheduledRidesEnabled: true,
      airportEnabled: true,
      zones: [
        {
          id: 'bom_airport',
          name: 'Chhatrapati Shivaji Airport',
          type: 'airport',
          bounds: { minLat: 19.09, maxLat: 19.11, minLng: 72.86, maxLng: 72.90 },
          fareSurcharge: 75,
          minFare: 400,
        },
      ],
    },
  }],
  ['delhi', {
    id: 'delhi',
    name: 'Delhi NCR',
    slug: 'delhi',
    state: 'Delhi',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    isActive: false,
    config: {
      bounds: {
        minLat: 28.4,
        maxLat: 28.9,
        minLng: 76.9,
        maxLng: 77.5,
      },
      center: { lat: 28.6139, lng: 77.209 },
      fareMultiplier: 1.15,
      minBaseFare: 0,
      maxBaseFare: 0,
      minDriverAge: 21,
      requirePermit: true,
      vehicleAgeLimit: 10,
      surgeEnabled: true,
      scheduledRidesEnabled: true,
      airportEnabled: true,
      zones: [
        {
          id: 'del_airport_t1',
          name: 'IGI Airport Terminal 1',
          type: 'airport',
          bounds: { minLat: 28.55, maxLat: 28.57, minLng: 77.08, maxLng: 77.12 },
          fareSurcharge: 100,
          minFare: 350,
        },
      ],
    },
  }],
]);

@Injectable()
export class CityService {
  private readonly logger = new Logger(CityService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
  ) {}

  /**
   * Get all active cities
   */
  async getActiveCities(): Promise<City[]> {
    const activeCities: City[] = [];
    CITIES.forEach(city => {
      if (city.isActive) {
        activeCities.push(city);
      }
    });
    return activeCities;
  }

  /**
   * Get city by slug
   */
  async getCityBySlug(slug: string): Promise<City | null> {
    return CITIES.get(slug.toLowerCase()) || null;
  }

  /**
   * Get city by ID
   */
  async getCityById(id: string): Promise<City | null> {
    for (const city of CITIES.values()) {
      if (city.id === id) return city;
    }
    return null;
  }

  /**
   * Find city for a location
   */
  async findCityForLocation(lat: number, lng: number): Promise<City | null> {
    for (const city of CITIES.values()) {
      if (this.isLocationInBounds(lat, lng, city.config.bounds)) {
        return city;
      }
    }
    return null;
  }

  /**
   * Check if location is within bounds
   */
  private isLocationInBounds(
    lat: number,
    lng: number,
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  ): boolean {
    return (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    );
  }

  /**
   * Get city statistics
   */
  async getCityStats(cityId: string): Promise<{
    activeDrivers: number;
    totalRides: number;
    ridesToday: number;
    avgRating: number;
    avgFare: number;
  }> {
    const city = await this.getCityById(cityId);
    if (!city) {
      throw new NotFoundError('City', cityId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeDrivers, totalRides, ridesToday, drivers] = await Promise.all([
      this.driverModel.countDocuments({
        status: 'online',
        cityId,
      }),
      this.rideModel.countDocuments({
        cityId,
      }),
      this.rideModel.countDocuments({
        cityId,
        requestedAt: { $gte: today },
      }),
      this.driverModel.find({ cityId }).select('rating'),
    ]);

    const avgRating = drivers.length > 0
      ? drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
      : 0;

    const completedRides = await this.rideModel.find({
      cityId,
      status: 'completed',
    });
    const avgFare = completedRides.length > 0
      ? completedRides.reduce((sum, r) => sum + (r.fare?.total || 0), 0) / completedRides.length
      : 0;

    return {
      activeDrivers,
      totalRides,
      ridesToday,
      avgRating: Math.round(avgRating * 10) / 10,
      avgFare: Math.round(avgFare * 100) / 100,
    };
  }

  /**
   * Get zone at location
   */
  async getZoneAtLocation(cityId: string, lat: number, lng: number): Promise<CityZone | null> {
    const city = await this.getCityById(cityId);
    if (!city) return null;

    for (const zone of city.config.zones) {
      if (this.isLocationInBounds(lat, lng, zone.bounds)) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Calculate fare for city
   */
  calculateCityFare(cityId: string, baseFare: number): number {
    const city = CITIES.get(cityId);
    if (!city) return baseFare;
    return Math.round(baseFare * city.config.fareMultiplier * 100) / 100;
  }

  /**
   * Check if city supports feature
   */
  async supportsFeature(cityId: string, feature: 'surge' | 'scheduled' | 'airport'): Promise<boolean> {
    const city = await this.getCityById(cityId);
    if (!city) return false;

    switch (feature) {
      case 'surge':
        return city.config.surgeEnabled;
      case 'scheduled':
        return city.config.scheduledRidesEnabled;
      case 'airport':
        return city.config.airportEnabled;
      default:
        return false;
    }
  }

  /**
   * Get drivers in city
   */
  async getDriversInCity(cityId: string, limit = 50): Promise<Driver[]> {
    return this.driverModel.find({
      cityId,
      status: { $ne: 'suspended' },
    })
      .sort({ rating: -1 })
      .limit(limit);
  }

  /**
   * Get nearby drivers in city
   */
  async findNearbyDriversInCity(
    cityId: string,
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<Driver[]> {
    const city = await this.getCityById(cityId);
    if (!city) return [];

    return (this.driverModel as any).findNearby(lat, lng, radiusKm, undefined);
  }

  /**
   * Add new city
   */
  async addCity(city: City): Promise<void> {
    CITIES.set(city.slug, city);
    this.logger.log(`City added: ${city.name}`);
  }

  /**
   * Activate/deactivate city
   */
  async setCityActive(cityId: string, isActive: boolean): Promise<void> {
    const city = await this.getCityById(cityId);
    if (city) {
      city.isActive = isActive;
      CITIES.set(city.slug, city);
      this.logger.log(`City ${city.name} ${isActive ? 'activated' : 'deactivated'}`);
    }
  }

  /**
   * Update city configuration
   */
  async updateCityConfig(cityId: string, config: Partial<CityConfig>): Promise<void> {
    const city = await this.getCityById(cityId);
    if (city) {
      city.config = { ...city.config, ...config };
      CITIES.set(city.slug, city);
      this.logger.log(`City ${city.name} config updated`);
    }
  }
}
