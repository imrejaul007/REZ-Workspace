import { v4 as uuidv4 } from 'uuid';
import { Tenant, BrandingConfig, CreateTenantSchema, UpdateTenantSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('TenantService');

// In-memory storage (replace with database in production)
const tenants: Map<string, Tenant> = new Map();

export class TenantService {
  async create(data: unknown): Promise<Tenant> {
    const parsed = CreateTenantSchema.parse(data);

    // Check for duplicate slug
    const existingBySlug = Array.from(tenants.values()).find(t => t.slug === parsed.slug);
    if (existingBySlug) {
      throw new Error(`Tenant with slug '${parsed.slug}' already exists`);
    }

    const tenant: Tenant = {
      id: uuidv4(),
      name: parsed.name,
      slug: parsed.slug,
      customBranding: parsed.customBranding,
      domain: parsed.domain,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tenants.set(tenant.id, tenant);
    logger.info('Tenant created', { tenantId: tenant.id, slug: tenant.slug });

    return tenant;
  }

  async findById(id: string): Promise<Tenant | null> {
    return tenants.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = Array.from(tenants.values()).find(t => t.slug === slug);
    return tenant || null;
  }

  async findAll(): Promise<Tenant[]> {
    return Array.from(tenants.values());
  }

  async update(id: string, data: unknown): Promise<Tenant | null> {
    const existing = tenants.get(id);
    if (!existing) {
      return null;
    }

    const parsed = UpdateTenantSchema.parse(data);

    // Check for duplicate slug if slug is being updated
    if (parsed.slug && parsed.slug !== existing.slug) {
      const existingBySlug = Array.from(tenants.values()).find(
        t => t.slug === parsed.slug && t.id !== id
      );
      if (existingBySlug) {
        throw new Error(`Tenant with slug '${parsed.slug}' already exists`);
      }
    }

    const updated: Tenant = {
      ...existing,
      ...parsed,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    tenants.set(id, updated);
    logger.info('Tenant updated', { tenantId: id });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = tenants.delete(id);
    if (deleted) {
      logger.info('Tenant deleted', { tenantId: id });
    }
    return deleted;
  }

  async updateBranding(id: string, branding: Partial<BrandingConfig>): Promise<Tenant | null> {
    const existing = tenants.get(id);
    if (!existing) {
      return null;
    }

    const updated: Tenant = {
      ...existing,
      customBranding: {
        ...existing.customBranding,
        ...branding,
      },
      updatedAt: new Date(),
    };

    tenants.set(id, updated);
    logger.info('Tenant branding updated', { tenantId: id });

    return updated;
  }
}

export const tenantService = new TenantService();
