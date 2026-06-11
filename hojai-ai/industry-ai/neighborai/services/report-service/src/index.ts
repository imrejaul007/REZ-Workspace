import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());

// In-memory stores
const reports: Map<string, any> = new Map();
const reportTypes: Map<string, any> = new Map();

// Initialize report types for property management
const defaultTypes = [
  { id: 'maintenance', name: 'Maintenance Report', category: 'operations', description: 'Maintenance requests and completions' },
  { id: 'visitor', name: 'Visitor Report', category: 'security', description: 'Visitor log and access patterns' },
  { id: 'financial', name: 'Financial Report', category: 'finance', description: 'Rent collection and expenses' },
  { id: 'occupancy', name: 'Occupancy Report', category: 'operations', description: 'Unit occupancy rates' },
  { id: 'incident', name: 'Incident Report', category: 'security', description: 'Security and safety incidents' }
];

defaultTypes.forEach(t => reportTypes.set(t.id, t));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'report-service', timestamp: new Date().toISOString() });
});

// Get all report types
app.get('/api/report-types', (_req: Request, res: Response) => {
  const types = Array.from(reportTypes.values());
  res.json({ success: true, count: types.length, data: types });
});

// Create report type
app.post('/api/report-types', (req: Request, res: Response) => {
  const { name, category, description } = req.body;

  if (!name || !category) {
    res.status(400).json({ success: false, error: 'name and category are required' });
    return;
  }

  const reportType = {
    id: uuidv4(),
    name,
    category,
    description: description || '',
    createdAt: new Date().toISOString()
  };

  reportTypes.set(reportType.id, reportType);
  res.status(201).json({ success: true, data: reportType });
});

// Get all reports
app.get('/api/reports', (req: Request, res: Response) => {
  const { type, status, startDate, endDate } = req.query;
  let filtered = Array.from(reports.values());

  if (type) {
    filtered = filtered.filter((r: any) => r.type === type);
  }
  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }
  if (startDate) {
    filtered = filtered.filter((r: any) => new Date(r.generatedAt) >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((r: any) => new Date(r.generatedAt) <= new Date(endDate as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Generate report
app.post('/api/reports', (req: Request, res: Response) => {
  const { type, dateRange, filters, propertyId } = req.body;

  if (!type) {
    res.status(400).json({ success: false, error: 'type is required' });
    return;
  }

  const reportType = reportTypes.get(type);
  if (!reportType) {
    res.status(404).json({ success: false, error: 'Report type not found' });
    return;
  }

  const report = {
    id: uuidv4(),
    type,
    typeName: reportType.name,
    category: reportType.category,
    propertyId: propertyId || null,
    status: 'generated',
    dateRange: dateRange || { from: new Date().toISOString(), to: new Date().toISOString() },
    filters: filters || {},
    data: generatePropertyReportData(type),
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

// Delete report
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
function generatePropertyReportData(type: string): any {
  switch (type) {
    case 'maintenance':
      return { totalRequests: 0, completed: 0, pending: 0, byPriority: {} };
    case 'visitor':
      return { totalVisitors: 0, byPurpose: {}, peakHours: {} };
    case 'financial':
      return { totalCollected: 0, totalDue: 0, outstanding: 0 };
    case 'occupancy':
      return { totalUnits: 0, occupied: 0, vacant: 0, occupancyRate: 0 };
    case 'incident':
      return { totalIncidents: 0, byType: {}, resolved: 0 };
    default:
      return {};
  }
}

// Get report statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allReports = Array.from(reports.values());

  res.json({
    success: true,
    data: {
      totalReports: allReports.length,
      byCategory: allReports.reduce((acc: any, r: any) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {}),
      byType: allReports.reduce((acc: any, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`NeighborAI Report Service running on port ${PORT}`);
});

export default app;