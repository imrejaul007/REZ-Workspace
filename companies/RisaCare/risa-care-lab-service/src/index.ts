import { logger } from ;
import express from 'express';
import mongoose from 'mongoose';
import labRoutes from './routes/labRoutes.js';
import { labService } from './services/labService.js';
import { testService } from './services/testService.js';

const app = express();
const PORT = process.env.PORT || 4742;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_lab';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Lab Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// CORS headers for B2B
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/', labRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-lab',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'RisaCare Laboratory Information System',
    version: '1.0.0',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    endpoints: {
      lab: '/lab',
      tests: '/tests',
      samples: '/samples',
      reports: '/reports',
      orders: '/orders',
      health: '/health',
    },
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize with sample data
function initializeSampleData() {
  logger.info('Initializing sample laboratory data...');

  // Setup lab
  const lab = labService.setupLab({
    name: 'RisaCare Diagnostic Laboratory',
    address: {
      street: '123 Healthcare Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
    },
    certifications: ['NABL', 'ISO 15189', 'ISO 9001'],
    accreditations: ['CAP', 'NABL'],
    tests: [],
    collectionCenters: [],
    contact: {
      phone: '+91-22-1234-5678',
      email: 'lab@risacare.com',
      emergency: '+91-22-1234-5679',
    },
    workingHours: {
      start: '07:00',
      end: '20:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
  });
  logger.info(`Lab initialized: ${lab.labId}`);

  // Add collection center
  const center = labService.addCollectionCenter({
    name: 'RisaCare Collection Center - Andheri',
    address: {
      street: '456 Medical Plaza',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
    },
    contact: {
      phone: '+91-22-2345-6789',
      email: 'andheri@risacare.com',
    },
    hours: {
      start: '07:00',
      end: '19:00',
    },
    isActive: true,
  });
  logger.info(`Collection center added: ${center.centerId}`);

  // Add sample tests
  const tests = [
    {
      name: 'Complete Blood Count (CBC)',
      category: 'hematology' as const,
      description: 'Comprehensive blood analysis including RBC, WBC, hemoglobin, and platelets',
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', referenceRange: { min: 12, max: 17.5 } },
        { name: 'RBC Count', unit: 'million/mcL', referenceRange: { min: 4.5, max: 5.5 } },
        { name: 'WBC Count', unit: 'thousand/mcL', referenceRange: { min: 4.5, max: 11 } },
        { name: 'Platelet Count', unit: 'thousand/mcL', referenceRange: { min: 150, max: 400 } },
        { name: 'Hematocrit', unit: '%', referenceRange: { min: 36, max: 48 } },
        { name: 'MCV', unit: 'fL', referenceRange: { min: 80, max: 100 } },
      ],
      sampleType: 'Blood',
      containerType: 'Purple Top (EDTA)',
      volume: '3ml',
      turnaroundTime: 4,
      price: 350,
      equipment: ['Automated Hematology Analyzer'],
      fastingRequired: false,
    },
    {
      name: 'Blood Glucose Fasting',
      category: 'biochemistry' as const,
      description: 'Fasting blood glucose level measurement',
      parameters: [
        { name: 'Glucose (Fasting)', unit: 'mg/dL', referenceRange: { min: 70, max: 100 } },
      ],
      sampleType: 'Blood',
      containerType: 'Gray Top (Fluoride)',
      volume: '2ml',
      turnaroundTime: 2,
      price: 150,
      equipment: ['Biochemistry Analyzer'],
      fastingRequired: true,
    },
    {
      name: 'Lipid Profile',
      category: 'biochemistry' as const,
      description: 'Complete lipid profile including cholesterol and triglycerides',
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: { min: 0, max: 200 } },
        { name: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: { min: 0, max: 100 } },
        { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: { min: 40, max: 60 } },
        { name: 'Triglycerides', unit: 'mg/dL', referenceRange: { min: 0, max: 150 } },
        { name: 'VLDL Cholesterol', unit: 'mg/dL', referenceRange: { min: 2, max: 30 } },
      ],
      sampleType: 'Blood',
      containerType: 'Red Top (Serum)',
      volume: '5ml',
      turnaroundTime: 6,
      price: 450,
      equipment: ['Biochemistry Analyzer'],
      fastingRequired: true,
    },
    {
      name: 'Thyroid Profile (T3, T4, TSH)',
      category: 'biochemistry' as const,
      description: 'Comprehensive thyroid function tests',
      parameters: [
        { name: 'T3', unit: 'ng/dL', referenceRange: { min: 80, max: 200 } },
        { name: 'T4', unit: 'mcg/dL', referenceRange: { min: 4.5, max: 12 } },
        { name: 'TSH', unit: 'mIU/L', referenceRange: { min: 0.4, max: 4 } },
      ],
      sampleType: 'Blood',
      containerType: 'Red Top (Serum)',
      volume: '3ml',
      turnaroundTime: 8,
      price: 600,
      equipment: ['Immunoassay Analyzer'],
      fastingRequired: false,
    },
    {
      name: 'Urinalysis',
      category: 'pathology' as const,
      description: 'Complete urine analysis including physical, chemical, and microscopic examination',
      parameters: [
        { name: 'pH', unit: 'pH', referenceRange: { min: 4.5, max: 8 } },
        { name: 'Specific Gravity', unit: 'g/mL', referenceRange: { min: 1.005, max: 1.030 } },
        { name: 'Protein', unit: 'mg/dL', referenceRange: { min: 0, max: 150 } },
        { name: 'Glucose', unit: 'mg/dL', referenceRange: { min: 0, max: 15 } },
        { name: 'Ketones', unit: 'mg/dL', referenceRange: { min: 0, max: 10 } },
        { name: 'RBC', unit: '/HPF', referenceRange: { min: 0, max: 2 } },
        { name: 'WBC', unit: '/HPF', referenceRange: { min: 0, max: 5 } },
      ],
      sampleType: 'Urine',
      containerType: 'Sterile Container',
      volume: '20ml',
      turnaroundTime: 4,
      price: 200,
      equipment: ['Urine Analyzer', 'Microscope'],
      fastingRequired: false,
    },
    {
      name: 'Dengue NS1 Antigen',
      category: 'microbiology' as const,
      description: 'Dengue virus NS1 antigen detection for early diagnosis',
      parameters: [
        { name: 'Dengue NS1', unit: '', referenceRange: { min: 0, max: 1 }, method: 'ELISA' },
      ],
      sampleType: 'Blood',
      containerType: 'Red Top (Serum)',
      volume: '3ml',
      turnaroundTime: 4,
      price: 800,
      equipment: ['ELISA Reader'],
      fastingRequired: false,
    },
    {
      name: 'X-Ray Chest PA View',
      category: 'imaging' as const,
      description: 'Chest X-ray posterior-anterior view',
      parameters: [],
      sampleType: 'None (Imaging)',
      turnaroundTime: 2,
      price: 300,
      equipment: ['Digital X-Ray Machine'],
      fastingRequired: false,
    },
    {
      name: 'HbA1c (Glycated Hemoglobin)',
      category: 'biochemistry' as const,
      description: 'Long-term blood sugar control measurement',
      parameters: [
        { name: 'HbA1c', unit: '%', referenceRange: { min: 4, max: 5.6 } },
      ],
      sampleType: 'Blood',
      containerType: 'Purple Top (EDTA)',
      volume: '3ml',
      turnaroundTime: 4,
      price: 400,
      equipment: ['HPLC Analyzer'],
      fastingRequired: false,
    },
    {
      name: 'Liver Function Test (LFT)',
      category: 'biochemistry' as const,
      description: 'Comprehensive liver function panel',
      parameters: [
        { name: 'Bilirubin Total', unit: 'mg/dL', referenceRange: { min: 0.1, max: 1.2 } },
        { name: 'Bilirubin Direct', unit: 'mg/dL', referenceRange: { min: 0, max: 0.3 } },
        { name: 'SGOT (AST)', unit: 'U/L', referenceRange: { min: 10, max: 40 } },
        { name: 'SGPT (ALT)', unit: 'U/L', referenceRange: { min: 7, max: 56 } },
        { name: 'Alkaline Phosphatase', unit: 'U/L', referenceRange: { min: 44, max: 147 } },
        { name: 'Total Protein', unit: 'g/dL', referenceRange: { min: 6, max: 8.3 } },
        { name: 'Albumin', unit: 'g/dL', referenceRange: { min: 3.5, max: 5.5 } },
      ],
      sampleType: 'Blood',
      containerType: 'Red Top (Serum)',
      volume: '5ml',
      turnaroundTime: 6,
      price: 500,
      equipment: ['Biochemistry Analyzer'],
      fastingRequired: true,
    },
    {
      name: 'Kidney Function Test (KFT)',
      category: 'biochemistry' as const,
      description: 'Comprehensive kidney function panel',
      parameters: [
        { name: 'Creatinine', unit: 'mg/dL', referenceRange: { min: 0.6, max: 1.2 } },
        { name: 'Blood Urea', unit: 'mg/dL', referenceRange: { min: 7, max: 20 } },
        { name: 'BUN', unit: 'mg/dL', referenceRange: { min: 7, max: 20 } },
        { name: 'Uric Acid', unit: 'mg/dL', referenceRange: { min: 3.5, max: 7.2 } },
        { name: 'Calcium', unit: 'mg/dL', referenceRange: { min: 8.5, max: 10.5 } },
        { name: 'Phosphorus', unit: 'mg/dL', referenceRange: { min: 2.5, max: 4.5 } },
      ],
      sampleType: 'Blood',
      containerType: 'Red Top (Serum)',
      volume: '5ml',
      turnaroundTime: 4,
      price: 450,
      equipment: ['Biochemistry Analyzer'],
      fastingRequired: true,
    },
  ];

  for (const testData of tests) {
    const test = testService.addTest(testData);
    logger.info(`Test added: ${test.testId} - ${test.name}`);
  }

  logger.info('Sample data initialization complete.');
}

// Start server with database connection
async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`RisaCare Laboratory Information System running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`💾 Database: ${dbConnected ? 'connected' : 'disconnected'}`);

    // Initialize sample data
    initializeSampleData();
  });
}

startServer().catch(console.error);

export default app;
