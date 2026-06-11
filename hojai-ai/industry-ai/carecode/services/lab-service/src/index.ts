/**
 * CARECODE - Lab Service
 * Laboratory test management, results processing, and reporting service
 * "AI That Delivers Accurate Lab Results Faster"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4822;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface LabTest {
  id: string;
  testId: string;
  patientId: string;
  patientName: string;
  testCode: string;
  testName: string;
  category: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'sample-collected' | 'processing' | 'completed' | 'cancelled';
  orderedBy: string;
  orderedByName: string;
  orderedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  results?: TestResult;
  notes?: string;
  cost?: number;
}

interface TestResult {
  value: number | string;
  unit: string;
  referenceRange: string;
  abnormal: boolean;
  flag: 'low' | 'normal' | 'high' | 'critical';
  interpretation?: string;
}

interface LabPanel {
  id: string;
  code: string;
  name: string;
  category: string;
  tests: { code: string; name: string }[];
  description: string;
  turnAroundTime: string; // hours
  cost: number;
  preparation?: string;
}

interface Order {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  tests: string[];
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'sample-collected' | 'processing' | 'completed' | 'cancelled';
  orderedBy: string;
  orderedByName: string;
  orderedDate: string;
  specimen?: string;
  notes?: string;
  results?: Map<string, TestResult>;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const labTests = new Map<string, LabTest>();
const labPanels = new Map<string, LabPanel>();
const orders = new Map<string, Order>();

// Sample lab panels
const samplePanels: LabPanel[] = [
  {
    id: 'panel-001',
    code: 'CBC',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    tests: [
      { code: 'WBC', name: 'White Blood Cell Count' },
      { code: 'RBC', name: 'Red Blood Cell Count' },
      { code: 'HGB', name: 'Hemoglobin' },
      { code: 'HCT', name: 'Hematocrit' },
      { code: 'PLT', name: 'Platelet Count' },
      { code: 'MCV', name: 'Mean Corpuscular Volume' }
    ],
    description: 'Evaluates overall health and detects disorders',
    turnAroundTime: '4',
    cost: 450,
    preparation: 'No fasting required'
  },
  {
    id: 'panel-002',
    code: 'BMP',
    name: 'Basic Metabolic Panel',
    category: 'Biochemistry',
    tests: [
      { code: 'GLU', name: 'Glucose' },
      { code: 'CA', name: 'Calcium' },
      { code: 'NA', name: 'Sodium' },
      { code: 'K', name: 'Potassium' },
      { code: 'CL', name: 'Chloride' },
      { code: 'CO2', name: 'Bicarbonate' },
      { code: 'BUN', name: 'Blood Urea Nitrogen' },
      { code: 'CRE', name: 'Creatinine' }
    ],
    description: 'Measures sugar, electrolyte, and kidney function',
    turnAroundTime: '6',
    cost: 800,
    preparation: 'Fasting for 8-12 hours recommended'
  },
  {
    id: 'panel-003',
    code: 'LIPID',
    name: 'Lipid Panel',
    category: 'Biochemistry',
    tests: [
      { code: 'TC', name: 'Total Cholesterol' },
      { code: 'TG', name: 'Triglycerides' },
      { code: 'HDL', name: 'HDL Cholesterol' },
      { code: 'LDL', name: 'LDL Cholesterol' },
      { code: 'VLDL', name: 'VLDL Cholesterol' }
    ],
    description: 'Evaluates heart disease risk',
    turnAroundTime: '6',
    cost: 600,
    preparation: 'Fasting for 12 hours required'
  },
  {
    id: 'panel-004',
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone',
    category: 'Endocrinology',
    tests: [
      { code: 'TSH', name: 'TSH' }
    ],
    description: 'Evaluates thyroid function',
    turnAroundTime: '8',
    cost: 500
  },
  {
    id: 'panel-005',
    code: 'HBA1C',
    name: 'Hemoglobin A1C',
    category: 'Biochemistry',
    tests: [
      { code: 'HBA1C', name: 'Hemoglobin A1C' }
    ],
    description: 'Monitors long-term blood sugar control',
    turnAroundTime: '4',
    cost: 400,
    preparation: 'No fasting required'
  },
  {
    id: 'panel-006',
    code: 'URINE',
    name: 'Urinalysis',
    category: 'Urinalysis',
    tests: [
      { code: 'COLOR', name: 'Color' },
      { code: 'PH', name: 'pH' },
      { code: 'PRO', name: 'Protein' },
      { code: 'GLU', name: 'Glucose' },
      { code: 'KET', name: 'Ketones' },
      { code: 'BLD', name: 'Blood' },
      { code: 'LEU', name: 'Leukocyte esterase' }
    ],
    description: 'Analyzes urine for various conditions',
    turnAroundTime: '2',
    cost: 250
  }
];

samplePanels.forEach(p => labPanels.set(p.id, p));

// Sample tests
const sampleTests: LabTest[] = [
  {
    id: 'test-001',
    testId: 'LAB-001',
    patientId: 'pat-001',
    patientName: 'Rahul Sharma',
    testCode: 'CBC',
    testName: 'Complete Blood Count',
    category: 'Hematology',
    priority: 'routine',
    status: 'completed',
    orderedBy: 'doc-001',
    orderedByName: 'Dr. Priya Sharma',
    orderedDate: '2026-06-01',
    completedDate: '2026-06-01',
    cost: 450,
    results: {
      WBC: { value: 7.5, unit: 'x10^9/L', referenceRange: '4.5-11.0', abnormal: false, flag: 'normal', interpretation: 'Normal white blood cell count' },
      RBC: { value: 4.8, unit: 'x10^12/L', referenceRange: '4.5-5.5', abnormal: false, flag: 'normal', interpretation: 'Normal red blood cell count' },
      HGB: { value: 14.2, unit: 'g/dL', referenceRange: '13.5-17.5', abnormal: false, flag: 'normal', interpretation: 'Normal hemoglobin level' },
      HCT: { value: 42, unit: '%', referenceRange: '38-50', abnormal: false, flag: 'normal', interpretation: 'Normal hematocrit' },
      PLT: { value: 250, unit: 'x10^9/L', referenceRange: '150-400', abnormal: false, flag: 'normal', interpretation: 'Normal platelet count' }
    }
  }
];

sampleTests.forEach(t => labTests.set(t.id, t));

// ============================================
// UTILITY FUNCTIONS
// ============================================

function interpretValue(value: number, referenceRange: string, unit: string): TestResult {
  const [min, max] = referenceRange.split('-').map(v => parseFloat(v.trim()));

  let flag: 'low' | 'normal' | 'high' | 'critical' = 'normal';
  let abnormal = false;
  let interpretation = '';

  if (isNaN(min) || isNaN(max)) {
    return { value, unit, referenceRange, abnormal: false, flag: 'normal' };
  }

  if (value < min * 0.8) {
    flag = 'low';
    abnormal = true;
    interpretation = value < min * 0.5 ? 'Critically low - immediate attention required' : 'Below normal range';
  } else if (value > max * 1.2) {
    flag = 'high';
    abnormal = true;
    interpretation = value > max * 1.5 ? 'Critically high - immediate attention required' : 'Above normal range';
  } else {
    interpretation = 'Within normal range';
  }

  return { value, unit, referenceRange, abnormal, flag, interpretation };
}

// ============================================
// API ROUTES
// ============================================

/**
 * Get available lab panels
 */
app.get('/api/panels', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let result = Array.from(labPanels.values());

    if (category) {
      result = result.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      panels: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get panels' });
  }
});

/**
 * Get panel by ID
 */
app.get('/api/panels/:id', (req: Request, res: Response) => {
  try {
    const panel = labPanels.get(req.params.id);
    if (!panel) {
      return res.status(404).json({ error: 'Panel not found' });
    }

    res.json({ success: true, panel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get panel' });
  }
});

/**
 * Order lab tests
 */
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const { patientId, patientName, tests, priority = 'routine', orderedBy, orderedByName, notes, specimen } = req.body;

    if (!patientId || !tests || tests.length === 0) {
      return res.status(400).json({ error: 'patientId and tests are required' });
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const orderedTests: LabTest[] = tests.map((testCode: string) => {
      const panel = Array.from(labPanels.values()).find(p =>
        p.code.toLowerCase() === testCode.toLowerCase() ||
        p.id.toLowerCase() === testCode.toLowerCase()
      );

      return {
        id: uuidv4(),
        testId: `${orderId}-${testCode}`,
        patientId,
        patientName,
        testCode: panel?.code || testCode,
        testName: panel?.name || testCode,
        category: panel?.category || 'General',
        priority: priority as 'routine' | 'urgent' | 'stat',
        status: 'ordered' as const,
        orderedBy: orderedBy || 'unknown',
        orderedByName: orderedByName || 'Unknown',
        orderedDate: now.split('T')[0],
        cost: panel?.cost
      };
    });

    orderedTests.forEach(t => labTests.set(t.id, t));

    const order: Order = {
      id: uuidv4(),
      orderId,
      patientId,
      patientName,
      tests,
      priority: priority as 'routine' | 'urgent' | 'stat',
      status: 'pending',
      orderedBy: orderedBy || 'unknown',
      orderedByName: orderedByName || 'Unknown',
      orderedDate: now.split('T')[0],
      specimen,
      notes
    };

    orders.set(order.id, order);

    console.log(`[${now}] Lab order created: ${orderId} for ${patientName}`);

    res.status(201).json({
      success: true,
      order,
      tests: orderedTests,
      message: `Order ${orderId} created with ${tests.length} test(s)`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * Get orders
 */
app.get('/api/orders', (req: Request, res: Response) => {
  try {
    const { patientId, status, priority, date } = req.query;
    let result = Array.from(orders.values());

    if (patientId) result = result.filter(o => o.patientId === patientId);
    if (status) result = result.filter(o => o.status === status);
    if (priority) result = result.filter(o => o.priority === priority);
    if (date) result = result.filter(o => o.orderedDate === date);

    result.sort((a, b) => new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime());

    res.json({
      success: true,
      orders: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

/**
 * Get order by ID
 */
app.get('/api/orders/:id', (req: Request, res: Response) => {
  try {
    const order = orders.get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get associated tests
    const tests = Array.from(labTests.values())
      .filter(t => t.testId.startsWith(order.orderId));

    res.json({
      success: true,
      order,
      tests,
      summary: {
        total: tests.length,
        completed: tests.filter(t => t.status === 'completed').length,
        pending: tests.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

/**
 * Update test status
 */
app.patch('/api/tests/:id', (req: Request, res: Response) => {
  try {
    const test = labTests.get(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const { status, notes } = req.body;

    if (status) {
      test.status = status;
      if (status === 'completed') {
        test.completedDate = new Date().toISOString().split('T')[0];
      }
    }

    if (notes) test.notes = notes;

    labTests.set(test.id, test);

    // Update order status
    const relatedOrder = Array.from(orders.values()).find(o =>
      o.orderId && test.testId.startsWith(o.orderId)
    );
    if (relatedOrder) {
      const allTests = Array.from(labTests.values()).filter(t =>
        t.testId.startsWith(relatedOrder.orderId)
      );
      if (allTests.every(t => t.status === 'completed')) {
        relatedOrder.status = 'completed';
      } else if (allTests.some(t => t.status === 'sample-collected' || t.status === 'processing')) {
        relatedOrder.status = 'processing';
      }
      orders.set(relatedOrder.id, relatedOrder);
    }

    res.json({
      success: true,
      test,
      message: `Test ${test.testCode} updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

/**
 * Submit test results
 */
app.post('/api/tests/:id/results', (req: Request, res: Response) => {
  try {
    const test = labTests.get(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const { results } = req.body;

    if (!results) {
      return res.status(400).json({ error: 'Results are required' });
    }

    // Interpret results
    const interpretedResults: Record<string, TestResult> = {};
    const panel = Array.from(labPanels.values()).find(p =>
      p.code.toLowerCase() === test.testCode.toLowerCase()
    );

    Object.entries(results).forEach(([code, data]: [string, any]) => {
      const panelTest = panel?.tests.find(t => t.code === code);
      const referenceRange = data.referenceRange || '0-0';

      interpretedResults[code] = interpretValue(
        parseFloat(data.value),
        referenceRange,
        data.unit || ''
      );
    });

    test.results = interpretedResults as any;
    test.status = 'completed';
    test.completedDate = new Date().toISOString().split('T')[0];

    labTests.set(test.id, test);

    // Find critical values
    const criticals = Object.entries(interpretedResults)
      .filter(([_, r]) => r.flag === 'critical')
      .map(([code, r]) => `${code}: ${r.value} (${r.interpretation})`);

    console.log(`[${new Date().toISOString()}] Results submitted for ${test.testId}`);
    if (criticals.length > 0) {
      console.log(`  ⚠️ CRITICAL VALUES: ${criticals.join(', ')}`);
    }

    res.json({
      success: true,
      test,
      results: interpretedResults,
      hasCriticalValues: criticals.length > 0,
      criticalValues: criticals,
      message: criticals.length > 0
        ? `Results submitted with ${criticals.length} critical value(s)`
        : 'Results submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit results' });
  }
});

/**
 * Get tests by patient
 */
app.get('/api/tests/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { status, category, limit = 50 } = req.query;
    let result = Array.from(labTests.values())
      .filter(t => t.patientId === req.params.patientId);

    if (status) result = result.filter(t => t.status === status);
    if (category) result = result.filter(t => t.category.toLowerCase() === String(category).toLowerCase());

    result.sort((a, b) => new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime());

    res.json({
      success: true,
      tests: result.slice(0, Number(limit)),
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patient tests' });
  }
});

/**
 * Get test by ID
 */
app.get('/api/tests/:id', (req: Request, res: Response) => {
  try {
    const test = labTests.get(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({
      success: true,
      test,
      panel: Array.from(labPanels.values()).find(p => p.code === test.testCode)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get test' });
  }
});

/**
 * Get pending tests
 */
app.get('/api/tests/pending', (req: Request, res: Response) => {
  try {
    const { priority, category } = req.query;
    let result = Array.from(labTests.values())
      .filter(t => !['completed', 'cancelled'].includes(t.status));

    if (priority) result = result.filter(t => t.priority === priority);
    if (category) result = result.filter(t => t.category === category);

    // Group by status
    const grouped = {
      ordered: result.filter(t => t.status === 'ordered'),
      'sample-collected': result.filter(t => t.status === 'sample-collected'),
      processing: result.filter(t => t.status === 'processing')
    };

    res.json({
      success: true,
      tests: result,
      grouped,
      summary: {
        total: result.length,
        stat: result.filter(t => t.priority === 'stat').length,
        urgent: result.filter(t => t.priority === 'urgent').length,
        routine: result.filter(t => t.priority === 'routine').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending tests' });
  }
});

/**
 * Cancel test
 */
app.post('/api/tests/:id/cancel', (req: Request, res: Response) => {
  try {
    const test = labTests.get(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    test.status = 'cancelled';
    test.notes = req.body.reason || 'Cancelled by user';
    labTests.set(test.id, test);

    res.json({
      success: true,
      test,
      message: 'Test cancelled'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel test' });
  }
});

/**
 * Get lab statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const allTests = Array.from(labTests.values());

    res.json({
      success: true,
      stats: {
        total: allTests.length,
        byStatus: {
          ordered: allTests.filter(t => t.status === 'ordered').length,
          'sample-collected': allTests.filter(t => t.status === 'sample-collected').length,
          processing: allTests.filter(t => t.status === 'processing').length,
          completed: allTests.filter(t => t.status === 'completed').length,
          cancelled: allTests.filter(t => t.status === 'cancelled').length
        },
        byPriority: {
          stat: allTests.filter(t => t.priority === 'stat').length,
          urgent: allTests.filter(t => t.priority === 'urgent').length,
          routine: allTests.filter(t => t.priority === 'routine').length
        },
        today: {
          ordered: allTests.filter(t => t.orderedDate === new Date().toISOString().split('T')[0]).length,
          completed: allTests.filter(t => t.completedDate === new Date().toISOString().split('T')[0]).length
        },
        panels: labPanels.size,
        totalOrders: orders.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const pendingTests = Array.from(labTests.values())
    .filter(t => !['completed', 'cancelled'].includes(t.status));

  res.json({
    status: 'healthy',
    service: 'carecode-lab-service',
    version: '1.0.0',
    port: PORT,
    stats: {
      totalTests: labTests.size,
      pendingTests: pendingTests.length,
      totalPanels: labPanels.size,
      todayCompleted: Array.from(labTests.values())
        .filter(t => t.completedDate === new Date().toISOString().split('T')[0]).length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Lab Service',
    description: 'Laboratory test management and reporting',
    version: '1.0.0',
    endpoints: {
      panels: {
        list: 'GET /api/panels',
        get: 'GET /api/panels/:id'
      },
      orders: {
        create: 'POST /api/orders',
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id'
      },
      tests: {
        list: 'GET /api/tests',
        get: 'GET /api/tests/:id',
        pending: 'GET /api/tests/pending',
        patient: 'GET /api/tests/patient/:patientId',
        update: 'PATCH /api/tests/:id',
        results: 'POST /api/tests/:id/results',
        cancel: 'POST /api/tests/:id/cancel'
      },
      stats: 'GET /api/stats'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE LAB SERVICE v1.0.0                ║
║                                                         ║
║  Tagline: "AI That Delivers Accurate Lab Results Faster"║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Lab Test Ordering                                    ║
║  • Results Management                                   ║
║  • Critical Value Alerts                                ║
║  • Panel-based Testing                                  ║
║  • Turn-around Tracking                                 ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, labTests, labPanels, orders };