const { v4: uuidv4 } = require('uuid');

// In-memory store for reports
const reports = new Map();

// Initialize with sample reports
const initReports = () => {
  const sampleReports = [
    {
      id: 'report-001',
      brandId: 'brand-001',
      clientId: 'client-001',
      name: 'Q1 2026 Campaign Report',
      type: 'campaign',
      format: 'pdf',
      period: { start: '2026-01-01', end: '2026-03-31' },
      sections: ['executive-summary', 'performance', 'audience', 'creative'],
      status: 'generated',
      downloadUrl: 'https://cdn.adbazaar.com/reports/report-001.pdf',
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'report-002',
      brandId: 'brand-001',
      clientId: 'client-002',
      name: 'Monthly Performance - April 2026',
      type: 'performance',
      format: 'pdf',
      period: { start: '2026-04-01', end: '2026-04-30' },
      sections: ['metrics', 'trends', 'recommendations'],
      status: 'generated',
      downloadUrl: 'https://cdn.adbazaar.com/reports/report-002.pdf',
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'report-003',
      brandId: 'brand-002',
      clientId: 'client-003',
      name: 'Media Effectiveness Report',
      type: 'media',
      format: 'html',
      period: { start: '2026-01-01', end: '2026-06-30' },
      sections: ['reach', 'frequency', 'engagement'],
      status: 'pending',
      downloadUrl: null,
      generatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleReports.forEach(report => reports.set(report.id, report));
};

initReports();

module.exports = {
  reports,
  createReport: (reportData) => {
    const id = uuidv4();
    const report = {
      id,
      brandId: reportData.brandId,
      clientId: reportData.clientId,
      name: reportData.name,
      type: reportData.type || 'custom',
      format: reportData.format || 'pdf',
      period: reportData.period || { start: null, end: null },
      sections: reportData.sections || ['summary'],
      status: reportData.status || 'pending',
      downloadUrl: reportData.downloadUrl || null,
      generatedAt: reportData.generatedAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    reports.set(id, report);
    return report;
  },
  getReport: (id) => reports.get(id),
  getReportsByBrand: (brandId) => {
    return Array.from(reports.values()).filter(r => r.brandId === brandId);
  },
  getReportsByClient: (clientId) => {
    return Array.from(reports.values()).filter(r => r.clientId === clientId);
  },
  updateReport: (id, updates) => {
    const report = reports.get(id);
    if (!report) return null;
    const updated = {
      ...report,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    reports.set(id, updated);
    return updated;
  },
  deleteReport: (id) => reports.delete(id),
  getAllReports: () => Array.from(reports.values())
};
