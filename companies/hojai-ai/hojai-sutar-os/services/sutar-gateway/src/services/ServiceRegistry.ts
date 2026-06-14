// ============================================================================
// SUTAR Gateway - Service Registry
// Dynamic service discovery and management
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  ServiceInstance,
  ServiceStatus,
  ServiceHealth,
  HealthCheck,
  ApiResponse,
} from '../types/index.js';

export interface ServiceRegistryConfig {
  heartbeatInterval: number;
  heartbeatTimeout: number;
  healthCheckInterval: number;
  maxServices: number;
  autoDeregister: boolean;
}

export interface ServiceRegistrationRequest {
  name: string;
  version: string;
  url: string;
  port: number;
  host: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  weight?: number;
  failover?: boolean;
  maxRequests?: number;
}

export interface ServiceDiscoveryQuery {
  name?: string;
  tags?: string[];
  status?: ServiceStatus;
  healthy?: boolean;
  limit?: number;
  offset?: number;
}

export class ServiceRegistry {
  private services: Map<string, ServiceInstance> = new Map();
  private serviceIndex: Map<string, Set<string>> = new Map(); // name -> serviceIds
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> serviceIds
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: ServiceRegistryConfig;
  private listeners: Set<(event: ServiceRegistryEvent) => void> = new Set();

  constructor(config: Partial<ServiceRegistryConfig> = {}) {
    this.config = {
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? 90000,
      healthCheckInterval: config.healthCheckInterval ?? 60000,
      maxServices: config.maxServices ?? 1000,
      autoDeregister: config.autoDeregister ?? true,
    };
    this.startCleanupTask();
  }

  // ---------------------------------------------------------------------------
  // Service Registration
  // ---------------------------------------------------------------------------

  register(request: ServiceRegistrationRequest): ApiResponse<ServiceInstance> {
    // Check if service already exists
    const existing = this.findByUrl(request.url);
    if (existing) {
      return this.successResponse(existing, 'Service already registered');
    }

    // Check max services limit
    if (this.services.size >= this.config.maxServices) {
      return this.errorResponse('Maximum number of services reached');
    }

    const service: ServiceInstance = {
      id: uuidv4(),
      name: request.name,
      version: request.version,
      url: request.url,
      port: request.port,
      host: request.host,
      status: 'starting',
      health: {
        status: 'unknown',
        latency: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        checks: [],
        score: 0,
      },
      metadata: request.metadata ?? {},
      tags: request.tags ?? [],
      weight: request.weight ?? 100,
      createdAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      failover: request.failover ?? false,
      maxRequests: request.maxRequests ?? 0,
      currentRequests: 0,
    };

    this.services.set(service.id, service);
    this.indexService(service);
    this.startHeartbeatMonitor(service.id);
    this.startHealthCheck(service.id);

    this.emit({
      type: 'registered',
      service: this.sanitizeService(service),
      timestamp: new Date().toISOString(),
    });

    return this.successResponse(service, 'Service registered successfully');
  }

  deregister(serviceId: string): ApiResponse<{ serviceId: string }> {
    const service = this.services.get(serviceId);
    if (!service) {
      return this.errorResponse('Service not found');
    }

    this.stopHeartbeatMonitor(serviceId);
    this.stopHealthCheck(serviceId);
    this.unindexService(service);
    this.services.delete(serviceId);

    this.emit({
      type: 'deregistered',
      serviceId,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse({ serviceId }, 'Service deregistered successfully');
  }

  // ---------------------------------------------------------------------------
  // Service Discovery
  // ---------------------------------------------------------------------------

  discover(query: ServiceDiscoveryQuery = {}): ApiResponse<{
    services: ServiceInstance[];
    total: number;
  }> {
    let services = Array.from(this.services.values());

    // Filter by name
    if (query.name) {
      services = services.filter(s => s.name === query.name);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      services = services.filter(s =>
        query.tags!.some(tag => s.tags.includes(tag))
      );
    }

    // Filter by status
    if (query.status) {
      services = services.filter(s => s.status === query.status);
    }

    // Filter by health
    if (query.healthy !== undefined) {
      services = services.filter(s =>
        query.healthy
          ? s.status === 'healthy' || s.status === 'degraded'
          : s.status === 'unhealthy'
      );
    }

    const total = services.length;

    // Apply pagination
    if (query.offset !== undefined) {
      services = services.slice(query.offset);
    }
    if (query.limit !== undefined) {
      services = services.slice(0, query.limit);
    }

    return this.successResponse({
      services: services.map(s => this.sanitizeService(s)),
      total,
    });
  }

  getService(serviceId: string): ApiResponse<ServiceInstance> {
    const service = this.services.get(serviceId);
    if (!service) {
      return this.errorResponse('Service not found');
    }
    return this.successResponse(this.sanitizeService(service));
  }

  getServiceByName(name: string): ApiResponse<ServiceInstance[]> {
    const serviceIds = this.serviceIndex.get(name);
    if (!serviceIds) {
      return this.successResponse({ services: [], total: 0 });
    }

    const services = Array.from(serviceIds)
      .map(id => this.services.get(id))
      .filter((s): s is ServiceInstance => s !== undefined)
      .map(s => this.sanitizeService(s));

    return this.successResponse({ services, total: services.length });
  }

  // ---------------------------------------------------------------------------
  // Heartbeat Management
  // ---------------------------------------------------------------------------

  receiveHeartbeat(serviceId: string, healthData?: Partial<ServiceHealth>): ApiResponse<{
    acknowledged: boolean;
    nextHeartbeat: string;
  }> {
    const service = this.services.get(serviceId);
    if (!service) {
      return this.errorResponse('Service not found');
    }

    service.lastHeartbeat = new Date().toISOString();

    if (healthData) {
      if (healthData.status) service.health.status = healthData.status;
      if (healthData.latency !== undefined) service.health.latency = healthData.latency;
      if (healthData.uptime !== undefined) service.health.uptime = healthData.uptime;
      if (healthData.checks) service.health.checks = healthData.checks;
      if (healthData.score !== undefined) service.health.score = healthData.score;
    }

    // Update service status based on health
    service.status = this.calculateServiceStatus(service);

    const nextHeartbeat = new Date(
      Date.now() + this.config.heartbeatInterval
    ).toISOString();

    this.emit({
      type: 'heartbeat',
      serviceId,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse({
      acknowledged: true,
      nextHeartbeat,
    });
  }

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  private startHealthCheck(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (!service) return;

    const performHealthCheck = async () => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${service.url}:${service.port}/health`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const latency = Date.now() - startTime;
        service.health.latency = latency;
        service.health.lastCheck = new Date().toISOString();

        if (response.ok) {
          const data = await response.json();
          service.health.checks = this.parseHealthChecks(data);
          service.health.status = 'healthy';
          service.health.score = this.calculateHealthScore(service.health.checks);
        } else {
          service.health.status = 'degraded';
          service.health.checks.push({
            name: 'http_check',
            status: 'warn',
            message: `HTTP ${response.status}`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        service.health.status = 'unhealthy';
        service.health.checks.push({
          name: 'connectivity',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Connection failed',
          timestamp: new Date().toISOString(),
        });
      }

      service.status = this.calculateServiceStatus(service);
    };

    const timer = setInterval(performHealthCheck, this.config.healthCheckInterval);
    this.healthCheckTimers.set(serviceId, timer);

    // Perform initial health check
    performHealthCheck();
  }

  private stopHealthCheck(serviceId: string): void {
    const timer = this.healthCheckTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(serviceId);
    }
  }

  private parseHealthChecks(data: unknown): HealthCheck[] {
    const checks: HealthCheck[] = [];

    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // Parse standard health response
      if (obj.status) {
        checks.push({
          name: 'service_status',
          status: obj.status === 'healthy' ? 'pass' : 'warn',
          message: `Status: ${obj.status}`,
          timestamp: new Date().toISOString(),
        });
      }

      if (obj.checks && Array.isArray(obj.checks)) {
        for (const check of obj.checks) {
          if (typeof check === 'object' && check !== null) {
            const c = check as Record<string, unknown>;
            checks.push({
              name: String(c.name ?? 'unknown'),
              status: (c.status as 'pass' | 'fail' | 'warn') ?? 'warn',
              message: String(c.message ?? ''),
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return checks;
  }

  private calculateHealthScore(checks: HealthCheck[]): number {
    if (checks.length === 0) return 0;

    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;

    return Math.round(((passCount * 1 + warnCount * 0.5) / checks.length) * 100);
  }

  private calculateServiceStatus(service: ServiceInstance): ServiceStatus {
    const staleThreshold = Date.now() - this.config.heartbeatTimeout;
    const lastHeartbeat = new Date(service.lastHeartbeat).getTime();

    if (lastHeartbeat < staleThreshold) {
      return 'unhealthy';
    }

    switch (service.health.status) {
      case 'healthy':
        return 'healthy';
      case 'degraded':
        return 'degraded';
      case 'unhealthy':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  }

  // ---------------------------------------------------------------------------
  // Heartbeat Monitoring
  // ---------------------------------------------------------------------------

  private startHeartbeatMonitor(serviceId: string): void {
    const monitor = () => {
      const service = this.services.get(serviceId);
      if (!service) {
        this.stopHeartbeatMonitor(serviceId);
        return;
      }

      const staleThreshold = Date.now() - this.config.heartbeatTimeout;
      const lastHeartbeat = new Date(service.lastHeartbeat).getTime();

      if (lastHeartbeat < staleThreshold) {
        if (this.config.autoDeregister) {
          console.log(`[Registry] Service ${serviceId} heartbeat stale, deregistering`);
          this.deregister(serviceId);
        } else {
          service.status = 'unhealthy';
          this.emit({
            type: 'stale',
            serviceId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    const timer = setInterval(monitor, this.config.heartbeatInterval / 2);
    this.heartbeatTimers.set(serviceId, timer);
  }

  private stopHeartbeatMonitor(serviceId: string): void {
    const timer = this.heartbeatTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(serviceId);
    }
  }

  private startCleanupTask(): void {
    setInterval(() => {
      const staleServices: string[] = [];
      const threshold = Date.now() - this.config.heartbeatTimeout;

      for (const [id, service] of this.services) {
        const lastHeartbeat = new Date(service.lastHeartbeat).getTime();
        if (lastHeartbeat < threshold) {
          staleServices.push(id);
        }
      }

      if (staleServices.length > 0 && this.config.autoDeregister) {
        console.log(`[Registry] Cleaning up ${staleServices.length} stale services`);
        for (const id of staleServices) {
          this.deregister(id);
        }
      }
    }, this.config.heartbeatInterval);
  }

  // ---------------------------------------------------------------------------
  // Indexing
  // ---------------------------------------------------------------------------

  private indexService(service: ServiceInstance): void {
    // Index by name
    if (!this.serviceIndex.has(service.name)) {
      this.serviceIndex.set(service.name, new Set());
    }
    this.serviceIndex.get(service.name)!.add(service.id);

    // Index by tags
    for (const tag of service.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(service.id);
    }
  }

  private unindexService(service: ServiceInstance): void {
    // Remove from name index
    const nameSet = this.serviceIndex.get(service.name);
    if (nameSet) {
      nameSet.delete(service.id);
      if (nameSet.size === 0) {
        this.serviceIndex.delete(service.name);
      }
    }

    // Remove from tag index
    for (const tag of service.tags) {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(service.id);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private findByUrl(url: string): ServiceInstance | undefined {
    for (const service of this.services.values()) {
      if (service.url === url) {
        return service;
      }
    }
    return undefined;
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  onEvent(listener: (event: ServiceRegistryEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: ServiceRegistryEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: ServiceRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[Registry] Event listener error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private sanitizeService(service: ServiceInstance): ServiceInstance {
    return {
      ...service,
      // Remove sensitive metadata
      metadata: { ...service.metadata },
    };
  }

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  getStats(): ApiResponse<{
    totalServices: number;
    byStatus: Record<ServiceStatus, number>;
    byName: Record<string, number>;
    indexSize: number;
  }> {
    const byStatus: Record<ServiceStatus, number> = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0,
      starting: 0,
      stopping: 0,
    };

    const byName: Record<string, number> = {};

    for (const service of this.services.values()) {
      byStatus[service.status]++;
      byName[service.name] = (byName[service.name] ?? 0) + 1;
    }

    return this.successResponse({
      totalServices: this.services.size,
      byStatus,
      byName,
      indexSize: this.serviceIndex.size + this.tagIndex.size,
    });
  }

  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values()).map(s => this.sanitizeService(s));
  }

  destroy(): void {
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();
    this.healthCheckTimers.clear();
    this.services.clear();
    this.serviceIndex.clear();
    this.tagIndex.clear();
    this.listeners.clear();
  }
}

export interface ServiceRegistryEvent {
  type: 'registered' | 'deregistered' | 'heartbeat' | 'stale' | 'health_change';
  serviceId?: string;
  service?: ServiceInstance;
  timestamp: string;
}

// Singleton instance
export const serviceRegistry = new ServiceRegistry();
