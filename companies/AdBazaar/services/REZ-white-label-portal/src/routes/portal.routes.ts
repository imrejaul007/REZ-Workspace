import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { portalService } from '../services/portal.service';
import { CreateReportSchema } from '../types';
import logger from '../utils/logger';

const portalLogger = logger.child({ component: 'PortalRoutes' });
const router = Router();

// ============== Portal Page Routes ==============

// Get portal dashboard page
router.get('/page/:tenantId/dashboard', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.client as string | undefined;
    
    const page = await portalService.getPortalPage(tenantId, 'dashboard', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render dashboard', { error });
    res.status(500).send('Internal server error');
  }
});

// Get portal campaigns page
router.get('/page/:tenantId/campaigns', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.client as string | undefined;
    
    const page = await portalService.getPortalPage(tenantId, 'campaigns', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render campaigns', { error });
    res.status(500).send('Internal server error');
  }
});

// Get portal reports page
router.get('/page/:tenantId/reports', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.client as string | undefined;
    
    const page = await portalService.getPortalPage(tenantId, 'reports', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render reports', { error });
    res.status(500).send('Internal server error');
  }
});

// Get portal invoices page
router.get('/page/:tenantId/invoices', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.client as string | undefined;
    
    const page = await portalService.getPortalPage(tenantId, 'invoices', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render invoices', { error });
    res.status(500).send('Internal server error');
  }
});

// Get portal settings page
router.get('/page/:tenantId/settings', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.client as string | undefined;
    
    const page = await portalService.getPortalPage(tenantId, 'settings', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render settings', { error });
    res.status(500).send('Internal server error');
  }
});

// ============== Embedded Portal Routes ==============

// Get embedded dashboard
router.get('/embed/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenant as string;
    const clientId = req.query.client as string | undefined;
    
    if (!tenantId) {
      return res.status(400).send('Tenant ID is required');
    }
    
    const page = await portalService.getPortalPage(tenantId, 'dashboard', clientId);
    
    if (!page) {
      return res.status(404).send('Portal not found');
    }
    
    res.send(page.html);
  } catch (error) {
    portalLogger.error('Failed to render embedded dashboard', { error });
    res.status(500).send('Internal server error');
  }
});

// Get embedded report
router.get('/embed/report/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    
    const report = await portalService.getReport(reportId);
    
    if (!report) {
      return res.status(404).send('Report not found');
    }
    
    // Return a simple report view HTML
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.name}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; }
          .report-container { max-width: 800px; margin: 0 auto; }
          h1 { color: #1e293b; }
          .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; }
          .status-ready { background: #dcfce7; color: #166534; }
          .status-generating { background: #fef9c3; color: #854d0e; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <h1>${report.name}</h1>
          <p>Type: ${report.type}</p>
          <p>Format: ${report.format.toUpperCase()}</p>
          <p>Status: <span class="status status-${report.status}">${report.status}</span></p>
          <p>Created: ${new Date(report.createdAt).toLocaleDateString()}</p>
          ${report.status === 'ready' && report.downloadUrl ? `<p><a href="${report.downloadUrl}">Download Report</a></p>` : ''}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    portalLogger.error('Failed to render embedded report', { error });
    res.status(500).send('Internal server error');
  }
});

// ============== Report Routes ==============

// Create report
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const validatedData = await CreateReportSchema.parseAsync(req.body);
    const report = await portalService.createReport(validatedData);
    
    portalLogger.info('Report created', { reportId: report.id });
    
    res.status(201).json({
      success: true,
      data: report,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.errors },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    portalLogger.error('Failed to create report', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create report' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// List reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string;
    const clientId = req.query.clientId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Tenant ID is required' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    const result = await portalService.listReports(tenantId, clientId, { page, limit });
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        timestamp: new Date(),
        pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
      },
    });
  } catch (error) {
    portalLogger.error('Failed to list reports', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list reports' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get report by ID
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await portalService.getReport(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: report,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to get report', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get report' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Download report
router.get('/reports/:id/download', async (req: Request, res: Response) => {
  try {
    const report = await portalService.getReport(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    if (report.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_READY', message: 'Report is not ready for download' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    // Generate report content based on format
    const content = generateReportContent(report);
    const filename = `${report.name.replace(/\s+/g, '_')}.${report.format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', getContentType(report.format));
    res.send(content);
  } catch (error) {
    portalLogger.error('Failed to download report', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to download report' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Delete report
router.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await portalService.deleteReport(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to delete report', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete report' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Portal User Routes ==============

// Create portal user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { clientId, tenantId, email, name, role } = req.body;
    
    const user = await portalService.createPortalUser({ clientId, tenantId, email, name, role });
    
    portalLogger.info('Portal user created', { userId: user.id, email: user.email });
    
    res.status(201).json({
      success: true,
      data: user,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to create portal user', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create portal user' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get portal user
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await portalService.getPortalUser(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: user,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to get portal user', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get portal user' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update portal user
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await portalService.updatePortalUser(req.params.id, req.body);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: user,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to update portal user', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update portal user' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Deactivate portal user
router.post('/users/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const user = await portalService.deactivatePortalUser(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: user,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to deactivate portal user', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate portal user' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== White-label Configuration Routes ==============

// Get white-label configuration
router.get('/config/:tenantId', async (req: Request, res: Response) => {
  try {
    const config = await portalService.getWhiteLabelConfig(req.params.tenantId);
    
    res.json({
      success: true,
      data: config,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to get white-label config', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get white-label config' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get dashboard embed code
router.post('/embed/dashboard', async (req: Request, res: Response) => {
  try {
    const { tenantId, clientId, width, height, theme } = req.body;
    
    const embedCode = portalService.generateDashboardEmbedCode(tenantId, clientId, { width, height, theme });
    
    res.json({
      success: true,
      data: { embedCode },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to generate dashboard embed code', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate embed code' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get report embed code
router.post('/embed/report', async (req: Request, res: Response) => {
  try {
    const { reportId, width, height } = req.body;
    
    const embedCode = portalService.generateReportEmbedCode(reportId, { width, height });
    
    res.json({
      success: true,
      data: { embedCode },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    portalLogger.error('Failed to generate report embed code', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate embed code' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Helper Functions ==============

function generateReportContent(report: any): string {
  switch (report.format) {
    case 'csv':
      return 'Campaign,Impressions,Clicks,Conversions,Spend,Revenue\nSample Campaign,100000,5000,250,5000,12500';
    case 'json':
      return JSON.stringify({ report, generatedAt: new Date().toISOString() }, null, 2);
    case 'html':
      return `<!DOCTYPE html>
<html>
<head>
  <title>${report.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; }
    h1 { color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>${report.name}</h1>
  <p>Type: ${report.type}</p>
  <p>Generated: ${new Date(report.createdAt).toLocaleDateString()}</p>
  <p>Data shown is sample data.</p>
</body>
</html>`;
    case 'pdf':
    default:
      return 'PDF content placeholder - integrate with PDF generation library for actual PDF output';
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'csv': return 'text/csv';
    case 'json': return 'application/json';
    case 'html': return 'text/html';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export default router;
