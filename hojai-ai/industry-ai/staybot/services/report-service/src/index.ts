import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());

// In-memory store for reports
const reports: Map<string, any> = new Map();
const reportTemplates: Map<string, any> = new Map();

// Initialize default templates
const defaultTemplates = [
  { id: 'occupancy', name: 'Occupancy Report', category: 'revenue', description: 'Daily occupancy statistics' },
  { id: 'revenue', name: 'Revenue Report', category: 'revenue', description: 'Revenue breakdown by service' },
  { id: 'guest-satisfaction', name: 'Guest Satisfaction Report', category: 'quality', description: 'Guest feedback and ratings' },
  { id: 'staff-performance', name: 'Staff Performance Report', category: 'hr', description: 'Staff productivity metrics' }
];

defaultTemplates.forEach(t => reportTemplates.set(t.id, t));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'report-service', timestamp: new Date().toISOString() });
});

// Get all report templates
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = Array.from(reportTemplates.values());
  res.json({ success: true, count: templates.length, data: templates });
});

// Create a report template
app.post('/api/templates', (req: Request, res: Response) => {
  const { name, category, description, metrics } = req.body;

  if (!name || !category) {
    res.status(400).json({ success: false, error: 'name and category are required' });
    return;
  }

  const template = {
    id: uuidv4(),
    name,
    category,
    description: description || '',
    metrics: metrics || [],
    createdAt: new Date().toISOString()
  };

  reportTemplates.set(template.id, template);
  res.status(201).json({ success: true, data: template });
});

// Get all reports
app.get('/api/reports', (req: Request, res: Response) => {
  const { templateId, status } = req.query;
  let filtered = Array.from(reports.values());

  if (templateId) {
    filtered = filtered.filter((r: any) => r.templateId === templateId);
  }
  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Generate a new report
app.post('/api/reports', (req: Request, res: Response) => {
  const { templateId, dateRange, filters } = req.body;

  if (!templateId) {
    res.status(400).json({ success: false, error: 'templateId is required' });
    return;
  }

  const template = reportTemplates.get(templateId);
  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }

  const report = {
    id: uuidv4(),
    templateId,
    templateName: template.name,
    category: template.category,
    status: 'generated',
    dateRange: dateRange || { from: new Date().toISOString(), to: new Date().toISOString() },
    filters: filters || {},
    data: generateSampleData(template.category),
    generatedAt: new Date().toISOString()
  };

  reports.set(report.id, report);
  res.status(201).json({ success: true, data: report });
});

// Get report by ID
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const report = reports.get(id);

  if (!report) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  res.json({ success: true, data: report });
});

// Delete a report
app.delete('/api/reports/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = reports.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Report deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Report not found' });
  }
});

// Helper function to generate sample data
function generateSampleData(category: string): any {
  switch (category) {
    case 'revenue':
      return { totalRevenue: 0, byService: {}, byPeriod: {} };
    case 'quality':
      return { averageRating: 0, totalReviews: 0, byRating: {} };
    case 'hr':
      return { totalHours: 0, productivity: 0, byStaff: {} };
    default:
      return {};
  }
}

app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});

export default app;