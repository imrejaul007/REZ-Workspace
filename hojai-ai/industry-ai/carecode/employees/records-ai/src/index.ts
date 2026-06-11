/**
 * CARECODE - Records AI Employee
 * AI-powered medical records management, document handling, and EHR integration
 * "AI That Keeps Medical Records Accurate & Accessible"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4855;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'visit-summary' | 'lab-result' | 'imaging' | 'prescription' | 'procedure' | 'discharge' | 'referral' | 'note';
  title: string;
  description: string;
  date: string;
  providerId: string;
  providerName: string;
  department: string;
  attachments?: Attachment[];
  icdCodes?: string[];
  cptCodes?: string[];
  content: string;
  metadata: RecordMetadata;
  accessLog: AccessEntry[];
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedAt: string;
}

interface RecordMetadata {
  confidentiality: 'public' | 'standard' | 'restricted' | 'confidential';
  retention: number; // days
  department: string;
  location?: string;
  tags: string[];
}

interface AccessEntry {
  userId: string;
  userName: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'print' | 'share';
  timestamp: string;
  ipAddress?: string;
}

interface PatientSummary {
  patientId: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  surgeries: SurgeryRecord[];
  immunizations: ImmunizationRecord[];
  familyHistory: string[];
  lastVisit?: string;
  totalVisits: number;
}

interface SurgeryRecord {
  id: string;
  name: string;
  date: string;
  hospital?: string;
  surgeon?: string;
  notes?: string;
}

interface ImmunizationRecord {
  id: string;
  vaccine: string;
  date: string;
  provider?: string;
  nextDue?: string;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const records = new Map<string, MedicalRecord>();
const patientSummaries = new Map<string, PatientSummary>();

// Sample data
const sampleRecords: MedicalRecord[] = [
  {
    id: 'rec-001',
    patientId: 'pat-001',
    type: 'visit-summary',
    title: 'Annual Physical Examination',
    description: 'Routine annual checkup with complete health assessment',
    date: '2026-05-15',
    providerId: 'doc-001',
    providerName: 'Dr. Priya Sharma',
    department: 'Family Medicine',
    icdCodes: ['Z00.00'],
    cptCodes: ['99395'],
    content: 'Patient presents for annual physical. Generally healthy. Vitals within normal limits. Discussed diet and exercise recommendations.',
    metadata: {
      confidentiality: 'standard',
      retention: 2555,
      department: 'Family Medicine',
      tags: ['annual', 'physical', 'wellness']
    },
    accessLog: [],
    createdAt: '2026-05-15T10:30:00Z',
    updatedAt: '2026-05-15T10:30:00Z'
  },
  {
    id: 'rec-002',
    patientId: 'pat-001',
    type: 'lab-result',
    title: 'Complete Blood Count (CBC)',
    description: 'Routine blood work analysis',
    date: '2026-05-15',
    providerId: 'lab-001',
    providerName: 'City Diagnostics Lab',
    department: 'Laboratory',
    icdCodes: ['Z01.89'],
    cptCodes: ['85025'],
    content: 'WBC: 7.5, RBC: 4.8, Hemoglobin: 14.2, Hematocrit: 42%, Platelets: 250. All values within normal range.',
    metadata: {
      confidentiality: 'standard',
      retention: 2555,
      department: 'Laboratory',
      tags: ['blood-test', 'cbc', 'routine']
    },
    accessLog: [],
    createdAt: '2026-05-15T14:00:00Z',
    updatedAt: '2026-05-15T14:00:00Z'
  },
  {
    id: 'rec-003',
    patientId: 'pat-001',
    type: 'prescription',
    title: 'Hypertension Medication Renewal',
    description: 'BP medication refilled for 90 days',
    date: '2026-05-20',
    providerId: 'doc-001',
    providerName: 'Dr. Priya Sharma',
    department: 'Family Medicine',
    icdCodes: ['I10'],
    cptCodes: ['99213'],
    content: 'Amlodipine 5mg - Take one tablet daily in the morning. Blood pressure monitoring recommended. Return in 3 months.',
    metadata: {
      confidentiality: 'standard',
      retention: 2555,
      department: 'Pharmacy',
      tags: ['hypertension', 'medication', 'renewal']
    },
    accessLog: [],
    createdAt: '2026-05-20T09:00:00Z',
    updatedAt: '2026-05-20T09:00:00Z'
  }
];

sampleRecords.forEach(rec => records.set(rec.id, rec));

// ============================================
// AI SEARCH ENGINE
// ============================================

interface SearchResult {
  record: MedicalRecord;
  relevance: number;
  matchedFields: string[];
  snippet: string;
}

function searchRecords(query: string, patientId?: string, filters?: {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  provider?: string;
}): SearchResult[] {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  records.forEach((record, id) => {
    // Filter by patient
    if (patientId && record.patientId !== patientId) return;

    // Apply filters
    if (filters?.type && record.type !== filters.type) return;
    if (filters?.dateFrom && record.date < filters.dateFrom) return;
    if (filters?.dateTo && record.date > filters.dateTo) return;
    if (filters?.department && !record.department.toLowerCase().includes(filters.department.toLowerCase())) return;
    if (filters?.provider && !record.providerName.toLowerCase().includes(filters.provider.toLowerCase())) return;

    // Calculate relevance
    let relevance = 0;
    const matchedFields: string[] = [];

    if (record.title.toLowerCase().includes(queryLower)) {
      relevance += 30;
      matchedFields.push('title');
    }
    if (record.content.toLowerCase().includes(queryLower)) {
      relevance += 25;
      matchedFields.push('content');
    }
    if (record.description.toLowerCase().includes(queryLower)) {
      relevance += 15;
      matchedFields.push('description');
    }
    if (record.metadata.tags.some(t => t.toLowerCase().includes(queryLower))) {
      relevance += 20;
      matchedFields.push('tags');
    }
    if (record.icdCodes?.some(c => c.toLowerCase().includes(queryLower))) {
      relevance += 25;
      matchedFields.push('icdCodes');
    }

    if (relevance > 0) {
      // Generate snippet
      const contentIndex = record.content.toLowerCase().indexOf(queryLower);
      let snippet = '';
      if (contentIndex >= 0) {
        const start = Math.max(0, contentIndex - 50);
        const end = Math.min(record.content.length, contentIndex + query.length + 50);
        snippet = (start > 0 ? '...' : '') + record.content.slice(start, end) + (end < record.content.length ? '...' : '');
      } else {
        snippet = record.content.slice(0, 100) + (record.content.length > 100 ? '...' : '');
      }

      results.push({
        record,
        relevance,
        matchedFields,
        snippet
      });
    }
  });

  return results.sort((a, b) => b.relevance - a.relevance);
}

// ============================================
// API ROUTES
// ============================================

/**
 * Create medical record
 */
app.post('/api/records', (req: Request, res: Response) => {
  try {
    const {
      patientId,
      type,
      title,
      description,
      date,
      providerId,
      providerName,
      department,
      icdCodes,
      cptCodes,
      content,
      confidentiality = 'standard',
      tags = []
    } = req.body;

    if (!patientId || !type || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields: patientId, type, title, content' });
    }

    const record: MedicalRecord = {
      id: `rec-${uuidv4().slice(0, 8)}`,
      patientId,
      type,
      title,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      providerId: providerId || 'unknown',
      providerName: providerName || 'Unknown Provider',
      department: department || 'General',
      icdCodes,
      cptCodes,
      content,
      metadata: {
        confidentiality,
        retention: 2555, // ~7 years default
        department: department || 'General',
        tags
      },
      accessLog: [{
        userId: providerId || 'system',
        userName: providerName || 'System',
        action: 'create',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.set(record.id, record);

    res.status(201).json({
      success: true,
      record,
      message: 'Medical record created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create record' });
  }
});

/**
 * Get record by ID
 */
app.get('/api/records/:id', (req: Request, res: Response) => {
  try {
    const record = records.get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Log access
    record.accessLog.push({
      userId: req.headers['x-user-id'] as string || 'unknown',
      userName: req.headers['x-user-name'] as string || 'Unknown',
      action: 'view',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip
    });
    records.set(record.id, record);

    res.json({
      success: true,
      record
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get record' });
  }
});

/**
 * Search records
 */
app.get('/api/records', (req: Request, res: Response) => {
  try {
    const { patientId, query, type, dateFrom, dateTo, department, provider } = req.query;

    if (query) {
      const results = searchRecords(String(query), patientId as string, {
        type: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        department: department as string,
        provider: provider as string
      });

      return res.json({
        success: true,
        results: results.map(r => r.record),
        count: results.length,
        searchQuery: query,
        message: `Found ${results.length} records matching "${query}"`
      });
    }

    // List all records with filters
    let result = Array.from(records.values());

    if (patientId) {
      result = result.filter(r => r.patientId === patientId);
    }
    if (type) {
      result = result.filter(r => r.type === type);
    }
    if (dateFrom) {
      result = result.filter(r => r.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(r => r.date <= dateTo);
    }
    if (department) {
      result = result.filter(r => r.department.toLowerCase().includes(String(department).toLowerCase()));
    }

    result.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      success: true,
      records: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search records' });
  }
});

/**
 * Get records by patient
 */
app.get('/api/records/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { type, limit = 50 } = req.query;
    let result = Array.from(records.values())
      .filter(r => r.patientId === req.params.patientId);

    if (type) {
      result = result.filter(r => r.type === type);
    }

    result.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      success: true,
      records: result.slice(0, Number(limit)),
      count: result.length,
      patientId: req.params.patientId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patient records' });
  }
});

/**
 * Update record
 */
app.put('/api/records/:id', (req: Request, res: Response) => {
  try {
    const record = records.get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const { title, description, content, tags, icdCodes } = req.body;

    if (title) record.title = title;
    if (description) record.description = description;
    if (content) record.content = content;
    if (tags) record.metadata.tags = tags;
    if (icdCodes) record.icdCodes = icdCodes;

    record.updatedAt = new Date().toISOString();

    record.accessLog.push({
      userId: req.headers['x-user-id'] as string || 'unknown',
      userName: req.headers['x-user-name'] as string || 'Unknown',
      action: 'update',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip
    });

    records.set(record.id, record);

    res.json({
      success: true,
      record,
      message: 'Record updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update record' });
  }
});

/**
 * Add attachment to record
 */
app.post('/api/records/:id/attachments', (req: Request, res: Response) => {
  try {
    const record = records.get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const { name, type, size, url } = req.body;

    const attachment: Attachment = {
      id: `att-${uuidv4().slice(0, 8)}`,
      name,
      type,
      size,
      url,
      uploadedAt: new Date().toISOString()
    };

    if (!record.attachments) {
      record.attachments = [];
    }
    record.attachments.push(attachment);
    record.updatedAt = new Date().toISOString();

    records.set(record.id, record);

    res.status(201).json({
      success: true,
      attachment,
      record
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

/**
 * Get patient summary
 */
app.get('/api/summary/:patientId', (req: Request, res: Response) => {
  try {
    const patientRecords = Array.from(records.values())
      .filter(r => r.patientId === req.params.patientId);

    if (patientRecords.length === 0) {
      return res.status(404).json({ error: 'No records found for patient' });
    }

    // Generate summary
    const conditions = new Set<string>();
    const medications = new Set<string>();
    const surgeries: SurgeryRecord[] = [];
    const immunizations: ImmunizationRecord[] = [];
    const allergies = new Set<string>();
    const familyHistory = new Set<string>();

    patientRecords.forEach(rec => {
      if (rec.icdCodes) {
        rec.icdCodes.forEach(code => {
          if (code.startsWith('E') || code.startsWith('I') || code.startsWith('J')) {
            conditions.add(code);
          }
        });
      }

      if (rec.type === 'prescription') {
        const medMatch = rec.content.match(/^([A-Za-z\s]+)\s*\d+/);
        if (medMatch) medications.add(medMatch[1].trim());
      }

      if (rec.type === 'procedure' && rec.content.toLowerCase().includes('surgery')) {
        surgeries.push({
          id: rec.id,
          name: rec.title,
          date: rec.date,
          hospital: rec.metadata.location,
          notes: rec.content
        });
      }
    });

    const summary: PatientSummary = {
      patientId: req.params.patientId,
      allergies: Array.from(allergies),
      conditions: Array.from(conditions),
      medications: Array.from(medications),
      surgeries,
      immunizations,
      familyHistory: Array.from(familyHistory),
      lastVisit: patientRecords.sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
      totalVisits: patientRecords.filter(r => r.type === 'visit-summary').length
    };

    res.json({
      success: true,
      summary,
      stats: {
        totalRecords: patientRecords.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * Get access log for record
 */
app.get('/api/records/:id/access', (req: Request, res: Response) => {
  try {
    const record = records.get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({
      success: true,
      recordId: record.id,
      accessLog: record.accessLog,
      accessCount: record.accessLog.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get access log' });
  }
});

/**
 * Generate health report
 */
app.post('/api/reports/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { startDate, endDate, includeLab = true, includeImaging = true } = req.body;

    const patientRecords = Array.from(records.values())
      .filter(r => r.patientId === req.params.patientId);

    if (startDate) {
      patientRecords.filter(r => r.date >= startDate);
    }
    if (endDate) {
      patientRecords.filter(r => r.date <= endDate);
    }

    const report = {
      patientId: req.params.patientId,
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      summary: {
        totalRecords: patientRecords.length,
        visits: patientRecords.filter(r => r.type === 'visit-summary').length,
        labResults: includeLab ? patientRecords.filter(r => r.type === 'lab-result').length : 0,
        imaging: includeImaging ? patientRecords.filter(r => r.type === 'imaging').length : 0,
        prescriptions: patientRecords.filter(r => r.type === 'prescription').length
      },
      diagnoses: Array.from(new Set(
        patientRecords.flatMap(r => r.icdCodes || [])
      )),
      records: patientRecords.sort((a, b) => b.date.localeCompare(a.date))
    };

    res.json({
      success: true,
      report,
      message: 'Health report generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Export records
 */
app.get('/api/records/export/:patientId', (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.query;
    const patientRecords = Array.from(records.values())
      .filter(r => r.patientId === req.params.patientId);

    if (format === 'json') {
      res.json({
        success: true,
        patientId: req.params.patientId,
        exportedAt: new Date().toISOString(),
        records: patientRecords,
        count: patientRecords.length
      });
    } else {
      res.status(400).json({ error: 'Unsupported format. Use json.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export records' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'records-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Medical record management',
      'AI-powered search',
      'Document attachments',
      'Access logging',
      'Patient summaries',
      'Health reports'
    ],
    stats: {
      totalRecords: records.size,
      byType: {
        visitSummary: Array.from(records.values()).filter(r => r.type === 'visit-summary').length,
        labResult: Array.from(records.values()).filter(r => r.type === 'lab-result').length,
        prescription: Array.from(records.values()).filter(r => r.type === 'prescription').length
      }
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Records AI',
    description: 'AI-powered medical records management',
    version: '1.0.0',
    endpoints: {
      create: 'POST /api/records',
      get: 'GET /api/records/:id',
      search: 'GET /api/records?query=...',
      patient: 'GET /api/records/patient/:patientId',
      update: 'PUT /api/records/:id',
      summary: 'GET /api/summary/:patientId',
      export: 'GET /api/records/export/:patientId',
      report: 'POST /api/reports/patient/:patientId'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE RECORDS AI v1.0.0                ║
║                                                         ║
║  Tagline: "AI That Keeps Medical Records Accurate"     ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Medical Record Management                           ║
║  • AI-Powered Search                                  ║
║  • Document Handling                                   ║
║  • Access Control & Logging                           ║
║  • Patient Summaries                                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, records, searchRecords };