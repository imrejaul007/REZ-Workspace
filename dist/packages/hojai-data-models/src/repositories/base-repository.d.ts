/**
 * Hojai Data Models - Repository Pattern
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Tenant-scoped repository pattern for all entities.
 */
import { z } from 'zod';
import { BaseEntity } from '../index';
/**
 * Base repository interface
 */
export interface IRepository<T extends BaseEntity> {
    create(data: unknown): Promise<T>;
    findById(id: string): Promise<T | null>;
    findOne(filter: Partial<T>): Promise<T | null>;
    findMany(filter?: Partial<T>, options?: FindOptions): Promise<T[]>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: Partial<T>): Promise<number>;
}
/**
 * Find options
 */
export interface FindOptions {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
}
/**
 * Abstract base repository
 */
export declare abstract class BaseRepository<T extends BaseEntity> {
    protected tenantId: string;
    constructor(tenantId: string);
    /**
     * Scope query to tenant
     */
    protected scopeFilter(filter?: Partial<T>): Partial<T>;
    /**
     * Generate tenant-scoped ID
     */
    protected generateId(prefix: string): string;
}
import { Tenant, TenantPlan, TenantCreateSchema, TenantUpdateSchema } from '../entities/tenant';
/**
 * Tenant repository
 */
export declare class TenantRepository {
    private tenants;
    create(data: z.infer<typeof TenantCreateSchema>): Promise<Tenant>;
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    update(id: string, data: z.infer<typeof TenantUpdateSchema>): Promise<Tenant | null>;
    upgradePlan(id: string, plan: TenantPlan): Promise<Tenant | null>;
    suspend(id: string): Promise<Tenant | null>;
    reactivate(id: string): Promise<Tenant | null>;
    churn(id: string): Promise<Tenant | null>;
    findAll(options?: FindOptions): Promise<Tenant[]>;
}
import { Consent, ConsentPurpose, ConsentChannel } from '../entities/consent';
/**
 * Consent repository
 */
export declare class ConsentRepository {
    private consents;
    create(tenantId: string, customerId: string, purpose: ConsentPurpose, granted: boolean, channel?: ConsentChannel): Promise<Consent>;
    findById(id: string): Promise<Consent | null>;
    findByCustomer(customerId: string): Promise<Consent[]>;
    findValidByCustomer(customerId: string): Promise<Consent[]>;
    withdraw(id: string, reason?: string): Promise<Consent | null>;
    getPreference(customerId: string, tenantId: string): Promise<{
        marketing: boolean;
        communication: boolean;
        allOptOut: boolean;
    }>;
}
import { Customer, CustomerCreateSchema, CustomerUpdateSchema } from '../entities/customer';
/**
 * Customer repository
 */
export declare class CustomerRepository {
    private customers;
    create(tenantId: string, data: z.infer<typeof CustomerCreateSchema>): Promise<Customer>;
    findById(id: string): Promise<Customer | null>;
    findByPhone(phone: string): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;
    findMany(options?: FindOptions): Promise<Customer[]>;
    update(id: string, data: z.infer<typeof CustomerUpdateSchema>): Promise<Customer | null>;
    updateMetrics(id: string, metrics: {
        lifetime_value?: number;
        order_count?: number;
        last_order_date?: string;
    }): Promise<Customer | null>;
    updateRisk(id: string, risk: 'low' | 'medium' | 'high', engagementScore: number): Promise<Customer | null>;
    count(): Promise<number>;
    delete(id: string): Promise<boolean>;
}
export type { IRepository, FindOptions };
export { BaseRepository };
export { TenantRepository, ConsentRepository, CustomerRepository };
//# sourceMappingURL=base-repository.d.ts.map