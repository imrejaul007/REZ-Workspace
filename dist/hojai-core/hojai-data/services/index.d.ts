/**
 * Hojai Data Platform - Service Index
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Main service entry point
 */
import { BaseService, BaseServiceConfig } from '../../shared/base-service';
import { TenantRepository } from './repositories/tenant-repository';
import { CustomerRepository } from './repositories/customer-repository';
import { OrderRepository } from './repositories/order-repository';
/**
 * Hojai Data Service Configuration
 */
interface DataServiceConfig extends BaseServiceConfig {
    mongodbUri: string;
    databaseName: string;
}
/**
 * Hojai Data Service
 * Provides unified access to all canonical entities
 */
export declare class HojaiDataService extends BaseService {
    private mongoClient;
    private db;
    private config;
    constructor(config: DataServiceConfig);
    /**
     * Initialize database connection
     */
    initialize(): Promise<void>;
    /**
     * Create database indexes
     */
    private createIndexes;
    /**
     * Get tenant repository
     */
    getTenantRepository(tenant_id: string): TenantRepository;
    /**
     * Get customer repository
     */
    getCustomerRepository(tenant_id: string): CustomerRepository;
    /**
     * Get order repository
     */
    getOrderRepository(tenant_id: string): OrderRepository;
    /**
     * Setup routes
     */
    protected setupRoutes(): void;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map