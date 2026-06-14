import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AlreadyInQueueError,
  NotFoundError,
  QueueFullError,
  NotInQueueError,
} from '../common/exceptions';

export interface AirportZone {
  id: string;
  name: string;
  code: string; // IATA code (BLR, DEL, BOM)
  city: string;
  state: string;
  location: { lat: number; lng: number };
  isActive: boolean;
  settings: AirportSettings;
}

export interface AirportSettings {
  queueEnabled: boolean;
  maxQueueSize: number;
  surgeMultiplier: number;
  peakHours: { start: number; end: number }[];
  holidayMultiplier: number;
}

export interface AirportQueueEntry {
  id: string;
  driverId: string;
  driverName: string;
  vehicleType: 'auto' | 'cab' | 'suv';
  vehiclePlate: string;
  position: number;
  enteredAt: Date;
  estimatedPickupTime: number; // minutes
  status: QUEUE_STATUS;
  pickedUpAt?: Date;
  tripId?: string;
}

export enum QUEUE_STATUS {
  WAITING = 'waiting',
  CALLED = 'called',
  PICKED_UP = 'picked_up',
  LEFT = 'left',
  TIMED_OUT = 'timed_out',
}

export interface AirportQueue {
  zoneId: string;
  vehicleType: 'auto' | 'cab' | 'suv';
  entries: AirportQueueEntry[];
  totalWaiting: number;
  avgWaitTime: number; // minutes
}

// Airport zones
const AIRPORTS: AirportZone[] = [
  {
    id: 'blr_airport',
    name: 'Kempegowda International Airport',
    code: 'BLR',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { lat: 13.1979, lng: 77.7063 },
    isActive: true,
    settings: {
      queueEnabled: true,
      maxQueueSize: 50,
      surgeMultiplier: 1.5,
      peakHours: [
        { start: 6, end: 9 },
        { start: 18, end: 22 },
      ],
      holidayMultiplier: 1.25,
    },
  },
  {
    id: 'del_t1_airport',
    name: 'IGI Airport Terminal 1',
    code: 'DEL',
    city: 'New Delhi',
    state: 'Delhi',
    location: { lat: 28.5665, lng: 77.1031 },
    isActive: true,
    settings: {
      queueEnabled: true,
      maxQueueSize: 100,
      surgeMultiplier: 1.75,
      peakHours: [
        { start: 5, end: 8 },
        { start: 17, end: 21 },
      ],
      holidayMultiplier: 1.5,
    },
  },
  {
    id: 'bom_airport',
    name: 'Chhatrapati Shivaji Airport',
    code: 'BOM',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: { lat: 19.0896, lng: 72.8656 },
    isActive: true,
    settings: {
      queueEnabled: true,
      maxQueueSize: 75,
      surgeMultiplier: 1.6,
      peakHours: [
        { start: 5, end: 9 },
        { start: 18, end: 22 },
      ],
      holidayMultiplier: 1.4,
    },
  },
  {
    id: 'hyd_airport',
    name: 'Rajiv Gandhi International Airport',
    code: 'HYD',
    city: 'Hyderabad',
    state: 'Telangana',
    location: { lat: 17.2403, lng: 78.4294 },
    isActive: true,
    settings: {
      queueEnabled: true,
      maxQueueSize: 40,
      surgeMultiplier: 1.4,
      peakHours: [
        { start: 6, end: 9 },
        { start: 18, end: 21 },
      ],
      holidayMultiplier: 1.3,
    },
  },
  {
    id: 'maa_airport',
    name: 'Chennai International Airport',
    code: 'MAA',
    city: 'Chennai',
    state: 'Tamil Nadu',
    location: { lat: 12.9900, lng: 80.1693 },
    isActive: true,
    settings: {
      queueEnabled: true,
      maxQueueSize: 35,
      surgeMultiplier: 1.3,
      peakHours: [
        { start: 5, end: 8 },
        { start: 18, end: 21 },
      ],
      holidayMultiplier: 1.25,
    },
  },
];

@Injectable()
export class AirportService {
  private readonly logger = new Logger(AirportService.name);

  // Queue storage
  private queues: Map<string, AirportQueueEntry[]> = new Map();
  private calledDrivers: Map<string, AirportQueueEntry> = new Map();

  constructor(
    @InjectModel('Ride') private rideModel: Model<any>,
  ) {}

  // ===========================================
  // AIRPORT MANAGEMENT
  // ===========================================

  /**
   * Get all airports
   */
  async getAirports(): Promise<AirportZone[]> {
    return AIRPORTS.filter(a => a.isActive);
  }

  /**
   * Get airport by code
   */
  async getAirport(code: string): Promise<AirportZone | null> {
    return AIRPORTS.find(a => a.code.toLowerCase() === code.toLowerCase()) || null;
  }

  /**
   * Get airport by ID
   */
  async getAirportById(id: string): Promise<AirportZone | null> {
    return AIRPORTS.find(a => a.id === id) || null;
  }

  /**
   * Check if location is near airport
   */
  async isNearAirport(lat: number, lng: number): Promise<AirportZone | null> {
    for (const airport of AIRPORTS) {
      const distance = this.getDistance(lat, lng, airport.location.lat, airport.location.lng);
      if (distance <= 5) { // Within 5km
        return airport;
      }
    }
    return null;
  }

  // ===========================================
  // QUEUE MANAGEMENT
  // ===========================================

  /**
   * Get queue for airport
   */
  async getQueue(airportId: string, vehicleType: 'auto' | 'cab' | 'suv'): Promise<AirportQueue> {
    const key = `${airportId}_${vehicleType}`;
    const entries = this.queues.get(key) || [];

    return {
      zoneId: airportId,
      vehicleType,
      entries,
      totalWaiting: entries.length,
      avgWaitTime: this.calculateAvgWaitTime(entries),
    };
  }

  /**
   * Join airport queue
   */
  async joinQueue(
    airportId: string,
    driver: {
      id: string;
      name: string;
      vehicleType: 'auto' | 'cab' | 'suv';
      vehiclePlate: string;
    }
  ): Promise<AirportQueueEntry> {
    const key = `${airportId}_${driver.vehicleType}`;
    const queue = this.queues.get(key) || [];

    // Check if already in queue
    const existing = queue.find(e => e.driverId === driver.id);
    if (existing) {
      throw new AlreadyInQueueError();
    }

    // Check queue size
    const airport = await this.getAirportById(airportId);
    if (!airport) {
      throw new NotFoundError('Airport', airportId);
    }

    if (queue.length >= airport.settings.maxQueueSize) {
      throw new QueueFullError();
    }

    const position = queue.length + 1;
    const estimatedPickupTime = this.calculateETA(position);

    const entry: AirportQueueEntry = {
      id: `QE_${Date.now()}`,
      driverId: driver.id,
      driverName: driver.name,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
      position,
      enteredAt: new Date(),
      estimatedPickupTime,
      status: QUEUE_STATUS.WAITING,
    };

    queue.push(entry);
    this.queues.set(key, queue);

    this.logger.log(`Driver ${driver.id} joined queue at ${airportId}, position ${position}`);

    return entry;
  }

  /**
   * Leave airport queue
   */
  async leaveQueue(airportId: string, vehicleType: 'auto' | 'cab' | 'suv', driverId: string): Promise<void> {
    const key = `${airportId}_${vehicleType}`;
    const queue = this.queues.get(key) || [];

    const index = queue.findIndex(e => e.driverId === driverId);
    if (index === -1) {
      throw new NotInQueueError();
    }

    const entry = queue[index];
    entry.status = QUEUE_STATUS.LEFT;
    queue.splice(index, 1);

    // Update positions
    queue.forEach((e, i) => {
      e.position = i + 1;
      e.estimatedPickupTime = this.calculateETA(i + 1);
    });

    this.queues.set(key, queue);

    this.logger.log(`Driver ${driverId} left queue at ${airportId}`);
  }

  /**
   * Get driver's queue position
   */
  async getPosition(airportId: string, vehicleType: 'auto' | 'cab' | 'suv', driverId: string): Promise<number> {
    const key = `${airportId}_${vehicleType}`;
    const queue = this.queues.get(key) || [];

    const entry = queue.find(e => e.driverId === driverId);
    return entry?.position || -1;
  }

  /**
   * Call next driver
   */
  async callNextDriver(airportId: string, vehicleType: 'auto' | 'cab' | 'suv'): Promise<AirportQueueEntry | null> {
    const key = `${airportId}_${vehicleType}`;
    const queue = this.queues.get(key) || [];

    if (queue.length === 0) {
      return null;
    }

    const entry = queue.shift();
    if (!entry) return null;

    entry.status = QUEUE_STATUS.CALLED;

    // Store in called drivers
    this.calledDrivers.set(entry.id, entry);

    // Update positions
    queue.forEach((e, i) => {
      e.position = i + 1;
      e.estimatedPickupTime = this.calculateETA(i + 1);
    });

    this.queues.set(key, queue);

    // Set timeout (5 minutes to respond)
    setTimeout(() => {
      this.handleTimeout(entry.id, airportId, vehicleType);
    }, 5 * 60 * 1000);

    this.logger.log(`Driver ${entry.driverId} called from queue at ${airportId}`);

    return entry;
  }

  /**
   * Confirm pickup
   */
  async confirmPickup(queueEntryId: string, tripId: string): Promise<void> {
    const entry = this.calledDrivers.get(queueEntryId);
    if (!entry) {
      throw new NotFoundError('Queue entry', queueEntryId);
    }

    entry.status = QUEUE_STATUS.PICKED_UP;
    entry.pickedUpAt = new Date();
    entry.tripId = tripId;

    this.calledDrivers.set(queueEntryId, entry);

    this.logger.log(`Driver ${entry.driverId} confirmed pickup at ${tripId}`);
  }

  /**
   * Handle timeout
   */
  private async handleTimeout(queueEntryId: string, airportId: string, vehicleType: string): Promise<void> {
    const entry = this.calledDrivers.get(queueEntryId);
    if (!entry || entry.status !== QUEUE_STATUS.CALLED) {
      return;
    }

    entry.status = QUEUE_STATUS.TIMED_OUT;
    this.calledDrivers.set(queueEntryId, entry);

    // Add to back of queue
    const key = `${airportId}_${vehicleType}`;
    const queue = this.queues.get(key) || [];

    entry.position = queue.length + 1;
    entry.estimatedPickupTime = this.calculateETA(queue.length + 1);
    entry.status = QUEUE_STATUS.WAITING;

    queue.push(entry);
    this.queues.set(key, queue);

    this.logger.log(`Driver ${entry.driverId} timed out, added back to queue`);
  }

  // ===========================================
  // SURGE PRICING
  // ===========================================

  /**
   * Get airport surge multiplier
   */
  async getSurgeMultiplier(airportId: string): Promise<number> {
    const airport = await this.getAirportById(airportId);
    if (!airport) return 1.0;

    const now = new Date();
    const hour = now.getHours();

    // Check peak hours
    const isPeakHour = airport.settings.peakHours.some(
      peak => hour >= peak.start && hour <= peak.end
    );

    if (!isPeakHour) return 1.0;

    // Check if holiday
    const isHoliday = this.isHoliday(now);

    let surge = airport.settings.surgeMultiplier;

    if (isHoliday) {
      surge *= airport.settings.holidayMultiplier;
    }

    // Cap at 3x
    return Math.min(surge, 3.0);
  }

  /**
   * Check if date is holiday
   */
  private isHoliday(date: Date): boolean {
    // Simplified - check for weekends
    const day = date.getDay();
    if (day === 0 || day === 6) return true;

    // Check for known holidays (simplified)
    const month = date.getMonth();
    const dayOfMonth = date.getDate();

    // Republic Day, Independence Day, Diwali, etc. (simplified)
    if (month === 0 && dayOfMonth === 26) return true; // Jan 26
    if (month === 7 && dayOfMonth === 15) return true; // Aug 15
    if (month === 10 && dayOfMonth >= 1 && dayOfMonth <= 5) return true; // Diwali

    return false;
  }

  // ===========================================
  // STATISTICS
  // ===========================================

  /**
   * Get queue statistics
   */
  async getQueueStats(airportId: string): Promise<{
    autoQueue: number;
    cabQueue: number;
    suvQueue: number;
    totalWaiting: number;
    avgWaitTime: number;
    pickedUpToday: number;
  }> {
    const [autoQueue, cabQueue, suvQueue] = await Promise.all([
      this.getQueue(airportId, 'auto'),
      this.getQueue(airportId, 'cab'),
      this.getQueue(airportId, 'suv'),
    ]);

    const pickedUpToday = Array.from(this.calledDrivers.values())
      .filter(e => e.pickedUpAt &&
        e.pickedUpAt.toDateString() === new Date().toDateString()
      ).length;

    return {
      autoQueue: autoQueue.totalWaiting,
      cabQueue: cabQueue.totalWaiting,
      suvQueue: suvQueue.totalWaiting,
      totalWaiting: autoQueue.totalWaiting + cabQueue.totalWaiting + suvQueue.totalWaiting,
      avgWaitTime: Math.round(
        (autoQueue.avgWaitTime + cabQueue.avgWaitTime + suvQueue.avgWaitTime) / 3
      ),
      pickedUpToday,
    };
  }

  // ===========================================
  // HELPERS
  // ===========================================

  /**
   * Calculate ETA based on position
   */
  private calculateETA(position: number): number {
    // Average 3 minutes per pickup
    return position * 3;
  }

  /**
   * Calculate average wait time
   */
  private calculateAvgWaitTime(entries: AirportQueueEntry[]): number {
    if (entries.length === 0) return 0;

    const totalWait = entries.reduce((sum, e) => {
      const wait = (Date.now() - e.enteredAt.getTime()) / (1000 * 60);
      return sum + wait;
    }, 0);

    return Math.round(totalWait / entries.length);
  }

  /**
   * Calculate distance between points
   */
  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
