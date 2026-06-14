import { v4 as uuidv4 } from 'uuid';
import { 
  TenantBranding, 
  Tenant, 
  CustomDomainConfig, 
  TenantStatus,
  BrandColors,
  TenantSettings,
  CreateTenantBrandingSchema,
  CustomDomainSchema,
  PaginatedResult,
  PaginationParams
} from '../types';
import logger from '../utils/logger';

const brandLogger = logger.child({ component: 'BrandService' });

// In-memory storage (replace with database in production)
const tenants: Map<string, Tenant> = new Map();
const brandings: Map<string, TenantBranding> = new Map();
const customDomains: Map<string, CustomDomainConfig> = new Map();

const DEFAULT_COLORS: BrandColors = {
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#f59e0b',
  background: '#ffffff',
  text: '#1e293b',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
};

const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  allowCustomDomains: true,
  maxClients: 50,
  maxUsers: 10,
  maxCampaigns: 100,
  features: ['dashboard', 'reports', 'invoices', 'analytics'],
  whiteLabel: true,
  clientPortalEnabled: true,
  analyticsEnabled: true,
  invoiceEnabled: true,
};

export class BrandService {
  // Tenant Management
  async createTenant(data: {
    name: string;
    slug: string;
    ownerId: string;
    plan?: 'starter' | 'professional' | 'enterprise';
  }): Promise<Tenant> {
    brandLogger.info('Creating tenant', { name: data.name, slug: data.slug });
    
    const tenant: Tenant = {
      id: uuidv4(),
      name: data.name,
      slug: data.slug,
      status: 'pending',
      ownerId: data.ownerId,
      plan: data.plan || 'starter',
      customDomains: [],
      settings: { ...DEFAULT_TENANT_SETTINGS },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    tenants.set(tenant.id, tenant);
    
    // Create default branding
    await this.createBranding({
      tenantId: tenant.id,
      brandName: data.name,
      colors: DEFAULT_COLORS,
    });
    
    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | null> {
    return tenants.get(id) || null;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of tenants.values()) {
      if (tenant.slug === slug) return tenant;
    }
    return null;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = tenants.get(id);
    if (!tenant) return null;
    
    const updated: Tenant = {
      ...tenant,
      ...data,
      id: tenant.id,
      createdAt: tenant.createdAt,
      updatedAt: new Date(),
    };
    
    tenants.set(id, updated);
    return updated;
  }

  async listTenants(pagination: PaginationParams): Promise<PaginatedResult<Tenant>> {
    const allTenants = Array.from(tenants.values());
    const total = allTenants.length;
    const totalPages = Math.ceil(total / pagination.limit);
    
    const start = (pagination.page - 1) * pagination.limit;
    const data = allTenants.slice(start, start + pagination.limit);
    
    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  // Branding Management
  async createBranding(data: z.infer<typeof CreateTenantBrandingSchema>): Promise<TenantBranding> {
    brandLogger.info('Creating branding for tenant', { tenantId: data.tenantId });
    
    const branding: TenantBranding = {
      id: uuidv4(),
      tenantId: data.tenantId,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      brandName: data.brandName,
      tagline: data.tagline,
      description: data.description,
      colors: data.colors,
      fontFamily: data.fontFamily,
      socialLinks: data.socialLinks,
      customCss: data.customCss,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    brandings.set(branding.id, branding);
    return branding;
  }

  async getBranding(tenantId: string): Promise<TenantBranding | null> {
    for (const branding of brandings.values()) {
      if (branding.tenantId === tenantId) return branding;
    }
    return null;
  }

  async updateBranding(tenantId: string, data: Partial<TenantBranding>): Promise<TenantBranding | null> {
    const branding = await this.getBranding(tenantId);
    if (!branding) return null;
    
    const updated: TenantBranding = {
      ...branding,
      ...data,
      id: branding.id,
      tenantId: branding.tenantId,
      createdAt: branding.createdAt,
      updatedAt: new Date(),
    };
    
    brandings.set(branding.id, updated);
    return updated;
  }

  async updateColors(tenantId: string, colors: BrandColors): Promise<TenantBranding | null> {
    return this.updateBranding(tenantId, { colors });
  }

  async uploadLogo(tenantId: string, logoUrl: string): Promise<TenantBranding | null> {
    return this.updateBranding(tenantId, { logoUrl });
  }

  async uploadFavicon(tenantId: string, faviconUrl: string): Promise<TenantBranding | null> {
    return this.updateBranding(tenantId, { faviconUrl });
  }

  async applyCustomCss(tenantId: string, css: string): Promise<TenantBranding | null> {
    return this.updateBranding(tenantId, { customCss: css });
  }

  async updateEmailTemplates(
    tenantId: string, 
    templates: Record<string, string>
  ): Promise<TenantBranding | null> {
    const branding = await this.getBranding(tenantId);
    if (!branding) return null;
    
    return this.updateBranding(tenantId, {
      emailTemplates: { ...branding.emailTemplates, ...templates },
    });
  }

  // Custom Domain Management
  async addCustomDomain(data: z.infer<typeof CustomDomainSchema>): Promise<CustomDomainConfig> {
    brandLogger.info('Adding custom domain', { tenantId: data.tenantId, domain: data.domain });
    
    const domain: CustomDomainConfig = {
      id: uuidv4(),
      tenantId: data.tenantId,
      domain: data.domain,
      isVerified: false,
      sslEnabled: false,
      createdAt: new Date(),
      dnsConfig: {
        type: 'CNAME',
        name: 'portal',
        value: `${data.tenantId}.portal.rez.app`,
      },
    };
    
    customDomains.set(domain.id, domain);
    
    // Update tenant's custom domains list
    const tenant = tenants.get(data.tenantId);
    if (tenant) {
      tenant.customDomains.push(data.domain);
      tenant.updatedAt = new Date();
    }
    
    return domain;
  }

  async getCustomDomains(tenantId: string): Promise<CustomDomainConfig[]> {
    const domains: CustomDomainConfig[] = [];
    for (const domain of customDomains.values()) {
      if (domain.tenantId === tenantId) domains.push(domain);
    }
    return domains;
  }

  async getCustomDomain(domain: string): Promise<CustomDomainConfig | null> {
    for (const config of customDomains.values()) {
      if (config.domain === domain) return config;
    }
    return null;
  }

  async verifyDomain(domainId: string, verificationData: {
    isVerified: boolean;
    sslEnabled?: boolean;
  }): Promise<CustomDomainConfig | null> {
    const domain = customDomains.get(domainId);
    if (!domain) return null;
    
    const updated: CustomDomainConfig = {
      ...domain,
      isVerified: verificationData.isVerified,
      verifiedAt: verificationData.isVerified ? new Date() : undefined,
      sslEnabled: verificationData.sslEnabled ?? domain.sslEnabled,
    };
    
    customDomains.set(domainId, updated);
    return updated;
  }

  async removeCustomDomain(domainId: string): Promise<boolean> {
    const domain = customDomains.get(domainId);
    if (!domain) return false;
    
    const tenant = tenants.get(domain.tenantId);
    if (tenant) {
      tenant.customDomains = tenant.customDomains.filter(d => d !== domain.domain);
      tenant.updatedAt = new Date();
    }
    
    return customDomains.delete(domainId);
  }

  // Tenant Status Management
  async activateTenant(tenantId: string): Promise<Tenant | null> {
    return this.updateTenant(tenantId, { status: 'active' });
  }

  async suspendTenant(tenantId: string): Promise<Tenant | null> {
    return this.updateTenant(tenantId, { status: 'suspended' });
  }

  // Preview branding (generate CSS variables)
  generateBrandingPreview(branding: TenantBranding): string {
    const { colors, fontFamily, customCss } = branding;
    
    const cssVars = `
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-background: ${colors.background};
        --color-text: ${colors.text};
        --color-error: ${colors.error};
        --color-success: ${colors.success};
        --color-warning: ${colors.warning};
        ${fontFamily ? `--font-family: '${fontFamily}', sans-serif;` : ''}
      }
      
      body {
        background-color: var(--color-background);
        color: var(--color-text);
        ${fontFamily ? `font-family: var(--font-family);` : ''}
      }
      
      ${customCss || ''}
    `;
    
    return cssVars;
  }

  // Get portal theme for a tenant
  async getPortalTheme(tenantId: string): Promise<{
    branding: TenantBranding;
    cssVariables: string;
  } | null> {
    const branding = await this.getBranding(tenantId);
    if (!branding) return null;
    
    return {
      branding,
      cssVariables: this.generateBrandingPreview(branding),
    };
  }
}

export const brandService = new BrandService();
export default brandService;
