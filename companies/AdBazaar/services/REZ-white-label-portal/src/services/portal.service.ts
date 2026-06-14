import { v4 as uuidv4 } from 'uuid';
import {
  Report,
  ReportType,
  ReportFormat,
  ReportFilters,
  ReportSchedule,
  CreateReportSchema,
  PaginatedResult,
  PaginationParams,
  TenantBranding,
  PortalUser,
  PortalAccess
} from '../types';
import { brandService } from './brand.service';
import { clientService } from './client.service';
import logger from '../utils/logger';

const portalLogger = logger.child({ component: 'PortalService' });

// In-memory storage
const reports: Map<string, Report> = new Map();
const portalUsers: Map<string, PortalUser> = new Map();
const portalAccess: Map<string, PortalAccess> = new Map();

export interface PortalPageData {
  tenantId: string;
  clientId?: string;
  page: string;
  branding: TenantBranding | null;
  data?: Record<string, unknown>;
  user?: PortalUser;
}

export interface RenderedPortalPage {
  html: string;
  css: string;
  js: string;
  metadata: {
    title: string;
    description?: string;
  };
}

export class PortalService {
  // ============== Portal Page Rendering ==============

  async getPortalPage(tenantId: string, page: string, clientId?: string): Promise<RenderedPortalPage | null> {
    portalLogger.info('Rendering portal page', { tenantId, page, clientId });
    
    const theme = await brandService.getPortalTheme(tenantId);
    if (!theme) return null;
    
    const baseTemplate = this.getBaseTemplate(theme.branding);
    
    switch (page) {
      case 'dashboard':
        return this.renderDashboard(baseTemplate, tenantId, clientId);
      case 'campaigns':
        return this.renderCampaigns(baseTemplate, tenantId, clientId);
      case 'reports':
        return this.renderReports(baseTemplate, tenantId, clientId);
      case 'invoices':
        return this.renderInvoices(baseTemplate, tenantId, clientId);
      case 'settings':
        return this.renderSettings(baseTemplate, tenantId, clientId);
      default:
        return this.renderDashboard(baseTemplate, tenantId, clientId);
    }
  }

  private getBaseTemplate(branding: TenantBranding): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${branding.brandName} - Client Portal</title>
        <link rel="icon" href="${branding.faviconUrl || '/favicon.ico'}">
        <style id="theme-styles"></style>
        <style id="custom-styles">
          /* Base styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: ${branding.fontFamily || 'system-ui, sans-serif'}; }
          
          /* Layout */
          .portal-container { display: flex; min-height: 100vh; }
          .portal-sidebar { width: 250px; background: var(--color-primary); }
          .portal-main { flex: 1; padding: 2rem; }
          
          /* Navigation */
          .nav-item { padding: 1rem; color: white; cursor: pointer; }
          .nav-item:hover { background: rgba(255,255,255,0.1); }
          .nav-item.active { background: rgba(255,255,255,0.2); }
          
          /* Cards */
          .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .card-header { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
          
          /* Metrics */
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
          .metric-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .metric-value { font-size: 2rem; font-weight: 700; color: var(--color-primary); }
          .metric-label { color: var(--color-secondary); font-size: 0.875rem; }
          
          /* Tables */
          .data-table { width: 100%; border-collapse: collapse; }
          .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .data-table th { background: #f9fafb; font-weight: 600; }
          
          /* Buttons */
          .btn { padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; border: none; font-size: 0.875rem; }
          .btn-primary { background: var(--color-primary); color: white; }
          .btn-secondary { background: var(--color-secondary); color: white; }
          
          /* Logo */
          .brand-logo { max-height: 40px; margin: 1rem; }
        </style>
      </head>
      <body>
        <div class="portal-container">
          <aside class="portal-sidebar">
            <img src="${branding.logoUrl || '/placeholder-logo.png'}" alt="${branding.brandName}" class="brand-logo">
            <nav class="portal-nav">
              <a href="/portal/dashboard" class="nav-item" data-page="dashboard">Dashboard</a>
              <a href="/portal/campaigns" class="nav-item" data-page="campaigns">Campaigns</a>
              <a href="/portal/reports" class="nav-item" data-page="reports">Reports</a>
              <a href="/portal/invoices" class="nav-item" data-page="invoices">Invoices</a>
              <a href="/portal/settings" class="nav-item" data-page="settings">Settings</a>
            </nav>
          </aside>
          <main class="portal-main">
            <div id="portal-content"></div>
          </main>
        </div>
        <script id="portal-data" type="application/json"></script>
        <script>
          // Initialize portal
          document.addEventListener('DOMContentLoaded', function() {
            // Apply theme styles
            const themeStyles = document.getElementById('theme-styles');
            if (themeStyles) {
              themeStyles.textContent = \`${brandService.generateBrandingPreview(branding)}\`;
            }
            
            // Highlight active nav item
            const currentPage = window.location.pathname.split('/').pop();
            document.querySelectorAll('.nav-item').forEach(item => {
              if (item.getAttribute('data-page') === currentPage) {
                item.classList.add('active');
              }
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private renderDashboard(template: string, tenantId: string, clientId?: string): RenderedPortalPage {
    const html = template.replace('<div id="portal-content"></div>', `
      <h1>Dashboard</h1>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value" id="total-impressions">-</div>
          <div class="metric-label">Total Impressions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="total-clicks">-</div>
          <div class="metric-label">Total Clicks</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="total-conversions">-</div>
          <div class="metric-label">Conversions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="total-spend">-</div>
          <div class="metric-label">Total Spend</div>
        </div>
      </div>
      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">Recent Campaigns</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Spend</th>
              <th>CTR</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody id="campaigns-table-body">
            <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `);
    
    return {
      html,
      css: '',
      js: `
        // Fetch dashboard data
        async function loadDashboard() {
          try {
            const response = await fetch('/api/analytics/${tenantId}${clientId ? '/client/' + clientId : ''}');
            const data = await response.json();
            
            if (data.success && data.data) {
              const overview = data.data.overview;
              document.getElementById('total-impressions').textContent = formatNumber(overview.totalImpressions);
              document.getElementById('total-clicks').textContent = formatNumber(overview.totalClicks);
              document.getElementById('total-conversions').textContent = formatNumber(overview.totalConversions);
              document.getElementById('total-spend').textContent = formatCurrency(overview.totalSpend);
            }
          } catch (error) {
            logger.error('Failed to load dashboard:', error);
          }
        }
        
        function formatNumber(num) {
          if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
          if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
          return num.toString();
        }
        
        function formatCurrency(amount) {
          return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
        }
        
        loadDashboard();
      `,
      metadata: {
        title: 'Dashboard - Client Portal',
        description: 'View your campaign performance and metrics',
      },
    };
  }

  private renderCampaigns(template: string, tenantId: string, clientId?: string): RenderedPortalPage {
    const html = template.replace('<div id="portal-content"></div>', `
      <h1>Campaigns</h1>
      <div style="margin: 1rem 0;">
        <button class="btn btn-primary" onclick="exportCampaigns()">Export CSV</button>
      </div>
      <div class="card">
        <table class="data-table" id="campaigns-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody id="campaigns-tbody">
            <tr><td colspan="9" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `);
    
    return {
      html,
      css: '',
      js: `
        async function loadCampaigns() {
          try {
            const response = await fetch('/api/analytics/${tenantId}/campaigns${clientId ? '?clientId=' + clientId : ''}');
            const data = await response.json();
            
            if (data.success && data.data) {
              const tbody = document.getElementById('campaigns-tbody');
              tbody.innerHTML = data.data.map(campaign => \`
                <tr>
                  <td>\${campaign.campaignName}</td>
                  <td>\${campaign.platform}</td>
                  <td><span class="status-badge">\${campaign.status}</span></td>
                  <td>\${formatCurrency(campaign.budget)}</td>
                  <td>\${formatCurrency(campaign.spent)}</td>
                  <td>\${formatNumber(campaign.impressions)}</td>
                  <td>\${formatNumber(campaign.clicks)}</td>
                  <td>\${campaign.ctr.toFixed(2)}%</td>
                  <td>\${campaign.roas.toFixed(2)}x</td>
                </tr>
              \`).join('');
            }
          } catch (error) {
            logger.error('Failed to load campaigns:', error);
          }
        }
        
        function exportCampaigns() {
          window.location.href = '/api/analytics/${tenantId}/export/campaigns${clientId ? '?clientId=' + clientId : ''}&format=csv';
        }
        
        loadCampaigns();
      `,
      metadata: {
        title: 'Campaigns - Client Portal',
        description: 'View and manage your advertising campaigns',
      },
    };
  }

  private renderReports(template: string, tenantId: string, clientId?: string): RenderedPortalPage {
    const html = template.replace('<div id="portal-content"></div>', `
      <h1>Reports</h1>
      <div style="margin: 1rem 0;">
        <button class="btn btn-primary" onclick="createReport()">Create New Report</button>
      </div>
      <div class="card">
        <div class="card-header">Your Reports</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Format</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="reports-tbody">
            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `);
    
    return {
      html,
      css: '',
      js: `
        async function loadReports() {
          try {
            const response = await fetch('/api/portal/${tenantId}/reports${clientId ? '?clientId=' + clientId : ''}');
            const data = await response.json();
            
            if (data.success && data.data) {
              const tbody = document.getElementById('reports-tbody');
              tbody.innerHTML = data.data.map(report => \`
                <tr>
                  <td>\${report.name}</td>
                  <td>\${report.type}</td>
                  <td>\${report.format.toUpperCase()}</td>
                  <td>\${report.status}</td>
                  <td>\${new Date(report.createdAt).toLocaleDateString()}</td>
                  <td>
                    \${report.status === 'ready' ? \`<a href="\${report.downloadUrl}" class="btn btn-secondary">Download</a>\` : ''}
                  </td>
                </tr>
              \`).join('') || '<tr><td colspan="6" style="text-align: center;">No reports found</td></tr>';
            }
          } catch (error) {
            logger.error('Failed to load reports:', error);
          }
        }
        
        function createReport() {
          window.location.href = '/portal/reports/create';
        }
        
        loadReports();
      `,
      metadata: {
        title: 'Reports - Client Portal',
        description: 'View and download your performance reports',
      },
    };
  }

  private renderInvoices(template: string, tenantId: string, clientId?: string): RenderedPortalPage {
    const html = template.replace('<div id="portal-content"></div>', `
      <h1>Invoices</h1>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="invoices-tbody">
            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `);
    
    return {
      html,
      css: '',
      js: `
        async function loadInvoices() {
          try {
            const response = await fetch('/api/invoices/tenant/${tenantId}${clientId ? '?clientId=' + clientId : ''}');
            const data = await response.json();
            
            if (data.success && data.data) {
              const tbody = document.getElementById('invoices-tbody');
              tbody.innerHTML = data.data.map(invoice => \`
                <tr>
                  <td>\${invoice.invoiceNumber}</td>
                  <td>\${new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td>\${new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td>\${formatCurrency(invoice.total)}</td>
                  <td><span class="status-badge status-\${invoice.status}">\${invoice.status}</span></td>
                  <td>
                    <a href="/api/invoices/\${invoice.id}/pdf" class="btn btn-secondary">PDF</a>
                  </td>
                </tr>
              \`).join('') || '<tr><td colspan="6" style="text-align: center;">No invoices found</td></tr>';
            }
          } catch (error) {
            logger.error('Failed to load invoices:', error);
          }
        }
        
        loadInvoices();
      `,
      metadata: {
        title: 'Invoices - Client Portal',
        description: 'View and pay your invoices',
      },
    };
  }

  private renderSettings(template: string, tenantId: string, clientId?: string): RenderedPortalPage {
    const html = template.replace('<div id="portal-content"></div>', `
      <h1>Settings</h1>
      <div class="card">
        <div class="card-header">Notification Preferences</div>
        <form id="settings-form">
          <div style="margin: 1rem 0;">
            <label>
              <input type="checkbox" id="email-notifications" checked>
              Receive email notifications
            </label>
          </div>
          <div style="margin: 1rem 0;">
            <label>
              <input type="checkbox" id="weekly-reports">
              Weekly performance reports
            </label>
          </div>
          <button type="submit" class="btn btn-primary">Save Settings</button>
        </form>
      </div>
    `);
    
    return {
      html,
      css: '',
      js: `
        document.getElementById('settings-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          alert('Settings saved successfully!');
        });
      `,
      metadata: {
        title: 'Settings - Client Portal',
        description: 'Manage your portal preferences',
      },
    };
  }

  // ============== Report Management ==============

  async createReport(data: z.infer<typeof CreateReportSchema>): Promise<Report> {
    portalLogger.info('Creating report', { tenantId: data.tenantId, clientId: data.clientId, type: data.type });
    
    const report: Report = {
      id: uuidv4(),
      tenantId: data.tenantId,
      clientId: data.clientId,
      name: data.name,
      type: data.type,
      format: data.format,
      status: 'generating',
      filters: data.filters,
      scheduled: data.scheduled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    reports.set(report.id, report);
    
    // Simulate report generation
    setTimeout(() => {
      this.completeReportGeneration(report.id);
    }, 2000);
    
    return report;
  }

  private async completeReportGeneration(reportId: string): Promise<void> {
    const report = reports.get(reportId);
    if (report) {
      report.status = 'ready';
      report.generatedAt = new Date();
      report.downloadUrl = `/api/portal/reports/${reportId}/download`;
      report.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      report.updatedAt = new Date();
      reports.set(reportId, report);
    }
  }

  async getReport(id: string): Promise<Report | null> {
    return reports.get(id) || null;
  }

  async listReports(
    tenantId: string,
    clientId?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Report>> {
    let filtered = Array.from(reports.values()).filter(r => r.tenantId === tenantId);
    
    if (clientId) {
      filtered = filtered.filter(r => r.clientId === clientId);
    }
    
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    
    return {
      data: filtered.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async deleteReport(id: string): Promise<boolean> {
    return reports.delete(id);
  }

  // ============== Portal User Management ==============

  async createPortalUser(data: {
    clientId: string;
    tenantId: string;
    email: string;
    name: string;
    role?: 'viewer' | 'editor' | 'admin';
  }): Promise<PortalUser> {
    portalLogger.info('Creating portal user', { clientId: data.clientId, email: data.email });
    
    const user: PortalUser = {
      id: uuidv4(),
      clientId: data.clientId,
      tenantId: data.tenantId,
      email: data.email,
      name: data.name,
      role: data.role || 'viewer',
      permissions: this.getDefaultPermissions(data.role || 'viewer'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    portalUsers.set(user.id, user);
    return user;
  }

  private getDefaultPermissions(role: 'viewer' | 'editor' | 'admin'): string[] {
    const basePermissions = ['view:dashboard', 'view:campaigns'];
    
    switch (role) {
      case 'viewer':
        return [...basePermissions, 'view:reports', 'view:invoices'];
      case 'editor':
        return [...basePermissions, 'view:reports', 'view:invoices', 'download:reports'];
      case 'admin':
        return [...basePermissions, 'view:reports', 'view:invoices', 'download:reports', 'manage:settings', 'manage:users'];
      default:
        return basePermissions;
    }
  }

  async getPortalUser(id: string): Promise<PortalUser | null> {
    return portalUsers.get(id) || null;
  }

  async getPortalUserByEmail(email: string): Promise<PortalUser | null> {
    for (const user of portalUsers.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async updatePortalUser(id: string, updates: Partial<PortalUser>): Promise<PortalUser | null> {
    const user = portalUsers.get(id);
    if (!user) return null;
    
    const updated: PortalUser = {
      ...user,
      ...updates,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };
    
    portalUsers.set(id, updated);
    return updated;
  }

  async deactivatePortalUser(id: string): Promise<PortalUser | null> {
    return this.updatePortalUser(id, { isActive: false });
  }

  async recordLogin(userId: string): Promise<void> {
    const user = portalUsers.get(userId);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      portalUsers.set(userId, user);
    }
  }

  // ============== Portal Access Control ==============

  async grantAccess(data: {
    clientId: string;
    userId: string;
    grantedBy: string;
    expiresAt?: Date;
  }): Promise<PortalAccess> {
    portalLogger.info('Granting portal access', { clientId: data.clientId, userId: data.userId });
    
    const access: PortalAccess = {
      id: uuidv4(),
      clientId: data.clientId,
      userId: data.userId,
      grantedBy: data.grantedBy,
      grantedAt: new Date(),
      expiresAt: data.expiresAt,
      isActive: true,
    };
    
    portalAccess.set(access.id, access);
    return access;
  }

  async checkAccess(userId: string, clientId: string): Promise<boolean> {
    for (const access of portalAccess.values()) {
      if (access.userId === userId && access.clientId === clientId && access.isActive) {
        if (access.expiresAt && new Date() > access.expiresAt) {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  async revokeAccess(accessId: string): Promise<boolean> {
    const access = portalAccess.get(accessId);
    if (!access) return false;
    
    access.isActive = false;
    portalAccess.set(accessId, access);
    return true;
  }

  // ============== White-label Configuration ==============

  async getWhiteLabelConfig(tenantId: string): Promise<{
    enabled: boolean;
    customDomain?: string;
    branding: TenantBranding | null;
  }> {
    const theme = await brandService.getPortalTheme(tenantId);
    
    return {
      enabled: true,
      customDomain: undefined,
      branding: theme?.branding || null,
    };
  }

  // ============== Embed Codes ==============

  generateDashboardEmbedCode(tenantId: string, clientId?: string, options?: {
    width?: string;
    height?: string;
    theme?: 'light' | 'dark';
  }): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4802';
    const width = options?.width || '100%';
    const height = options?.height || '600px';
    
    return `<!-- ReZ Client Portal Dashboard Embed -->
<iframe 
  src="${baseUrl}/portal/embed/dashboard?tenant=${tenantId}${clientId ? '&client=' + clientId : ''}"
  width="${width}"
  height="${height}"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
  title="Client Portal Dashboard"
></iframe>`;
  }

  generateReportEmbedCode(reportId: string, options?: {
    width?: string;
    height?: string;
  }): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4802';
    const width = options?.width || '100%';
    const height = options?.height || '800px';
    
    return `<!-- ReZ Client Report Embed -->
<iframe 
  src="${baseUrl}/portal/embed/report/${reportId}"
  width="${width}"
  height="${height}"
  style="border: none; border-radius: 8px;"
  title="Performance Report"
></iframe>`;
  }
}

export const portalService = new PortalService();
export default portalService;
