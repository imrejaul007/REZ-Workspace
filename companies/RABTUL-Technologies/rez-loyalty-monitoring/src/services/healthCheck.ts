import axios, { AxiosError } from 'axios';
import { IServiceHealth, ServiceStatus } from '../models/MetricSnapshot.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Service configuration
interface ServiceConfig {
  name: string;
  url: string;
  port?: number;
}

const serviceConfigs: ServiceConfig[] = [
  {
    name: 'profile-aggregator',
    url: process.env.PROFILE_AGGREGATOR_URL || 'http://localhost:4025',
    port: 4025
  },
  {
    name: 'streak-service',
    url: process.env.STREAK_SERVICE_URL || 'http://localhost:4026',
    port: 4026
  },
  {
    name: 'cross-merchant',
    url: process.env.CROSS_MERCHANT_URL || 'http://localhost:4027',
    port: 4027
  },
  {
    name: 'score-service',
    url: process.env.SCORE_SERVICE_URL || 'http://localhost:4028',
    port: 4028
  },
  {
    name: 'karma-bridge',
    url: process.env.KARMA_BRIDGE_URL || 'http://localhost:4029',
    port: 4029
  }
];

// Health check state per service
const serviceState: Map<string, {
  consecutiveFailures: number;
  lastStatus: ServiceStatus;
  lastResponseTime: number;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
}> = new Map();

// Initialize state for each service
serviceConfigs.forEach(service => {
  serviceState.set(service.name, {
    consecutiveFailures: 0,
    lastStatus: 'unknown',
    lastResponseTime: 0,
    uptime: 100,
    totalChecks: 0,
    successfulChecks: 0
  });
});

// Determine status based on response time and consecutive failures
function determineStatus(responseTime: number, consecutiveFailures: number): ServiceStatus {
  if (consecutiveFailures >= 3) {
    return 'unhealthy';
  }
  if (consecutiveFailures > 0 || responseTime > 2000) {
    return 'degraded';
  }
  if (responseTime > 1000) {
    return 'degraded';
  }
  return 'healthy';
}

// Perform health check on a single service
async function checkServiceHealth(service: ServiceConfig): Promise<IServiceHealth> {
  const state = serviceState.get(service.name)!;
  const startTime = Date.now();

  try {
    const response = await axios.get(`${service.url}/health`, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.status >= 200 && response.status < 300;

    state.consecutiveFailures = 0;
    state.lastResponseTime = responseTime;
    state.totalChecks++;
    state.successfulChecks++;

    // Calculate uptime percentage
    state.uptime = (state.successfulChecks / state.totalChecks) * 100;
    state.lastStatus = determineStatus(responseTime, 0);

    const health: IServiceHealth = {
      name: service.name,
      status: state.lastStatus,
      responseTime,
      lastChecked: new Date(),
      uptime: state.uptime
    };

    logger.debug(`Health check passed for ${service.name}: ${responseTime}ms`);
    return health;

  } catch (error) {
    state.consecutiveFailures++;
    state.lastStatus = determineStatus(0, state.consecutiveFailures);

    const axiosError = error as AxiosError;
    const errorMessage = axiosError.message || 'Unknown error';
    const responseTime = Date.now() - startTime;

    state.lastResponseTime = responseTime;

    logger.warn(`Health check failed for ${service.name}: ${errorMessage}`);

    return {
      name: service.name,
      status: state.lastStatus,
      responseTime,
      lastChecked: new Date(),
      errorMessage: errorMessage.substring(0, 200),
      uptime: state.uptime
    };
  }
}

// Aggregate health check for all services
export async function performHealthCheck(): Promise<{
  services: IServiceHealth[];
  overallStatus: ServiceStatus;
  timestamp: Date;
}> {
  logger.info('Starting aggregated health check...');

  const results = await Promise.allSettled(
    serviceConfigs.map(service => checkServiceHealth(service))
  );

  const services: IServiceHealth[] = [];
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      services.push(result.value);
      if (result.value.status === 'healthy') healthyCount++;
      if (result.value.status === 'degraded') degradedCount++;
      if (result.value.status === 'unhealthy') unhealthyCount++;
    } else {
      // This shouldn't happen with Promise.allSettled, but handle it
      services.push({
        name: serviceConfigs[index].name,
        status: 'unknown',
        responseTime: 0,
        lastChecked: new Date(),
        errorMessage: 'Unexpected error in health check',
        uptime: 0
      });
    }
  });

  // Determine overall status
  let overallStatus: ServiceStatus = 'healthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else if (healthyCount < serviceConfigs.length) {
    overallStatus = 'degraded';
  }

  logger.info(`Health check complete: ${healthyCount}/${serviceConfigs.length} healthy, overall: ${overallStatus}`);

  return {
    services,
    overallStatus,
    timestamp: new Date()
  };
}

// Get current status for a specific service
export function getServiceStatus(serviceName: string): IServiceHealth | null {
  const state = serviceState.get(serviceName);
  if (!state) return null;

  return {
    name: serviceName,
    status: state.lastStatus,
    responseTime: state.lastResponseTime,
    lastChecked: new Date(),
    uptime: state.uptime
  };
}

// Get all service states
export function getAllServiceStates(): Map<string, {
  consecutiveFailures: number;
  lastStatus: ServiceStatus;
  lastResponseTime: number;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
}> {
  return new Map(serviceState);
}

// Reset service state (useful for testing)
export function resetServiceState(serviceName?: string): void {
  if (serviceName) {
    const state = serviceState.get(serviceName);
    if (state) {
      state.consecutiveFailures = 0;
      state.uptime = 100;
      state.totalChecks = 0;
      state.successfulChecks = 0;
    }
  } else {
    serviceConfigs.forEach(service => {
      const state = serviceState.get(service.name);
      if (state) {
        state.consecutiveFailures = 0;
        state.uptime = 100;
        state.totalChecks = 0;
        state.successfulChecks = 0;
      }
    });
  }
}
