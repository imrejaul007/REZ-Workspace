import logger from './utils/logger';

import { Worker, Job } from 'bullmq';
import { Driver, DriverDocument } from '../models/Driver';
import { Delivery, DeliveryDocument } from '../models/Delivery';
import { driverService } from '../services/driverService';
import { deliveryService } from '../services/deliveryService';
import { trackingService } from '../services/trackingService';
import { redisClient } from '../config/redis';
import { DriverStatus, DeliveryStatus, GeoLocation } from '../types';
import config from '../config';

interface DeliveryJobData {
  deliveryId: string;
  driverId: string;
  action: 'start' | 'complete' | 'fail' | 'update_location';
  location?: GeoLocation;
  notes?: string;
}

interface DriverAssignmentJobData {
  deliveryId: string;
  pickupLocation: GeoLocation;
  vehicleType?: string;
}

interface CleanupJobData {
  deliveryId: string;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined
};

class DriverWorker {
  private deliveryWorker: Worker<DeliveryJobData>;
  private assignmentWorker: Worker<DriverAssignmentJobData>;
  private cleanupWorker: Worker<CleanupJobData>;
  private isRunning: boolean = false;

  constructor() {
    this.deliveryWorker = new Worker<DeliveryJobData>(
      'delivery-jobs',
      async (job: Job<DeliveryJobData>) => this.processDeliveryJob(job),
      { connection, concurrency: 10 }
    );

    this.assignmentWorker = new Worker<DriverAssignmentJobData>(
      'driver-assignment',
      async (job: Job<DriverAssignmentJobData>) => this.processAssignmentJob(job),
      { connection, concurrency: 5 }
    );

    this.cleanupWorker = new Worker<CleanupJobData>(
      'delivery-cleanup',
      async (job: Job<CleanupJobData>) => this.processCleanupJob(job),
      { connection, concurrency: 3 }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.deliveryWorker.on('completed', (job) => {
      logger.info(`Delivery job ${job.id} completed for delivery ${job.data.deliveryId}`);
    });

    this.deliveryWorker.on('failed', (job, err) => {
      logger.error(`Delivery job ${job?.id} failed:`, err.message);
    });

    this.assignmentWorker.on('completed', (job) => {
      logger.info(`Assignment job ${job.id} completed`);
    });

    this.assignmentWorker.on('failed', (job, err) => {
      logger.error(`Assignment job ${job?.id} failed:`, err.message);
    });

    this.cleanupWorker.on('completed', (job) => {
      logger.info(`Cleanup job ${job.id} completed for delivery ${job.data.deliveryId}`);
    });
  }

  private async processDeliveryJob(job: Job<DeliveryJobData>): Promise<unknown> {
    const { deliveryId, driverId, action, location, notes } = job.data;

    switch (action) {
      case 'start':
        return this.handleDeliveryStart(deliveryId, driverId);

      case 'complete':
        return this.handleDeliveryComplete(deliveryId, driverId);

      case 'fail':
        return this.handleDeliveryFail(deliveryId, driverId, notes);

      case 'update_location':
        return this.handleLocationUpdate(deliveryId, driverId, location!);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async handleDeliveryStart(deliveryId: string, driverId: string): Promise<unknown> {
    logger.info(`Starting delivery ${deliveryId} for driver ${driverId}`);

    const [delivery, driver] = await Promise.all([
      Delivery.findById(deliveryId).exec(),
      Driver.findById(driverId).exec()
    ]);

    if (!delivery || !driver) {
      throw new Error('Delivery or driver not found');
    }

    await delivery.updateOne({
      status: DeliveryStatus.PICKED_UP,
      actualPickup: new Date(),
      $push: {
        events: {
          status: DeliveryStatus.PICKED_UP,
          timestamp: new Date(),
          notes: 'Driver picked up the package',
          updatedBy: driverId
        }
      }
    });

    await trackingService.startTrackingDelivery(deliveryId, driverId);

    return { success: true, status: DeliveryStatus.PICKED_UP };
  }

  private async handleDeliveryComplete(deliveryId: string, driverId: string): Promise<unknown> {
    logger.info(`Completing delivery ${deliveryId} for driver ${driverId}`);

    const delivery = await Delivery.findById(deliveryId).exec();
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    await delivery.updateOne({
      status: DeliveryStatus.DELIVERED,
      actualDropoff: new Date(),
      $push: {
        events: {
          status: DeliveryStatus.DELIVERED,
          timestamp: new Date(),
          notes: 'Delivery completed successfully',
          updatedBy: driverId
        }
      }
    });

    await driverService.completeCurrentDelivery(driverId);
    await trackingService.stopTrackingDelivery(deliveryId);

    return { success: true, status: DeliveryStatus.DELIVERED };
  }

  private async handleDeliveryFail(
    deliveryId: string,
    driverId: string,
    notes?: string
  ): Promise<unknown> {
    logger.info(`Failing delivery ${deliveryId} for driver ${driverId}`);

    const delivery = await Delivery.findById(deliveryId).exec();
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    await delivery.updateOne({
      status: DeliveryStatus.FAILED,
      $push: {
        events: {
          status: DeliveryStatus.FAILED,
          timestamp: new Date(),
          notes: notes || 'Delivery failed',
          updatedBy: driverId
        }
      }
    });

    await driverService.cancelCurrentDelivery(driverId);
    await trackingService.stopTrackingDelivery(deliveryId);

    return { success: true, status: DeliveryStatus.FAILED };
  }

  private async handleLocationUpdate(
    deliveryId: string,
    driverId: string,
    location: GeoLocation
  ): Promise<unknown> {
    const eta = await trackingService.updateLocation(deliveryId, driverId, location);
    return { success: true, eta };
  }

  private async processAssignmentJob(job: Job<DriverAssignmentJobData>): Promise<unknown> {
    const { deliveryId, pickupLocation, vehicleType } = job.data;

    logger.info(`Processing assignment for delivery ${deliveryId}`);

    const nearestDriver = await driverService.findNearestAvailableDriver(
      pickupLocation,
      vehicleType as unknown
    );

    if (!nearestDriver) {
      throw new Error('No available drivers found');
    }

    const delivery = await deliveryService.assignDriver({
      deliveryId,
      driverId: nearestDriver._id?.toString() || ''
    });

    return {
      success: true,
      driverId: nearestDriver._id?.toString(),
      deliveryId: delivery._id?.toString()
    };
  }

  private async processCleanupJob(job: Job<CleanupJobData>): Promise<unknown> {
    const { deliveryId } = job.data;

    logger.info(`Cleaning up delivery ${deliveryId}`);

    await trackingService.stopTrackingDelivery(deliveryId);

    return { success: true };
  }

  public async addDeliveryJob(data: DeliveryJobData, options?: { delay?: number }): Promise<string> {
    const job = await this.deliveryWorker.addJob(data, {
      ...options,
      jobId: `delivery-${data.deliveryId}-${Date.now()}`
    });
    return job.id || '';
  }

  public async addAssignmentJob(data: DriverAssignmentJobData): Promise<string> {
    const job = await this.assignmentWorker.addJob(data, {
      jobId: `assignment-${data.deliveryId}-${Date.now()}`
    });
    return job.id || '';
  }

  public async addCleanupJob(data: CleanupJobData, delay?: number): Promise<string> {
    const job = await this.cleanupWorker.addJob(data, {
      ...(delay ? { delay } : {}),
      jobId: `cleanup-${data.deliveryId}-${Date.now()}`
    });
    return job.id || '';
  }

  public async start(): Promise<void> {
    logger.info('Starting driver worker...');
    this.isRunning = true;
  }

  public async stop(): Promise<void> {
    logger.info('Stopping driver worker...');
    this.isRunning = false;

    await Promise.all([
      this.deliveryWorker.close(),
      this.assignmentWorker.close(),
      this.cleanupWorker.close()
    ]);

    logger.info('Driver worker stopped');
  }

  public getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}

export class DeliveryScheduler {
  private static instance: DeliveryScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): DeliveryScheduler {
    if (!DeliveryScheduler.instance) {
      DeliveryScheduler.instance = new DeliveryScheduler();
    }
    return DeliveryScheduler.instance;
  }

  public async start(): Promise<void> {
    logger.info('Starting delivery scheduler...');

    this.intervalId = setInterval(async () => {
      await this.checkStaleDeliveries();
      await this.checkDriverAvailability();
      await this.updateETAs();
    }, 60000);

    logger.info('Delivery scheduler started');
  }

  public async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Delivery scheduler stopped');
  }

  private async checkStaleDeliveries(): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const staleDeliveries = await Delivery.find({
      status: DeliveryStatus.ASSIGNED,
      createdAt: { $lt: thirtyMinutesAgo }
    }).exec();

    for (const delivery of staleDeliveries) {
      logger.warn(`Stale delivery found: ${delivery._id}`);
    }
  }

  private async checkDriverAvailability(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;

    const drivers = await Driver.find({
      status: DriverStatus.AVAILABLE,
      'availability.isAvailable': true
    }).exec();

    for (const driver of drivers) {
      const { start, end } = driver.availability.workingHours;
      if (currentTime < start || currentTime > end) {
        await driver.updateOne({
          status: DriverStatus.OFFLINE,
          'availability.isAvailable': false
        });
        logger.info(`Driver ${driver._id} set to offline due to working hours`);
      }
    }
  }

  private async updateETAs(): Promise<void> {
    const activeDeliveries = await Delivery.find({
      status: {
        $in: [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY]
      }
    }).exec();

    for (const delivery of activeDeliveries) {
      if (!delivery.driverId) continue;

      const driver = await Driver.findById(delivery.driverId).exec();
      if (!driver?.currentLocation) continue;

      const { calculateETA } = await import('../utils/geo');
      const eta = calculateETA(driver.currentLocation, delivery.dropoff);

      await delivery.updateOne({ eta });
    }
  }
}

let worker: DriverWorker | null = null;
let scheduler: DeliveryScheduler | null = null;

export async function startWorker(): Promise<void> {
  worker = new DriverWorker();
  scheduler = DeliveryScheduler.getInstance();

  await worker.start();
  await scheduler.start();
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.stop();
    worker = null;
  }
  if (scheduler) {
    await scheduler.stop();
    scheduler = null;
  }
}

export function getWorker(): DriverWorker | null {
  return worker;
}

if (require.main === module) {
  startWorker().catch(logger.error);

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received');
    await stopWorker();
    await redisClient.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received');
    await stopWorker();
    await redisClient.disconnect();
    process.exit(0);
  });
}

export default DriverWorker;
