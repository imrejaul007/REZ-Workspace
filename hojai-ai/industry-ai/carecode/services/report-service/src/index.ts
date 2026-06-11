/**
 * CARECODE - Report Service
 * Health reports, analytics, and document generation service
 * "AI That Turns Data Into Insights"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4823;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Report {
  id: string;
  reportId: string;
  type: 'patient-summary' | 'health-trend' | 'lab-summary' | 'billing-report' | 'inventory-report' | 'custom';
  title: string;
  description: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  generatedBy: string;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  data?: any;
  downloadUrl?: string;
}

interface DashboardData {
  patients: {
    total: number;
    active: number;
    newThisMonth: number;
    byCondition: { condition: string; count: number }[];
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    avgWaitTime?: number;
  };
  billing: {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
  };
  lab: {
    testsOrdered: number;
    testsCompleted: number;
    avgTurnaround: number; // hours
    criticalValues: number;
  };
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const reports = new Map<string, Report>();

// ============================================
// REPORT GENERATORS
// ============================================

function generatePatientSummary(patientId: string): any {
  // Simulated data - in production, would fetch from other services
  return {
    patientId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalVisits: Math.floor(Math.random() * 20) + 1,
      lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      allergies: ['Penicillin'],
      medications: [
        { name: 'Metformin 500mg', frequency: 'Twice daily' },
        { name: 'Amlodipine 5mg', frequency: 'Once daily' }
      ],
      recentLabResults: [
        { test: 'CBC', date: '2026-05-15', status: 'Normal' },
        { test: 'Lipid Panel', date: '2026-05-15', status: 'Abnormal - LDL High' }
      ]
    },
    vitals: {
      latest: {
        bloodPressure: { systolic: 135, diastolic: 85 },
        heartRate: 72,
        weight: 78,
        date: new Date().toISOString().split('T')[0]
      },
      trends: {
        bloodPressure: [
          { date: '2026-03-15', systolic: 140, diastolic: 90 },
          { date: '2026-04-15', systolic: 138, diastolic: 88 },
          { date: '2026-05-15', systolic: 135, diastolic: 85 }
        ],
        weight: [
          { date: '2026-03-15', value: 80 },
          { date: '2026-04-15', value: 79 },
          { date: '2026-05-15', value: 78 }
        ]
      }
    },
    recommendations: [
      'Continue current medication regimen',
      'Reduce sodium intake to help lower blood pressure',
      'Schedule follow-up in 3 months'
    ]
  };
}

function generateHealthTrend(patientId: string, dateFrom: string, dateTo: string): any {
  const days = Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints = Math.min(days, 30);

  return {
    patientId,
    period: { from: dateFrom, to: dateTo },
    generatedAt: new Date().toISOString(),
    metrics: {
      bloodPressure: {
        avgSystolic: 135,
        avgDiastolic: 85,
        min: { systolic: 125, diastolic: 78 },
        max: { systolic: 145, diastolic: 92 },
        trend: 'improving',
        dataPoints: Array.from({ length: dataPoints }, (_, i) => ({
          date: new Date(new Date(dateFrom).getTime() + i * (days / dataPoints) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          systolic: 130 + Math.floor(Math.random() * 15),
          diastolic: 80 + Math.floor(Math.random() * 12)
        }))
      },
      heartRate: {
        avg: 72,
        min: 62,
        max: 88,
        trend: 'stable',
        dataPoints: Array.from({ length: dataPoints }, (_, i) => ({
          date: new Date(new Date(dateFrom).getTime() + i * (days / dataPoints) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: 68 + Math.floor(Math.random() * 12)
        }))
      },
      weight: {
        start: 80,
        current: 78,
        change: -2,
        trend: 'improving',
        dataPoints: Array.from({ length: dataPoints }, (_, i) => ({
          date: new Date(new Date(dateFrom).getTime() + i * (days / dataPoints) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: 79 - (i * 2 / dataPoints) + Math.random() * 2
        }))
      }
    },
    insights: [
      'Blood pressure has shown gradual improvement over the period',
      'Heart rate remains stable within normal range',
      'Weight loss of 2kg achieved - on track with goals'
    ]
  };
}

function generateBillingReport(dateFrom: string, dateTo: string): any {
  const days = Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24));

  return {
    period: { from: dateFrom, to: dateTo },
    generatedAt: new Date().toISOString(),
    summary: {
      totalBilled: 150000 + Math.random() * 50000,
      totalCollected: 120000 + Math.random() * 30000,
      outstanding: 25000 + Math.random() * 15000,
      collectionRate: 82 + Math.random() * 10
    },
    byServiceType: [
      { type: 'Consultations', amount: 45000, count: 150 },
      { type: 'Lab Tests', amount: 35000, count: 200 },
      { type: 'Procedures', amount: 40000, count: 45 },
      { type: 'Medications', amount: 25000, count: 180 },
      { type: 'Imaging', amount: 20000, count: 30 }
    ],
    agingReport: {
      '0-30': { amount: 15000, invoices: 45 },
      '31-60': { amount: 8000, invoices: 28 },
      '61-90': { amount: 4000, invoices: 15 },
      '90+': { amount: 2000, invoices: 8 }
    },
    trends: Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(new Date(dateFrom).getTime() + i * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        billed: 4000 + Math.random() * 2000,
        collected: 3500 + Math.random() * 1500
      };
    })
  };
}

function generateLabSummary(dateFrom: string, dateTo: string): any {
  return {
    period: { from: dateFrom, to: dateTo },
    generatedAt: new Date().toISOString(),
    summary: {
      totalOrders: 350,
      completed: 320,
      pending: 30,
      avgTurnaroundHours: 6.5,
      criticalValuesFlagged: 12
    },
    byCategory: [
      { category: 'Hematology', ordered: 120, completed: 115, avgTurnaround: 4 },
      { category: 'Biochemistry', ordered: 100, completed: 95, avgTurnaround: 6 },
      { category: 'Microbiology', ordered: 50, completed: 45, avgTurnaround: 24 },
      { category: 'Immunology', ordered: 45, completed: 40, avgTurnaround: 8 },
      { category: 'Pathology', ordered: 35, completed: 25, avgTurnaround: 12 }
    ],
    topTests: [
      { test: 'Complete Blood Count', ordered: 150, abnormalRate: 15 },
      { test: 'Lipid Panel', ordered: 120, abnormalRate: 35 },
      { test: 'Basic Metabolic Panel', ordered: 100, abnormalRate: 20 },
      { test: 'Thyroid Panel', ordered: 80, abnormalRate: 25 },
      { test: 'Liver Function Test', ordered: 75, abnormalRate: 18 }
    ],
    criticalValues: [
      { patientId: 'PAT-001', test: 'Potassium', value: 6.2, unit: 'mEq/L', date: '2026-06-01', status: 'Reviewed' },
      { patientId: 'PAT-002', test: 'Glucose', value: 320, unit: 'mg/dL', date: '2026-06-01', status: 'Reviewed' }
    ]
  };
}

// ============================================
// API ROUTES
// ============================================

/**
 * Generate report
 */
app.post('/api/reports', (req: Request, res: Response) => {
  try {
    const { type, title, description, patientId, dateFrom, dateTo, generatedBy } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }

    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;

    const report: Report = {
      id: uuidv4(),
      reportId,
      type,
      title,
      description: description || '',
      patientId,
      dateFrom,
      dateTo,
      generatedBy: generatedBy || 'system',
      generatedAt: new Date().toISOString(),
      status: 'generating'
    };

    reports.set(report.id, report);

    // Simulate async generation
    setTimeout(() => {
      try {
        let data: any;

        switch (type) {
          case 'patient-summary':
            data = generatePatientSummary(patientId!);
            break;
          case 'health-trend':
            data = generateHealthTrend(patientId!, dateFrom!, dateTo!);
            break;
          case 'billing-report':
            data = generateBillingReport(dateFrom!, dateTo!);
            break;
          case 'lab-summary':
            data = generateLabSummary(dateFrom!, dateTo!);
            break;
          default:
            data = { message: 'Custom report data would go here' };
        }

        report.data = data;
        report.status = 'completed';
        report.downloadUrl = `/api/reports/${report.id}/download`;
        reports.set(report.id, report);

        console.log(`[${new Date().toISOString()}] Report generated: ${reportId}`);
      } catch (error) {
        report.status = 'failed';
        reports.set(report.id, report);
        console.error(`Report generation failed: ${reportId}`, error);
      }
    }, 500);

    res.status(202).json({
      success: true,
      report,
      message: 'Report generation started',
      statusUrl: `/api/reports/${report.id}/status`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * Get report status
 */
app.get('/api/reports/:id/status', (req: Request, res: Response) => {
  try {
    const report = reports.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      reportId: report.reportId,
      status: report.status,
      generatedAt: report.generatedAt,
      isReady: report.status === 'completed'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Get report
 */
app.get('/api/reports/:id', (req: Request, res: Response) => {
  try {
    const report = reports.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status !== 'completed') {
      return res.status(202).json({
        success: false,
        status: report.status,
        message: 'Report is still being generated',
        statusUrl: `/api/reports/${report.id}/status`
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * List reports
 */
app.get('/api/reports', (req: Request, res: Response) => {
  try {
    const { type, patientId, status, limit = 50 } = req.query;
    let result = Array.from(reports.values());

    if (type) result = result.filter(r => r.type === type);
    if (patientId) result = result.filter(r => r.patientId === patientId);
    if (status) result = result.filter(r => r.status === status);

    result.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    res.json({
      success: true,
      reports: result.slice(0, Number(limit)),
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

/**
 * Download report (returns JSON for now)
 */
app.get('/api/reports/:id/download', (req: Request, res: Response) => {
  try {
    const report = reports.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({ error: 'Report not ready for download' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportId}.json"`);

    res.json({
      report: {
        ...report,
        data: report.data
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download report' });
  }
});

/**
 * Delete report
 */
app.delete('/api/reports/:id', (req: Request, res: Response) => {
  try {
    const report = reports.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    reports.delete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

/**
 * Get dashboard data
 */
app.get('/api/dashboard', (req: Request, res: Response) => {
  try {
    const dashboard: DashboardData = {
      patients: {
        total: 1250,
        active: 1180,
        newThisMonth: 45,
        byCondition: [
          { condition: 'Hypertension', count: 320 },
          { condition: 'Diabetes', count: 210 },
          { condition: 'Asthma', count: 150 },
          { condition: 'Arthritis', count: 120 },
          { condition: 'Heart Disease', count: 85 }
        ]
      },
      appointments: {
        total: 450,
        completed: 395,
        cancelled: 35,
        noShow: 20,
        avgWaitTime: 12
      },
      billing: {
        totalBilled: 156000,
        totalCollected: 128000,
        outstanding: 28000,
        collectionRate: 82
      },
      lab: {
        testsOrdered: 520,
        testsCompleted: 485,
        avgTurnaround: 6.5,
        criticalValues: 8
      }
    };

    res.json({
      success: true,
      dashboard,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * Get patient summary report
 */
app.post('/api/reports/patient-summary', (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
    const data = generatePatientSummary(patientId);

    res.json({
      success: true,
      reportId,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get health trend report
 */
app.post('/api/reports/health-trend', (req: Request, res: Response) => {
  try {
    const { patientId, dateFrom, dateTo } = req.body;

    if (!patientId || !dateFrom || !dateTo) {
      return res.status(400).json({ error: 'patientId, dateFrom, and dateTo are required' });
    }

    const data = generateHealthTrend(patientId, dateFrom, dateTo);

    res.json({
      success: true,
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get billing report
 */
app.post('/api/reports/billing', (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.body;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'dateFrom and dateTo are required' });
    }

    const data = generateBillingReport(dateFrom, dateTo);

    res.json({
      success: true,
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get lab summary report
 */
app.post('/api/reports/lab-summary', (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.body;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'dateFrom and dateTo are required' });
    }

    const data = generateLabSummary(dateFrom, dateTo);

    res.json({
      success: true,
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'carecode-report-service',
    version: '1.0.0',
    port: PORT,
    stats: {
      totalReports: reports.size,
      completedReports: Array.from(reports.values()).filter(r => r.status === 'completed').length,
      generatingReports: Array.from(reports.values()).filter(r => r.status === 'generating').length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Report Service',
    description: 'Health reports, analytics, and document generation',
    version: '1.0.0',
    endpoints: {
      reports: {
        create: 'POST /api/reports',
        list: 'GET /api/reports',
        get: 'GET /api/reports/:id',
        status: 'GET /api/reports/:id/status',
        download: 'GET /api/reports/:id/download',
        delete: 'DELETE /api/reports/:id'
      },
      quickReports: {
        patientSummary: 'POST /api/reports/patient-summary',
        healthTrend: 'POST /api/reports/health-trend',
        billing: 'POST /api/reports/billing',
        labSummary: 'POST /api/reports/lab-summary'
      },
      dashboard: 'GET /api/dashboard'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             CARECODE REPORT SERVICE v1.0.0              ║
║                                                         ║
║  Tagline: "AI That Turns Data Into Insights"          ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Patient Summary Reports                             ║
║  • Health Trend Analysis                               ║
║  • Billing Reports                                     ║
║  • Lab Summary Reports                                 ║
║  • Dashboard Analytics                                 ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, reports };