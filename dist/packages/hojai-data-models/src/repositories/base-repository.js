/**
 * Hojai Data Models - Repository Pattern
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Tenant-scoped repository pattern for all entities.
 */
/**
 * Abstract base repository
 */
export class BaseRepository {
    tenantId;
    constructor(tenantId) {
        this.tenantId = tenantId;
    }
    /**
     * Scope query to tenant
     */
    scopeFilter(filter = {}) {
        return { ...filter, tenant_id: this.tenantId };
    }
    /**
     * Generate tenant-scoped ID
     */
    generateId(prefix) {
        return `${prefix}_${this.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
// ============================================
// TENANT REPOSITORY
// ============================================
import { createTenant, upgradeTenantPlan, suspendTenant, reactivateTenant, churnTenant, } from '../entities/tenant';
/**
 * Tenant repository
 */
export class TenantRepository {
    tenants = new Map();
    async create(data) {
        const tenant = createTenant(data);
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }
    async findById(id) {
        return this.tenants.get(id) || null;
    }
    async findBySlug(slug) {
        for (const tenant of this.tenants.values()) {
            if (tenant.slug === slug)
                return tenant;
        }
        return null;
    }
    async update(id, data) {
        const tenant = this.tenants.get(id);
        if (!tenant)
            return null;
        const updated = {
            ...tenant,
            ...data,
            contact: data.contact ? { ...tenant.contact, ...data.contact } : tenant.contact,
            branding: data.branding ? { ...tenant.branding, ...data.branding } : tenant.branding,
            updated_at: new Date().toISOString(),
        };
        this.tenants.set(id, updated);
        return updated;
    }
    async upgradePlan(id, plan) {
        const tenant = this.tenants.get(id);
        if (!tenant)
            return null;
        const updated = upgradeTenantPlan(tenant, plan);
        this.tenants.set(id, updated);
        return updated;
    }
    async suspend(id) {
        const tenant = this.tenants.get(id);
        if (!tenant)
            return null;
        const updated = suspendTenant(tenant);
        this.tenants.set(id, updated);
        return updated;
    }
    async reactivate(id) {
        const tenant = this.tenants.get(id);
        if (!tenant)
            return null;
        const updated = reactivateTenant(tenant);
        this.tenants.set(id, updated);
        return updated;
    }
    async churn(id) {
        const tenant = this.tenants.get(id);
        if (!tenant)
            return null;
        const updated = churnTenant(tenant);
        this.tenants.set(id, updated);
        return updated;
    }
    async findAll(options) {
        const tenants = Array.from(this.tenants.values());
        return tenants.slice(options?.skip || 0, options?.limit || tenants.length);
    }
}
// ============================================
// CONSENT REPOSITORY
// ============================================
import { grantConsent, denyConsent, withdrawConsent, isConsentValid, getCustomerConsentPreference, ConsentCreateSchema, } from '../entities/consent';
/**
 * Consent repository
 */
export class ConsentRepository {
    consents = new Map();
    async create(tenantId, customerId, purpose, granted, channel = 'app') {
        const data = { customer_id: customerId, purpose, channel };
        const consent = granted
            ? grantConsent(tenantId, ConsentCreateSchema.parse(data))
            : denyConsent(tenantId, ConsentCreateSchema.parse(data));
        this.consents.set(consent.id, consent);
        return consent;
    }
    async findById(id) {
        return this.consents.get(id) || null;
    }
    async findByCustomer(customerId) {
        const results = [];
        for (const consent of this.consents.values()) {
            if (consent.customer_id === customerId) {
                results.push(consent);
            }
        }
        return results;
    }
    async findValidByCustomer(customerId) {
        const consents = await this.findByCustomer(customerId);
        return consents.filter(isConsentValid);
    }
    async withdraw(id, reason) {
        const consent = this.consents.get(id);
        if (!consent)
            return null;
        const updated = withdrawConsent(consent, reason);
        this.consents.set(id, updated);
        return updated;
    }
    async getPreference(customerId, tenantId) {
        const consents = await this.findByCustomer(customerId);
        const pref = getCustomerConsentPreference(customerId, tenantId, consents);
        return {
            marketing: !pref.marketing_opt_out,
            communication: !pref.all_communication_opt_out,
            allOptOut: pref.all_communication_opt_out,
        };
    }
}
// ============================================
// CUSTOMER REPOSITORY
// ============================================
import { createCustomer, updateCustomerMetrics, updateCustomerRisk, } from '../entities/customer';
/**
 * Customer repository
 */
export class CustomerRepository {
    customers = new Map();
    async create(tenantId, data) {
        const customer = createCustomer(tenantId, data);
        this.customers.set(customer.id, customer);
        return customer;
    }
    async findById(id) {
        return this.customers.get(id) || null;
    }
    async findByPhone(phone) {
        for (const customer of this.customers.values()) {
            if (customer.phone === phone)
                return customer;
        }
        return null;
    }
    async findByEmail(email) {
        for (const customer of this.customers.values()) {
            if (customer.email === email)
                return customer;
        }
        return null;
    }
    async findMany(options) {
        const customers = Array.from(this.customers.values());
        return customers.slice(options?.skip || 0, options?.limit || customers.length);
    }
    async update(id, data) {
        const customer = this.customers.get(id);
        if (!customer)
            return null;
        const updated = {
            ...customer,
            ...data,
            preferences: data.preferences
                ? { ...customer.preferences, ...data.preferences }
                : customer.preferences,
            updated_at: new Date().toISOString(),
        };
        this.customers.set(id, updated);
        return updated;
    }
    async updateMetrics(id, metrics) {
        const customer = this.customers.get(id);
        if (!customer)
            return null;
        const updated = updateCustomerMetrics(customer, metrics);
        this.customers.set(id, updated);
        return updated;
    }
    async updateRisk(id, risk, engagementScore) {
        const customer = this.customers.get(id);
        if (!customer)
            return null;
        const updated = updateCustomerRisk(customer, risk, engagementScore);
        this.customers.set(id, updated);
        return updated;
    }
    async count() {
        return this.customers.size;
    }
    async delete(id) {
        return this.customers.delete(id);
    }
}
//# sourceMappingURL=base-repository.js.map