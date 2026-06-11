/**
 * LEDGERAI - Health Check Utilities
 * System health monitoring and readiness checks
 */

import mongoose from 'mongoose';
import os from 'os';
import config from '../config';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface ComponentHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
}

export interface DetailedHealth extends HealthStatus {
  components: ComponentHealth[];
  system: {
    memory: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
    cpu: {
      cores: number;
      load: number[];
    };
    process: {
      pid: number;
      uptime: number;
      memoryUsage: NodeJS.MemoryUsage;
    };
  };
}

/**
 * Get basic health status
 */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: config.nodeEnv
  };
}

/**
 * Get detailed health status with all components
 */
export async function getDetailedHealth(): Promise<DetailedHealth> {
  const components: ComponentHealth[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check MongoDB connection
  const mongoHealth = await checkMongoDB();
  components.push(mongoHealth);
  if (mongoHealth.status === 'down') overallStatus = 'unhealthy';
  if (mongoHealth.status === 'degraded') overallStatus = 'degraded';

  // Get system metrics
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = (usedMem / totalMem) * 100;

  const loadAvg = os.loadavg();
  const cpus = os.cpus();

  const system = {
    memory: {
      total: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100, // GB
      free: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100,
      used: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100,
      percentage: Math.round(memPercentage * 10) / 10
    },
    cpu: {
      cores: cpus.length,
      load: loadAvg.map(l => Math.round(l * 100) / 100)
    },
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  };

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: config.nodeEnv,
    components,
    system
  };
}

/**
 * Check MongoDB connection health
 */
async function checkMongoDB(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        name: 'MongoDB',
        status: 'down',
        latency: Date.now() - start,
        error: 'Not connected'
      };
    }

    // Ping the database
    const startPing = Date.now();
    await mongoose.connection.db?.admin().ping();
    const latency = Date.now() - startPing;

    if (latency > 1000) {
      return {
        name: 'MongoDB',
        status: 'degraded',
        latency,
        error: 'High latency'
      };
    }

    return {
      name: 'MongoDB',
      status: 'up',
      latency
    };
  } catch (error) {
    return {
      name: 'MongoDB',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Readiness check - is the server ready to accept traffic?
 */
export async function isReady(): Promise<boolean> {
  // Check MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  // Check if we can do a simple operation
  try {
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Liveness check - is the server alive?
 */
export function isAlive(): boolean {
  return true;
}

/**
 * Memory usage warning thresholds
 */
export function getMemoryWarning(): string | null {
  const usedMem = process.memoryUsage();
  const heapUsedMB = usedMem.heapUsed / (1024 * 1024);
  const heapTotalMB = usedMem.heapTotal / (1024 * 1024);
  const heapPercentage = (usedMem.heapUsed / usedMem.heapTotal) * 100;

  if (heapPercentage > 90) {
    return `CRITICAL: Heap usage at ${heapPercentage.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB)`;
  }
  if (heapPercentage > 80) {
    return `WARNING: Heap usage at ${heapPercentage.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB)`;
  }

  return null;
}

export default {
  getHealthStatus,
  getDetailedHealth,
  isReady,
  isAlive,
  getMemoryWarning
};